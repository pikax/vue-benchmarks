/**
 * Confirm vue-jsx-vapor / babel JSX transforms produce expected codegen shapes.
 *
 * The vapor and vdom-interop paths import virtual runtime modules
 * (`/vue-jsx-vapor/*`) that only exist inside a bundler, so those are checked at
 * the codegen level. The babel path emits plain `vue` vdom calls, so it is
 * additionally executed and mounted — a shape check alone cannot tell whether
 * spread props were merged or an event handler was actually bound.
 */
import { createSuite } from "../lib/harness.mjs";
import { ensureDom } from "../lib/dom.mjs";
import { loadCompiledComponent } from "../lib/compile-to-component.mjs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const PLANTS = [
  {
    id: "static-div",
    source: `export default function App() {
  return <div class="wrap" data-testid="root">hello</div>
}
`,
    expect: {
      vapor: [/template\s*\(/, /class=wrap|class="wrap"/],
      vdomInterop: [/createElementBlock|createVNode|openBlock/],
      babel: [/createVNode|_createVNode/, /"wrap"|'wrap'/],
    },
    async runtime(mount, component) {
      const w = mount(component);
      const root = w.get("[data-testid=root]");
      expectText(root.text(), "hello");
      if (root.classes("wrap") !== true) {
        throw new Error(`static class lost: classes=${JSON.stringify(root.classes())}`);
      }
      w.unmount();
    },
  },
  {
    id: "interp-text",
    source: `export default function App() {
  const msg = 'x'
  return <span>{msg}</span>
}
`,
    expect: {
      vapor: [/msg/],
      vdomInterop: [/msg/],
      babel: [/msg/],
    },
  },
  {
    id: "list-map",
    source: `export default function App() {
  const items = [1, 2, 3]
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}
`,
    expect: {
      vapor: [/map/, /items/],
      vdomInterop: [/map/, /items/],
      babel: [/map/, /items/],
    },
    async runtime(mount, component) {
      const w = mount(component);
      const items = w.findAll("li");
      if (items.length !== 3) {
        throw new Error(`expected 3 <li>, got ${items.length}`);
      }
      expectText(items[2].text(), "3");
      w.unmount();
    },
  },
  {
    id: "fragment",
    source: `export default function App() {
  return (
    <>
      <span data-testid="a">A</span>
      <span data-testid="b">B</span>
    </>
  )
}
`,
    expect: {
      // vapor returns a node array rather than a Fragment vnode
      vapor: [/\[_n0,\s*_n1\]|Fragment/],
      vdomInterop: [/Fragment/],
      babel: [/Fragment/],
    },
    async runtime(mount, component) {
      const w = mount(component);
      if (!w.find("[data-testid=a]").exists() || !w.find("[data-testid=b]").exists()) {
        throw new Error("fragment dropped one of its children");
      }
      w.unmount();
    },
  },
  {
    id: "conditional",
    source: `export default function App(props) {
  return (
    <div>
      {props.ok ? <span data-testid="yes">yes</span> : <span data-testid="no">no</span>}
      {props.extra && <em data-testid="extra">extra</em>}
    </div>
  )
}
`,
    expect: {
      vapor: [/props\.ok/, /props\.extra/],
      vdomInterop: [/props\.ok/, /props\.extra/],
      babel: [/props\.ok/, /props\.extra/],
    },
    async runtime(mount, component) {
      const on = mount(component, { props: { ok: true, extra: true } });
      if (!on.find("[data-testid=yes]").exists() || on.find("[data-testid=no]").exists()) {
        throw new Error("ternary picked the wrong branch for ok=true");
      }
      if (!on.find("[data-testid=extra]").exists()) {
        throw new Error("&& branch not rendered for extra=true");
      }
      on.unmount();

      const off = mount(component, { props: { ok: false, extra: false } });
      if (!off.find("[data-testid=no]").exists() || off.find("[data-testid=yes]").exists()) {
        throw new Error("ternary picked the wrong branch for ok=false");
      }
      if (off.find("[data-testid=extra]").exists()) {
        throw new Error("&& branch rendered for extra=false");
      }
      off.unmount();
    },
  },
  {
    id: "spread-props",
    source: `export default function App() {
  const rest = { id: 'spread-id', title: 'spread-title' }
  return <div class="base" {...rest} data-testid="root">body</div>
}
`,
    expect: {
      // a spread that overwrites instead of merging would drop class="base"
      vapor: [/setDynamicProps|mergeProps/],
      vdomInterop: [/mergeProps/],
      babel: [/mergeProps/],
    },
    async runtime(mount, component) {
      const w = mount(component);
      const root = w.get("[data-testid=root]");
      if (root.attributes("id") !== "spread-id" || root.attributes("title") !== "spread-title") {
        throw new Error("spread props were not applied");
      }
      if (!root.classes("base")) {
        throw new Error("static class before the spread was overwritten instead of merged");
      }
      w.unmount();
    },
  },
  {
    id: "component-props",
    source: `const Child = (props) => <b data-testid="child">{props.label}</b>
export default function App() {
  return <div><Child label="hi" /></div>
}
`,
    expect: {
      vapor: [/createComponent/, /label/],
      vdomInterop: [/createVNode\(\s*Child|Child,/, /label/],
      babel: [/createVNode\(Child/, /label/],
    },
    async runtime(mount, component) {
      const w = mount(component);
      expectText(w.get("[data-testid=child]").text(), "hi");
      w.unmount();
    },
  },
  {
    id: "event-handler",
    source: `export default function App(props) {
  return <button data-testid="btn" onClick={props.onPing}>go</button>
}
`,
    expect: {
      vapor: [/_on\(|"click"/],
      vdomInterop: [/onClick/],
      babel: [/onClick/],
    },
    async runtime(mount, component) {
      let calls = 0;
      const w = mount(component, {
        props: {
          onPing: () => {
            calls++;
          },
        },
      });
      await w.get("[data-testid=btn]").trigger("click");
      if (calls !== 1) {
        throw new Error(`onClick handler was not bound (calls=${calls})`);
      }
      w.unmount();
    },
  },
];

function loadTransformers() {
  const tools = [];

  try {
    const rs = require(
      require.resolve("@vue-jsx-vapor/compiler-rs", {
        paths: [rootDir],
      }),
    );
    if (typeof rs.transform === "function") {
      tools.push({
        id: "compiler-rs-vapor",
        expectKey: "vapor",
        transform: (src) => rs.transform(src)?.code ?? "",
      });
      tools.push({
        id: "compiler-rs-vdom",
        expectKey: "vdomInterop",
        transform: (src) => rs.transform(src, { interop: true })?.code ?? "",
      });
    }
  } catch (error) {
    tools.push({
      id: "compiler-rs-vapor",
      skip: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const babel = require(require.resolve("@babel/core", { paths: [rootDir] }));
    const pluginMod = require(require.resolve("@vue/babel-plugin-jsx", { paths: [rootDir] }));
    const plugin = pluginMod.default ?? pluginMod;
    tools.push({
      id: "babel-vue-jsx",
      expectKey: "babel",
      // only path whose output resolves against the real `vue` package
      mountable: true,
      transform: (src) =>
        babel.transformSync(src, {
          plugins: [plugin],
          filename: "Plant.jsx",
          sourceMaps: false,
          babelrc: false,
          configFile: false,
        })?.code ?? "",
    });
  } catch (error) {
    tools.push({
      id: "babel-vue-jsx",
      skip: error instanceof Error ? error.message : String(error),
    });
  }

  return tools;
}

export async function runJsxCompileConfirmSuite() {
  const suite = createSuite("jsx-compile");
  const tools = loadTransformers();

  ensureDom();
  const { mount } = await import("@vue/test-utils");

  // vue-jsx-vapor/api
  try {
    const { transformVueJsxVapor } = await import("vue-jsx-vapor/api");
    tools.push({
      id: "vue-jsx-vapor-api",
      expectKey: "vapor",
      transform: (src) => transformVueJsxVapor(src)?.code ?? "",
    });
  } catch (error) {
    suite.skip(
      "api-load",
      "vue-jsx-vapor-api",
      error instanceof Error ? error.message : String(error),
    );
  }

  for (const plant of PLANTS) {
    for (const tool of tools) {
      if (tool.skip) {
        suite.skip(plant.id, tool.id, tool.skip);
        continue;
      }
      await suite.run(plant.id, tool.id, () => {
        const code = tool.transform(plant.source);
        if (!code || typeof code !== "string") {
          throw new Error("empty transform output");
        }
        const patterns = plant.expect[tool.expectKey] || [];
        for (const re of patterns) {
          if (!re.test(code)) {
            throw new Error(`output missing ${re}: ${code.slice(0, 200).replace(/\n/g, " ")}`);
          }
        }
      });

      // Behavioural confirmation for the mountable transform
      if (!tool.mountable || !plant.runtime) continue;
      await suite.run(`${plant.id} (runtime)`, tool.id, async () => {
        const code = tool.transform(plant.source);
        const { component, cleanup } = await loadCompiledComponent(code, tool.id);
        try {
          await plant.runtime(mount, component);
        } finally {
          cleanup();
        }
      });
    }
  }

  return suite.results;
}

function expectText(actual, expected) {
  if (actual !== expected) {
    throw new Error(`expected text ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
