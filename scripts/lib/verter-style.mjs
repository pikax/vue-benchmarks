/**
 * Verter's public per-block style entrypoint.
 *
 * `@verter/native` renamed the export between 0.0.1-beta.3 (`processStyle`)
 * and 0.0.1-beta.5 (`transformVueStyle`). Both take the same options
 * (`scopeId`, `scoped`, `isModule`, `moduleName`, `filename`, `sourcemap`) and
 * return the same `{ code, sourceMap?, moduleClasses, moduleName?, vBindVars }`
 * shape; beta.5 additionally reports `refusals` — per-selector rules the
 * cascade dropped from `code` while still publishing the rest. A caller that
 * ignores a non-empty list is charging the row for CSS it did not emit, so the
 * adapters treat it as a compile error.
 *
 * Resolution is by installed export so the measured entrypoint is named
 * exactly and a future rename self-reports as "no style path" instead of
 * silently borrowing a different API.
 */
const STYLE_TRANSFORM_EXPORTS = ["transformVueStyle", "processStyle"];

/**
 * @param {object | null | undefined} native loaded `@verter/native` module (or `{ error }`)
 * @returns {{ name: string, transform: Function } | null}
 */
export function resolveVerterStyleTransform(native) {
  if (!native || native.error) return null;
  for (const name of STYLE_TRANSFORM_EXPORTS) {
    if (typeof native[name] === "function") return { name, transform: native[name] };
  }
  return null;
}

/** Throws when the transform dropped rules or reported errors. */
export function assertVerterStyleResult(result, context = "verter style transform") {
  if (result?.errors?.length) {
    throw new Error(`${context} errors: ${String(result.errors[0]?.message ?? result.errors[0])}`);
  }
  if (result?.refusals?.length) {
    throw new Error(`${context} refused ${result.refusals.length} selector(s): ${result.refusals[0]}`);
  }
  return result;
}
