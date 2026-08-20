const ALLOWED_HTML_STRICTNESS_DIAGNOSTIC =
  /^SfcParse\(ParseError \{ kind: InvalidHtml\(NonVoidHtmlElementStartTagWithTrailingSolidus\), span: \d+\.\.\d+ \}\)$/;

export function fervidDiagnosticMessage(diagnostic) {
  return String(diagnostic?.message ?? diagnostic);
}

export function isAllowedFervidDiagnostic(diagnostic) {
  return ALLOWED_HTML_STRICTNESS_DIAGNOSTIC.test(fervidDiagnosticMessage(diagnostic));
}

export function assertOnlyAllowedFervidDiagnostics(result, context) {
  const unexpected = (result?.errors ?? []).filter(
    (diagnostic) => !isAllowedFervidDiagnostic(diagnostic),
  );
  if (unexpected.length) {
    throw new Error(`${context}: ${unexpected.map(fervidDiagnosticMessage).join("; ")}`);
  }
  return result?.errors?.length ?? 0;
}
