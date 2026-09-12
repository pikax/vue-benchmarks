/**
 * Navigation & refactor content gates — regression guard.
 *
 * Every payload in `REAL` below is a VERBATIM capture from a live run of all
 * four servers (volar, volar-tnb, vize, verter) against the navigation suite's
 * own workspace, at the suite's own probe positions. Every value and every key
 * ORDER is exactly as it came off the wire — nothing is renamed, reordered,
 * filled in or tidied up; only JSON whitespace is this file's. The shapes ARE
 * the test.
 *
 * What these fixtures are guarding against, concretely:
 *
 *   1. THE WINDOWS URI FALSE-FAIL. The same file came back as
 *      `file:///d%3A/…` (Volar, via tsserver), `file:///D:/…` (Vize) and
 *      `file:///d:/…` (Verter). A gate comparing uri strings would have
 *      reported two of the three servers as answering about the wrong file
 *      while they were answering correctly — the same class of mistake as the
 *      /\bstring\b/ hover gate that demoted a correct server.
 *
 *   2. THE SHAPE ZOO. `textDocument/definition` arrived as LocationLink[]
 *      (Volar), as Location[] (Volar's typeDefinition) and as a bare Location
 *      OBJECT (Vize, Verter). A WorkspaceEdit arrived as `changes` (both
 *      renames) and as `documentChanges` (inside Volar's quick fix). Failing a
 *      server over a shape this file did not handle would be this file's bug.
 *
 *   3. THE BROKEN REFACTOR. `vizeRename_Changes` renames the declaration in
 *      ChildCard.vue and leaves `:captionText="heading"` in Parent.vue's
 *      template pointing at a prop that no longer exists. It is fast, it is
 *      well-formed, and it is wrong. The gate must call it invalid, and the
 *      test below fails if anyone ever loosens it into a pass.
 *
 * `LEGAL` holds response shapes the LSP spec permits that no server under test
 * happened to emit. They are CONSTRUCTED, and labelled as such — they exist so
 * the branches handling them stay covered rather than to claim provenance.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  FIXTURES,
  applyTextEdits,
  executeDisposableCommand,
  gateCodeActions,
  gateDefinition,
  gateFormatting,
  gatePrepareRename,
  gateReferences,
  gateRename,
  gateSignatureHelp,
  mergeLocations,
  mergeWorkspaceEdits,
  normalizeUri,
  normalizeWorkspaceEdit,
  signatureParamLabels,
  textInRange,
  toLocations,
  uriMatchesPath,
} from "../../scripts/lib/ide-ops/suites/navigation.mjs";
import { declarationTarget, propRanges, rangeOf, typoDiagnostic } from "../../scripts/lib/ide-ops/navigation-validation.mjs";

/** Workspace roots the payloads were captured against, in native form. */
const ROOT = "D:\\dev\\personal\\vue-benchmarks\\work-ide";
const VOLAR = `${ROOT}\\capture-volar`;
const VIZE = `${ROOT}\\capture-vize`;
const VERTER = `${ROOT}\\capture-verter`;

