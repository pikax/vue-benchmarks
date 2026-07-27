/**
 * Background-suite content gates — regression guard.
 *
 * Every payload marked CAPTURE below is the verbatim JSON a real server sent
 * during `node scripts/ide-bench.mjs --suite background --server all --runs 1
 * --warmups 0 --verbose`, copied out of the suite's own `--verbose` dump. They
 * are compact rather than pretty-printed for exactly the reason the hover-gate
 * fixtures are not tidied: the bytes ARE the test.
 *
 * The alternate shapes each gate has to survive, all of them real:
 *
 *   documentSymbol   nested DocumentSymbol[]        Volar, Verter
 *                    flat DocumentSymbol[]          Vize (two SFC blocks, no children)
 *                    SymbolInformation[]            typescript-language-server
 *                                                   (range hides in location.range)
 *   inlayHint        label: string                  Vize
 *                    label: InlayHintLabelPart[]    Volar's TypeScript half
 *   semanticTokens   { resultId, data }             Volar
 *                    { data }                       Vize (no resultId)
 *                    null                           Verter
 *   foldingRange     endLine === closeLine          Vize, Verter
 *                    endLine === closeLine - 1      Volar
 *
 * A shape this suite fails to handle gets reported as a server failure, which is
 * the most damaging thing this harness can do — so each of those rows has a test
 * that would go red if the handling were dropped.
 *
 * The absolute `file:` URIs inside the captures are the capture machine's
 * workspace paths. No gate reads them; they are left in because trimming a
 * payload is how a fixture stops being evidence.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  EDITED_SOURCE,
  EXPECTED_SYMBOLS,
  HIGHLIGHT_SYMBOL,
  SOURCE,
  decodeRequestError,
  expectationsFor,
  flattenSymbols,
  gateDocumentHighlights,
  gateDocumentSymbols,
  gateFoldingRanges,
  gateInlayHints,
  gateSemanticTokens,
  gateSemanticTokensDelta,
  inlayLabelText,
  occurrencesOf,
} from "../../scripts/lib/ide-ops/suites/background.mjs";

const EXPECT = expectationsFor(SOURCE);

/* -------------------------------------------------------------------------- */
/* Verbatim captures                                                          */
/* -------------------------------------------------------------------------- */

/* CAPTURE — Volar (@vue/language-server), textDocument/semanticTokens/full */
const VOLAR_TOKENS = {"resultId":"1785108447283","data":[3,13,7,8,0,3,17,5,7,3,0,9,14,8,0,0,22,5,7,2,0,6,2,8,0,1,11,11,11,0,0,12,5,7,2,4,36,8,11,0,0,9,9,8,0,8,10,5,3,1,1,2,2,8,1,1,2,5,8,1,1,2,6,8,1,3,6,7,7,3,1,6,9,7,3,1,6,9,7,3,2,6,7,7,3,0,10,3,10,0,0,4,5,3,0,2,6,14,7,3,0,17,8,10,2,0,15,7,7,2,0,8,5,8,0,0,6,6,11,16,0,8,1,6,1,0,6,1,6,0,0,2,6,8,0,0,10,9,7,2,2,9,11,10,1,0,12,5,6,1,0,7,5,3,0,1,12,5,6,0,0,6,5,8,0,0,10,5,6,0,0,6,6,8,0,3,9,8,10,1,0,9,5,6,1,0,15,6,6,1,1,2,7,7,2,0,8,5,8,0,0,6,4,11,16,0,7,2,8,1,0,4,7,7,2,0,8,5,8,0,0,6,6,8,16,0,12,5,8,1,0,7,6,8,1,3,0,8,10,0]};

/* CAPTURE — Vize LSP, textDocument/semanticTokens/full (note: no resultId) */
const VIZE_TOKENS = {"data":[3,13,7,8,0,3,10,5,15,0,0,7,5,8,0,0,6,2,15,0,0,3,14,8,0,0,16,4,9,0,0,6,5,8,0,0,6,2,9,0,1,11,11,12,0,0,12,5,8,0,4,28,6,11,0,0,8,8,12,0,0,9,9,8,0,0,11,1,19,0,20,23,8,12,512]};

/* CAPTURE — Verter LSP, textDocument/semanticTokens/full */
const VERTER_TOKENS = null;

/* CAPTURE — the JSON-RPC error text LspClient throws, per server */
const VOLAR_DELTA_ERROR = "{\"code\":-32601,\"message\":\"Unhandled method textDocument/semanticTokens/full/delta\"}";
const VIZE_DELTA_ERROR = "{\"code\":-32601,\"message\":\"Method not found\"}";
const VERTER_DELTA_ERROR = "{\"code\":-32601,\"message\":\"Method not found\"}";

