/**
 * Real-world Vue project registry.
 *
 * Every field here was verified against the repository tree AT THE PINNED REF
 * (GitHub `git/trees?recursive=1`, 2026-07-29) rather than assumed from the
 * project's README. That matters more than it sounds, because the intuition
 * "famous Vue UI library ⇒ thousands of SFCs to benchmark" is wrong for most of
 * this list, and a corpus built on that intuition would publish numbers for
 * documentation sites while claiming to measure component libraries.
 *
 * What the tree actually says (`.vue` counts at the pinned refs):
 *
 * | Project         | repo `.vue` | library source `.vue` | the rest is…            |
 * | --------------- | ----------: | --------------------: | ----------------------- |
 * | naive-ui        |        1708 |                  ~0   | `src/<comp>/demos` — the components themselves are `.tsx` |
 * | vuetify         |        1254 |                  ~8   | `packages/docs/src` — the library is `.ts`/`.tsx` |
 * | ant-design-vue  |         733 |                  ~0   | `components/<comp>/demo` — 637 `.tsx` components |
 * | quasar          |        1383 |                   ~3   | `ui/playground` + `docs/src/examples` |
 * | element-plus    |        1004 |                 162   | `docs/examples` + `ssr-testing/cases` |
 * | primevue        |        2615 |                 279   | `apps/showcase/doc` + `apps/volt/doc` |
 * | nuxt-ui         |         720 |                 180   | `docs/app/components` (402) |
 * | vue-vben-admin  |         650 |                 650   | app + ui-kit source throughout |
 * | hoppscotch      |         365 |                 365   | app source throughout |
 *
 * So three of the "best candidate" UI libraries (naive-ui, vuetify,
 * ant-design-vue) contain essentially **no library SFCs at all** — their
 * components are TSX/render functions. Their `.vue` files are real, hand-written,
 * non-trivial Vue that is perfectly good to benchmark; they are just *demo and
 * documentation* SFCs, which skew short and template-heavy compared to a
 * library component. Both flavours are worth measuring and they are not the same
 * thing, so every corpus below carries an explicit `kind` and the report prints
 * it next to the numbers. A `docs-demo` corpus is never presented as "Vuetify's
 * components".
 *
 * `ref` is pinned. Tags are used where the project still ships them; Hoppscotch
 * is pinned to a commit SHA because its newest tag (`v3.0.1`) predates the
 * rewrite and holds 147 SFCs of 2021-era Postwoman code, while `main` holds the
 * 365-SFC app everybody means when they say "Hoppscotch".
 */

/** Directories never walked when collecting a corpus, at any depth. */
export const CORPUS_IGNORE_DIRS = Object.freeze([
  ".git",
  ".github",
  ".nuxt",
  ".output",
  ".turbo",
  ".vercel",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "cypress",
  "__snapshots__",
]);

/**
 * Corpus kinds, in descending order of "is this what the project actually ships".
 *
 * - `library-source` — SFCs that are compiled into the published package.
 * - `app-source`     — SFCs that make up a real application's pages/components.
 * - `docs-demo`      — SFCs written to demonstrate the library in its own docs.
 *
 * The distinction is reported, never ranked across: a docs-demo SFC is typically
 * a fraction of the size of a library component, so files/second between the two
 * kinds compares corpora, not tools.
 */
export const CORPUS_KINDS = Object.freeze(["library-source", "app-source", "docs-demo"]);

/**
 * @typedef {object} Corpus
 * @property {string} id          corpus id, unique within the project
 * @property {string[]} roots     repo-relative dirs to walk for `.vue`
 * @property {(typeof CORPUS_KINDS)[number]} kind
 * @property {number} approxFiles `.vue` count observed at the pinned ref
 * @property {string} note        what this corpus is, in one line
 * @property {boolean} [default]  used when no corpus is named on the CLI
 */

/**
 * @typedef {object} RealWorldProject
 * @property {string} id
 * @property {string} label
 * @property {string} repo
 * @property {string} ref
 * @property {"tag"|"sha"} refKind
 * @property {string} license
 * @property {"pnpm"|"npm"|"yarn"} packageManager
 * @property {boolean} hasLockfile  false ⇒ install cannot be frozen, so the
 *                                  installed dependency set is whatever resolved
 *                                  on the day. Propagated onto `ResolvedCorpus`
 *                                  as `dependenciesReproducible`, and the
 *                                  orchestrator UNRANKS every row on the
 *                                  surfaces that run inside the checkout against
 *                                  those dependencies — see
 *                                  `CHECKOUT_DEPENDENCY_SURFACES` in
 *                                  `corpus.mjs`. The corpus-copy surfaces
 *                                  (compile, format, lint, bundle, hmr) read SFC
 *                                  text and externalise everything else, so the
 *                                  project's dependency resolution cannot move
 *                                  their numbers and they stay ranked. Applies to
 *                                  naive-ui and ant-design-vue today.
 * @property {Corpus[]} corpora
 * @property {string} [notes]
 */