/** VERBATIM server payloads. Do not tidy — the formatting IS the test. */
const REAL = {
  /** LocationLink[]: `targetUri`, not `uri`. Drive letter percent-encoded. */
  volarDefTag_LocationLinkArray: [
    {
      "originSelectionRange": {"start":{"line":2,"character":5},"end":{"line":2,"character":14}},
      "targetRange": {"start":{"line":0,"character":0},"end":{"line":0,"character":0}},
      "targetUri": "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/ChildCard.vue",
      "targetSelectionRange": {"start":{"line":0,"character":0},"end":{"line":0,"character":0}}
    }
  ],

  /** Location[] — the plain array shape. */
  volarTypeDef_LocationArray: [
    {
      "uri": "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/types.ts",
      "range": {"start":{"line":1,"character":17},"end":{"line":1,"character":31}}
    }
  ],

  /** A BARE Location object, not an array. Drive letter upper-case, unencoded.
   * Resolves to the import binding in Parent.vue — the self-resolving answer
   * this suite exists to catch. */
  vizeDefImport_SingleLocation: {
    "range": {"end":{"character":22,"line":8},"start":{"character":9,"line":8}},
    "uri": "file:///D:/dev/personal/vue-benchmarks/work-ide/capture-vize/Parent.vue"
  },

  /** A bare Location object again, but with a LOWER-CASE unencoded drive letter.
   * Three spellings of the same drive across three servers; string equality
   * would fail two of them. */
  verterDefTag_SingleLocation: {
    "range": {"end":{"character":0,"line":0},"start":{"character":0,"line":0}},
    "uri": "file:///d:/dev/personal/vue-benchmarks/work-ide/capture-verter/ChildCard.vue"
  },

  /** Four references, including the use site in Parent.vue's template. */
  volarRefs: [
    {
      "uri": "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/ChildCard.vue",
      "range": {"start":{"line":11,"character":2},"end":{"line":11,"character":13}}
    },
    {
      "uri": "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/ChildCard.vue",
      "range": {"start":{"line":15,"character":38},"end":{"line":15,"character":49}}
    },
    {
      "uri": "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/ChildCard.vue",
      "range": {"start":{"line":2,"character":11},"end":{"line":2,"character":22}}
    },
    {
      "uri": "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/Parent.vue",
      "range": {"start":{"line":2,"character":16},"end":{"line":2,"character":27}}
    }
  ],

  /** Three references, all inside ChildCard.vue — the parent template is missed. */
  vizeRefs: [
    {
      "range": {"end":{"character":22,"line":2},"start":{"character":11,"line":2}},
      "uri": "file:///D:/dev/personal/vue-benchmarks/work-ide/capture-vize/ChildCard.vue"
    },
    {
      "range": {"end":{"character":13,"line":12},"start":{"character":2,"line":12}},
      "uri": "file:///D:/dev/personal/vue-benchmarks/work-ide/capture-vize/ChildCard.vue"
    },
    {
      "range": {"end":{"character":49,"line":16},"start":{"character":38,"line":16}},
      "uri": "file:///D:/dev/personal/vue-benchmarks/work-ide/capture-vize/ChildCard.vue"
    }
  ],

  /** prepareRename as a bare Range. */
  volarPrepareRename_BareRange: {"start":{"line":11,"character":2},"end":{"line":11,"character":13}},

  /** The same shape with the object keys serialized in the other order. */
  vizePrepareRename_BareRange: {"end":{"character":13,"line":11},"start":{"character":2,"line":11}},

  /** WorkspaceEdit via `changes`. Reaches BOTH Parent.vue and ChildCard.vue. */
  volarRename_Changes: {
    "changes": {
      "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/Parent.vue": [
        {
          "newText": "renamedCaption",
          "range": {"start":{"line":2,"character":16},"end":{"line":2,"character":27}}
        }
      ],
      "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/ChildCard.vue": [
        {
          "newText": "renamedCaption",
          "range": {"start":{"line":2,"character":11},"end":{"line":2,"character":22}}
        },
        {
          "newText": "renamedCaption",
          "range": {"start":{"line":15,"character":38},"end":{"line":15,"character":49}}
        },
        {
          "newText": "renamedCaption",
          "range": {"start":{"line":11,"character":2},"end":{"line":11,"character":13}}
        }
      ]
    }
  },

  /** WorkspaceEdit via `changes`, ChildCard.vue ONLY. The broken refactor:
   * `:captionText="heading"` in Parent.vue is left bound to a prop that no
   * longer exists. */
  vizeRename_Changes: {
    "changes": {
      "file:///D:/dev/personal/vue-benchmarks/work-ide/capture-vize/ChildCard.vue": [
        {
          "newText": "renamedCaption",
          "range": {"end":{"character":22,"line":2},"start":{"character":11,"line":2}}
        },
        {
          "newText": "renamedCaption",
          "range": {"end":{"character":13,"line":11},"start":{"character":2,"line":11}}
        },
        {
          "newText": "renamedCaption",
          "range": {"end":{"character":49,"line":15},"start":{"character":38,"line":15}}
        }
      ]
    }
  },

  /** CodeAction[]. The first carries BOTH a `command` and an `edit`, and that
   * edit uses `documentChanges` — the WorkspaceEdit shape the rename payloads
   * above do not exercise. */
  volarCodeActions: [
    {
      "title": "Change spelling to 'fixtureLabel'",
      "kind": "quickfix",
      "command": {
        "command": "_typescript.applyCodeActionCommand",
        "arguments": [
          {
            "action": {
              "fixName": "spelling",
              "description": "Change spelling to 'fixtureLabel'",
              "changes": [
                {
                  "fileName": "d:/dev/personal/vue-benchmarks/work-ide/capture-volar/Parent.vue",
                  "textChanges": [
                    {
                      "start": {"line":20,"offset":23},
                      "end": {"line":20,"offset":34},
                      "newText": "fixtureLabel"
                    }
                  ]
                }
              ]
            },
            "diagnostic": {
              "severity": 1,
              "code": 2552,
              "source": "ts",
              "message": "Cannot find name 'fixtureLabl'. Did you mean 'fixtureLabel'?",
              "range": {"start":{"line":19,"character":22},"end":{"line":19,"character":33}}
            },
            "documentUri": "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/Parent.vue"
          }
        ],
        "title": ""
      },
      "diagnostics": [
        {
          "severity": 1,
          "code": 2552,
          "source": "ts",
          "message": "Cannot find name 'fixtureLabl'. Did you mean 'fixtureLabel'?",
          "range": {"start":{"line":19,"character":22},"end":{"line":19,"character":33}}
        }
      ],
      "edit": {
        "documentChanges": [
          {
            "textDocument": {
              "uri": "file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/Parent.vue",
              "version": 1
            },
            "edits": [
              {
                "range": {"start":{"line":19,"character":22},"end":{"line":19,"character":33}},
                "newText": "fixtureLabel"
              }
            ]
          }
        ]
      },
      "isPreferred": true
    },
    {
      "title": "Move to a new file",
      "kind": "refactor.move.newFile",
      "command": {
        "title": "Move to a new file",
        "command": "_typescript.applyRefactoring",
        "arguments": [
          {
            "file": "d:\\dev\\personal\\vue-benchmarks\\work-ide\\capture-volar\\Parent.vue",
            "startLine": 20,
            "startOffset": 23,
            "endLine": 20,
            "endOffset": 34,
            "refactor": "Move to a new file",
            "action": "Move to a new file"
          }
        ]
      }
    }
  ],

  /** SignatureHelp with ParameterInformation.label as plain strings. */
  volarSignatureHelp: {
    "activeSignature": 0,
    "activeParameter": 0,
    "signatures": [
      {
        "label": "formatCaption(rawText: string, repeat: number): string",
        "documentation": {
          "kind": "markdown",
          "value": "Definition + signatureHelp target.\n`rawText` is deliberately not a substring of the function name."
        },
        "parameters": [{"label":"rawText: string"},{"label":"repeat: number"}]
      }
    ]
  },

  /** One whole-document TextEdit that genuinely reformats Messy.vue. */
  volarFormatting: [
    {
      "range": {"start":{"line":0,"character":0},"end":{"line":15,"character":0}},
      "newText": "<template>\n  <div class=\"messy\">\n    <span>{{ msg }}</span>\n    <em>{{ shouted }}</em>\n  </div>\n</template>\n\n<script setup lang=\"ts\">\nimport { ref } from 'vue'\nconst msg = ref('messy')\nfunction shout(first: string, times: number) {\n  return first.repeat(times)\n}\nconst shouted = shout(msg.value, 3)\n</script>\n"
    }
  ],

  /** The same operation, a different formatter. */
  vizeFormatting: [
    {
      "newText": "<script setup lang=\"ts\">\nimport { ref } from \"vue\";\nconst msg = ref(\"messy\");\nfunction shout(first: string, times: number) {\n  return first.repeat(times);\n}\nconst shouted = shout(msg.value, 3);\n</script>\n\n<template>\n  <div class=\"messy\">\n    <span>\n      {{ msg }}\n    </span>\n    <em>\n      {{ shouted }}\n    </em>\n  </div>\n</template>\n",
      "range": {"end":{"character":0,"line":15},"start":{"character":0,"line":0}}
    }
  ],
};