/* CAPTURE — Volar, textDocument/documentSymbol (nested DocumentSymbol[]) */
const VOLAR_SYMBOLS = [{"name":"template","kind":2,"range":{"start":{"line":0,"character":0},"end":{"line":14,"character":11}},"selectionRange":{"start":{"line":0,"character":0},"end":{"line":0,"character":10}},"children":[{"name":"section.panel","kind":8,"range":{"start":{"line":1,"character":2},"end":{"line":13,"character":12}},"selectionRange":{"start":{"line":1,"character":2},"end":{"line":13,"character":12}},"children":[{"name":"header","kind":8,"range":{"start":{"line":2,"character":4},"end":{"line":4,"character":13}},"selectionRange":{"start":{"line":2,"character":4},"end":{"line":4,"character":13}},"children":[{"name":"h1","kind":8,"range":{"start":{"line":3,"character":6},"end":{"line":3,"character":28}},"selectionRange":{"start":{"line":3,"character":6},"end":{"line":3,"character":28}}}]},{"name":"ul","kind":8,"range":{"start":{"line":5,"character":4},"end":{"line":9,"character":9}},"selectionRange":{"start":{"line":5,"character":4},"end":{"line":9,"character":9}},"children":[{"name":"li","kind":8,"range":{"start":{"line":6,"character":6},"end":{"line":8,"character":11}},"selectionRange":{"start":{"line":6,"character":6},"end":{"line":8,"character":11}}}]},{"name":"footer","kind":8,"range":{"start":{"line":10,"character":4},"end":{"line":12,"character":13}},"selectionRange":{"start":{"line":10,"character":4},"end":{"line":12,"character":13}},"children":[{"name":"button","kind":8,"range":{"start":{"line":11,"character":6},"end":{"line":11,"character":72}},"selectionRange":{"start":{"line":11,"character":6},"end":{"line":11,"character":72}}}]}]}]},{"name":"script setup","kind":2,"range":{"start":{"line":16,"character":0},"end":{"line":42,"character":9}},"selectionRange":{"start":{"line":16,"character":0},"end":{"line":16,"character":24}},"children":[{"name":"addEntry","kind":12,"range":{"start":{"line":37,"character":0},"end":{"line":39,"character":1}},"selectionRange":{"start":{"line":37,"character":9},"end":{"line":37,"character":17}},"children":[{"name":"id","kind":7,"range":{"start":{"line":38,"character":23},"end":{"line":38,"character":51}},"selectionRange":{"start":{"line":38,"character":23},"end":{"line":38,"character":25}},"children":[]},{"name":"label","kind":7,"range":{"start":{"line":38,"character":53},"end":{"line":38,"character":58}},"selectionRange":{"start":{"line":38,"character":53},"end":{"line":38,"character":58}},"children":[]},{"name":"weight","kind":7,"range":{"start":{"line":38,"character":60},"end":{"line":38,"character":66}},"selectionRange":{"start":{"line":38,"character":60},"end":{"line":38,"character":66}},"children":[]}]},{"name":"entries","kind":13,"range":{"start":{"line":29,"character":6},"end":{"line":29,"character":32}},"selectionRange":{"start":{"line":29,"character":6},"end":{"line":29,"character":13}},"children":[]},{"name":"Entry","kind":11,"range":{"start":{"line":19,"character":0},"end":{"line":23,"character":1}},"selectionRange":{"start":{"line":19,"character":10},"end":{"line":19,"character":15}},"children":[{"name":"id","kind":7,"range":{"start":{"line":20,"character":2},"end":{"line":20,"character":12}},"selectionRange":{"start":{"line":20,"character":2},"end":{"line":20,"character":4}},"children":[]},{"name":"label","kind":7,"range":{"start":{"line":21,"character":2},"end":{"line":21,"character":15}},"selectionRange":{"start":{"line":21,"character":2},"end":{"line":21,"character":7}},"children":[]},{"name":"weight","kind":7,"range":{"start":{"line":22,"character":2},"end":{"line":22,"character":16}},"selectionRange":{"start":{"line":22,"character":2},"end":{"line":22,"character":8}},"children":[]}]},{"name":"formatEntry","kind":12,"range":{"start":{"line":33,"character":0},"end":{"line":35,"character":1}},"selectionRange":{"start":{"line":33,"character":9},"end":{"line":33,"character":20}},"children":[]},{"name":"heading","kind":13,"range":{"start":{"line":25,"character":6},"end":{"line":25,"character":39}},"selectionRange":{"start":{"line":25,"character":6},"end":{"line":25,"character":13}},"children":[]},{"name":"nextLabel","kind":13,"range":{"start":{"line":26,"character":6},"end":{"line":26,"character":25}},"selectionRange":{"start":{"line":26,"character":6},"end":{"line":26,"character":15}},"children":[]},{"name":"threshold","kind":13,"range":{"start":{"line":27,"character":6},"end":{"line":27,"character":19}},"selectionRange":{"start":{"line":27,"character":6},"end":{"line":27,"character":15}},"children":[]},{"name":"visibleEntries","kind":13,"range":{"start":{"line":31,"character":6},"end":{"line":31,"character":89}},"selectionRange":{"start":{"line":31,"character":6},"end":{"line":31,"character":20}},"children":[{"name":"computed() callback","kind":12,"range":{"start":{"line":31,"character":32},"end":{"line":31,"character":88}},"selectionRange":{"start":{"line":31,"character":32},"end":{"line":31,"character":88}},"children":[{"name":"entries.value.filter() callback","kind":12,"range":{"start":{"line":31,"character":59},"end":{"line":31,"character":87}},"selectionRange":{"start":{"line":31,"character":59},"end":{"line":31,"character":87}},"children":[]}]}]}]}];

/* CAPTURE — Vize, textDocument/documentSymbol (flat DocumentSymbol[], no children) */
const VIZE_SYMBOLS = [{"kind":2,"name":"template","range":{"end":{"character":0,"line":14},"start":{"character":0,"line":0}},"selectionRange":{"end":{"character":10,"line":0},"start":{"character":0,"line":0}}},{"detail":"ts","kind":2,"name":"script setup","range":{"end":{"character":0,"line":42},"start":{"character":0,"line":16}},"selectionRange":{"end":{"character":14,"line":16},"start":{"character":0,"line":16}}}];

