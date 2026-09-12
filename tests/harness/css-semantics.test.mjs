import assert from "node:assert/strict";
import { test } from "node:test";
import { cssProjection } from "../../scripts/lib/css-semantics.mjs";
import { FORMAT_VALIDITY_PLANTS, judgeFormattedPlant } from "../../scripts/lib/format-validity-plants.mjs";
import { parse } from "@vue/compiler-sfc";

test("CSS semantic projection accepts equivalent colors, independent declaration order and media syntax", () => {
  const before = '.a{color:red;color:blue!important;--gap:2px;padding:1px 2px}@media(min-width:1px){.a::before{color:blue}}';
  const after = '.a{color:#f00;--gap:2px;padding:1px 2px;color:#00f!important}@media(width >= 1px){.a:before{color:#0000ff}}';
  assert.deepEqual(cssProjection(before), cssProjection(after));
  assert.deepEqual(cssProjection('@media(max-height:2em){.a{opacity:.8}}'), cssProjection('@media(height <= 2em){.a{opacity:0.8}}'));
});

test("CSS normalization preserves conflicting declarations, shorthand order and custom-property tokens", () => {
  for (const [before, after] of [
    ['.a{color:red;color:blue}', '.a{color:blue;color:red}'],
    ['.a{color:red;color:blue!important}', '.a{color:red;color:blue}'],
    ['.a{padding:1px;padding-left:2px}', '.a{padding-left:2px;padding:1px}'],
    ['.a{padding:1px;all:unset}', '.a{all:unset;padding:1px}'],
    ['.a{--tone:blue}', '.a{--tone:#00f}'],
    ['.a{--tone:red;--tone:blue}', '.a{--tone:blue;--tone:red}'],
    ['.a{color:red}', '.a{color:blue}'],
    ['.a{content:"keep  spaces"}', '.a{content:"keep spaces"}'],
  ]) assert.notDeepEqual(cssProjection(before), cssProjection(after), `${before} must differ from ${after}`);
});

test("media and pseudo-element normalization does not equate changed boundaries or unrelated selectors", () => {
  const original = '@media(min-width:1px){.a::before{color:red}}';
  for (const changed of [
    '@media(width > 1px){.a::before{color:red}}',
    '@media(width >= 2px){.a::before{color:red}}',
    '@media(width >= 1em){.a::before{color:red}}',
    '@media(height >= 1px){.a::before{color:red}}',
    '@media not (width >= 1px){.a::before{color:red}}',
    '@media(width >= 1px){.a::after{color:red}}',
  ]) assert.notDeepEqual(cssProjection(original), cssProjection(changed));
  assert.notDeepEqual(cssProjection('.a:selection{color:red}'), cssProjection('.a::selection{color:red}'));
});

test("format plant accepts semantics-preserving CSS canonicalization but still rejects a changed cascade", () => {
  const plant = FORMAT_VALIDITY_PLANTS.find((plant) => plant.id === "css-and-custom-block-semantics");
  const formatted = plant.source
    .replace('<section><span>preserve</span><span>styles</span></section>', '<section>\n<span>preserve</span><span>styles</span>\n</section>')
    .replace('color:red;color:blue!important;--label:"keep  two spaces";padding:1px 2px', 'color:red;--label:"keep  two spaces";padding:1px 2px;color:#00f!important')
    .replace('(min-width:1px)', '(width >= 1px)')
    .replace('::before', ':before');
  const judge = (first) => judgeFormattedPlant({ plant, original: plant.source, first, second: first, parse });
  const result = judge(formatted);
  assert.equal(result.ok, true, result.failures.join('; '));
  assert.equal(judge(formatted.replace('color:#00f!important', 'color:#f00!important')).ok, false);
});