/** Legal LSP shapes no server under test emitted. CONSTRUCTED, not captured. */
const LEGAL = {
  /** `Command[]` is as legal a codeAction result as `CodeAction[]`. */
  commandArray: [
    { title: "Change spelling to 'fixtureLabel'", command: "editor.action.applyFix", arguments: [2552] },
  ],

  /** prepareRename may answer `{ range, placeholder }`. */
  prepareRenameWithPlaceholder: {
    range: { start: { line: 11, character: 2 }, end: { line: 11, character: 13 } },
    placeholder: "captionText",
  },

  /** …or `{ defaultBehavior: true }`, carrying no range at all. */
  prepareRenameDefaultBehavior: { defaultBehavior: true },

  /** ParameterInformation.label may be a [start, end] offset pair into the
   *  signature label rather than a string. */
  signatureHelpWithOffsetLabels: {
    activeSignature: 0,
    activeParameter: 0,
    signatures: [
      {
        label: "formatCaption(rawText: string, repeat: number): string",
        parameters: [{ label: [14, 29] }, { label: [31, 45] }],
      },
    ],
  },

  /** A correct rename expressed with `documentChanges` + AnnotatedTextEdit. */
  renameDocumentChanges: {
    documentChanges: [
      {
        textDocument: { uri: `file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-vize/ChildCard.vue`, version: 1 },
        edits: [
          {
            range: { start: { line: 11, character: 2 }, end: { line: 11, character: 13 } },
            newText: "renamedCaption",
            annotationId: "rename",
          },
          { range: { start: { line: 2, character: 11 }, end: { line: 2, character: 22 } }, newText: "renamedCaption" },
          { range: { start: { line: 15, character: 38 }, end: { line: 15, character: 49 } }, newText: "renamedCaption" },
        ],
      },
      {
        textDocument: { uri: `file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-vize/Parent.vue`, version: 1 },
        edits: [
          {
            range: { start: { line: 2, character: 16 }, end: { line: 2, character: 27 } },
            newText: "renamedCaption",
          },
        ],
      },
    ],
  },
};

/* ========================================================================== */

describe("uri normalisation (the Windows false-fail)", () => {
  test("all three real drive spellings designate the same file", () => {
    const encoded = REAL.volarDefTag_LocationLinkArray[0].targetUri; // d%3A
    const upper = REAL.vizeDefImport_SingleLocation.uri; // D:
    const lower = REAL.verterDefTag_SingleLocation.uri; // d:
    assert.equal(normalizeUri(encoded), `${normalizeUri(VOLAR)}/childcard.vue`);
    assert.equal(normalizeUri(upper), `${normalizeUri(VIZE)}/parent.vue`);
    assert.equal(normalizeUri(lower), `${normalizeUri(VERTER)}/childcard.vue`);
    // Same basename, three encodings, one normal form.
    assert.equal(
      new Set([encoded, lower].map((u) => normalizeUri(u).replace(/capture-[a-z-]+/, "ws"))).size,
      1,
    );
  });

  test("a native backslash path matches its own file:// uri", () => {
    assert.equal(uriMatchesPath(REAL.verterDefTag_SingleLocation.uri, `${VERTER}\\ChildCard.vue`), true);
    assert.equal(
      uriMatchesPath(REAL.volarDefTag_LocationLinkArray[0].targetUri, `${VOLAR}\\ChildCard.vue`),
      true,
    );
  });

  test("the generated .vue.ts twin of an SFC counts as the SFC", () => {
    // Volar's tsserver leg and virtual-file servers may answer with the
    // generated companion; an editor maps it straight back.
    assert.equal(uriMatchesPath(`file:///d%3A/x/ChildCard.vue.ts`, "D:\\x\\ChildCard.vue"), true);
    assert.equal(uriMatchesPath(`file:///d%3A/x/ChildCard.vue.js`, "D:\\x\\ChildCard.vue"), true);
  });

  test("a differently-named neighbour is still a different file", () => {
    assert.equal(uriMatchesPath(`file:///d:/x/ChildCard.vue.backup.vue`, "D:\\x\\ChildCard.vue"), false);
    assert.equal(uriMatchesPath(`file:///d:/x/Parent.vue`, "D:\\x\\ChildCard.vue"), false);
    assert.equal(uriMatchesPath("", "D:\\x\\ChildCard.vue"), false);
    assert.equal(uriMatchesPath(null, "D:\\x\\ChildCard.vue"), false);
  });
});

