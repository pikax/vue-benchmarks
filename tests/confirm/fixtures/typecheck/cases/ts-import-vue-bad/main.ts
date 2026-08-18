import Child from "./Child.vue";

// plant: Child.count is number. @ts-expect-error consumes the real error;
// if the SFC import is typed as any the directive is unused and the case fails.
// @ts-expect-error
const _count: InstanceType<typeof Child>["$props"]["count"] = "nope";
void _count;
