import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import valueParser from "postcss-value-parser";

// Keep value token boundaries, strings and duplicate declarations. Only the
// explicit equivalent forms below are normalized; this is not a CSS optimizer.
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

// Basic CSS colors have equivalent keyword and hex spellings. Only normalize
// the color property: custom-property token streams must keep their spelling.
const BASIC_COLORS = {
  black: "000000", silver: "c0c0c0", gray: "808080", white: "ffffff",
  maroon: "800000", red: "ff0000", purple: "800080", fuchsia: "ff00ff",
  green: "008000", lime: "00ff00", olive: "808000", yellow: "ffff00",
  navy: "000080", blue: "0000ff", teal: "008080", aqua: "00ffff",
};

function declarationValue(node) {
  if (node.prop.toLowerCase() === "color") {
    const value = node.value.trim().toLowerCase();
    const hex = (Object.hasOwn(BASIC_COLORS, value) ? BASIC_COLORS[value] : null) ?? (/^#[\da-f]{6}$/.test(value) ? value.slice(1)
      : /^#[\da-f]{3}$/.test(value) ? [...value.slice(1)].map((digit) => digit + digit).join("") : null);
    if (hex) return [["color", hex]];
  }
  return cssValueProjection(node.value);
}

function mediaProjection(params) {
  const visit = (nodes) => nodes.filter((node) => !["space", "comment"].includes(node.type)).map((node) => {
    if (node.type !== "function") return valueNodes([node])[0];
    // MQ4 min-/max- prefixes are inclusive range comparisons. Normalize only
    // simple width/height features, leaving calc(), unknown features and units
    // unchanged rather than guessing at their equivalence.
    const text = valueParser.stringify(node.nodes).trim();
    if (!node.value) {
      const prefix = /^(min|max)-(width|height)\s*:\s*(\d*\.?\d+(?:px|em|rem))$/i.exec(text);
      const range = /^(width|height)\s*(>=|<=)\s*(\d*\.?\d+(?:px|em|rem))$/i.exec(text);
      if (prefix) return ["range", prefix[2].toLowerCase(), prefix[1].toLowerCase() === "min" ? ">=" : "<=", cssValueProjection(prefix[3])];
      if (range) return ["range", range[1].toLowerCase(), range[2], cssValueProjection(range[3])];
    }
    return ["function", node.value, visit(node.nodes)];
  });
  return visit(valueParser(params).nodes);
}

function declarationGroup(node) {
  if (node[0] !== "decl") return null;
  const prop = node[1];
  // This conservative set covers the plants' independent properties. Everything
  // else is an ordering barrier, including shorthand/longhand and logical/physical
  // interactions. Duplicate declarations always keep their relative order.
  if (prop.startsWith("--")) return prop;
  return ["color", "opacity", "padding"].includes(prop) ? prop : null;
}

function orderedDeclarations(children) {
  const output = [];
  let run = [];
  const flush = () => {
    run.sort((left, right) => declarationGroup(left).localeCompare(declarationGroup(right)));
    output.push(...run);
    run = [];
  };
  for (const child of children) {
    if (declarationGroup(child)) run.push(child);
    else { flush(); output.push(child); }
  }
  flush();
  return output;
}

function selectorProjection(selector) {
  const visit = (node) => {
    if (node.type === "comment") return null;
    // Selectors 3 retains the single-colon spelling of these CSS2 pseudo-elements.
    const value = node.type === "pseudo" && /^::?(before|after|first-line|first-letter)$/i.test(node.value)
      ? `::${node.value.replace(/^:+/, "").toLowerCase()}` : node.value;
    if (node.nodes) return [node.type, value ?? null, node.nodes.map(visit).filter(Boolean)];
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
      node.type === "combinator" ? value.trim() || " " : value,
      node.namespace ?? null,
    ];
  };
  return visit(selectorParser().astSync(selector));
}

export function cssProjection(css, { selectors = true } = {}) {
  const visit = (node) => {
    if (node.type === "comment") return null;
    if (node.type === "decl")
      return ["decl", node.prop, declarationValue(node), Boolean(node.important)];
    const children = node.nodes?.map(visit).filter(Boolean) ?? null;
    if (node.type === "root") return children;
    if (node.type === "rule")
      return ["rule", selectors ? selectorProjection(node.selector) : null, orderedDeclarations(children)];
    if (node.type === "atrule")
      return ["atrule", node.name, node.name.toLowerCase() === "media" ? mediaProjection(node.params) : cssValueProjection(node.params), children];
    throw new Error(`unsupported CSS node ${node.type}`);
  };
  return visit(postcss.parse(css));
}
