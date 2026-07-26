/**
 * Install a jsdom environment for @vue/test-utils + Vue runtime-dom.
 */
import { JSDOM } from "jsdom";

let installed = false;

function defineGlobal(key, value) {
  try {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      enumerable: true,
      value,
    });
  } catch {
    // last resort
    // @ts-expect-error force
    globalThis[key] = value;
  }
}

export function ensureDom() {
  if (installed) return;

  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const { window } = dom;

  // Vue runtime-dom touches these identifiers as bare globals
  const keys = [
    "window",
    "document",
    "navigator",
    "location",
    "history",
    "HTMLElement",
    "HTMLDivElement",
    "HTMLSpanElement",
    "HTMLButtonElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "HTMLAnchorElement",
    "HTMLImageElement",
    "HTMLUListElement",
    "HTMLLIElement",
    "HTMLHeadingElement",
    "HTMLParagraphElement",
    "HTMLSectionElement",
    "HTMLArticleElement",
    "SVGElement",
    "SVGSVGElement",
    "Element",
    "Node",
    "Text",
    "Comment",
    "DocumentFragment",
    "Document",
    "DOMParser",
    "MutationObserver",
    "customElements",
    "Event",
    "CustomEvent",
    "MouseEvent",
    "KeyboardEvent",
    "FocusEvent",
    "InputEvent",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "matchMedia",
  ];

  for (const key of keys) {
    if (key === "window") {
      defineGlobal("window", window);
      continue;
    }
    if (key === "document") {
      defineGlobal("document", window.document);
      continue;
    }
    if (key === "getComputedStyle") {
      defineGlobal("getComputedStyle", window.getComputedStyle.bind(window));
      continue;
    }
    if (key === "requestAnimationFrame") {
      defineGlobal("requestAnimationFrame", (cb) => setTimeout(() => cb(Date.now()), 16));
      continue;
    }
    if (key === "cancelAnimationFrame") {
      defineGlobal("cancelAnimationFrame", (id) => clearTimeout(id));
      continue;
    }
    if (key === "matchMedia") {
      defineGlobal(
        "matchMedia",
        window.matchMedia?.bind(window) ||
          (() => ({
            matches: false,
            media: "",
            addListener() {},
            removeListener() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() {
              return false;
            },
          })),
      );
      continue;
    }
    if (key in window) {
      defineGlobal(key, window[key]);
    }
  }

  // Some code paths read from window only
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = globalThis.requestAnimationFrame;
    window.cancelAnimationFrame = globalThis.cancelAnimationFrame;
  }

  installed = true;
}