/* CAPTURE — Verter, textDocument/documentSymbol (nested, decorated block name) */
const VERTER_SYMBOLS = [{"children":[{"kind":8,"name":"<section>","range":{"end":{"character":12,"line":13},"start":{"character":2,"line":1}},"selectionRange":{"end":{"character":12,"line":13},"start":{"character":2,"line":1}}}],"kind":23,"name":"template","range":{"end":{"character":11,"line":14},"start":{"character":0,"line":0}},"selectionRange":{"end":{"character":10,"line":0},"start":{"character":0,"line":0}}},{"children":[{"detail":"const","kind":14,"name":"heading","range":{"end":{"character":13,"line":25},"start":{"character":6,"line":25}},"selectionRange":{"end":{"character":13,"line":25},"start":{"character":6,"line":25}}},{"detail":"const","kind":14,"name":"nextLabel","range":{"end":{"character":15,"line":26},"start":{"character":6,"line":26}},"selectionRange":{"end":{"character":15,"line":26},"start":{"character":6,"line":26}}},{"detail":"const","kind":14,"name":"threshold","range":{"end":{"character":15,"line":27},"start":{"character":6,"line":27}},"selectionRange":{"end":{"character":15,"line":27},"start":{"character":6,"line":27}}},{"detail":"const (reactive)","kind":14,"name":"entries","range":{"end":{"character":13,"line":29},"start":{"character":6,"line":29}},"selectionRange":{"end":{"character":13,"line":29},"start":{"character":6,"line":29}}},{"detail":"const (reactive)","kind":14,"name":"visibleEntries","range":{"end":{"character":20,"line":31},"start":{"character":6,"line":31}},"selectionRange":{"end":{"character":20,"line":31},"start":{"character":6,"line":31}}},{"detail":"function","kind":12,"name":"formatEntry","range":{"end":{"character":20,"line":33},"start":{"character":9,"line":33}},"selectionRange":{"end":{"character":20,"line":33},"start":{"character":9,"line":33}}},{"detail":"function","kind":12,"name":"addEntry","range":{"end":{"character":17,"line":37},"start":{"character":9,"line":37}},"selectionRange":{"end":{"character":17,"line":37},"start":{"character":9,"line":37}}},{"detail":"from 'vue'","kind":13,"name":"computed","range":{"end":{"character":35,"line":17},"start":{"character":0,"line":17}},"selectionRange":{"end":{"character":17,"line":17},"start":{"character":9,"line":17}}},{"detail":"from 'vue'","kind":13,"name":"ref","range":{"end":{"character":35,"line":17},"start":{"character":0,"line":17}},"selectionRange":{"end":{"character":22,"line":17},"start":{"character":19,"line":17}}}],"detail":"script setup","kind":2,"name":"script setup (ts)","range":{"end":{"character":9,"line":42},"start":{"character":0,"line":16}},"selectionRange":{"end":{"character":24,"line":16},"start":{"character":0,"line":16}}}];

/*
 * CAPTURE — typescript-language-server (the TypeScript half of the Volar pair),
 * textDocument/documentSymbol for a plain .ts document. The harness client does
 * not advertise hierarchicalDocumentSymbolSupport, so a conforming server
 * answers with the FLAT SymbolInformation[] encoding, whose range lives at
 * location.range. This is the shape a suite most easily forgets.
 */
