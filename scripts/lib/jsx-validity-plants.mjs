import { createHash } from "node:crypto";

/**
 * Observable-behaviour plants for the generated JSX VDOM comparison.
 *
 * The compiler outputs are intentionally not compared with one another. The
 * oracle mounts each generated component and observes DOM, events and updates.
 */

function equal(actual, expected, context) {
  if (actual !== expected) {
    throw new Error(
      `${context}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function truthy(value, context) {
  if (!value) throw new Error(context);
}

function mountPlant(mount, component, options, run) {
  const wrapper = mount(component, options);
  return Promise.resolve(run(wrapper)).finally(() => wrapper.unmount());
}

export const JSX_VALIDITY_SUITE_VERSION = "2026-08-20.1";

export const JSX_VALIDITY_PLANTS = Object.freeze([
  {
    id: "static-element-attributes",
    coverage: ["element", "static text", "class", "data attribute"],
    source: `export default function App() {
  return <div class="wrap" data-plant="root">hello</div>
}`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, (wrapper) => {
        const root = wrapper.get('[data-plant="root"]');
        equal(root.text(), "hello", "static text");
        truthy(root.classes("wrap"), "static class was not retained");
      });
    },
  },
  {
    id: "interpolation-and-prop-update",
    coverage: ["expression child", "component props", "reactive rerender"],
    source: `export default function App(props) {
  return <output data-plant="value">{props.label}:{props.count}</output>
}`,
    assert({ mount, component }) {
      return mountPlant(
        mount,
        component,
        { props: { label: "first", count: 1 } },
        async (wrapper) => {
          equal(wrapper.get('[data-plant="value"]').text(), "first:1", "initial props");
          await wrapper.setProps({ label: "next", count: 2 });
          equal(wrapper.get('[data-plant="value"]').text(), "next:2", "updated props");
        },
      );
    },
  },
  {
    id: "keyed-list-map",
    coverage: ["array children", "map", "key", "dynamic text"],
    source: `export default function App(props) {
  return <ul>{props.items.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
}`,
    assert({ mount, component }) {
      return mountPlant(
        mount,
        component,
        {
          props: {
            items: [
              { id: 1, label: "A" },
              { id: 2, label: "B" },
            ],
          },
        },
        async (wrapper) => {
          equal(
            wrapper
              .findAll("li")
              .map((item) => item.text())
              .join(","),
            "A,B",
            "list order",
          );
          await wrapper.setProps({
            items: [
              { id: 2, label: "B2" },
              { id: 1, label: "A2" },
            ],
          });
          equal(
            wrapper
              .findAll("li")
              .map((item) => item.text())
              .join(","),
            "B2,A2",
            "keyed reorder",
          );
        },
      );
    },
  },
  {
    id: "fragment-children",
    coverage: ["fragment", "multiple roots", "sibling preservation"],
    source: `export default function App() {
  return <><span data-plant="a">A</span><span data-plant="b">B</span></>
}`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, (wrapper) => {
        equal(wrapper.get('[data-plant="a"]').text(), "A", "first fragment child");
        equal(wrapper.get('[data-plant="b"]').text(), "B", "second fragment child");
      });
    },
  },
  {
    id: "conditional-branches",
    coverage: ["ternary", "logical-and child", "prop update"],
    source: `export default function App(props) {
  return <div>
    {props.ok ? <span data-plant="yes">yes</span> : <span data-plant="no">no</span>}
    {props.extra && <em data-plant="extra">extra</em>}
  </div>
}`,
    assert({ mount, component }) {
      return mountPlant(mount, component, { props: { ok: true, extra: true } }, async (wrapper) => {
        truthy(wrapper.find('[data-plant="yes"]').exists(), "true branch was not rendered");
        truthy(wrapper.find('[data-plant="extra"]').exists(), "logical child was not rendered");
        await wrapper.setProps({ ok: false, extra: false });
        truthy(wrapper.find('[data-plant="no"]').exists(), "false branch was not rendered");
        truthy(
          !wrapper.find('[data-plant="extra"]').exists(),
          "false logical child remained rendered",
        );
      });
    },
  },
  {
    id: "spread-props-merge",
    coverage: ["object spread", "attribute merge", "static prop preservation"],
    source: `export default function App() {
  const rest = { id: 'spread-id', title: 'spread-title' }
  return <div class="base" {...rest} data-plant="spread">body</div>
}`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, (wrapper) => {
        const root = wrapper.get('[data-plant="spread"]');
        equal(root.attributes("id"), "spread-id", "spread id");
        equal(root.attributes("title"), "spread-title", "spread title");
        truthy(root.classes("base"), "static class was overwritten by the spread");
      });
    },
  },
  {
    id: "functional-component-props",
    coverage: ["component vnode", "functional component", "prop forwarding"],
    source: `const Child = (props) => <b data-plant="child">{props.label}</b>
export default function App() {
  return <section><Child label="hi" /></section>
}`,
    assert({ mount, component }) {
      return mountPlant(mount, component, undefined, (wrapper) => {
        equal(wrapper.get('[data-plant="child"]').text(), "hi", "child prop");
      });
    },
  },
  {
    id: "event-handler",
    coverage: ["native event", "handler prop", "exactly-once dispatch"],
    source: `export default function App(props) {
  return <button data-plant="button" onClick={props.onPing}>go</button>
}`,
    assert({ mount, component }) {
      let calls = 0;
      return mountPlant(mount, component, { props: { onPing: () => calls++ } }, async (wrapper) => {
        await wrapper.get('[data-plant="button"]').trigger("click");
        equal(calls, 1, "event dispatch count");
      });
    },
  },
]);

export const JSX_VALIDITY_SUITE_HASH = createHash("sha256")
  .update(
    JSON.stringify(
      JSX_VALIDITY_PLANTS.map(({ id, coverage, source }) => ({ id, coverage, source })),
    ),
  )
  .digest("hex");

export function unknownJsxValidityResults(reason) {
  return JSX_VALIDITY_PLANTS.map((plant) => ({
    id: plant.id,
    coverage: plant.coverage,
    status: "UNKNOWN",
    phase: "not-run",
    detail: reason,
  }));
}
