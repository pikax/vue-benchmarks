import ts from "typescript";

function parseType(text) {
  const source = ts.createSourceFile(
    "fact.ts",
    `type Fact = ${text};`,
    ts.ScriptTarget.Latest,
    true,
  );
  if (source.parseDiagnostics.length || source.statements.length !== 1) return null;
  return ts.isTypeAliasDeclaration(source.statements[0]) ? source.statements[0].type : null;
}

function unwrap(node) {
  while (node && ts.isParenthesizedTypeNode(node)) node = node.type;
  return node;
}

function key(node, { optional = false } = {}) {
  node = unwrap(node);
  if (!node) return "missing";
  if (ts.isUnionTypeNode(node)) {
    const parts = node.types
      .filter((part) => !optional || part.kind !== ts.SyntaxKind.UndefinedKeyword)
      .map((part) => key(part))
      .sort();
    return parts.join("|");
  }
  if (ts.isLiteralTypeNode(node))
    return `literal:${JSON.stringify(node.literal.text ?? node.literal.getText())}`;
  if (ts.isArrayTypeNode(node)) return `array:${key(node.elementType)}`;
  // Tokens preserve string contents while ignoring trivia and quote spelling.
  return node.getText().replace(/\s+/g, "");
}

function parameters(node) {
  node = unwrap(node);
  if (!node) return null;
  if (ts.isTupleTypeNode(node))
    return node.elements.map((element) => {
      if (ts.isNamedTupleMember(element)) {
        return {
          type: element.type,
          optional: Boolean(element.questionToken),
          rest: Boolean(element.dotDotDotToken),
        };
      }
      return {
        type: ts.isOptionalTypeNode(element) || ts.isRestTypeNode(element) ? element.type : element,
        optional: ts.isOptionalTypeNode(element),
        rest: ts.isRestTypeNode(element),
      };
    });
  if (ts.isFunctionTypeNode(node) || ts.isCallSignatureDeclaration(node)) {
    if (node.parameters.length === 1 && node.parameters[0].dotDotDotToken) {
      const tuple = unwrap(node.parameters[0].type);
      if (tuple && ts.isTupleTypeNode(tuple)) return parameters(tuple);
    }
    return node.parameters.map((parameter) => ({
      type: parameter.type,
      optional: Boolean(parameter.questionToken || parameter.initializer),
      rest: Boolean(parameter.dotDotDotToken),
    }));
  }
  if (ts.isTypeLiteralNode(node)) {
    const calls = node.members.filter(ts.isCallSignatureDeclaration);
    if (calls.length === 1) return parameters(calls[0]);
  }
  return null;
}

function propertyNodes(node) {
  node = unwrap(node);
  if (!node) return [];
  if (ts.isFunctionTypeNode(node)) return propertyNodes(node.parameters[0]?.type);
  if (ts.isIntersectionTypeNode(node)) return node.types.flatMap(propertyNodes);
  if (ts.isTypeReferenceNode(node) && node.typeName.getText() === "Readonly")
    return propertyNodes(node.typeArguments?.[0]);
  return ts.isTypeLiteralNode(node) ? node.members.filter(ts.isPropertySignature) : [];
}

/** Independent structural constraints, separate from typeIncludes alternatives. */
export function checkMetaTypeFacts(actual, facts) {
  if (!facts) return [];
  const root = parseType(String(actual ?? ""));
  if (!root) return ["reported type is missing or is not a parseable TypeScript type"];
  const failures = [];
  const check = (node, wanted, path, optional = false) => {
    if (wanted.type) {
      const expected = parseType(wanted.type);
      if (!expected || key(node, { optional }) !== key(expected, { optional })) {
        failures.push(`${path}: expected ${wanted.type}, got ${node?.getText() ?? "missing"}`);
      }
    }
    if (wanted.properties) {
      const members = propertyNodes(node);
      for (const [name, property] of Object.entries(wanted.properties)) {
        const found = members.find(
          (member) => (member.name.text ?? member.name.getText()) === name,
        );
        if (!found) {
          failures.push(`${path}.${name}: missing property`);
          continue;
        }
        const optionalProperty = property.optional ?? false;
        if (Boolean(found.questionToken) !== optionalProperty)
          failures.push(`${path}.${name}: optionality differs`);
        check(found.type, property, `${path}.${name}`, optionalProperty);
      }
    }
  };
  check(root, facts, "type");
  if (facts.parameters) {
    const actualParameters = parameters(root);
    if (!actualParameters || actualParameters.length !== facts.parameters.length) {
      failures.push(
        `parameters: expected ${facts.parameters.length}, got ${actualParameters?.length ?? "no signature/tuple"}`,
      );
    } else {
      facts.parameters.forEach((wanted, index) => {
        const got = actualParameters[index];
        const optional = wanted.optional ?? false;
        if (got.optional !== optional) failures.push(`parameter ${index + 1}: optionality differs`);
        if (got.rest !== (wanted.rest ?? false))
          failures.push(`parameter ${index + 1}: rest parameter differs`);
        check(got.type, wanted, `parameter ${index + 1}`, optional);
      });
    }
  }
  return failures;
}