const TS_LS_SYMBOL_INFORMATION = [{"name":"addEntry","kind":12,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":12,"character":0},"end":{"line":14,"character":1}}}},{"name":"id","kind":7,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":13,"character":14},"end":{"line":13,"character":33}}},"containerName":"addEntry"},{"name":"label","kind":7,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":13,"character":35},"end":{"line":13,"character":40}}},"containerName":"addEntry"},{"name":"weight","kind":7,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":13,"character":42},"end":{"line":13,"character":48}}},"containerName":"addEntry"},{"name":"Entry","kind":11,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":0,"character":0},"end":{"line":4,"character":1}}}},{"name":"id","kind":7,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":1,"character":2},"end":{"line":1,"character":12}}},"containerName":"Entry"},{"name":"label","kind":7,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":2,"character":2},"end":{"line":2,"character":15}}},"containerName":"Entry"},{"name":"weight","kind":7,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":3,"character":2},"end":{"line":3,"character":16}}},"containerName":"Entry"},{"name":"formatEntry","kind":12,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":8,"character":0},"end":{"line":10,"character":1}}}},{"name":"threshold","kind":14,"location":{"uri":"file:///C:/Users/david/AppData/Local/Temp/claude/D--dev-personal-vue-benchmarks/c295f8d2-ffed-4909-96da-61074cf9a039/scratchpad/bg3-ws/entries.ts","range":{"start":{"line":6,"character":13},"end":{"line":6,"character":26}}}}];

/* CAPTURE — Volar, textDocument/documentHighlight at the `entries` declaration */
const VOLAR_HIGHLIGHTS = [{"range":{"start":{"line":29,"character":6},"end":{"line":29,"character":13}},"kind":3},{"range":{"start":{"line":31,"character":38},"end":{"line":31,"character":45}},"kind":2},{"range":{"start":{"line":38,"character":2},"end":{"line":38,"character":9}},"kind":2},{"range":{"start":{"line":38,"character":27},"end":{"line":38,"character":34}},"kind":2}];

/* CAPTURE — Verter, same request. Same data, different key order. */
const VERTER_HIGHLIGHTS = [{"kind":3,"range":{"end":{"character":13,"line":29},"start":{"character":6,"line":29}}},{"kind":2,"range":{"end":{"character":45,"line":31},"start":{"character":38,"line":31}}},{"kind":2,"range":{"end":{"character":9,"line":38},"start":{"character":2,"line":38}}},{"kind":2,"range":{"end":{"character":34,"line":38},"start":{"character":27,"line":38}}}];

/* CAPTURE — Volar's TypeScript half, textDocument/inlayHint (label as parts) */
const VOLAR_INLAY_HINTS = [{"position":{"line":29,"character":13},"label":[{"value":": "},{"value":"Ref","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/node_modules/.pnpm/%40vue%2Breactivity%403.5.40/node_modules/%40vue/reactivity/dist/reactivity.d.ts","range":{"start":{"line":416,"character":17},"end":{"line":416,"character":20}}}},{"value":"<"},{"value":"{"},{"value":" "},{"value":"id"},{"value":": "},{"value":"number"},{"value":"; "},{"value":"label"},{"value":": "},{"value":"string"},{"value":"; "},{"value":"weight"},{"value":": "},{"value":"number"},{"value":" "},{"value":"}"},{"value":"[]"},{"value":", "},{"value":"Entry","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/work-ide/background-volar-2/Background.vue","range":{"start":{"line":42,"character":10},"end":{"line":42,"character":10}}}},{"value":"[]"},{"value":" | "},{"value":"{"},{"value":" "},{"value":"id"},{"value":": "},{"value":"number"},{"value":"; "},{"value":"label"},{"value":": "},{"value":"string"},{"value":"; "},{"value":"weight"},{"value":": "},{"value":"number"},{"value":" "},{"value":"}"},{"value":"[]"},{"value":">"}],"kind":1,"paddingLeft":true},{"position":{"line":29,"character":29},"label":[{"value":"value","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/node_modules/.pnpm/%40vue%2Breactivity%403.5.40/node_modules/%40vue/reactivity/dist/reactivity.d.ts","range":{"start":{"line":440,"character":31},"end":{"line":440,"character":36}}}},{"value":":"}],"kind":2,"paddingRight":true},{"position":{"line":31,"character":20},"label":[{"value":": "},{"value":"ComputedRef","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/node_modules/.pnpm/%40vue%2Breactivity%403.5.40/node_modules/%40vue/reactivity/dist/reactivity.d.ts","range":{"start":{"line":352,"character":17},"end":{"line":352,"character":28}}}},{"value":"<"},{"value":"{"},{"value":" "},{"value":"id"},{"value":": "},{"value":"number"},{"value":"; "},{"value":"label"},{"value":": "},{"value":"string"},{"value":"; "},{"value":"weight"},{"value":": "},{"value":"number"},{"value":" "},{"value":"}"},{"value":"[]"},{"value":">"}],"kind":1,"paddingLeft":true},{"position":{"line":31,"character":32},"label":[{"value":"getter","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/node_modules/.pnpm/%40vue%2Breactivity%403.5.40/node_modules/%40vue/reactivity/dist/reactivity.d.ts","range":{"start":{"line":411,"character":36},"end":{"line":411,"character":42}}}},{"value":":"}],"kind":2,"paddingRight":true},{"position":{"line":31,"character":34},"label":[{"value":": "},{"value":"{"},{"value":" "},{"value":"id"},{"value":": "},{"value":"number"},{"value":"; "},{"value":"label"},{"value":": "},{"value":"string"},{"value":"; "},{"value":"weight"},{"value":": "},{"value":"number"},{"value":" "},{"value":"}"},{"value":"[]"}],"kind":1,"paddingLeft":true},{"position":{"line":31,"character":59},"label":[{"value":"predicate","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/node_modules/.pnpm/typescript%405.9.3/node_modules/typescript/lib/lib.es5.d.ts","range":{"start":{"line":1481,"character":11},"end":{"line":1481,"character":20}}}},{"value":":"}],"kind":2,"paddingRight":true},{"position":{"line":31,"character":61},"label":[{"value":": "},{"value":"{"},{"value":" "},{"value":"id"},{"value":": "},{"value":"number"},{"value":"; "},{"value":"label"},{"value":": "},{"value":"string"},{"value":"; "},{"value":"weight"},{"value":": "},{"value":"number"},{"value":" "},{"value":"}"}],"kind":1,"paddingLeft":true},{"position":{"line":31,"character":62},"label":[{"value":": "},{"value":"boolean"}],"kind":1,"paddingLeft":true},{"position":{"line":38,"character":21},"label":[{"value":"...items","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/node_modules/.pnpm/typescript%405.9.3/node_modules/typescript/lib/lib.es5.d.ts","range":{"start":{"line":1346,"character":12},"end":{"line":1346,"character":17}}}},{"value":":"}],"kind":2,"paddingRight":true},{"position":{"line":41,"character":9},"label":[{"value":"label","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/work-ide/background-volar-2/Background.vue","range":{"start":{"line":42,"character":10},"end":{"line":42,"character":10}}}},{"value":":"}],"kind":2,"paddingRight":true},{"position":{"line":41,"character":17},"label":[{"value":"weight","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/work-ide/background-volar-2/Background.vue","range":{"start":{"line":42,"character":10},"end":{"line":42,"character":10}}}},{"value":":"}],"kind":2,"paddingRight":true},{"position":{"line":7,"character":23},"label":[{"value":"entry","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/work-ide/background-volar-2/Background.vue","range":{"start":{"line":42,"character":10},"end":{"line":42,"character":10}}}},{"value":":"}],"kind":2,"paddingRight":true},{"position":{"line":11,"character":45},"label":[{"value":"label","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/work-ide/background-volar-2/Background.vue","range":{"start":{"line":42,"character":10},"end":{"line":42,"character":10}}}},{"value":":"}],"kind":2,"paddingRight":true},{"position":{"line":11,"character":56},"label":[{"value":"weight","location":{"uri":"file:///d%3A/dev/personal/vue-benchmarks/work-ide/background-volar-2/Background.vue","range":{"start":{"line":42,"character":10},"end":{"line":42,"character":10}}}},{"value":":"}],"kind":2,"paddingRight":true}];

