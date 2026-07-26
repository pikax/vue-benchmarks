/**
 * Confirm vue-jsx-vapor / babel JSX transforms produce expected codegen shapes.
 * Vapor path is not mounted under test-utils (virtual runtime modules).
 */
import { createSuite } from "../lib/harness.mjs";
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
    // dynamic import path resolved at run time
  } catch {
    /* */
  }

  try {
    const babel = require(require.resolve("@babel/core", { paths: [rootDir] }));
    const pluginMod = require(require.resolve("@vue/babel-plugin-jsx", { paths: [rootDir] }));
    const plugin = pluginMod.default ?? pluginMod;
    tools.push({
      id: "babel-vue-jsx",
      expectKey: "babel",
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
    }
  }

  return suite.results;
}
