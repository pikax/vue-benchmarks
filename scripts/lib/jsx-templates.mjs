/**
 * Unique JSX/TSX component bodies for vue-jsx-vapor / @vue/babel-plugin-jsx benches.
 * Not SFCs — separate surface from Vue SFC compile.
 */

const PATTERNS = [
  (id) => `export default function Comp${id}() {
  const n = ${Number(id) % 97}
  return <div class="c-${id}" data-id="${id}">{n}</div>
}
`,
  (id) => `export default function Comp${id}(props) {
  return (
    <button type="button" onClick={() => props.onInc?.()}>
      {props.label ?? 'L${id}'}
    </button>
  )
}
`,
  (id) => `export default function Comp${id}() {
  const items = [${Number(id) % 3}, ${(Number(id) + 1) % 5}, ${(Number(id) + 2) % 7}]
  return (
    <ul class="list-${id}">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}
`,
  (id) => `export default function Comp${id}() {
  const show = ${Number(id) % 2 === 0}
  return show ? <span class="yes-${id}">yes</span> : <span class="no-${id}">no</span>
}
`,
  (id) => `export default function Comp${id}() {
  const title = 'T${id}'
  const body = 'body-${id}'
  return (
    <section class="sec-${id}">
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  )
}
`,
];

export function jsxTemplateForIndex(i) {
  const id = String(i).padStart(5, "0");
  const fn = PATTERNS[i % PATTERNS.length];
  // Salt the body so every generated project file remains content-distinct.
  return `${fn(id)}\n// unique:${id}:${i * 2654435761}\n`;
}

export function createJsxCorpus(count) {
  const files = [];
  for (let i = 0; i < count; i++) {
    const id = String(i).padStart(5, "0");
    files.push({
      filename: `Comp${id}.jsx`,
      source: jsxTemplateForIndex(i),
    });
  }
  return files;
}