/* CAPTURE — Vize, textDocument/inlayHint (label as a plain string) */
const VIZE_INLAY_HINTS = [{"kind":1,"label":": Ref<Entry[]>","paddingLeft":true,"position":{"character":13,"line":29},"tooltip":"Vue reactive binding (Ref)"},{"kind":1,"label":": ComputedRef<boolean>","paddingLeft":true,"position":{"character":20,"line":31},"tooltip":"Vue reactive binding (ComputedRef)"}];

/* CAPTURE — Verter, textDocument/inlayHint */
const VERTER_INLAY_HINTS = null;

/* CAPTURE — textDocument/foldingRange */
const VOLAR_FOLDING = [{"startLine":19,"endLine":22,"startCharacter":15,"endCharacter":16},{"startLine":29,"endLine":29,"startCharacter":29,"endCharacter":29},{"startLine":33,"endLine":34,"startCharacter":42,"endCharacter":43},{"startLine":34,"endLine":34,"startCharacter":9,"endCharacter":9},{"startLine":37,"endLine":38,"startCharacter":54,"endCharacter":69},{"startLine":38,"endLine":38,"startCharacter":21,"endCharacter":21},{"startLine":2,"endLine":3},{"startLine":6,"endLine":7},{"startLine":5,"endLine":8},{"startLine":10,"endLine":11},{"startLine":1,"endLine":12},{"startLine":0,"endLine":13},{"startLine":16,"endLine":41}];
const VIZE_FOLDING = [{"collapsedText":"template","endLine":14,"kind":"region","startLine":0},{"collapsedText":"script setup","endLine":42,"kind":"region","startLine":16}];
const VERTER_FOLDING = [{"collapsedText":"<template>...","endCharacter":11,"endLine":14,"kind":"region","startCharacter":0,"startLine":0},{"collapsedText":"<script>...","endCharacter":9,"endLine":42,"kind":"region","startCharacter":0,"startLine":16},{"collapsedText":"<section>...","endCharacter":12,"endLine":13,"kind":"region","startCharacter":2,"startLine":1},{"collapsedText":"<header>...","endCharacter":13,"endLine":4,"kind":"region","startCharacter":4,"startLine":2},{"collapsedText":"<ul>...","endCharacter":9,"endLine":9,"kind":"region","startCharacter":4,"startLine":5},{"collapsedText":"<li>...","endCharacter":11,"endLine":8,"kind":"region","startCharacter":6,"startLine":6},{"collapsedText":"<footer>...","endCharacter":13,"endLine":12,"kind":"region","startCharacter":4,"startLine":10}];

/* -------------------------------------------------------------------------- */

describe("fixture positions are derived, not written down", () => {
  test("the probe sits on the `entries` declaration and the fixture uses it 4x", () => {
    assert.equal(EXPECT.highlightOccurrences.length, 4);
    assert.deepEqual(EXPECT.highlightProbe, EXPECT.highlightOccurrences[0]);
    // Every occurrence is inside the script block, so a highlight in the
    // template would be a mapping bug rather than a legal extra.
    for (const occ of EXPECT.highlightOccurrences) {
      assert.ok(occ.line > EXPECT.script.openLine && occ.line < EXPECT.script.closeLine);
    }
  });

  test("`visibleEntries` does not masquerade as an occurrence of `entries`", () => {
    // Case matters: the template says `visibleEntries`, whose lowercase run
    // never spells the probe symbol. If it did, the highlight gate would be
    // checking positions the server was never asked about.
    assert.equal(occurrencesOf(SOURCE, HIGHLIGHT_SYMBOL).length, 4);
    assert.ok(SOURCE.includes("visibleEntries"));
  });

  test("the delta edit moves no line and no later column", () => {
    const before = SOURCE.split(/\r?\n/);
    const after = EDITED_SOURCE.split(/\r?\n/);
    assert.notEqual(SOURCE, EDITED_SOURCE);
    assert.equal(before.length, after.length);
    const changed = before.map((l, i) => (l === after[i] ? null : i)).filter((i) => i !== null);
    assert.deepEqual(changed.length, 1);
    // …and the one line it touches is not a line any other gate is derived from.
    const touched = changed[0];
    assert.ok(EXPECT.highlightOccurrences.every((o) => o.line !== touched));
    assert.ok(touched !== EXPECT.script.openLine && touched !== EXPECT.script.closeLine);
    assert.deepEqual(expectationsFor(EDITED_SOURCE), EXPECT);
  });
});

