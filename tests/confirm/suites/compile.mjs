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

function compileOrThrow(compiler, source, filename) {
  const compiled = compiler.compile(source, filename);
  if (compiled.errors?.length) {
    throw new Error(`compile errors: ${compiled.errors.join("; ")}`);
  }
  if (!compiled.code) {
    throw new Error("compile returned empty code");
  }
  return compiled.code;
}

async function withComponent(compiler, source, filename, fn) {
  const code = compileOrThrow(compiler, source, filename);
  const { component, cleanup } = await loadCompiledComponent(code, compiler.id);
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
    {
      id: "v-model-native-input",
      file: "VModelInput.vue",
      async assert(component) {
        const w = mount(component);
        expectText(w.get("[data-testid=echo]").text(), "initial");
        const input = w.get("[data-testid=input]");
        if (input.element.value !== "initial") {
          throw new Error(
            `v-model did not seed input value, got ${JSON.stringify(input.element.value)}`,
          );
        }
        await input.setValue("typed");
        expectText(w.get("[data-testid=echo]").text(), "typed");
        w.unmount();
      },
    },
    {
      id: "v-model-modifiers",
      file: "VModelModifiers.vue",
      async assert(component) {
        const w = mount(component);

        // .number — value must be coerced away from string
        await w.get("[data-testid=num]").setValue("42");
        expectText(w.get("[data-testid=num-type]").text(), "number:42");

        // .trim — leading/trailing whitespace stripped before the ref is written
        await w.get("[data-testid=trim]").setValue("  hi  ");
        expectText(w.get("[data-testid=trim-value]").text(), "[hi]");

        // .lazy — `input` must NOT sync; only `change` does
        const lazy = w.get("[data-testid=lazy]");
        lazy.element.value = "later";
        await lazy.trigger("input");
        expectText(w.get("[data-testid=lazy-value]").text(), "[]");
        await lazy.trigger("change");
        expectText(w.get("[data-testid=lazy-value]").text(), "[later]");

        w.unmount();
      },
    },
    {
      id: "v-model-component",
      file: "VModelComponent.vue",
      async assert(component) {
        const w = mount(component);
        expectText(w.get("[data-testid=child]").text(), "a");
        expectText(w.get("[data-testid=parent]").text(), "a");
        await w.get("[data-testid=child]").trigger("click");
        expectText(w.get("[data-testid=parent]").text(), "a!");
        expectText(w.get("[data-testid=child]").text(), "a!");
        w.unmount();
      },
    },
    {
      id: "dynamic-component-is",
      file: "DynamicComponent.vue",
      async assert(component) {
        const w = mount(component);
        if (!w.find("[data-testid=alpha]").exists()) {
          throw new Error("<component :is> did not render initial component");
        }
        await w.get("[data-testid=swap]").trigger("click");
        if (w.find("[data-testid=alpha]").exists()) {
          throw new Error("<component :is> did not unmount the previous component");
        }
        if (!w.find("[data-testid=beta]").exists()) {
          throw new Error("<component :is> did not render the swapped component");
        }
        w.unmount();
      },
    },
    {
      id: "v-once",
      file: "VOnce.vue",
      async assert(component) {
        const w = mount(component);
        expectText(w.get("[data-testid=once]").text(), "0");
        await w.get("[data-testid=bump]").trigger("click");
        expectText(w.get("[data-testid=live]").text(), "1");
        // v-once must freeze the subtree after the first render
        expectText(w.get("[data-testid=once]").text(), "0");
        w.unmount();
      },
    },
    {
      id: "v-memo",
      file: "VMemo.vue",
      async assert(component) {
        const w = mount(component);
        expectText(w.get("[data-testid=memo]").text(), "0-0");

        // dep list unchanged → memoized subtree must not re-render
        await w.get("[data-testid=bump-other]").trigger("click");
        expectText(w.get("[data-testid=live]").text(), "1");
        expectText(w.get("[data-testid=memo]").text(), "0-0");

        // dep list changed → cache invalidated
        await w.get("[data-testid=bump-key]").trigger("click");
        expectText(w.get("[data-testid=memo]").text(), "1-1");
        w.unmount();
      },
    },
    {
      id: "v-pre",
      file: "VPre.vue",
      async assert(component) {
        const w = mount(component);
        expectText(w.get("[data-testid=pre]").text(), "{{ msg }}");
        expectText(w.get("[data-testid=normal]").text(), "compiled");
        w.unmount();
      },
    },
    {
      id: "v-text-v-html",
      file: "VTextHtml.vue",
      async assert(component) {
        const w = mount(component);
        expectText(w.get("[data-testid=text]").text(), "compiled");
        if (!w.find("[data-testid=bold]").exists()) {
          throw new Error("v-html did not insert raw markup");
        }
        w.unmount();
      },
    },
    {
      id: "teleport",
      file: "TeleportHost.vue",
      async assert(component) {
        const target = withTeleportTarget();
        try {
          const w = mount(component);
          if (w.get("[data-testid=host]").find("[data-testid=ported]").exists()) {
            throw new Error("Teleport content stayed in the host subtree");
          }
          if (target.textContent !== "teleported") {
            throw new Error(
              `Teleport target content ${JSON.stringify(target.textContent)} !== "teleported"`,
            );
          }
          expectText(w.get("[data-testid=local]").text(), "local");
          w.unmount();
          if (target.textContent !== "") {
            throw new Error("Teleport did not clean up target on unmount");
          }
        } finally {
          target.remove();
        }
      },
    },
    {
      id: "keep-alive",
      file: "KeepAliveHost.vue",
      async assert(component) {
        const w = mount(component);
        await w.get("[data-testid=count]").trigger("click");
        await w.get("[data-testid=count]").trigger("click");
        expectText(w.get("[data-testid=count]").text(), "2");

        await w.get("[data-testid=toggle]").trigger("click");
        if (!w.find("[data-testid=other]").exists()) {
          throw new Error("KeepAlive host did not swap components");
        }

        await w.get("[data-testid=toggle]").trigger("click");
        // Without KeepAlive this remounts and resets to "0"
        expectText(w.get("[data-testid=count]").text(), "2");
        w.unmount();
      },
    },
    {
      id: "custom-directive",
      file: "CustomDirective.vue",
      async assert(component) {
        const w = mount(component);
        const target = w.get("[data-testid=target]");
        if (target.attributes("data-hit") !== "red") {
          throw new Error(
            `directive value not delivered: data-hit=${target.attributes("data-hit")}`,
          );
        }
        if (target.attributes("data-arg") !== "tone") {
          throw new Error(`directive arg lost: data-arg=${target.attributes("data-arg")}`);
        }
        if (target.attributes("data-mods") !== "loud") {
          throw new Error(`directive modifiers lost: data-mods=${target.attributes("data-mods")}`);
        }
        await w.get("[data-testid=change]").trigger("click");
        if (w.get("[data-testid=target]").attributes("data-hit") !== "blue") {
          throw new Error("directive updated hook did not receive the new value");
        }
        w.unmount();
      },
    },
    {
      id: "dynamic-slot-name",
      file: "DynamicSlotName.vue",
      async assert(component) {
        const w = mount(component);
        expectText(w.get("[data-testid=alpha-slot]").text(), "dyn-1");
        expectText(w.get("[data-testid=beta-slot]").text(), "none");
        await w.get("[data-testid=swap]").trigger("click");
        expectText(w.get("[data-testid=alpha-slot]").text(), "none");
        expectText(w.get("[data-testid=beta-slot]").text(), "dyn-2");
        w.unmount();
      },
    },
    {
      id: "event-modifiers",
      file: "EventModifiers.vue",
      async assert(component) {
        const w = mount(component);

        // .stop — inner click must not bubble to the outer handler
        await w.get("[data-testid=inner]").trigger("click");
        expectText(w.get("[data-testid=inner-count]").text(), "1");
        expectText(w.get("[data-testid=outer-count]").text(), "0");

        // .prevent — preventDefault runs before the handler
        await w.get("[data-testid=form]").trigger("submit");
        expectText(w.get("[data-testid=prevented]").text(), "yes");

        // key modifier — only Enter counts
        const key = w.get("[data-testid=key]");
        await key.trigger("keyup", { key: "a" });
        expectText(w.get("[data-testid=enter-count]").text(), "0");
        await key.trigger("keyup", { key: "Enter" });
        expectText(w.get("[data-testid=enter-count]").text(), "1");

        w.unmount();
      },
    },
    {
      id: "css-v-bind",
      file: "CssVarBind.vue",
      // Codegen-level: runtime-dom's useCssVars is a no-op outside a browser
      // build, so the only honest runtime-free check is that the compiler read
      // the <style> block and wired the binding into setup().
      assertCode(code) {
        if (!/useCssVars/.test(code)) {
          throw new Error("<style> v-bind() did not inject useCssVars into setup()");
        }
        if (!/themeColor(\.value)?/.test(code)) {
          throw new Error("useCssVars payload does not reference the bound setup variable");
        }
        const varKey = code.match(/["']((?:--)?[\w-]*themeColor|v[0-9a-f]{6,})["']\s*:/i);
        if (!varKey) {
          throw new Error(
            `useCssVars call has no hashed custom-property key: ${code.slice(code.indexOf("useCssVars"), code.indexOf("useCssVars") + 160)}`,
          );
        }
        // runtime-dom's setVarsOnNode does `style.setProperty(\`--${key}\`, …)`,
        // so the emitted key must be the bare name. A pre-prefixed key yields
        // `----hash-name` at runtime and never matches the `var(--hash-name)`
        // the compiler wrote into the stylesheet.
        if (varKey[1].startsWith("--")) {
          throw new Error(
            `useCssVars key ${JSON.stringify(varKey[1])} is already "--"-prefixed; the runtime prepends "--", so the style var resolves to "--${varKey[1]}" and cannot match the emitted CSS`,
          );
        }
      },
    },
    {
      id: "v-show",
      file: "VShowToggle.vue",
      async assert(component) {
        const w = mount(component);
        const shown = w.get("[data-testid=shown]");
        if (shown.element.style.display === "none") {
          throw new Error("v-show true should not set display:none");
        }
        await w.get("[data-testid=toggle]").trigger("click");
        if (w.get("[data-testid=shown]").element.style.display !== "none") {
          throw new Error("v-show false must set display:none (element must stay in the DOM)");
        }
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
        if (c.assertCode) {
          c.assertCode(compileOrThrow(compiler, source, c.file), compiler.id);
          return;
        }
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

/** Teleport resolves its `to` selector against `document`. */
function withTeleportTarget(id = "confirm-teleport-target") {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
  return el;
}