describe("toLocations — every legal definition shape", () => {
  test("LocationLink[] (targetUri / targetSelectionRange)", () => {
    const locs = toLocations(REAL.volarDefTag_LocationLinkArray);
    assert.equal(locs.length, 1);
    assert.equal(uriMatchesPath(locs[0].uri, `${VOLAR}\\ChildCard.vue`), true);
  });

  test("Location[]", () => {
    const locs = toLocations(REAL.volarTypeDef_LocationArray);
    assert.equal(locs.length, 1);
    assert.equal(uriMatchesPath(locs[0].uri, `${VOLAR}\\types.ts`), true);
  });

  test("a bare Location object", () => {
    assert.equal(toLocations(REAL.verterDefTag_SingleLocation).length, 1);
    assert.equal(toLocations(REAL.vizeDefImport_SingleLocation).length, 1);
  });

  test("null and junk produce no locations rather than throwing", () => {
    assert.deepEqual(toLocations(null), []);
    assert.deepEqual(toLocations(undefined), []);
    assert.deepEqual(toLocations([null, 7, "x", {}]), []);
  });

  test("mergeLocations dedupes the same hit reported by two providers", () => {
    const merged = mergeLocations(
      REAL.volarDefTag_LocationLinkArray,
      REAL.volarDefTag_LocationLinkArray,
    );
    assert.equal(merged.length, 1);
    assert.equal(mergeLocations(null, null), null);
    // An empty array from one leg must not erase the other leg's answer.
    assert.equal(mergeLocations([], REAL.volarTypeDef_LocationArray).length, 1);
  });
});

describe("gateDefinition", () => {
  test("Volar's LocationLink[] reaches ChildCard.vue", () => {
    const r = gateDefinition(REAL.volarDefTag_LocationLinkArray, {
      targetPath: `${VOLAR}\\ChildCard.vue`,
      currentPath: `${VOLAR}\\Parent.vue`,
      what: "tag definition",
      targetSource: FIXTURES.CHILD_SOURCE,
      fileDefinition: true,
    });
    assert.equal(r.valid, true, r.reason);
    assert.equal(r.artifact, 1);
  });

  test("Verter's bare Location reaches ChildCard.vue", () => {
    const r = gateDefinition(REAL.verterDefTag_SingleLocation, {
      targetPath: `${VERTER}\\ChildCard.vue`,
      currentPath: `${VERTER}\\Parent.vue`,
      targetSource: FIXTURES.CHILD_SOURCE,
      fileDefinition: true,
    });
    assert.equal(r.valid, true, r.reason);
  });

  test("an answer that never leaves the current file is invalid", () => {
    // Vize resolved the USE of an imported symbol to the import binding one
    // line above it. Nothing was navigated.
    const r = gateDefinition(REAL.vizeDefImport_SingleLocation, {
      targetPath: `${VIZE}\\helpers.ts`,
      currentPath: `${VIZE}\\Parent.vue`,
    });
    assert.equal(r.valid, false);
    assert.match(r.reason, /stayed inside Parent\.vue/);
    assert.match(r.reason, /helpers\.ts/);
  });

  test("null is invalid and says so plainly", () => {
    const r = gateDefinition(null, {
      targetPath: `${VIZE}\\ChildCard.vue`,
      currentPath: `${VIZE}\\Parent.vue`,
      what: "tag definition",
    });
    assert.equal(r.valid, false);
    assert.match(r.reason, /returned no location/);
    assert.equal(r.artifact, 0);
  });

  test("extra locations alongside the right one do NOT fail the gate", () => {
    // A server may legitimately return the local import binding as well as the
    // real declaration. The user still gets to helpers.ts; failing that would
    // be a false fail.
    const both = [REAL.vizeDefImport_SingleLocation, ...REAL.volarTypeDef_LocationArray];
    const r = gateDefinition(both, {
      targetPath: `${VOLAR}\\types.ts`,
      currentPath: `${VIZE}\\Parent.vue`,
      what: "typeDefinition",
      targetSource: FIXTURES.TYPES_SOURCE,
      expectedRange: declarationTarget(FIXTURES.TYPES_SOURCE, "CaptionOptions").range,
      allowedRange: declarationTarget(FIXTURES.TYPES_SOURCE, "CaptionOptions").container,
    });
    assert.equal(r.valid, true, r.reason);
    assert.equal(r.artifact, 2);
  });
});

describe("gateReferences", () => {
  test("declaration + parent-template use site passes", () => {
    const r = gateReferences(REAL.volarRefs, {
      declPath: `${VOLAR}\\ChildCard.vue`,
      usePath: `${VOLAR}\\Parent.vue`,
    });
    assert.equal(r.valid, true, r.reason);
    assert.equal(r.artifact, 4);
  });

  test("references confined to the declaring file fail, and the reason names the miss", () => {
    const r = gateReferences(REAL.vizeRefs, {
      declPath: `${VIZE}\\ChildCard.vue`,
      usePath: `${VIZE}\\Parent.vue`,
    });
    assert.equal(r.valid, false);
    assert.match(r.reason, /missing .*Parent\.vue/);
    // The count is still recorded: three real references were found.
    assert.equal(r.artifact, 3);
  });

  test("null is invalid with a zero census", () => {
    const r = gateReferences(null, {
      declPath: `${VERTER}\\ChildCard.vue`,
      usePath: `${VERTER}\\Parent.vue`,
    });
    assert.equal(r.valid, false);
    assert.match(r.reason, /returned nothing/);
    assert.equal(r.artifact, 0);
  });
});