describe("gateSemanticTokens", () => {
  test("accepts Volar's { resultId, data }", () => {
    const r = gateSemanticTokens(VOLAR_TOKENS);
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.tokens, VOLAR_TOKENS.data.length / 5);
    assert.equal(r.resultId, VOLAR_TOKENS.resultId);
  });

  test("accepts Vize's { data } with no resultId", () => {
    const r = gateSemanticTokens(VIZE_TOKENS);
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.resultId, null, "absent resultId must be reported as null, not invented");
    assert.equal(r.tokens, VIZE_TOKENS.data.length / 5);
  });

  test("rejects Verter's null with the payload named in the reason", () => {
    const r = gateSemanticTokens(VERTER_TOKENS);
    assert.equal(r.ok, false);
    assert.match(r.reason, /returned null/);
  });

  test("rejects an empty token array", () => {
    assert.equal(gateSemanticTokens({ data: [] }).ok, false);
  });

  test("rejects a truncated array that is not a whole number of tokens", () => {
    // The failure mode this catches is a fast, confident, WRONG answer: a
    // half-written token array decodes into garbage colours in the editor.
    const r = gateSemanticTokens({ data: VOLAR_TOKENS.data.slice(0, -1) });
    assert.equal(r.ok, false);
    assert.match(r.reason, /multiple of 5/);
  });

  test("rejects non-integer and negative entries", () => {
    assert.equal(gateSemanticTokens({ data: [0, 0, 5, 1, 0.5] }).ok, false);
    assert.equal(gateSemanticTokens({ data: [0, 0, 5, 1, -1] }).ok, false);
  });

  test("tolerates a bare array, which is not spec but is not wrong either", () => {
    assert.equal(gateSemanticTokens(VOLAR_TOKENS.data).ok, true);
  });

  test("rejects an object with no data array, naming what it did get", () => {
    const r = gateSemanticTokens({ resultId: "7" });
    assert.equal(r.ok, false);
    assert.match(r.reason, /resultId/);
  });
});

describe("gateSemanticTokensDelta", () => {
  test("accepts a full token set — a legal answer to a delta request", () => {
    const r = gateSemanticTokensDelta(VOLAR_TOKENS);
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.kind, "full");
  });

  test("accepts a well-formed SemanticTokensDelta", () => {
    const r = gateSemanticTokensDelta({
      resultId: "2",
      edits: [{ start: 10, deleteCount: 5, data: [0, 1, 4, 8, 0] }],
    });
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.kind, "delta");
    assert.equal(r.edits, 1);
  });

  test("accepts an empty edit list", () => {
    // Deliberate. This fixture's edit widens a string literal, and a server
    // whose legend does not classify string literals correctly produces no
    // token change at all. Demanding an edit would fail it for being right.
    assert.equal(gateSemanticTokensDelta({ resultId: "2", edits: [] }).ok, true);
  });

  test("rejects an edit with no deleteCount", () => {
    const r = gateSemanticTokensDelta({ edits: [{ start: 0 }] });
    assert.equal(r.ok, false);
    assert.match(r.reason, /start\/deleteCount/);
  });

  test("rejects edit data that is not a whole number of tokens", () => {
    const r = gateSemanticTokensDelta({ edits: [{ start: 0, deleteCount: 0, data: [1, 2, 3] }] });
    assert.equal(r.ok, false);
    assert.match(r.reason, /5-integer tokens/);
  });

  test("rejects null and a payload that is neither shape", () => {
    assert.equal(gateSemanticTokensDelta(null).ok, false);
    const r = gateSemanticTokensDelta({ resultId: "2" });
    assert.equal(r.ok, false);
    assert.match(r.reason, /no `edits` array/);
  });
});

describe("decodeRequestError", () => {
  test("decodes Volar's -32601 verbatim", () => {
    const r = decodeRequestError(VOLAR_DELTA_ERROR);
    assert.equal(r.code, -32601);
    assert.equal(r.text, "Unhandled method textDocument/semanticTokens/full/delta");
  });

  test("decodes the tower-lsp servers' terser -32601", () => {
    for (const raw of [VIZE_DELTA_ERROR, VERTER_DELTA_ERROR]) {
      const r = decodeRequestError(raw);
      assert.equal(r.code, -32601);
      assert.equal(r.text, "Method not found");
    }
  });

  test("passes a transport failure through untouched", () => {
    const raw = "verter: textDocument/inlayHint timed out after 45000ms";
    const r = decodeRequestError(raw);
    assert.equal(r.code, null);
    assert.equal(r.text, raw);
  });
});

describe("flattenSymbols", () => {
  test("descends children of a nested DocumentSymbol[]", () => {
    const flat = flattenSymbols(VOLAR_SYMBOLS);
    assert.ok(flat.length > VOLAR_SYMBOLS.length, "children must be walked, not just the roots");
    assert.ok(flat.some((s) => s.name === "addEntry"));
    assert.ok(flat.every((s) => s.range !== null));
  });

  test("reads SymbolInformation ranges out of location.range", () => {
    const flat = flattenSymbols(TS_LS_SYMBOL_INFORMATION);
    assert.equal(flat.length, TS_LS_SYMBOL_INFORMATION.length);
    for (const [i, s] of flat.entries()) {
      assert.deepEqual(
        s.range,
        TS_LS_SYMBOL_INFORMATION[i].location.range,
        "a SymbolInformation has no top-level range; missing this reports a correct server as broken",
      );
    }
    assert.ok(flat.some((s) => s.container === "addEntry"), "containerName is part of the shape");
  });

  test("is inert on a null or non-array payload", () => {
    assert.deepEqual(flattenSymbols(null), []);
    assert.deepEqual(flattenSymbols({ name: "x" }), []);
  });
});

