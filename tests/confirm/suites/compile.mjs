/**
 * Compiler confirmation: compile SFC → mount with @vue/test-utils → assert DOM/behavior.
 * Catches "compiled with 0 errors but wrong runtime output".
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import { ensureDom } from "../lib/dom.mjs";
import { getCompilers, loadCompiledComponent } from "../lib/compile-to-component.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "../fixtures/compile");

function loadVue(name) {
  return readFileSync(join(fixturesDir, name), "utf8");
}

/**
 * Vue runtime-dom captures `document` at first import. Install jsdom first,
 * then dynamic-import @vue/test-utils so createElement is bound to jsdom.
 */
async function loadMount() {
  ensureDom();
  const { mount } = await import("@vue/test-utils");
  return mount;
}

async function withComponent(compiler, source, filename, fn) {
  const compiled = compiler.compile(source, filename);
  if (compiled.errors?.length) {
    throw new Error(`compile errors: ${compiled.errors.join("; ")}`);
  }
  if (!compiled.code) {
    throw new Error("compile returned empty code");
  }
  const { component, cleanup } = await loadCompiledComponent(compiled.code, compiler.id);
  try {
    await fn(component);
  } finally {
    cleanup();
  }
}

export async function runCompileSuite() {
  const mount = await loadMount();
  const suite = createSuite("compile");
  const compilers = getCompilers();

  const cases = [
    {
      id: "counter-click",
      file: "Counter.vue",
      async assert(component) {
        const w = mount(component);
        expectText(w.get("[data-testid=value]").text(), "0");
        await w.get("[data-testid=inc]").trigger("click");
        expectText(w.get("[data-testid=value]").text(), "1");
        await w.get("[data-testid=inc]").trigger("click");
        expectText(w.get("[data-testid=value]").text(), "2");
        w.unmount();
      },
    },
    {
      id: "props-echo",
      file: "PropsEcho.vue",
      async assert(component) {
        const w = mount(component, {
          props: { title: "Hello", count: 7 },
        });
        expectText(w.get("[data-testid=title]").text(), "Hello");
        expectText(w.get("[data-testid=count]").text(), "count=7");
        w.unmount();
      },
    },
    {
      id: "v-for-list",
      file: "ListItems.vue",
      async assert(component) {
        const w = mount(component, {
          props: { items: ["a", "b", "c"] },
        });
        const items = w.findAll("[data-testid=item]");
        if (items.length !== 3) {
          throw new Error(`expected 3 items, got ${items.length}`);
        }
        expectText(items[0].text(), "a");
        expectText(items[2].text(), "c");
        w.unmount();
      },
    },
    {
      id: "v-if-true",
      file: "Conditional.vue",
      async assert(component) {
        const w = mount(component, {
          props: { show: true, label: "visible" },
        });
        if (!w.find("[data-testid=shown]").exists()) {
          throw new Error("v-if true branch missing");
        }
        expectText(w.get("[data-testid=shown]").text(), "visible");
        if (w.find("[data-testid=hidden]").exists()) {
          throw new Error("v-else should not render when show=true");
        }
        w.unmount();
      },
    },
    {
      id: "v-if-false",
      file: "Conditional.vue",
      async assert(component) {
        const w = mount(component, {
          props: { show: false },
        });
        if (w.find("[data-testid=shown]").exists()) {
          throw new Error("v-if false branch should hide shown");
        }
        expectText(w.get("[data-testid=hidden]").text(), "hidden");
        w.unmount();
      },
    },
    {
      id: "slot-default",
      file: "SlotHost.vue",
      async assert(component) {
        const w = mount(component, {
          props: { heading: "H" },
          slots: { default: "slot-body" },
        });
        expectText(w.get("[data-testid=heading]").text(), "H");
        expectText(w.get("[data-testid=slot]").text(), "slot-body");
        w.unmount();
      },
    },
    {
      id: "slot-fallback",
      file: "SlotHost.vue",
      async assert(component) {
        const w = mount(component, { props: { heading: "H" } });
        expectText(w.get("[data-testid=slot]").text(), "fallback");
        w.unmount();
      },
    },
    {
      id: "inherit-attrs-true",
      file: "AttrsInherit.vue",
      async assert(component) {
        const w = mount(component, {
          props: { title: "T" },
          attrs: { id: "outer-id", "data-x": "1" },
        });
        const root = w.get("[data-testid=root]");
        if (root.attributes("id") !== "outer-id") {
          throw new Error(
            `inheritAttrs true: expected id=outer-id on root, got ${root.attributes("id")}`,
          );
        }
        if (root.attributes("data-x") !== "1") {
          throw new Error("inheritAttrs true: data-x not fallthrough");
        }
        w.unmount();
      },
    },
    {
      id: "inherit-attrs-false",
      file: "AttrsNoInherit.vue",
      async assert(component) {
        const w = mount(component, {
          props: { title: "T" },
          attrs: { id: "outer-id", "data-x": "1" },
        });
        const root = w.get("[data-testid=root]");
        if (root.attributes("id") === "outer-id") {
          throw new Error("inheritAttrs false: id should NOT fall through to root");
        }
        if (root.attributes("data-x") === "1") {
          throw new Error("inheritAttrs false: data-x should NOT fall through to root");
        }
        expectText(root.text(), "T");
        w.unmount();
      },
    },
  ];

  for (const c of cases) {
    const source = loadVue(c.file);
    for (const compiler of compilers) {
      if (compiler.skip) {
        suite.skip(c.id, compiler.id, compiler.skip);
        continue;
      }
      await suite.run(c.id, compiler.id, async () => {
        await withComponent(compiler, source, c.file, c.assert);
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
