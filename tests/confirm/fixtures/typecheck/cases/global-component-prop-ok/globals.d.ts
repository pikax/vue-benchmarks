export {};

declare module "vue" {
  interface GlobalComponents {
    Fancy: typeof import("./Child.vue").default;
  }
}