describe("gateDocumentSymbols", () => {
  test("accepts Volar's nested outline", () => {
    const r = gateDocumentSymbols(VOLAR_SYMBOLS, EXPECTED_SYMBOLS, EXPECT.script);
    assert.equal(r.ok, true, r.reason);
  });

  test("accepts Verter's outline, which names every binding but no interface", () => {
    // Verter lists the seven value bindings and omits `Entry`. That is a usable
    // outline, so `Entry` is deliberately absent from EXPECTED_SYMBOLS — this
    // test is what stops someone adding it back.
    const r = gateDocumentSymbols(VERTER_SYMBOLS, EXPECTED_SYMBOLS, EXPECT.script);
    assert.equal(r.ok, true, r.reason);
    assert.ok(!r.names.includes("Entry"));
    assert.ok(r.names.includes("script setup (ts)"), "decorated block names must not break matching");
  });

  test("rejects Vize's block-only outline and names every missing symbol", () => {
    const r = gateDocumentSymbols(VIZE_SYMBOLS, EXPECTED_SYMBOLS, EXPECT.script);
    assert.equal(r.ok, false);
    for (const name of EXPECTED_SYMBOLS) assert.match(r.reason, new RegExp(name));
  });

  test("accepts a SymbolInformation[] outline", () => {
    // A .ts document has no SFC block, so the anchor is the whole file.
    const wholeFile = { openLine: -1, closeLine: Number.MAX_SAFE_INTEGER };
    const r = gateDocumentSymbols(
      TS_LS_SYMBOL_INFORMATION,
      ["threshold", "formatEntry", "addEntry", "Entry"],
      wholeFile,
    );
    assert.equal(r.ok, true, r.reason);
  });

  test("`visibleEntries` alone does not satisfy `entries`", () => {
    // The substring trap. A loose `includes()` would credit this outline with a
    // symbol it never reported.
    const outline = [
      { name: "visibleEntries", kind: 13, range: { start: { line: 31, character: 6 }, end: { line: 31, character: 20 } } },
      { name: "formatEntry", kind: 12, range: { start: { line: 33, character: 0 }, end: { line: 35, character: 1 } } },
    ];
    const r = gateDocumentSymbols(outline, ["entries"], EXPECT.script);
    assert.equal(r.ok, false);
    assert.match(r.reason, /entries/);
  });

  test("matches a decorated name through whole-identifier comparison", () => {
    const outline = [
      { name: "const threshold", kind: 13, range: { start: { line: 27, character: 6 }, end: { line: 27, character: 19 } } },
      { name: "addEntry(label, weight)", kind: 12, range: { start: { line: 37, character: 0 }, end: { line: 39, character: 1 } } },
    ];
    const r = gateDocumentSymbols(outline, ["threshold", "addEntry"], EXPECT.script);
    assert.equal(r.ok, true, r.reason);
  });

  test("rejects an outline whose functions are ranged outside the script block", () => {
    const outline = flattenSymbols(VERTER_SYMBOLS)
      .filter((s) => s.range)
      .map((s) => ({
        name: s.name,
        kind: s.kind,
        range: {
          start: { line: 0, character: s.range.start.character },
          end: { line: 0, character: s.range.end.character },
        },
      }));
    const r = gateDocumentSymbols(outline, EXPECTED_SYMBOLS, EXPECT.script);
    assert.equal(r.ok, false);
    assert.match(r.reason, /inside the script block/);
  });

  test("rejects null and a non-array", () => {
    assert.equal(gateDocumentSymbols(null, EXPECTED_SYMBOLS, EXPECT.script).ok, false);
    assert.equal(gateDocumentSymbols({}, EXPECTED_SYMBOLS, EXPECT.script).ok, false);
  });
});

describe("gateDocumentHighlights", () => {
  test("accepts Volar's four ranges", () => {
    const r = gateDocumentHighlights(VOLAR_HIGHLIGHTS, EXPECT.highlightOccurrences);
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.matched, 4);
  });

  test("accepts Verter's identical answer with the keys in a different order", () => {
    const r = gateDocumentHighlights(VERTER_HIGHLIGHTS, EXPECT.highlightOccurrences);
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.matched, 4);
  });

  test("accepts ranges wider than the identifier", () => {
    // A server may highlight the whole declarator. Requiring an exact start
    // position would fail it for being generous.
    const wide = EXPECT.highlightOccurrences.map((o) => ({
      range: { start: { line: o.line, character: 0 }, end: { line: o.line, character: 200 } },
    }));
    assert.equal(gateDocumentHighlights(wide, EXPECT.highlightOccurrences).ok, true);
  });

  test("rejects four ranges over the wrong symbol", () => {
    // Fast and wrong: the right SHAPE, the right COUNT, the wrong places.
    const shifted = VOLAR_HIGHLIGHTS.map((h) => ({
      kind: h.kind,
      range: {
        start: { line: h.range.start.line + 100, character: h.range.start.character },
        end: { line: h.range.end.line + 100, character: h.range.end.character },
      },
    }));
    const r = gateDocumentHighlights(shifted, EXPECT.highlightOccurrences);
    assert.equal(r.ok, false);
    assert.match(r.reason, /only 0 of the 4/);
  });

  test("rejects a single range for a symbol used four times", () => {
    const r = gateDocumentHighlights(VOLAR_HIGHLIGHTS.slice(0, 1), EXPECT.highlightOccurrences);
    assert.equal(r.ok, false);
    assert.match(r.reason, /at least 2/);
  });

  test("rejects null", () => {
    assert.equal(gateDocumentHighlights(null, EXPECT.highlightOccurrences).ok, false);
  });
});

