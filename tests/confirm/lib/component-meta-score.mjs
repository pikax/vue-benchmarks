/**
 * Score normalized component-meta against expect.json.
 *
 * Expectations are intentionally loose on exact type strings (tools phrase
 * `number | undefined` vs `number` differently) but strict on API surface
 * names and coarse type tokens.
 */

function findByName(list, name) {
  return (list || []).find((x) => x.name === name);
}

/**
 * Coarse token match against the type the tool actually reported.
 *
 * A tool that reported no type has not answered the question, so it does not
 * match — the same verdict for every tool. (The comment that used to sit on
 * this branch named one vendor; the behaviour never was vendor-specific, and a
 * scoring function must not read as though it were.)
 */
function typeMatches(actualType, typeIncludes) {
  if (!typeIncludes?.length) return true;
  const t = String(actualType || "").toLowerCase();
  if (!t) return false;
  return typeIncludes.some((needle) => t.includes(String(needle).toLowerCase()));
}

/**
 * @param {object} meta normalized meta
 * @param {object} expect case expectation
 * @param {{ capabilities?: string[] }} tool
 */
export function scoreComponentMeta(meta, expect, tool = {}) {
  const caps = new Set(tool.capabilities || []);
  const notes = [];
  const failures = [];

  const checkSection = (section, items, actualList) => {
    if (!items?.length) return;
    if (caps.size && !caps.has(section) && !caps.has("*")) {
      notes.push(`skip ${section}: tool lacks capability`);
      return;
    }
    for (const item of items) {
      const found = findByName(actualList, item.name);
      if (!found) {
        // MISSING API SURFACE IS A FAIL — for every tool, with no exceptions.
        //
        // There used to be an escape hatch here: if a tool produced no
        // structured entry, the name was looked for in `meta._strings` (the raw
        // payload blob only one extractor emits) and, when it appeared
        // anywhere in it, the item was recorded as a note and skipped. That
        // turned zero extraction into a PASS for the one tool that ships that
        // field, while a competitor that produced a wrong answer on the same
        // case failed — a named exemption contradicting the documented rule.
        //
        // A name appearing somewhere in a protobuf dump is not an extracted
        // prop/event/slot. A tool that genuinely does not implement a section
        // declares so through `capabilities` (see `caps.has(section)` above),
        // which is checked before any item is scored. That is the honest way
        // to say "not supported"; this branch is the honest way to say
        // "supported, and it did not work".
        failures.push(`${section}.${item.name}: missing`);
        continue;
      }

      // The type is judged on what the tool REPORTED for this entry, never on
      // what happens to appear in a raw payload blob.
      //
      // The second `meta._strings` escape hatch lived here: when the reported
      // type did not contain the expected token, the token was looked for
      // anywhere in the payload strings and, if found, the mismatch became a
      // note. The `empty type` failure two lines below was therefore
      // UNREACHABLE for the one tool that ships `_strings` — a tool that
      // reported no type at all passed because the word "boolean" occurred
      // somewhere in its protobuf dump. Same field, same tool, same shape of
      // exemption as the missing-entry hatch above.
      //
      // Tools legitimately phrase types differently (`number | undefined` vs
      // `number`), which is why the check is a coarse substring over
      // `typeIncludes` rather than string equality — that is the loose part,
      // and it applies identically to every tool.
      if (item.typeIncludes?.length && !typeMatches(found.type, item.typeIncludes)) {
        if (!found.type) {
          failures.push(
            `${section}.${item.name}: empty type, expected to include ${item.typeIncludes.join("|")}`,
          );
        } else {
          failures.push(
            `${section}.${item.name}: type ${JSON.stringify(found.type)} missing ${item.typeIncludes.join("|")}`,
          );
        }
      }

      if (item.required === true && caps.has("required") && found.required === false) {
        failures.push(`${section}.${item.name}: expected required=true`);
      }
      if (item.required === false && caps.has("required") && found.required === true) {
        failures.push(`${section}.${item.name}: expected required=false`);
      }

      if (item.hasDefault === true && caps.has("defaults") && found.hasDefault === false) {
        failures.push(`${section}.${item.name}: expected hasDefault`);
      }
    }
  };

  checkSection("props", expect.props, meta.props);
  checkSection("events", expect.events, meta.events);
  checkSection("slots", expect.slots, meta.slots);
  checkSection("exposed", expect.exposed, meta.exposed);

  // Absent names must not appear as non-global props
  for (const name of expect.absentProps || []) {
    if (findByName(meta.props, name)) {
      failures.push(`props.${name}: should be absent`);
    }
  }

  // Optional: min prop count (non-global)
  if (typeof expect.minProps === "number") {
    if ((meta.props || []).length < expect.minProps) {
      failures.push(`props count ${meta.props?.length ?? 0} < minProps ${expect.minProps}`);
    }
  }

  if (failures.length) {
    return {
      ok: false,
      message: failures.join("; "),
      notes,
      metaSummary: summarizeMeta(meta),
    };
  }

  return {
    ok: true,
    message: [
      `props=${meta.props?.length ?? 0}`,
      `events=${meta.events?.length ?? 0}`,
      `slots=${meta.slots?.length ?? 0}`,
      `exposed=${meta.exposed?.length ?? 0}`,
      notes.length ? `notes=${notes.join(",")}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    notes,
    metaSummary: summarizeMeta(meta),
  };
}

function summarizeMeta(meta) {
  return {
    source: meta.source,
    props: (meta.props || []).map((p) => p.name),
    events: (meta.events || []).map((e) => e.name),
    slots: (meta.slots || []).map((s) => s.name),
    exposed: (meta.exposed || []).map((e) => e.name),
  };
}