describe("WorkspaceEdit normalisation — both shapes", () => {
  test("the changes shape", () => {
    const files = normalizeWorkspaceEdit(REAL.volarRename_Changes);
    assert.equal(files.length, 2);
    assert.equal(
      files.reduce((n, f) => n + f.edits.length, 0),
      4,
    );
  });

  test("the documentChanges shape, verbatim from inside a real CodeAction", () => {
    const files = normalizeWorkspaceEdit(REAL.volarCodeActions[0].edit);
    assert.equal(files.length, 1);
    assert.equal(files[0].edits.length, 1);
    assert.equal(uriMatchesPath(files[0].uri, `${VOLAR}\\Parent.vue`), true);
  });

  test("AnnotatedTextEdit counts as a text edit", () => {
    const files = normalizeWorkspaceEdit(LEGAL.renameDocumentChanges);
    assert.equal(
      files.reduce((n, f) => n + f.edits.length, 0),
      4,
    );
  });

  test("file create/rename/delete operations do not crash the walk", () => {
    const files = normalizeWorkspaceEdit({
      documentChanges: [
        { kind: "create", uri: "file:///d:/x/New.vue" },
        { kind: "rename", oldUri: "file:///d:/x/A.vue", newUri: "file:///d:/x/B.vue" },
        { kind: "delete", uri: "file:///d:/x/Old.vue" },
      ],
    });
    assert.equal(files.length, 3);
    assert.equal(
      files.reduce((n, f) => n + f.edits.length, 0),
      0,
    );
  });

  test("null / junk normalise to nothing", () => {
    assert.deepEqual(normalizeWorkspaceEdit(null), []);
    assert.deepEqual(normalizeWorkspaceEdit({}), []);
    assert.deepEqual(normalizeWorkspaceEdit({ changes: {} }), []);
  });

  test("mergeWorkspaceEdits dedupes so the edit census is not doubled", () => {
    // Volar answers rename from its Vue half AND from tsserver. Without the
    // dedupe the artifact would read 8 for a 4-edit refactor.
    const merged = mergeWorkspaceEdits(REAL.volarRename_Changes, REAL.volarRename_Changes);
    const total = normalizeWorkspaceEdit(merged).reduce((n, f) => n + f.edits.length, 0);
    assert.equal(total, 4);
    assert.equal(mergeWorkspaceEdits(null, null), null);
    assert.equal(mergeWorkspaceEdits({}, {}), null);
    assert.equal(normalizeWorkspaceEdit(mergeWorkspaceEdits({}, REAL.volarRename_Changes)).length, 2);
    // One leg silent must not erase the other's answer.
    assert.equal(
      normalizeWorkspaceEdit(mergeWorkspaceEdits(null, REAL.vizeRename_Changes)).length,
      1,
    );
  });
});

describe("gateRename — the killer gate", () => {
  const targets = (root) => ({
    templatePath: `${root}\\Parent.vue`,
    declPath: `${root}\\ChildCard.vue`,
    newName: "renamedCaption",
  });

  test("a rename that reaches the parent template passes, and counts 4 edits", () => {
    const r = gateRename(REAL.volarRename_Changes, targets(VOLAR));
    assert.equal(r.valid, true, r.reason);
    assert.equal(r.artifact, 4);
  });

  test("a rename that edits only the declaration is INVALID", () => {
    // The whole point of this suite. Three well-formed edits, zero of them in
    // the template that consumes the prop.
    const r = gateRename(REAL.vizeRename_Changes, targets(VIZE));
    assert.equal(r.valid, false, "a declaration-only rename must never pass");
    assert.match(r.reason, /BROKEN REFACTOR/);
    assert.match(r.reason, /Parent\.vue/);
    // The edits it DID produce are still reported rather than zeroed.
    assert.equal(r.artifact, 3);
  });

  test("the parent-template edit really lands on the prop binding", () => {
    // Guards the probe as much as the gate: if positionOf ever drifted off
    // `captionText: string`, this range would cover something else.
    const parentEdits = normalizeWorkspaceEdit(REAL.volarRename_Changes).find((f) =>
      uriMatchesPath(f.uri, `${VOLAR}\\Parent.vue`),
    );
    assert.equal(
      textInRange(FIXTURES.PARENT_SOURCE, parentEdits.edits[0].range),
      FIXTURES.PROP_NAME,
    );
  });

  test("a documentChanges rename is graded like a changes rename", () => {
    const r = gateRename(LEGAL.renameDocumentChanges, targets(VIZE));
    assert.equal(r.valid, true, r.reason);
    assert.equal(r.artifact, 4);
  });

  test("a kebab-cased template edit is accepted", () => {
    // A server may normalise `:captionText` to `:renamed-caption`. That is a
    // correct refactor; a gate demanding the camelCase spelling verbatim would
    // false-fail it.
    const kebab = {
      changes: {
        [`file:///d:/dev/personal/vue-benchmarks/work-ide/capture-vize/ChildCard.vue`]:
          normalizeWorkspaceEdit(REAL.volarRename_Changes).find((file) => file.uri.endsWith("ChildCard.vue")).edits,
        [`file:///d:/dev/personal/vue-benchmarks/work-ide/capture-vize/Parent.vue`]: [
          {
            range: { start: { line: 2, character: 16 }, end: { line: 2, character: 27 } },
            newText: "renamed-caption",
          },
        ],
      },
    };
    assert.equal(gateRename(kebab, targets(VIZE)).valid, true);
  });

  test("an edit in the template that does not write the new name fails", () => {
    const wrong = {
      changes: {
        [`file:///d:/dev/personal/vue-benchmarks/work-ide/capture-vize/Parent.vue`]: [
          {
            range: { start: { line: 2, character: 16 }, end: { line: 2, character: 27 } },
            newText: "captionText",
          },
        ],
      },
    };
    const r = gateRename(wrong, targets(VIZE));
    assert.equal(r.valid, false);
    assert.match(r.reason, /BROKEN REFACTOR/);
  });

  test("null and empty edits are invalid", () => {
    assert.equal(gateRename(null, targets(VERTER)).valid, false);
    assert.match(gateRename(null, targets(VERTER)).reason, /no WorkspaceEdit/);
    const empty = gateRename({ changes: { "file:///d:/x/Parent.vue": [] } }, targets(VERTER));
    assert.equal(empty.valid, false);
    assert.equal(empty.artifact, 0);
  });
});