describe("inlayLabelText", () => {
  test("passes a plain string label through", () => {
    assert.equal(inlayLabelText(VIZE_INLAY_HINTS[0].label), ": Ref<Entry[]>");
  });

  test("joins an InlayHintLabelPart[] into the text the editor draws", () => {
    const text = inlayLabelText(VOLAR_INLAY_HINTS[0].label);
    assert.ok(Array.isArray(VOLAR_INLAY_HINTS[0].label), "this capture must stay the parts shape");
    assert.ok(text.startsWith(": Ref<"), `parts joined wrong: ${JSON.stringify(text)}`);
    assert.ok(text.length > 10);
  });

  test("returns empty for shapes that carry no text", () => {
    assert.equal(inlayLabelText(undefined), "");
    assert.equal(inlayLabelText([{ tooltip: "no value here" }]), "");
  });
});

describe("gateInlayHints", () => {
  test("accepts Volar's parts-labelled hints", () => {
    const r = gateInlayHints(VOLAR_INLAY_HINTS, EXPECT);
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.count, VOLAR_INLAY_HINTS.length);
    assert.ok(r.best.line > EXPECT.script.openLine);
  });

  test("accepts Vize's string-labelled hints", () => {
    const r = gateInlayHints(VIZE_INLAY_HINTS, EXPECT);
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.best.text, ": Ref<Entry[]>");
  });

  test("rejects Verter's null", () => {
    const r = gateInlayHints(VERTER_INLAY_HINTS, EXPECT);
    assert.equal(r.ok, false);
    assert.match(r.reason, /returned null/);
  });

  test("rejects an empty array", () => {
    assert.equal(gateInlayHints([], EXPECT).ok, false);
  });

  test("rejects a hint with an empty label", () => {
    const r = gateInlayHints([{ position: { line: 29, character: 13 }, label: "" }], EXPECT);
    assert.equal(r.ok, false);
    assert.match(r.reason, /1 hint\(s\), 0 with a label/);
  });

  test("rejects a labelled hint parked outside the script block", () => {
    const r = gateInlayHints([{ position: { line: 0, character: 0 }, label: ": string" }], EXPECT);
    assert.equal(r.ok, false);
    assert.match(r.reason, /inside the script block/);
  });

  test("rejects a hint positioned past the end of the document", () => {
    const r = gateInlayHints(
      [{ position: { line: EXPECT.lastLine + 50, character: 0 }, label: ": string" }],
      EXPECT,
    );
    assert.equal(r.ok, false);
    assert.match(r.reason, /0 inside the document/);
  });

  test("one good hint survives a malformed neighbour", () => {
    const r = gateInlayHints([{ label: "" }, ...VIZE_INLAY_HINTS], EXPECT);
    assert.equal(r.ok, true, r.reason);
  });
});

describe("gateFoldingRanges", () => {
  test("accepts Volar's ranges, which end one line short of the closing tag", () => {
    const r = gateFoldingRanges(VOLAR_FOLDING, EXPECT);
    assert.equal(r.ok, true, r.reason);
    assert.deepEqual(r.covers, ["template", "script"]);
    const templateFold = VOLAR_FOLDING.find((f) => f.startLine === EXPECT.template.openLine);
    assert.equal(templateFold.endLine, EXPECT.template.closeLine - 1, "the convention this test pins");
  });

  test("accepts Vize's ranges, which end ON the closing tag", () => {
    const r = gateFoldingRanges(VIZE_FOLDING, EXPECT);
    assert.equal(r.ok, true, r.reason);
    const templateFold = VIZE_FOLDING.find((f) => f.startLine === EXPECT.template.openLine);
    assert.equal(templateFold.endLine, EXPECT.template.closeLine, "the other convention");
  });

  test("accepts Verter's ranges", () => {
    const r = gateFoldingRanges(VERTER_FOLDING, EXPECT);
    assert.equal(r.ok, true, r.reason);
    assert.deepEqual(r.covers, ["template", "script"]);
  });

  test("rejects an answer with only inner folds", () => {
    const inner = VOLAR_FOLDING.filter(
      (f) => !(f.startLine <= EXPECT.template.openLine && f.endLine >= EXPECT.template.closeLine - 1) &&
             !(f.startLine <= EXPECT.script.openLine && f.endLine >= EXPECT.script.closeLine - 1),
    );
    const r = gateFoldingRanges(inner, EXPECT);
    assert.equal(r.ok, false);
    assert.match(r.reason, /none covering the template/);
  });

  test("rejects null and an empty array", () => {
    assert.equal(gateFoldingRanges(null, EXPECT).ok, false);
    assert.equal(gateFoldingRanges([], EXPECT).ok, false);
  });
});
