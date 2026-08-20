export {};

// Named per case on purpose: the combined one-tsconfig run compiles EVERY
// plant together, so two cases augmenting `GlobalComponents` with the same
// member merge into one conflicting declaration and neither component
// resolves — the plant then fails for reasons that have nothing to do with
// the tool. Unique names keep this case scoreable on both paths.
declare module "vue" {
  interface GlobalComponents {
    FancyOk: typeof import("./Child.vue").default;
  }
}
