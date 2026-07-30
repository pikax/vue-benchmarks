/**
 * ANSI stripping for tool output captured from child processes.
 *
 * Built with `String.fromCharCode(27)` rather than written as a literal escape
 * byte or a `` escape in a regex literal, for two reasons learned the hard
 * way in this repository:
 *
 * - A raw ESC byte in source is invisible in review and gets silently mangled by
 *   anything that rewrites the file.
 * - Hand-escaping it inline produced `/…?[[0-9;]*m/`, where the character class
 *   swallowed the `[` and the optional ESC made the pattern match a bare `m`.
 *   That silently deleted stray `m` characters from every diagnostic it touched,
 *   corrupting the error messages the reports are supposed to quote verbatim.
 *
 * One definition, no escapes, used by every surface that reports tool output.
 */
const ESC = String.fromCharCode(27);

/** Matches CSI colour/style sequences, e.g. ESC[31m or ESC[0;1m. */
export const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;]*m`, "g");

/** Remove ANSI colour sequences, leaving the text otherwise byte-identical. */
export function stripAnsi(value) {
  return String(value ?? "").replace(ANSI_PATTERN, "");
}
