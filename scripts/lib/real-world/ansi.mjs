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
const BEL = String.fromCharCode(7);

/**
 * Matches every escape sequence a CLI can put in front of a diagnostic:
 *
 *   OSC   ESC ] … BEL  /  ESC ] … ESC \    (clickable file hyperlinks)
 *   CSI   ESC [ … final                    (colour, cursor moves, `ESC[?25l`)
 *   bare  ESC <single char>                (ESC( charset selects, ESC7/ESC8)
 *
 * OSC is matched FIRST because its payload contains `[` and a CSI-only pattern
 * would chew the sequence in half, leaving the URL in the text.
 *
 * Scope creep is the point here: this used to be SGR-only (`ESC[…m`), which is
 * all `stripAnsi` callers ever needed — but the confirmation suite grew its own
 * narrower copy, and a colour code inside `path(line,col)` made the typecheck
 * scorer read 0 diagnostics out of 64 (issue #34). One complete definition,
 * used by every consumer, is what keeps that from recurring per-surface.
 */
export const ANSI_PATTERN = new RegExp(
  [
    `${ESC}\\][\\s\\S]*?(?:${BEL}|${ESC}\\\\)`,
    `${ESC}\\[[0-9;?]*[ -/]*[@-~]`,
    `${ESC}[@-Z\\\\-_]`,
  ].join("|"),
  "g",
);

/** Remove ANSI escape sequences, leaving the text otherwise byte-identical. */
export function stripAnsi(value) {
  return String(value ?? "").replace(ANSI_PATTERN, "");
}
