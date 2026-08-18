/**
 * inheritAttrs + root-shape plants.
 *
 * `vueCompilerOptions.fallthroughAttributes` is a Volar opt-in (default false).
 * It is NOT on the shared tsconfig and MUST NOT be slipped into case
 * tsconfig.json — that would hide that a tool only types fallthrough when
 * given a non-default option.
 *
 * These plants therefore run twice: shared config first, then an isolated
 * extra tsconfig. Scoring:
 *   shared ✓ extra ✓ → pass (no extra option needed, or dirty plant errors either way)
 *   shared ✗ extra ✓ → warn  (needed the opt-in; not a pass)
 *   shared ✓ extra ✗ → fail  (opt-in revealed the plant was missed — e.g. Volar
 *                             treating v-if mono / v-else fragment as one root)
 *   shared ✗ extra ✗ → fail
 */

export const FALLTHROUGH_EXTRA_VUE_COMPILER_OPTIONS = {
  fallthroughAttributes: true,
};

/**
 * @param {"needed-option" | "shared-ok-extra-missed" | "both-failed"} kind
 * @param {string} [scoreMessage]
 */
export function fallthroughExtraWarning(kind, scoreMessage = "") {
  const head =
    "EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes " +
    "is not default and is not on the shared tsconfig. A fully compatible " +
    "checker types inheritAttrs fallthrough without this opt-in.";
  if (kind === "needed-option") {
    return `${head} Plant scored only after enabling it${scoreMessage ? `: ${scoreMessage}` : ""}.`;
  }
  if (kind === "shared-ok-extra-missed") {
    return (
      `${head} On the shared tsconfig the plant appeared to pass ` +
      `(undeclared attrs always error under default strictTemplates). ` +
      `With fallthroughAttributes the plant was missed${scoreMessage ? `: ${scoreMessage}` : ""}.`
    );
  }
  return `${head} Failed on the shared tsconfig and still failed after enabling it${
    scoreMessage ? `: ${scoreMessage}` : ""
  }.`;
}

/**
 * @param {{ ok: boolean, message: string }} sharedScore
 * @param {{ ok: boolean, message: string }} extraScore
 * @returns {{ status: "pass" | "warn" | "fail", message: string }}
 */
export function scoreFallthroughPair(sharedScore, extraScore) {
  if (sharedScore.ok && extraScore.ok) {
    return { status: "pass", message: sharedScore.message };
  }
  if (!sharedScore.ok && extraScore.ok) {
    return {
      status: "warn",
      message: fallthroughExtraWarning("needed-option", extraScore.message),
    };
  }
  if (sharedScore.ok && !extraScore.ok) {
    return {
      status: "fail",
      message: fallthroughExtraWarning("shared-ok-extra-missed", extraScore.message),
    };
  }
  return {
    status: "fail",
    message: fallthroughExtraWarning("both-failed", extraScore.message || sharedScore.message),
  };
}
