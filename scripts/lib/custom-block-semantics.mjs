function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalJson(value[key])]),
    );
  return value;
}

export function customBlockProjection(block) {
  if (block.lang === "json" || block.attrs?.lang === "json") {
    return { type: block.type, payload: canonicalJson(JSON.parse(block.content)) };
  }
  // Opaque blocks have no language parser. Only surrounding blank space and
  // line-ending spelling are ignored; inner text remains an exact contract.
  return { type: block.type, payload: block.content.replace(/\r\n/g, "\n").trim() };
}