describe("gatePrepareRename — four legal answers", () => {
  const opts = { source: FIXTURES.CHILD_SOURCE, expected: FIXTURES.PROP_NAME };

  test("a bare Range is validated against the source it covers", () => {
    const r = gatePrepareRename(REAL.volarPrepareRename_BareRange, opts);
    assert.equal(r.valid, true, r.reason);
    assert.equal(textInRange(FIXTURES.CHILD_SOURCE, REAL.volarPrepareRename_BareRange), "captionText");
  });

  test("key order in the serialized Range is irrelevant", () => {
    assert.equal(gatePrepareRename(REAL.vizePrepareRename_BareRange, opts).valid, true);
  });

  test("{ range, placeholder } passes", () => {
    assert.equal(gatePrepareRename(LEGAL.prepareRenameWithPlaceholder, opts).valid, true);
  });

  test("{ defaultBehavior: true } passes without any range", () => {
    // A full-strength positive answer. Demanding a range would false-fail it.
    assert.equal(gatePrepareRename(LEGAL.prepareRenameDefaultBehavior, opts).valid, true);
  });

  test("null is a refusal, and is reported as one", () => {
    const r = gatePrepareRename(null, opts);
    assert.equal(r.valid, false);
    assert.match(r.reason, /declines to rename/);
  });

  test("a range over the wrong text fails and shows what it covered", () => {
    const r = gatePrepareRename(
      { start: { line: 0, character: 0 }, end: { line: 0, character: 9 } },
      opts,
    );
    assert.equal(r.valid, false);
    assert.match(r.reason, /template/);
  });
});

describe("gateCodeActions", () => {
  test("Volar's CodeAction[] passes and the quick fix is named in the sample", async () => {
    const r = await gateCodeActions(REAL.volarCodeActions, { filePath: `${VOLAR}\\Parent.vue` });
    assert.equal(r.valid, true, r.reason);
    assert.equal(r.artifact, 2);
    assert.match(r.sample, /Change spelling to 'fixtureLabel'/);
    // Both entries are actionable (edit and/or command).
    assert.match(r.sample, /^2\/2 actionable/);
  });

  test("a bare Command[] is valid when executing it produces the intended edit", async () => {
    const r = await gateCodeActions(LEGAL.commandArray, {
      filePath: `${VOLAR}\\Parent.vue`, execute: async () => REAL.volarCodeActions[0].edit,
    });
    assert.equal(r.valid, true, r.reason);
    assert.equal(r.artifact, 1);
  });

  test("null is invalid", async () => {
    const r = await gateCodeActions(null);
    assert.equal(r.valid, false);
    assert.match(r.reason, /returned nothing/);
    assert.equal(r.artifact, 0);
  });

  test("untitled entries do not count", async () => {
    const r = await gateCodeActions([{ kind: "quickfix" }, { title: "   " }]);
    assert.equal(r.valid, false);
    assert.match(r.reason, /without a title/);
  });
});

describe("signature help — both ParameterInformation.label shapes", () => {
  test("string labels", () => {
    assert.deepEqual(signatureParamLabels(REAL.volarSignatureHelp.signatures[0]), [
      "rawText: string",
      "repeat: number",
    ]);
    const r = gateSignatureHelp(REAL.volarSignatureHelp, FIXTURES.PARAM_NAME);
    assert.equal(r.valid, true, r.reason);
    assert.equal(r.artifact, 1);
  });

  test("[start, end] offset labels are resolved against the signature label", () => {
    assert.deepEqual(signatureParamLabels(LEGAL.signatureHelpWithOffsetLabels.signatures[0]), [
      "rawText: string",
      "repeat: number",
    ]);
    assert.equal(
      gateSignatureHelp(LEGAL.signatureHelpWithOffsetLabels, FIXTURES.PARAM_NAME).valid,
      true,
    );
  });

  test("a signature with no parameters array but the name in its label passes", () => {
    // Failing this would be a false fail: the user has been shown the
    // parameter. `rawText` occurs nowhere else in the fixture, so the label
    // check cannot be satisfied by accident.
    const r = gateSignatureHelp(
      { signatures: [{ label: "formatCaption(rawText: string, repeat: number): string" }] },
      FIXTURES.PARAM_NAME,
    );
    assert.equal(r.valid, true, r.reason);
  });

  test("a signature for some other function fails", () => {
    const r = gateSignatureHelp(
      { signatures: [{ label: "shout(first: string, times: number): string", parameters: [{ label: "first: string" }] }] },
      FIXTURES.PARAM_NAME,
    );
    assert.equal(r.valid, false);
    assert.match(r.reason, /no signature names/);
  });

  test("null and an empty signature list fail", () => {
    assert.equal(gateSignatureHelp(null, FIXTURES.PARAM_NAME).valid, false);
    const r = gateSignatureHelp({ signatures: [] }, FIXTURES.PARAM_NAME);
    assert.equal(r.valid, false);
    assert.match(r.reason, /no signatures/);
  });
});

describe("formatting", () => {
  test("Volar's whole-document edit genuinely reformats Messy.vue", () => {
    const r = gateFormatting(FIXTURES.MESSY_SOURCE, REAL.volarFormatting);
    assert.equal(r.valid, true, r.reason);
    assert.equal(r.artifact, 1);
    const next = applyTextEdits(FIXTURES.MESSY_SOURCE, REAL.volarFormatting);
    assert.notEqual(next, FIXTURES.MESSY_SOURCE);
    assert.match(next, /<div class="messy">/);
  });

  test("Vize's differently-opinionated formatter also passes", () => {
    // The gate must not encode one formatter's house style: Vize moves the
    // <script> block above <template>, which is a different but valid answer.
    const r = gateFormatting(FIXTURES.MESSY_SOURCE, REAL.vizeFormatting);
    assert.equal(r.valid, true, r.reason);
  });

  test("null on a deliberately unformatted document is invalid", () => {
    const r = gateFormatting(FIXTURES.MESSY_SOURCE, null);
    assert.equal(r.valid, false);
    assert.match(r.reason, /returned null/);
    assert.equal(r.artifact, 0);
  });

  test("edits that reproduce the input byte for byte are invalid", () => {
    // The fast-and-wrong case: a non-empty TextEdit[] that changes nothing
    // would otherwise register as a very quick success.
    const noop = [
      {
        range: { start: { line: 0, character: 0 }, end: { line: 15, character: 0 } },
        newText: FIXTURES.MESSY_SOURCE,
      },
    ];
    const r = gateFormatting(FIXTURES.MESSY_SOURCE, noop);
    assert.equal(r.valid, false);
    assert.match(r.reason, /reproduce the input unchanged/);
    assert.equal(r.artifact, 1);
  });

  test("applyTextEdits applies several edits back-to-front without shifting them", () => {
    const src = "alpha\nbeta\ngamma\n";
    const out = applyTextEdits(src, [
      { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, newText: "AAA" },
      { range: { start: { line: 2, character: 0 }, end: { line: 2, character: 5 } }, newText: "ZZZZZZZ" },
    ]);
    assert.equal(out, "AAA\nbeta\nZZZZZZZ\n");
  });

  test("out-of-range edits are rejected instead of silently applied elsewhere", () => {
    assert.throws(() => applyTextEdits("abc\n", [
      { range: { start: { line: 99, character: 99 }, end: { line: 99, character: 200 } }, newText: "!" },
    ]), /out-of-bounds/);
  });
});