/** @type {RealWorldProject[]} */
export const REAL_WORLD_PROJECTS = [
  {
    id: "element-plus",
    label: "Element Plus",
    repo: "https://github.com/element-plus/element-plus.git",
    ref: "2.14.3",
    refKind: "tag",
    // Provenance, verified 2026-07-29. `sha` is the commit the ref pointed at
    // when it was pinned; the fetch step compares what it actually checked out
    // against this and refuses to benchmark a mismatch, so a moved tag is an
    // error rather than a silently different corpus.
    sha: "7a7bcfb66b8b84da582ddeff4ebb405f0ab3f464",
    committedAt: "2026-07-10",
    releasedAt: "2026-07-10",
    releaseKind: "github-release",
    pinnedAt: "2026-07-29",
    // Upstream CI at the PINNED commit. The rule: a project green in its own
    // CI should be runnable here, so a failure here is the harness's until
    // proven otherwise. Where upstream was NOT green the pin was moved back to
    // a tag that was, rather than benchmarking known-broken code and
    // attributing its breakage to a tool.
    ci: {
      state: "green",
      checkedAt: "2026-07-30",
      note: "2/2 checks succeeded at the pinned commit.",
    },
    license: "MIT",
    packageManager: "pnpm",
    hasLockfile: true,
    corpora: [
      {
        id: "components",
        roots: ["packages/components"],
        kind: "library-source",
        approxFiles: 162,
        note: "Published component SFCs. Element Plus authors most logic in .ts beside the SFC, so these are template-dense.",
        default: true,
      },
      {
        id: "docs",
        roots: ["docs/examples"],
        kind: "docs-demo",
        approxFiles: 600,
        note: "Documentation examples — short, single-purpose SFCs.",
      },
    ],
  },
  {
    id: "naive-ui",
    label: "Naive UI",
    repo: "https://github.com/tusen-ai/naive-ui.git",
    ref: "v2.44.0",
    refKind: "tag",
    // Provenance, verified 2026-07-29. `sha` is the commit the ref pointed at
    // when it was pinned; the fetch step compares what it actually checked out
    // against this and refuses to benchmark a mismatch, so a moved tag is an
    // error rather than a silently different corpus.
    sha: "a3e05c11db95e023bb09caf08fbe95c8d50eef90",
    committedAt: "2026-03-08",
    releasedAt: null,
    releaseKind: "tag-only",
    pinnedAt: "2026-07-29",
    // Upstream CI at the PINNED commit. The rule: a project green in its own
    // CI should be runnable here, so a failure here is the harness's until
    // proven otherwise. Where upstream was NOT green the pin was moved back to
    // a tag that was, rather than benchmarking known-broken code and
    // attributing its breakage to a tool.
    ci: {
      state: "green",
      checkedAt: "2026-07-30",
      note: "5/5 checks succeeded at v2.44.0. RE-PINNED from v2.44.1, whose `lint (22)` job failed twice — the newer tag was not green, so it is not used.",
    },
    license: "MIT",
    packageManager: "pnpm",
    // No lockfile at the repo root in the pinned tree.
    hasLockfile: false,
    corpora: [
      {
        id: "demos",
        roots: ["src"],
        kind: "docs-demo",
        approxFiles: 1682,
        note: "Every .vue in naive-ui is a component demo under src/*/demos — the components themselves are .tsx render functions.",
        default: true,
      },
    ],
    notes:
      "Largest SFC count in the registry and zero library SFCs. Valuable as a high-volume docs-demo corpus; never describe a naive-ui row as measuring naive-ui's components.",
  },
  {
    id: "vuetify",
    label: "Vuetify",
    repo: "https://github.com/vuetifyjs/vuetify.git",
    ref: "v4.1.6",
    refKind: "tag",
    // Provenance, verified 2026-07-29. `sha` is the commit the ref pointed at
    // when it was pinned; the fetch step compares what it actually checked out
    // against this and refuses to benchmark a mismatch, so a moved tag is an
    // error rather than a silently different corpus.
    sha: "f5d76f8ac4b646f5dc0f9464f3a868c402bd4ed5",
    committedAt: "2026-07-23",
    releasedAt: "2026-07-23",
    releaseKind: "github-release",
    pinnedAt: "2026-07-29",
    // Upstream CI at the PINNED commit. The rule: a project green in its own
    // CI should be runnable here, so a failure here is the harness's until
    // proven otherwise. Where upstream was NOT green the pin was moved back to
    // a tag that was, rather than benchmarking known-broken code and
    // attributing its breakage to a tool.
    ci: {
      state: "green",
      checkedAt: "2026-07-30",
      note: "29 succeeded, 1 skipped, 0 failed at the pinned commit.",
    },
    license: "MIT",
    packageManager: "pnpm",
    hasLockfile: true,
    corpora: [
      {
        id: "docs",
        roots: ["packages/docs/src"],
        kind: "docs-demo",
        approxFiles: 1246,
        note: "The documentation application. `packages/vuetify/src` is .ts/.tsx and contributes ~8 SFCs, so there is no library-source corpus to offer.",
        default: true,
      },
    ],
    notes:
      "Vuetify's components are TypeScript render functions. Its 1254 .vue files are a docs app — a legitimate real-world Vue application, and not the library.",
  },
  {
    id: "primevue",
    label: "PrimeVue",
    repo: "https://github.com/primefaces/primevue.git",
    ref: "4.5.3",
    refKind: "tag",
    // Provenance, verified 2026-07-29. `sha` is the commit the ref pointed at
    // when it was pinned; the fetch step compares what it actually checked out
    // against this and refuses to benchmark a mismatch, so a moved tag is an
    // error rather than a silently different corpus.
    sha: "8600f6a3b2c0f3db78483026e31c3ef42cee8534",
    committedAt: "2025-12-10",
    releasedAt: "2025-12-10",
    releaseKind: "github-release",
    pinnedAt: "2026-07-29",
    // Upstream CI at the PINNED commit. The rule: a project green in its own
    // CI should be runnable here, so a failure here is the harness's until
    // proven otherwise. Where upstream was NOT green the pin was moved back to
    // a tag that was, rather than benchmarking known-broken code and
    // attributing its breakage to a tool.
    ci: {
      state: "green",
      checkedAt: "2026-07-30",
      note: "7/7 checks succeeded at 4.5.3. RE-PINNED from 4.5.5, where `build (18)` failed and `build (20)` was cancelled — a failing BUILD is exactly the thing this surface depends on, so the newer tag is not used.",
    },
    license: "MIT",
    packageManager: "pnpm",
    hasLockfile: true,
    corpora: [
      {
        id: "components",
        roots: ["packages/primevue/src"],
        kind: "library-source",
        approxFiles: 279,
        note: "Published component SFCs — the largest genuine library-source corpus in the registry.",
        default: true,
      },
      {
        id: "showcase",
        roots: ["apps/showcase/doc", "apps/showcase/pages", "apps/showcase/components"],
        kind: "docs-demo",
        approxFiles: 1647,
        note: "Showcase site: doc fragments plus real Nuxt pages/components.",
      },
    ],
  },
  {
    id: "quasar",
    label: "Quasar",
    repo: "https://github.com/quasarframework/quasar.git",
    ref: "quasar-v2.23.3",
    refKind: "tag",
    // Provenance, verified 2026-07-29. `sha` is the commit the ref pointed at
    // when it was pinned; the fetch step compares what it actually checked out
    // against this and refuses to benchmark a mismatch, so a moved tag is an
    // error rather than a silently different corpus.
    sha: "db082a4407936be7865c7c85dd1862bb213f0c08",
    committedAt: "2026-07-28",
    releasedAt: "2026-07-28",
    releaseKind: "github-release",
    pinnedAt: "2026-07-29",
    // Upstream CI at the PINNED commit. The rule: a project green in its own
    // CI should be runnable here, so a failure here is the harness's until
    // proven otherwise. Where upstream was NOT green the pin was moved back to
    // a tag that was, rather than benchmarking known-broken code and
    // attributing its breakage to a tool.
    ci: {
      state: "green",
      checkedAt: "2026-07-30",
      note: "30/30 checks succeeded at the pinned commit.",
    },
    license: "MIT",
    packageManager: "pnpm",
    hasLockfile: true,
    corpora: [
      {
        id: "playground",
        roots: ["ui/playground/src"],
        kind: "app-source",
        approxFiles: 252,
        note: "The UI playground app — exercise pages for every Quasar component.",
        default: true,
      },
      {
        id: "docs",
        roots: ["docs/src"],
        kind: "docs-demo",
        approxFiles: 989,
        note: "Documentation site: examples, pages and layouts.",
      },
    ],
    notes:
      "Tagged per package; `quasar-v*` is the UI package tag. `ui/src` is .js with ~3 SFCs, so there is no library-source corpus.",
  },
  {
    id: "ant-design-vue",
    label: "Ant Design Vue",
    repo: "https://github.com/vueComponent/ant-design-vue.git",
    ref: "4.2.6",
    refKind: "tag",
    // Provenance, verified 2026-07-29. `sha` is the commit the ref pointed at
    // when it was pinned; the fetch step compares what it actually checked out
    // against this and refuses to benchmark a mismatch, so a moved tag is an
    // error rather than a silently different corpus.
    sha: "4a37016f4e3f829838b2e2b3cd128af220d67be8",
    committedAt: "2024-11-11",
    releasedAt: "2024-11-11",
    releaseKind: "github-release",
    pinnedAt: "2026-07-29",
    // Upstream CI at the PINNED commit. The rule: a project green in its own
    // CI should be runnable here, so a failure here is the harness's until
    // proven otherwise. Where upstream was NOT green the pin was moved back to
    // a tag that was, rather than benchmarking known-broken code and
    // attributing its breakage to a tool.
    ci: {
      state: "unknown",
      checkedAt: "2026-07-30",
      note: "NO check runs are retained for this commit — the tag is from 2024-11-11 and GitHub has expired its check history, so CI status cannot be confirmed either way. Pinned at the latest stable tag regardless, because no newer tag exists to move to. Treat failures on this corpus with extra caution: there is no green-CI evidence to argue they are the harness's fault.",
    },
    license: "MIT",
    packageManager: "pnpm",
    hasLockfile: false,
    corpora: [
      {
        id: "demos",
        roots: ["components"],
        kind: "docs-demo",
        approxFiles: 695,
        note: "Per-component demo SFCs. The 637 components themselves are .tsx.",
        default: true,
      },
      {
        id: "site",
        roots: ["site/src"],
        kind: "app-source",
        approxFiles: 37,
        note: "The documentation site application (layouts and components).",
      },
    ],
  },
  {
    id: "hoppscotch",
    label: "Hoppscotch",
    repo: "https://github.com/hoppscotch/hoppscotch.git",
    // Pinned to a commit, not a tag, and deliberately: the newest tag (v3.0.1)
    // is 2021-era Postwoman with 147 SFCs, while this SHA is the ~80k-star app.
    ref: "a4395b3e7c41541de1d769e8701ea110ba8f96c2",
    refKind: "sha",
    // Provenance, verified 2026-07-29. `sha` is the commit the ref pointed at
    // when it was pinned; the fetch step compares what it actually checked out
    // against this and refuses to benchmark a mismatch, so a moved tag is an
    // error rather than a silently different corpus.
    sha: "a4395b3e7c41541de1d769e8701ea110ba8f96c2",
    committedAt: "2026-07-15",
    releasedAt: null,
    releaseKind: "branch-commit",
    pinnedAt: "2026-07-29",
    // Upstream CI at the PINNED commit. The rule: a project green in its own
    // CI should be runnable here, so a failure here is the harness's until
    // proven otherwise. Where upstream was NOT green the pin was moved back to
    // a tag that was, rather than benchmarking known-broken code and
    // attributing its breakage to a tool.
    ci: {
      state: "green",
      checkedAt: "2026-07-30",
      note: "22/22 checks succeeded at the pinned commit on main.",
    },
    license: "MIT",
    packageManager: "pnpm",
    hasLockfile: true,
    corpora: [
      {
        id: "common",
        roots: ["packages/hoppscotch-common/src"],
        kind: "app-source",
        approxFiles: 293,
        note: "The Hoppscotch client application — pages, components and layouts of a production tool.",
        default: true,
      },
      {
        id: "admin",
        roots: ["packages/hoppscotch-sh-admin/src"],
        kind: "app-source",
        approxFiles: 56,
        note: "Self-host admin dashboard.",
      },
    ],
    notes:
      "Best app-realism corpus here: deep component trees, composables, i18n and codemirror integration rather than isolated demo components.",
  },
  {
    id: "vue-vben-admin",
    label: "Vue Vben Admin",
    repo: "https://github.com/vbenjs/vue-vben-admin.git",
    ref: "v5.7.0",
    refKind: "tag",
    // Provenance, verified 2026-07-29. `sha` is the commit the ref pointed at
    // when it was pinned; the fetch step compares what it actually checked out
    // against this and refuses to benchmark a mismatch, so a moved tag is an
    // error rather than a silently different corpus.
    sha: "63a38dce49ba109f61607994e21ba921d8e970e9",
    committedAt: "2026-05-21",
    releasedAt: "2026-05-21",
    releaseKind: "github-release",
    pinnedAt: "2026-07-29",
    // Upstream CI at the PINNED commit. The rule: a project green in its own
    // CI should be runnable here, so a failure here is the harness's until
    // proven otherwise. Where upstream was NOT green the pin was moved back to
    // a tag that was, rather than benchmarking known-broken code and
    // attributing its breakage to a tool.
    ci: {
      state: "green-ignoring-bot",
      checkedAt: "2026-07-30",
      note: "16 succeeded, 1 skipped, and 1 failure — `reply-labeled`, an issue-bot workflow that posts a comment when a label is applied. It builds and tests nothing, so it is not treated as a red build. Every build/test check passed.",
    },
    license: "MIT",
    packageManager: "pnpm",
    hasLockfile: true,
    corpora: [
      {
        id: "core-ui",
        roots: ["packages/@core/ui-kit", "packages/effects"],
        kind: "library-source",
        approxFiles: 330,
        note: "The admin template's own component kit — shipped source, not demos.",
        default: true,
      },
      {
        id: "apps",
        roots: ["playground/src", "apps"],
        kind: "app-source",
        approxFiles: 264,
        note: "Playground views plus the per-UI-library app shells (antd, element, naive, tdesign).",
      },
    ],
  },
  {
    id: "nuxt-ui",
    label: "Nuxt UI",
    repo: "https://github.com/nuxt/ui.git",
    ref: "v4.10.0",
    refKind: "tag",
    // Provenance, verified 2026-07-29. `sha` is the commit the ref pointed at
    // when it was pinned; the fetch step compares what it actually checked out
    // against this and refuses to benchmark a mismatch, so a moved tag is an
    // error rather than a silently different corpus.
    sha: "ada15803684c4a8eeced1a305d5d930484ccf82d",
    committedAt: "2026-07-16",
    releasedAt: "2026-07-16",
    releaseKind: "github-release",
    pinnedAt: "2026-07-29",
    // Upstream CI at the PINNED commit. The rule: a project green in its own
    // CI should be runnable here, so a failure here is the harness's until
    // proven otherwise. Where upstream was NOT green the pin was moved back to
    // a tag that was, rather than benchmarking known-broken code and
    // attributing its breakage to a tool.
    ci: {
      state: "green",
      checkedAt: "2026-07-30",
      note: "20/20 checks succeeded at the pinned commit.",
    },
    license: "MIT",
    packageManager: "pnpm",
    hasLockfile: true,
    corpora: [
      {
        id: "runtime",
        roots: ["src/runtime"],
        kind: "library-source",
        approxFiles: 187,
        note: "Published runtime components — genuine library SFCs with heavy generic/slot typing.",
        default: true,
      },
      {
        id: "docs",
        roots: ["docs/app"],
        kind: "docs-demo",
        approxFiles: 418,
        note: "Documentation application components and pages.",
      },
    ],
    notes:
      "The VS Code E2E surface clones nuxt/ui separately at its own pinned ref (see scripts/e2e-vscode/setup-workspaces.mjs). The two clones are independent on purpose — E2E pins what its probe was written against, this pins what the corpus tables report.",
  },
];

