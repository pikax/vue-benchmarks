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

function typeMatches(actualType, typeIncludes) {
  if (!typeIncludes?.length) return true;
  const t = String(actualType || "").toLowerCase();
  if (!t) {
    // name-only tools (verter heuristic may omit types sometimes)
    return false;
  }
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
        // verter may put names only in _strings
        if (meta._strings?.includes(item.name)) {
          notes.push(`${section}.${item.name}: name found in payload strings only`);
          if (item.typeIncludes?.length) {
            const ok = item.typeIncludes.some((n) =>
              meta._strings.some((s) => String(s).toLowerCase().includes(String(n).toLowerCase())),
            );
            if (!ok) {
              failures.push(
                `${section}.${item.name}: type tokens ${item.typeIncludes.join("|")} not in payload`,
              );
            }
          }
          continue;
        }
        failures.push(`${section}.${item.name}: missing`);
        continue;
      }

      if (item.typeIncludes?.length) {
        if (!typeMatches(found.type, item.typeIncludes)) {
          // Soft fallback: type tokens may live only in raw payload strings
          // (Verter protobuf) or adjacent slot prop fields.
          const strings = meta._strings || [];
          const soft = item.typeIncludes.some((n) => {
            const needle = String(n).toLowerCase();
            if (
              String(found.type || "")
                .toLowerCase()
                .includes(needle)
            ) {
              return true;
            }
            return strings.some((s) => String(s).toLowerCase().includes(needle));
          });
          if (soft) {
            notes.push(`${section}.${item.name}: type matched via payload strings`);
          } else if (!found.type) {
            failures.push(
              `${section}.${item.name}: empty type, expected to include ${item.typeIncludes.join("|")}`,
            );
          } else {
            failures.push(
              `${section}.${item.name}: type ${JSON.stringify(found.type)} missing ${item.typeIncludes.join("|")}`,
            );
          }
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