describe("fixture integrity", () => {
  test("the quick-fix diagnostic replayed to every server matches the fixture typo", () => {
    assert.match(FIXTURES.QUICK_FIX_DIAGNOSTIC.message, /Cannot find name 'fixtureLabl'/);
    assert.equal(FIXTURES.QUICK_FIX_DIAGNOSTIC.code, 2552);
    // The typo must exist exactly once, and must not be a substring of the
    // identifier it misspells — otherwise positionOf would find the wrong one.
    assert.equal(FIXTURES.PARENT_SOURCE.split(FIXTURES.TYPO).length - 1, 1);
    assert.equal("fixtureLabel".includes(FIXTURES.TYPO), false);
  });

  test("the signature-help parameter name is not a substring of the function name", () => {
    // Otherwise the label check would pass on the function name alone.
    assert.equal("formatCaption".toLowerCase().includes(FIXTURES.PARAM_NAME.toLowerCase()), false);
    assert.match(FIXTURES.HELPERS_SOURCE, new RegExp(`formatCaption\\(${FIXTURES.PARAM_NAME}: string`));
  });

  test("the typing variant differs from the base source only in the call arguments", () => {
    assert.equal(
      FIXTURES.PARENT_TYPING_SOURCE.split("\n").length,
      FIXTURES.PARENT_SOURCE.split("\n").length,
    );
    assert.match(FIXTURES.PARENT_TYPING_SOURCE, /formatCaption\(\)/);
  });

  test("Parent.vue really consumes the prop ChildCard.vue declares", () => {
    assert.match(FIXTURES.PARENT_SOURCE, new RegExp(`:${FIXTURES.PROP_NAME}="heading"`));
    assert.match(FIXTURES.CHILD_SOURCE, new RegExp(`${FIXTURES.PROP_NAME}: string`));
  });
});

