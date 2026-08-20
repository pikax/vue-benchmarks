export {};

// Unique member name — see global-component-prop-ok/globals.d.ts.
declare module "vue" {
  interface GlobalComponents {
    FancyBad: typeof import("./Child.vue").default;
  }
}
