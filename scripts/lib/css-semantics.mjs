import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import valueParser from "postcss-value-parser";

// Keep token boundaries, order, strings and duplicate declarations. Formatting
// trivia may change; collapsing a value to a bag of words would hide mutations.
function valueNodes(nodes) {
  return nodes
    .filter((node) => !["space", "comment"].includes(node.type))
    .map((node) => {
      if (node.type === "function") return [node.type, node.value, valueNodes(node.nodes)];
      const value = node.type === "word" ? node.value.replace(/^(-?)\.(\d)/, "$10.$2") : node.value;
      return [node.type, value];
    });
}

export function cssValueProjection(value) {
  return valueNodes(valueParser(value).nodes);
}

function selectorProjection(selector) {
  const visit = (node) => {
    if (node.type === "comment") return null;
    if (node.nodes) return [node.type, node.value ?? null, node.nodes.map(visit).filter(Boolean)];
    if (node.type === "attribute")
      return [
        node.type,
        node.namespace ?? null,
        node.attribute,
        node.operator ?? null,
        node.value ?? null,
        node.insensitive ?? false,
      ];
    return [
      node.type,
      node.type === "combinator" ? node.value.trim() || " " : node.value,
      node.namespace ?? null,
    ];
  };
  return visit(selectorParser().astSync(selector));
}

export function cssProjection(css, { selectors = true } = {}) {
  const visit = (node) => {
    if (node.type === "comment") return null;
    if (node.type === "decl")
      return ["decl", node.prop, cssValueProjection(node.value), Boolean(node.important)];
    const children = node.nodes?.map(visit).filter(Boolean) ?? null;
    if (node.type === "root") return children;
    if (node.type === "rule")
      return ["rule", selectors ? selectorProjection(node.selector) : null, children];
    if (node.type === "atrule")
      return ["atrule", node.name, cssValueProjection(node.params), children];
    throw new Error(`unsupported CSS node ${node.type}`);
  };
  return visit(postcss.parse(css));
}