describe("applied navigation mutation controls", () => {
  const parentPath = `${VOLAR}\\Parent.vue`;
  const childPath = `${VOLAR}\\ChildCard.vue`;
  const renameOptions = { templatePath: parentPath, declPath: childPath, newName: FIXTURES.NEW_NAME };
  const whole = (source, newText) => ({ range: rangeOf(source, 0, source.length), newText });
  const rename = () => structuredClone(REAL.volarRename_Changes);
  const fileKey = (edit, name) => Object.keys(edit.changes).find((key) => key.endsWith(name));

  test("a parent comment containing the new name cannot satisfy rename", () => {
    const edit = rename();
    edit.changes[fileKey(edit, "Parent.vue")] = [{ range: rangeOf(FIXTURES.PARENT_SOURCE, 0, 0), newText: "<!-- renamedCaption -->\n" }];
    assert.equal(gateRename(edit, renameOptions).valid, false);
  });

  test("every intended use and the declaration must be renamed", () => {
    const edit = rename();
    edit.changes[fileKey(edit, "ChildCard.vue")].pop();
    assert.equal(gateRename(edit, renameOptions).valid, false);
  });

  test("string and comment decoys cannot be renamed", () => {
    for (const marker of ["'captionText'", "// captionText"]) {
      const edit = rename();
      const start = FIXTURES.PARENT_SOURCE.indexOf(marker) + marker.indexOf("captionText");
      edit.changes[fileKey(edit, "Parent.vue")].push({ range: rangeOf(FIXTURES.PARENT_SOURCE, start, start + 11), newText: FIXTURES.NEW_NAME });
      assert.equal(gateRename(edit, renameOptions).valid, false, marker);
    }
  });

  test("whole-document replacement is a legal rename layout when semantics match", () => {
    const edit = rename();
    for (const [name, source] of [["Parent.vue", FIXTURES.PARENT_SOURCE], ["ChildCard.vue", FIXTURES.CHILD_SOURCE]]) {
      const key = fileKey(edit, name);
      edit.changes[key] = [whole(source, applyTextEdits(source, edit.changes[key]))];
    }
    assert.equal(gateRename(edit, renameOptions).valid, true);
  });

  test("malformed edits and overlapping ranges cannot be silently discarded", () => {
    const malformed = rename();
    malformed.changes[fileKey(malformed, "Parent.vue")].push({ newText: "bad" });
    assert.equal(gateRename(malformed, renameOptions).valid, false);
    const overlap = rename();
    overlap.changes[fileKey(overlap, "Parent.vue")].push(overlap.changes[fileKey(overlap, "Parent.vue")][0]);
    assert.equal(gateRename(overlap, renameOptions).valid, false);
  });

  test("resource operations survive provider merging and invalidate a prop rename", () => {
    const edit = mergeWorkspaceEdits(REAL.volarRename_Changes, { documentChanges: [{ kind: "delete", uri: "file:///d:/fixture/Other.vue" }] });
    assert.equal(gateRename(edit, renameOptions).valid, false);
  });

  test("named definitions require the right source range, not just the filename", () => {
    const target = declarationTarget(FIXTURES.HELPERS_SOURCE, "formatCaption");
    const options = {
      targetPath: `${VOLAR}\\helpers.ts`, currentPath: parentPath, targetSource: FIXTURES.HELPERS_SOURCE,
      expectedRange: target.range, allowedRange: target.container,
    };
    const uri = `file:///d%3A/dev/personal/vue-benchmarks/work-ide/capture-volar/helpers.ts`;
    assert.equal(gateDefinition({ uri, range: target.range }, options).valid, true);
    assert.equal(gateDefinition([{ targetUri: uri, targetRange: target.container, targetSelectionRange: target.range }], options).valid, true);
    assert.equal(gateDefinition({ uri, range: target.container }, options).valid, true);
    for (const range of [null, rangeOf(FIXTURES.HELPERS_SOURCE, 0, 0), rangeOf(FIXTURES.HELPERS_SOURCE, 0, FIXTURES.HELPERS_SOURCE.length)]) {
      assert.equal(gateDefinition({ uri, range }, options).valid, false);
    }
    assert.equal(gateDefinition({ uri: `${uri}.ts`, range: target.range }, options).valid, false);
    assert.equal(gateDefinition({ uri: parentPath, range: rangeOf(FIXTURES.PARENT_SOURCE, 1, 2) }, {
      targetPath: parentPath, currentPath: childPath, targetSource: FIXTURES.PARENT_SOURCE, fileDefinition: true,
    }).valid, false);
  });

  test("reference ranges must identify all intended uses and no decoys", () => {
    const options = { declPath: childPath, usePath: parentPath };
    const missing = structuredClone(REAL.volarRefs);
    missing[3].range = rangeOf(FIXTURES.PARENT_SOURCE, 0, 0);
    assert.equal(gateReferences(missing, options).valid, false);
    const extra = [...REAL.volarRefs, { uri: REAL.volarRefs[3].uri, range: rangeOf(FIXTURES.PARENT_SOURCE, 0, 0) }];
    assert.equal(gateReferences(extra, options).valid, false);
  });

  test("formatting cannot delete the SFC, change literals or change behavior", () => {
    for (const replacement of ["", FIXTURES.MESSY_SOURCE.replace("'messy'", "'different'"), FIXTURES.MESSY_SOURCE.replace("msg.value,3", "msg.value,4")]) {
      assert.equal(gateFormatting(FIXTURES.MESSY_SOURCE, [whole(FIXTURES.MESSY_SOURCE, replacement)]).valid, false);
    }
  });

  test("UTF-16 ranges preserve CRLF and astral characters around the edit", () => {
    const source = "🧪 alpha\r\nbeta\r\n";
    assert.equal(applyTextEdits(source, [{ range: { start: { line: 0, character: 3 }, end: { line: 0, character: 8 } }, newText: "A" }]), "🧪 A\r\nbeta\r\n");
    assert.equal(textInRange(source, { start: { line: 0, character: 8 }, end: { line: 0, character: 9 } }), "");
  });

  test("resolved actions must apply the intended fix and remove its TypeScript diagnostic", async () => {
    const options = { filePath: parentPath };
    assert.ok(typoDiagnostic(FIXTURES.PARENT_SOURCE, FIXTURES.TYPO).length);
    const resolved = await gateCodeActions([{ title: "Fix spelling", kind: "quickfix", data: { id: 1 } }], {
      ...options, resolve: async () => REAL.volarCodeActions[0],
    });
    assert.equal(resolved.valid, true, resolved.reason);
    const unrelated = { title: "Fix spelling", kind: "quickfix", edit: { changes: { [parentPath]: [{ range: rangeOf(FIXTURES.PARENT_SOURCE, 0, 0), newText: "<!-- fixtureLabel -->\n" }] } } };
    assert.equal((await gateCodeActions([unrelated], options)).valid, false);
    const invalid = structuredClone(REAL.volarCodeActions[0]);
    invalid.edit.documentChanges[0].edits[0].newText = "anotherMissingName";
    assert.equal((await gateCodeActions([invalid], options)).valid, false);
    assert.equal((await gateCodeActions(LEGAL.commandArray, options)).valid, false);
  });

  test("command-backed fixes acknowledge disposable edits and restore the request handler", async () => {
    let handler;
    let restored = false;
    const provider = {
      setServerRequestHandler(method, next) {
        assert.equal(method, "workspace/applyEdit");
        handler = next;
        return () => { restored = true; handler = null; };
      },
      async sendRequest(method, params) {
        assert.equal(method, "workspace/executeCommand");
        assert.equal(params.command, "editor.action.applyFix");
        assert.deepEqual(await handler({ edit: REAL.volarCodeActions[0].edit }), { applied: true });
        return null;
      },
    };
    const result = await gateCodeActions(LEGAL.commandArray, {
      filePath: parentPath,
      execute: (command, action) => executeDisposableCommand(provider, command, action, { filePath: parentPath, source: FIXTURES.PARENT_SOURCE, timeoutMs: 100 }),
    });
    assert.equal(result.valid, true, result.reason);
    assert.equal(restored, true);
    assert.equal(handler, null);
  });

  test("command failures still restore the request handler", async () => {
    let restored = false;
    const provider = {
      setServerRequestHandler: () => () => { restored = true; },
      sendRequest: async () => { throw new Error("command failed"); },
    };
    await assert.rejects(() => executeDisposableCommand(provider, "fix", {}, { filePath: parentPath, source: FIXTURES.PARENT_SOURCE, timeoutMs: 100 }), /command failed/);
    assert.equal(restored, true);
  });
});