/** @returns {RealWorldProject|undefined} */
export function findProject(id) {
  return REAL_WORLD_PROJECTS.find((p) => p.id === id);
}

/**
 * Resolve a `project` or `project:corpus` selector to `{ project, corpus }`.
 * Throws with the valid options rather than silently falling back, so a typo in
 * CI names a corpus that does not exist instead of quietly benchmarking a
 * different one.
 */
export function resolveSelector(selector) {
  const [projectId, corpusId] = String(selector).split(":");
  const project = findProject(projectId);
  if (!project) {
    throw new Error(
      `unknown real-world project "${projectId}" — known: ${REAL_WORLD_PROJECTS.map((p) => p.id).join(", ")}`,
    );
  }
  const corpus = corpusId
    ? project.corpora.find((c) => c.id === corpusId)
    : (project.corpora.find((c) => c.default) ?? project.corpora[0]);
  if (!corpus) {
    throw new Error(
      `unknown corpus "${corpusId}" for ${projectId} — known: ${project.corpora.map((c) => c.id).join(", ")}`,
    );
  }
  return { project, corpus };
}

/** Default selector set: one corpus per project, preferring library/app source. */
export function defaultSelectors() {
  return REAL_WORLD_PROJECTS.map((p) => {
    const c = p.corpora.find((x) => x.default) ?? p.corpora[0];
    return `${p.id}:${c.id}`;
  });
}
