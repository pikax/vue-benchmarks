# Confirmation suite (correctness, not performance)

Tools are checked against planted expectations (compile → mount, lint counts, type diagnostics, component-meta shapes, format parse/idempotence/tokens).
Skip = missing API/binary or out of scope. Fail = plant expectation not met. Warn = extra harness behaviour for one tool (not a pass).

## typecheck

| Case | Tool | Status | Notes |
| --- | --- | --- | --- |
| async-component-prop-bad | vue-tsc | pass | caught 1 error(s) |
| async-component-prop-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| async-component-prop-bad | verter-tsc | pass | caught 1 error(s) |
| async-component-prop-bad | golar-typecheck | pass | caught 1 error(s) |
| async-component-prop-ok | vue-tsc | pass | clean |
| async-component-prop-ok | vize-check | pass | clean |
| async-component-prop-ok | verter-tsc | pass | clean |
| async-component-prop-ok | golar-typecheck | pass | clean |
| async-setup-await | vue-tsc | pass | clean |
| async-setup-await | vize-check | pass | clean |
| async-setup-await | verter-tsc | pass | clean |
| async-setup-await | golar-typecheck | pass | clean |
| attrs-aria-data-unknown | vue-tsc | pass | caught 1 error(s) |
| attrs-aria-data-unknown | vize-check | skip | tool lacks capability: strict-component-attrs |
| attrs-aria-data-unknown | verter-tsc | **FAIL** | expected ≥1 error(s), got 0 |
| attrs-aria-data-unknown | golar-typecheck | pass | caught 1 error(s) |
| attrs-class-style-ok | vue-tsc | pass | clean |
| attrs-class-style-ok | vize-check | pass | clean |
| attrs-class-style-ok | verter-tsc | pass | clean |
| attrs-class-style-ok | golar-typecheck | pass | clean |
| attrs-unknown-fallthrough | vue-tsc | pass | caught 1 error(s) |
| attrs-unknown-fallthrough | vize-check | skip | tool lacks capability: strict-component-attrs |
| attrs-unknown-fallthrough | verter-tsc | **FAIL** | expected ≥1 error(s), got 0 |
| attrs-unknown-fallthrough | golar-typecheck | pass | caught 1 error(s) |
| boolean-prop-attr-ok | vue-tsc | pass | clean |
| boolean-prop-attr-ok | vize-check | pass | clean |
| boolean-prop-attr-ok | verter-tsc | pass | clean |
| boolean-prop-attr-ok | golar-typecheck | pass | clean |
| clean-basic | vue-tsc | pass | clean |
| clean-basic | vize-check | pass | clean |
| clean-basic | verter-tsc | pass | clean |
| clean-basic | golar-typecheck | pass | clean |
| component-ref-expose-bad | vue-tsc | pass | caught 1 error(s) |
| component-ref-expose-bad | vize-check | **FAIL** | expected ≥1 error(s), got 0 |
| component-ref-expose-bad | verter-tsc | pass | caught 1 error(s) |
| component-ref-expose-bad | golar-typecheck | pass | caught 1 error(s) |
| component-ref-expose-ok | vue-tsc | pass | clean |
| component-ref-expose-ok | vize-check | pass | clean |
| component-ref-expose-ok | verter-tsc | pass | clean |
| component-ref-expose-ok | golar-typecheck | pass | clean |
| computed-unwrap-ok | vue-tsc | pass | clean |
| computed-unwrap-ok | vize-check | pass | clean |
| computed-unwrap-ok | verter-tsc | pass | clean |
| computed-unwrap-ok | golar-typecheck | pass | clean |
| custom-directive-value-bad | vue-tsc | pass | caught 1 error(s) |
| custom-directive-value-bad | vize-check | **FAIL** | no diagnostic at App.vue:14 (@plant-error) |
| custom-directive-value-bad | verter-tsc | pass | caught 1 error(s) |
| custom-directive-value-bad | golar-typecheck | **FAIL** | expected ≥1 error(s), got 0 |
| custom-directive-value-ok | vue-tsc | pass | clean |
| custom-directive-value-ok | vize-check | pass | clean |
| custom-directive-value-ok | verter-tsc | pass | clean |
| custom-directive-value-ok | golar-typecheck | pass | clean |
| define-model-default-ok | vue-tsc | pass | clean |
| define-model-default-ok | vize-check | pass | clean |
| define-model-default-ok | verter-tsc | pass | clean |
| define-model-default-ok | golar-typecheck | pass | clean |
| define-model-get-set-ok | vue-tsc | pass | clean |
| define-model-get-set-ok | vize-check | pass | clean |
| define-model-get-set-ok | verter-tsc | pass | clean |
| define-model-get-set-ok | golar-typecheck | pass | clean |
| define-model-modifiers-ok | vue-tsc | pass | clean |
| define-model-modifiers-ok | vize-check | **FAIL** | expected clean (0 errors), got 2 |
| define-model-modifiers-ok | verter-tsc | **FAIL** | expected clean (0 errors), got 2 |
| define-model-modifiers-ok | golar-typecheck | pass | clean |
| define-model-modifiers-read-bad | vue-tsc | pass | caught 1 error(s) |
| define-model-modifiers-read-bad | vize-check | **FAIL** | no diagnostic at App.vue:6 (@plant-error) |
| define-model-modifiers-read-bad | verter-tsc | **FAIL** | no diagnostic at App.vue:6 (@plant-error) |
| define-model-modifiers-read-bad | golar-typecheck | pass | caught 1 error(s) |
| define-model-modifiers-unknown-bad | vue-tsc | pass | caught 1 error(s) |
| define-model-modifiers-unknown-bad | vize-check | **FAIL** | no diagnostic at App.vue:11 (@plant-error) |
| define-model-modifiers-unknown-bad | verter-tsc | **FAIL** | no diagnostic at App.vue:11 (@plant-error) |
| define-model-modifiers-unknown-bad | golar-typecheck | pass | caught 1 error(s) |
| define-model-named | vue-tsc | **FAIL** | plant at App.vue:11 did not mention title |
| define-model-named | vize-check | **FAIL** | no diagnostic at App.vue:11 (@plant-error) |
| define-model-named | verter-tsc | **FAIL** | plant at App.vue:11 did not mention title |
| define-model-named | golar-typecheck | **FAIL** | plant at App.vue:11 did not mention title |
| define-model-named-modifiers-ok | vue-tsc | pass | clean |
| define-model-named-modifiers-ok | vize-check | **FAIL** | expected clean (0 errors), got 2 |
| define-model-named-modifiers-ok | verter-tsc | **FAIL** | expected clean (0 errors), got 2 |
| define-model-named-modifiers-ok | golar-typecheck | pass | clean |
| define-model-ok | vue-tsc | pass | clean |
| define-model-ok | vize-check | pass | clean |
| define-model-ok | verter-tsc | pass | clean |
| define-model-ok | golar-typecheck | pass | clean |
| define-model-set-bad | vue-tsc | pass | caught 1 error(s) |
| define-model-set-bad | vize-check | **FAIL** | no diagnostic at App.vue:7 (@plant-error) |
| define-model-set-bad | verter-tsc | pass | caught 1 error(s) |
| define-model-set-bad | golar-typecheck | pass | caught 1 error(s) |
| define-slots-default-ok | vue-tsc | pass | clean |
| define-slots-default-ok | vize-check | pass | clean |
| define-slots-default-ok | verter-tsc | pass | clean |
| define-slots-default-ok | golar-typecheck | pass | clean |
| define-slots-fn-bad | vue-tsc | **FAIL** | plant at App.vue:10 did not mention nope |
| define-slots-fn-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| define-slots-fn-bad | verter-tsc | **FAIL** | plant at App.vue:10 did not mention nope |
| define-slots-fn-bad | golar-typecheck | **FAIL** | plant at App.vue:10 did not mention nope |
| define-slots-fn-ok | vue-tsc | pass | clean |
| define-slots-fn-ok | vize-check | pass | clean |
| define-slots-fn-ok | verter-tsc | pass | clean |
| define-slots-fn-ok | golar-typecheck | pass | clean |
| define-slots-named-ok | vue-tsc | pass | clean |
| define-slots-named-ok | vize-check | pass | clean |
| define-slots-named-ok | verter-tsc | pass | clean |
| define-slots-named-ok | golar-typecheck | pass | clean |
| discriminated-union-v-model-bad | vue-tsc | pass | caught 1 error(s) |
| discriminated-union-v-model-bad | vize-check | **FAIL** | no diagnostic at App.vue:8 (@plant-error) |
| discriminated-union-v-model-bad | verter-tsc | **FAIL** | plant at App.vue:8 did not mention 's' |
| discriminated-union-v-model-bad | golar-typecheck | pass | caught 1 error(s) |
| discriminated-union-v-model-ok | vue-tsc | pass | clean |
| discriminated-union-v-model-ok | vize-check | pass | clean |
| discriminated-union-v-model-ok | verter-tsc | pass | clean |
| discriminated-union-v-model-ok | golar-typecheck | pass | clean |
| dollar-event-bad | vue-tsc | pass | caught 1 error(s) |
| dollar-event-bad | vize-check | **FAIL** | no diagnostic at App.vue:7 (@plant-error) |
| dollar-event-bad | verter-tsc | pass | caught 1 error(s) |
| dollar-event-bad | golar-typecheck | pass | caught 1 error(s) |
| dollar-event-ok | vue-tsc | pass | clean |
| dollar-event-ok | vize-check | pass | clean |
| dollar-event-ok | verter-tsc | pass | clean |
| dollar-event-ok | golar-typecheck | pass | clean |
| dynamic-component-prop-bad | vue-tsc | pass | caught 1 error(s) |
| dynamic-component-prop-bad | vize-check | **FAIL** | expected ≥1 error(s), got 0 |
| dynamic-component-prop-bad | verter-tsc | pass | caught 1 error(s) |
| dynamic-component-prop-bad | golar-typecheck | pass | caught 1 error(s) |
| dynamic-component-prop-ok | vue-tsc | pass | clean |
| dynamic-component-prop-ok | vize-check | pass | clean |
| dynamic-component-prop-ok | verter-tsc | pass | clean |
| dynamic-component-prop-ok | golar-typecheck | pass | clean |
| element-prop-type | vue-tsc | **FAIL** | plant at App.vue:9 did not mention disabled |
| element-prop-type | vize-check | **FAIL** | no diagnostic at App.vue:9 (@plant-error) |
| element-prop-type | verter-tsc | **FAIL** | plant at App.vue:9 did not mention disabled |
| element-prop-type | golar-typecheck | **FAIL** | plant at App.vue:9 did not mention disabled |
| emit-ok | vue-tsc | pass | clean |
| emit-ok | vize-check | pass | clean |
| emit-ok | verter-tsc | pass | clean |
| emit-ok | golar-typecheck | pass | clean |
| emit-unknown-event | vue-tsc | pass | caught 1 error(s) |
| emit-unknown-event | vize-check | **FAIL** | no diagnostic at App.vue:8 (@plant-error) |
| emit-unknown-event | verter-tsc | pass | caught 1 error(s) |
| emit-unknown-event | golar-typecheck | pass | caught 1 error(s) |
| emit-wrong-arg | vue-tsc | **FAIL** | plant at App.vue:8 did not mention nope |
| emit-wrong-arg | vize-check | **FAIL** | no diagnostic at App.vue:8 (@plant-error) |
| emit-wrong-arg | verter-tsc | **FAIL** | plant at App.vue:8 did not mention nope |
| emit-wrong-arg | golar-typecheck | **FAIL** | plant at App.vue:8 did not mention nope |
| event-emit-payload | vue-tsc | pass | caught 1 error(s) |
| event-emit-payload | vize-check | **FAIL** | no diagnostic at App.vue:12 (@plant-error) |
| event-emit-payload | verter-tsc | pass | caught 1 error(s) |
| event-emit-payload | golar-typecheck | pass | caught 1 error(s) |
| event-mod-click-ctrl-ok | vue-tsc | pass | clean |
| event-mod-click-ctrl-ok | vize-check | pass | clean |
| event-mod-click-ctrl-ok | verter-tsc | pass | clean |
| event-mod-click-ctrl-ok | golar-typecheck | pass | clean |
| event-mod-click-prevent-bad | vue-tsc | pass | caught 1 error(s) |
| event-mod-click-prevent-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| event-mod-click-prevent-bad | verter-tsc | pass | caught 1 error(s) |
| event-mod-click-prevent-bad | golar-typecheck | pass | caught 1 error(s) |
| event-mod-click-prevent-dollar-bad | vue-tsc | **FAIL** | plant at App.vue:7 did not mention key |
| event-mod-click-prevent-dollar-bad | vize-check | **FAIL** | no diagnostic at App.vue:7 (@plant-error) |
| event-mod-click-prevent-dollar-bad | verter-tsc | pass | caught 1 error(s) |
| event-mod-click-prevent-dollar-bad | golar-typecheck | **FAIL** | plant at App.vue:7 did not mention key |
| event-mod-click-prevent-ok | vue-tsc | pass | clean |
| event-mod-click-prevent-ok | vize-check | pass | clean |
| event-mod-click-prevent-ok | verter-tsc | pass | clean |
| event-mod-click-prevent-ok | golar-typecheck | pass | clean |
| event-mod-click-stop-prevent-ok | vue-tsc | pass | clean |
| event-mod-click-stop-prevent-ok | vize-check | pass | clean |
| event-mod-click-stop-prevent-ok | verter-tsc | pass | clean |
| event-mod-click-stop-prevent-ok | golar-typecheck | pass | clean |
| event-mod-component-once-bad | vue-tsc | pass | caught 1 error(s) |
| event-mod-component-once-bad | vize-check | **FAIL** | no diagnostic at App.vue:12 (@plant-error) |
| event-mod-component-once-bad | verter-tsc | pass | caught 1 error(s) |
| event-mod-component-once-bad | golar-typecheck | pass | caught 1 error(s) |
| event-mod-component-once-ok | vue-tsc | pass | clean |
| event-mod-component-once-ok | vize-check | pass | clean |
| event-mod-component-once-ok | verter-tsc | pass | clean |
| event-mod-component-once-ok | golar-typecheck | pass | clean |
| event-mod-keyup-enter-bad | vue-tsc | **FAIL** | plant at App.vue:10 did not mention KeyboardEvent |
| event-mod-keyup-enter-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| event-mod-keyup-enter-bad | verter-tsc | pass | caught 1 error(s) |
| event-mod-keyup-enter-bad | golar-typecheck | **FAIL** | plant at App.vue:10 did not mention KeyboardEvent |
| event-mod-keyup-enter-ok | vue-tsc | pass | clean |
| event-mod-keyup-enter-ok | vize-check | pass | clean |
| event-mod-keyup-enter-ok | verter-tsc | pass | clean |
| event-mod-keyup-enter-ok | golar-typecheck | pass | clean |
| event-mod-submit-prevent-ok | vue-tsc | pass | clean |
| event-mod-submit-prevent-ok | vize-check | pass | clean |
| event-mod-submit-prevent-ok | verter-tsc | pass | clean |
| event-mod-submit-prevent-ok | golar-typecheck | pass | clean |
| fallthrough-mono-false-bad | vue-tsc | pass | caught 1 error(s) |
| fallthrough-mono-false-bad | vize-check | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0. |
| fallthrough-mono-false-bad | verter-tsc | pass | caught 1 error(s) |
| fallthrough-mono-false-bad | golar-typecheck | pass | caught 1 error(s) |
| fallthrough-mono-ok | vue-tsc | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| fallthrough-mono-ok | vize-check | pass | clean |
| fallthrough-mono-ok | verter-tsc | pass | clean |
| fallthrough-mono-ok | golar-typecheck | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| fallthrough-multi-bad | vue-tsc | pass | caught 1 error(s) |
| fallthrough-multi-bad | vize-check | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0. |
| fallthrough-multi-bad | verter-tsc | pass | caught 1 error(s) |
| fallthrough-multi-bad | golar-typecheck | pass | caught 1 error(s) |
| fallthrough-multi-false-bad | vue-tsc | pass | caught 1 error(s) |
| fallthrough-multi-false-bad | vize-check | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0. |
| fallthrough-multi-false-bad | verter-tsc | pass | caught 1 error(s) |
| fallthrough-multi-false-bad | golar-typecheck | pass | caught 1 error(s) |
| fallthrough-native-type-bad | vue-tsc | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. On the shared tsconfig the plant appeared to pass (undeclared attrs always error under default strictTemplates). With fallthroughAttributes the plant was missed: plant at App.vue:8 did not mention disabled. |
| fallthrough-native-type-bad | vize-check | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0. |
| fallthrough-native-type-bad | verter-tsc | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: plant at App.vue:8 did not mention disabled. |
| fallthrough-native-type-bad | golar-typecheck | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. On the shared tsconfig the plant appeared to pass (undeclared attrs always error under default strictTemplates). With fallthroughAttributes the plant was missed: plant at App.vue:8 did not mention disabled. |
| fallthrough-vif-both-mono-false-bad | vue-tsc | pass | caught 1 error(s) |
| fallthrough-vif-both-mono-false-bad | vize-check | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0. |
| fallthrough-vif-both-mono-false-bad | verter-tsc | pass | caught 1 error(s) |
| fallthrough-vif-both-mono-false-bad | golar-typecheck | pass | caught 1 error(s) |
| fallthrough-vif-both-mono-ok | vue-tsc | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| fallthrough-vif-both-mono-ok | vize-check | pass | clean |
| fallthrough-vif-both-mono-ok | verter-tsc | pass | clean |
| fallthrough-vif-both-mono-ok | golar-typecheck | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| fallthrough-vif-mono-multi-bad | vue-tsc | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. On the shared tsconfig the plant appeared to pass (undeclared attrs always error under default strictTemplates). With fallthroughAttributes the plant was missed: expected ≥1 error(s), got 0. |
| fallthrough-vif-mono-multi-bad | vize-check | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0. |
| fallthrough-vif-mono-multi-bad | verter-tsc | pass | caught 1 error(s) |
| fallthrough-vif-mono-multi-bad | golar-typecheck | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. On the shared tsconfig the plant appeared to pass (undeclared attrs always error under default strictTemplates). With fallthroughAttributes the plant was missed: expected ≥1 error(s), got 0. |
| fallthrough-vif-static-multi-bad | vue-tsc | pass | caught 1 error(s) |
| fallthrough-vif-static-multi-bad | vize-check | **FAIL** | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Failed on the shared tsconfig and still failed after enabling it: expected ≥1 error(s), got 0. |
| fallthrough-vif-static-multi-bad | verter-tsc | pass | caught 1 error(s) |
| fallthrough-vif-static-multi-bad | golar-typecheck | pass | caught 1 error(s) |
| fallthrough-vif-static-ok | vue-tsc | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| fallthrough-vif-static-ok | vize-check | pass | clean |
| fallthrough-vif-static-ok | verter-tsc | pass | clean |
| fallthrough-vif-static-ok | golar-typecheck | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| fallthrough-vif-static-prop-ok | vue-tsc | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| fallthrough-vif-static-prop-ok | vize-check | pass | clean |
| fallthrough-vif-static-prop-ok | verter-tsc | pass | clean |
| fallthrough-vif-static-prop-ok | golar-typecheck | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| generic-component-bad | vue-tsc | **FAIL** | plant at App.vue:13 did not mention selected |
| generic-component-bad | vize-check | **FAIL** | no diagnostic at App.vue:13 (@plant-error) |
| generic-component-bad | verter-tsc | **FAIL** | plant at App.vue:13 did not mention selected |
| generic-component-bad | golar-typecheck | **FAIL** | plant at App.vue:13 did not mention selected |
| generic-component-ok | vue-tsc | pass | clean |
| generic-component-ok | vize-check | pass | clean |
| generic-component-ok | verter-tsc | **FAIL** | expected clean (0 errors), got 1 |
| generic-component-ok | golar-typecheck | pass | clean |
| generic-constraint-template-bad | vue-tsc | pass | caught 1 error(s) |
| generic-constraint-template-bad | vize-check | **FAIL** | no diagnostic at Child.vue:10 (@plant-error) |
| generic-constraint-template-bad | verter-tsc | pass | caught 1 error(s) |
| generic-constraint-template-bad | golar-typecheck | pass | caught 1 error(s) |
| generic-default-ok | vue-tsc | pass | clean |
| generic-default-ok | vize-check | pass | clean |
| generic-default-ok | verter-tsc | pass | clean |
| generic-default-ok | golar-typecheck | pass | clean |
| generic-define-model-bad | vue-tsc | pass | caught 2 error(s) |
| generic-define-model-bad | vize-check | **FAIL** | no diagnostic at App.vue:11 (@plant-error) |
| generic-define-model-bad | verter-tsc | **FAIL** | expected ≥1 error(s), got 0 |
| generic-define-model-bad | golar-typecheck | pass | caught 1 error(s) |
| generic-define-model-ok | vue-tsc | pass | clean |
| generic-define-model-ok | vize-check | pass | clean |
| generic-define-model-ok | verter-tsc | pass | clean |
| generic-define-model-ok | golar-typecheck | pass | clean |
| generic-emit-bad | vue-tsc | pass | caught 1 error(s) |
| generic-emit-bad | vize-check | **FAIL** | no diagnostic at App.vue:12 (@plant-error) |
| generic-emit-bad | verter-tsc | pass | caught 1 error(s) |
| generic-emit-bad | golar-typecheck | pass | caught 1 error(s) |
| generic-emit-ok | vue-tsc | pass | clean |
| generic-emit-ok | vize-check | pass | clean |
| generic-emit-ok | verter-tsc | pass | clean |
| generic-emit-ok | golar-typecheck | pass | clean |
| generic-fallthrough-mono-ok | vue-tsc | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| generic-fallthrough-mono-ok | vize-check | pass | clean |
| generic-fallthrough-mono-ok | verter-tsc | pass | clean |
| generic-fallthrough-mono-ok | golar-typecheck | ⚠ warn | EXTRA VUE COMPILER OPTION — vueCompilerOptions.fallthroughAttributes is not default and is not on the shared tsconfig. A fully compatible checker types inheritAttrs fallthrough without this opt-in. Plant scored only after enabling it: clean. |
| generic-inherit-false-class-ok | vue-tsc | pass | clean |
| generic-inherit-false-class-ok | vize-check | pass | clean |
| generic-inherit-false-class-ok | verter-tsc | **FAIL** | expected clean (0 errors), got 1 |
| generic-inherit-false-class-ok | golar-typecheck | pass | clean |
| generic-inherit-false-unknown | vue-tsc | pass | caught 1 error(s) |
| generic-inherit-false-unknown | vize-check | skip | tool lacks capability: strict-component-attrs |
| generic-inherit-false-unknown | verter-tsc | pass | caught 2 error(s) |
| generic-inherit-false-unknown | golar-typecheck | pass | caught 1 error(s) |
| generic-multi-root-ok | vue-tsc | pass | clean |
| generic-multi-root-ok | vize-check | pass | clean |
| generic-multi-root-ok | verter-tsc | pass | clean |
| generic-multi-root-ok | golar-typecheck | pass | clean |
| generic-slot-bad | vue-tsc | **FAIL** | plant at App.vue:13 did not mention id |
| generic-slot-bad | vize-check | **FAIL** | expected ≥1 error(s), got 0 |
| generic-slot-bad | verter-tsc | **FAIL** | plant at App.vue:13 did not mention id |
| generic-slot-bad | golar-typecheck | **FAIL** | plant at App.vue:13 did not mention id |
| generic-slot-ok | vue-tsc | pass | clean |
| generic-slot-ok | vize-check | pass | clean |
| generic-slot-ok | verter-tsc | pass | clean |
| generic-slot-ok | golar-typecheck | pass | clean |
| generic-two-params-bad | vue-tsc | pass | caught 1 error(s) |
| generic-two-params-bad | vize-check | **FAIL** | expected ≥1 error(s), got 0 |
| generic-two-params-bad | verter-tsc | pass | caught 1 error(s) |
| generic-two-params-bad | golar-typecheck | pass | caught 1 error(s) |
| generic-two-params-ok | vue-tsc | pass | clean |
| generic-two-params-ok | vize-check | pass | clean |
| generic-two-params-ok | verter-tsc | pass | clean |
| generic-two-params-ok | golar-typecheck | pass | clean |
| global-component-prop-bad | vue-tsc | pass | caught 1 error(s) |
| global-component-prop-bad | vize-check | **FAIL** | no diagnostic at App.vue:6 (@plant-error) |
| global-component-prop-bad | verter-tsc | **FAIL** | plant at App.vue:6 did not mention one of: TS2322 \| number \| string |
| global-component-prop-bad | golar-typecheck | pass | caught 1 error(s) |
| global-component-prop-ok | vue-tsc | pass | clean |
| global-component-prop-ok | vize-check | pass | clean |
| global-component-prop-ok | verter-tsc | **FAIL** | expected clean (0 errors), got 2 |
| global-component-prop-ok | golar-typecheck | pass | clean |
| inherit-attrs-default-class-style-ok | vue-tsc | pass | clean |
| inherit-attrs-default-class-style-ok | vize-check | pass | clean |
| inherit-attrs-default-class-style-ok | verter-tsc | pass | clean |
| inherit-attrs-default-class-style-ok | golar-typecheck | pass | clean |
| inherit-attrs-default-unknown | vue-tsc | pass | caught 1 error(s) |
| inherit-attrs-default-unknown | vize-check | skip | tool lacks capability: strict-component-attrs |
| inherit-attrs-default-unknown | verter-tsc | **FAIL** | expected ≥1 error(s), got 0 |
| inherit-attrs-default-unknown | golar-typecheck | pass | caught 1 error(s) |
| inherit-attrs-false-class-style-ok | vue-tsc | pass | clean |
| inherit-attrs-false-class-style-ok | vize-check | pass | clean |
| inherit-attrs-false-class-style-ok | verter-tsc | pass | clean |
| inherit-attrs-false-class-style-ok | golar-typecheck | pass | clean |
| inherit-attrs-false-unknown | vue-tsc | **FAIL** | plant at App.vue:8 did not mention data-x |
| inherit-attrs-false-unknown | vize-check | skip | tool lacks capability: strict-component-attrs |
| inherit-attrs-false-unknown | verter-tsc | **FAIL** | expected ≥1 error(s), got 0 |
| inherit-attrs-false-unknown | golar-typecheck | **FAIL** | plant at App.vue:8 did not mention data-x |
| inject-key-type | vue-tsc | pass | caught 1 error(s) |
| inject-key-type | vize-check | **FAIL** | no diagnostic at App.vue:12 (@plant-error) |
| inject-key-type | verter-tsc | pass | caught 1 error(s) |
| inject-key-type | golar-typecheck | pass | caught 1 error(s) |
| literal-union-prop-bad | vue-tsc | pass | caught 1 error(s) |
| literal-union-prop-bad | vize-check | **FAIL** | no diagnostic at App.vue:8 (@plant-error) |
| literal-union-prop-bad | verter-tsc | pass | caught 1 error(s) |
| literal-union-prop-bad | golar-typecheck | pass | caught 1 error(s) |
| literal-union-prop-ok | vue-tsc | pass | clean |
| literal-union-prop-ok | vize-check | pass | clean |
| literal-union-prop-ok | verter-tsc | pass | clean |
| literal-union-prop-ok | golar-typecheck | pass | clean |
| missing-required-prop | vue-tsc | pass | caught 1 error(s) |
| missing-required-prop | vize-check | **FAIL** | no diagnostic at App.vue:8 (@plant-error) |
| missing-required-prop | verter-tsc | pass | caught 1 error(s) |
| missing-required-prop | golar-typecheck | **FAIL** | expected ≥1 error(s), got 0 |
| native-input-v-model-ok | vue-tsc | pass | clean |
| native-input-v-model-ok | vize-check | pass | clean |
| native-input-v-model-ok | verter-tsc | pass | clean |
| native-input-v-model-ok | golar-typecheck | pass | clean |
| native-keyup-bad | vue-tsc | **FAIL** | plant at App.vue:10 did not mention KeyboardEvent |
| native-keyup-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| native-keyup-bad | verter-tsc | pass | caught 1 error(s) |
| native-keyup-bad | golar-typecheck | **FAIL** | plant at App.vue:10 did not mention KeyboardEvent |
| native-v-model-lazy-ok | vue-tsc | pass | clean |
| native-v-model-lazy-ok | vize-check | pass | clean |
| native-v-model-lazy-ok | verter-tsc | pass | clean |
| native-v-model-lazy-ok | golar-typecheck | pass | clean |
| native-v-model-number-ok | vue-tsc | pass | clean |
| native-v-model-number-ok | vize-check | pass | clean |
| native-v-model-number-ok | verter-tsc | pass | clean |
| native-v-model-number-ok | golar-typecheck | pass | clean |
| native-v-model-trim-ok | vue-tsc | pass | clean |
| native-v-model-trim-ok | vize-check | pass | clean |
| native-v-model-trim-ok | verter-tsc | pass | clean |
| native-v-model-trim-ok | golar-typecheck | pass | clean |
| optional-chain-bad | vue-tsc | pass | caught 1 error(s) |
| optional-chain-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| optional-chain-bad | verter-tsc | pass | caught 1 error(s) |
| optional-chain-bad | golar-typecheck | pass | caught 1 error(s) |
| optional-chain-ok | vue-tsc | pass | clean |
| optional-chain-ok | vize-check | pass | clean |
| optional-chain-ok | verter-tsc | pass | clean |
| optional-chain-ok | golar-typecheck | pass | clean |
| options-api-prop-bad | vue-tsc | **FAIL** | plant at App.vue:11 did not mention count |
| options-api-prop-bad | vize-check | **FAIL** | no diagnostic at App.vue:11 (@plant-error) |
| options-api-prop-bad | verter-tsc | **FAIL** | plant at App.vue:11 did not mention count |
| options-api-prop-bad | golar-typecheck | **FAIL** | plant at App.vue:11 did not mention count |
| provide-inject-ok | vue-tsc | pass | clean |
| provide-inject-ok | vize-check | pass | clean |
| provide-inject-ok | verter-tsc | pass | clean |
| provide-inject-ok | golar-typecheck | pass | clean |
| ref-unwrap-bad | vue-tsc | pass | caught 1 error(s) |
| ref-unwrap-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| ref-unwrap-bad | verter-tsc | pass | caught 1 error(s) |
| ref-unwrap-bad | golar-typecheck | pass | caught 1 error(s) |
| ref-unwrap-ok | vue-tsc | pass | clean |
| ref-unwrap-ok | vize-check | pass | clean |
| ref-unwrap-ok | verter-tsc | pass | clean |
| ref-unwrap-ok | golar-typecheck | pass | clean |
| required-slot-missing-bad | vue-tsc | **FAIL** | expected ≥1 error(s), got 0 |
| required-slot-missing-bad | vize-check | **FAIL** | expected ≥1 error(s), got 0 |
| required-slot-missing-bad | verter-tsc | **FAIL** | expected ≥1 error(s), got 0 |
| required-slot-missing-bad | golar-typecheck | **FAIL** | expected ≥1 error(s), got 0 |
| required-slot-ok | vue-tsc | pass | clean |
| required-slot-ok | vize-check | pass | clean |
| required-slot-ok | verter-tsc | pass | clean |
| required-slot-ok | golar-typecheck | pass | clean |
| script-type-error | vue-tsc | **FAIL** | plant at App.vue:4 did not mention count |
| script-type-error | vize-check | **FAIL** | no diagnostic at App.vue:4 (@plant-error) |
| script-type-error | verter-tsc | **FAIL** | plant at App.vue:4 did not mention count |
| script-type-error | golar-typecheck | **FAIL** | plant at App.vue:4 did not mention count |
| slot-default-implicit-ok | vue-tsc | pass | clean |
| slot-default-implicit-ok | vize-check | pass | clean |
| slot-default-implicit-ok | verter-tsc | **FAIL** | expected clean (0 errors), got 1 |
| slot-default-implicit-ok | golar-typecheck | pass | clean |
| slot-provide-type-bad | vue-tsc | **FAIL** | plant at App.vue:11 did not mention msg |
| slot-provide-type-bad | vize-check | **FAIL** | expected ≥1 error(s), got 0 |
| slot-provide-type-bad | verter-tsc | **FAIL** | plant at App.vue:11 did not mention msg |
| slot-provide-type-bad | golar-typecheck | **FAIL** | plant at App.vue:11 did not mention msg |
| slot-provide-type-ok | vue-tsc | pass | clean |
| slot-provide-type-ok | vize-check | pass | clean |
| slot-provide-type-ok | verter-tsc | pass | clean |
| slot-provide-type-ok | golar-typecheck | pass | clean |
| slot-scope-ok | vue-tsc | pass | clean |
| slot-scope-ok | vize-check | pass | clean |
| slot-scope-ok | verter-tsc | pass | clean |
| slot-scope-ok | golar-typecheck | pass | clean |
| slot-scope-payload | vue-tsc | **FAIL** | plant at App.vue:13 did not mention id |
| slot-scope-payload | vize-check | **FAIL** | no diagnostic at App.vue:13 (@plant-error) |
| slot-scope-payload | verter-tsc | **FAIL** | plant at App.vue:13 did not mention id |
| slot-scope-payload | golar-typecheck | **FAIL** | plant at App.vue:13 did not mention id |
| slot-unknown-prop-bad | vue-tsc | pass | caught 1 error(s) |
| slot-unknown-prop-bad | vize-check | **FAIL** | expected ≥1 error(s), got 0 |
| slot-unknown-prop-bad | verter-tsc | pass | caught 1 error(s) |
| slot-unknown-prop-bad | golar-typecheck | pass | caught 1 error(s) |
| slot-v-bind-bad | vue-tsc | pass | caught 1 error(s) |
| slot-v-bind-bad | vize-check | **FAIL** | expected ≥1 error(s), got 0 |
| slot-v-bind-bad | verter-tsc | **FAIL** | plant at App.vue:13 did not mention one of: TS2322 \| TS2345 \| number \| string \| not assignable |
| slot-v-bind-bad | golar-typecheck | pass | caught 1 error(s) |
| slot-v-bind-ok | vue-tsc | pass | clean |
| slot-v-bind-ok | vize-check | pass | clean |
| slot-v-bind-ok | verter-tsc | **FAIL** | expected clean (0 errors), got 1 |
| slot-v-bind-ok | golar-typecheck | pass | clean |
| static-number-attr-bad | vue-tsc | **FAIL** | plant at App.vue:8 did not mention count |
| static-number-attr-bad | vize-check | **FAIL** | no diagnostic at App.vue:8 (@plant-error) |
| static-number-attr-bad | verter-tsc | **FAIL** | plant at App.vue:8 did not mention count |
| static-number-attr-bad | golar-typecheck | **FAIL** | plant at App.vue:8 did not mention count |
| style-binding-bad | vue-tsc | pass | caught 1 error(s) |
| style-binding-bad | vize-check | **FAIL** | no diagnostic at App.vue:8 (@plant-error) |
| style-binding-bad | verter-tsc | pass | caught 1 error(s) |
| style-binding-bad | golar-typecheck | pass | caught 1 error(s) |
| template-ref-type | vue-tsc | pass | caught 1 error(s) |
| template-ref-type | vize-check | **FAIL** | no diagnostic at App.vue:9 (@plant-error) |
| template-ref-type | verter-tsc | pass | caught 1 error(s) |
| template-ref-type | golar-typecheck | pass | caught 1 error(s) |
| template-undefined | vue-tsc | pass | caught 1 error(s) |
| template-undefined | vize-check | **FAIL** | no diagnostic at App.vue:8 (@plant-error) |
| template-undefined | verter-tsc | pass | caught 1 error(s) |
| template-undefined | golar-typecheck | pass | caught 1 error(s) |
| ts-import-vue-bad | vue-tsc | pass | clean |
| ts-import-vue-bad | vize-check | pass | clean |
| ts-import-vue-bad | verter-tsc | ⚠ warn | EXTRA TSCONFIG — verter-tsc did not typecheck main.ts (a .ts importer of a .vue SFC) on the shared tsconfig the other tools use. Retried with allowArbitraryExtensions + allowImportingTsExtensions (other tools do not need these). Retry still only checked .vue files — the plant in main.ts was not exercised. |
| ts-import-vue-bad | golar-typecheck | pass | clean |
| ts-import-vue-ok | vue-tsc | pass | clean |
| ts-import-vue-ok | vize-check | pass | clean |
| ts-import-vue-ok | verter-tsc | ⚠ warn | EXTRA TSCONFIG — verter-tsc did not typecheck main.ts (a .ts importer of a .vue SFC) on the shared tsconfig the other tools use. Retried with allowArbitraryExtensions + allowImportingTsExtensions (other tools do not need these). Retry still only checked .vue files — the plant in main.ts was not exercised. |
| ts-import-vue-ok | golar-typecheck | pass | clean |
| unknown-prop-strict | vue-tsc | pass | caught 1 error(s) |
| unknown-prop-strict | vize-check | skip | tool lacks capability: strict-component-attrs |
| unknown-prop-strict | verter-tsc | pass | caught 1 error(s) |
| unknown-prop-strict | golar-typecheck | pass | caught 1 error(s) |
| v-bind-object-bad | vue-tsc | pass | caught 1 error(s) |
| v-bind-object-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| v-bind-object-bad | verter-tsc | pass | caught 1 error(s) |
| v-bind-object-bad | golar-typecheck | pass | caught 1 error(s) |
| v-bind-object-ok | vue-tsc | pass | clean |
| v-bind-object-ok | vize-check | pass | clean |
| v-bind-object-ok | verter-tsc | pass | clean |
| v-bind-object-ok | golar-typecheck | pass | clean |
| v-else-if-bad | vue-tsc | pass | caught 1 error(s) |
| v-else-if-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| v-else-if-bad | verter-tsc | pass | caught 1 error(s) |
| v-else-if-bad | golar-typecheck | pass | caught 1 error(s) |
| v-else-if-ok | vue-tsc | pass | clean |
| v-else-if-ok | vize-check | pass | clean |
| v-else-if-ok | verter-tsc | pass | clean |
| v-else-if-ok | golar-typecheck | pass | clean |
| v-for-destructure-ok | vue-tsc | pass | clean |
| v-for-destructure-ok | vize-check | pass | clean |
| v-for-destructure-ok | verter-tsc | pass | clean |
| v-for-destructure-ok | golar-typecheck | pass | clean |
| v-for-item-type | vue-tsc | pass | caught 1 error(s) |
| v-for-item-type | vize-check | **FAIL** | no diagnostic at App.vue:11 (@plant-error) |
| v-for-item-type | verter-tsc | pass | caught 1 error(s) |
| v-for-item-type | golar-typecheck | pass | caught 1 error(s) |
| v-for-ok | vue-tsc | pass | clean |
| v-for-ok | vize-check | pass | clean |
| v-for-ok | verter-tsc | pass | clean |
| v-for-ok | golar-typecheck | pass | clean |
| v-for-tuple-ok | vue-tsc | pass | clean |
| v-for-tuple-ok | vize-check | pass | clean |
| v-for-tuple-ok | verter-tsc | pass | clean |
| v-for-tuple-ok | golar-typecheck | pass | clean |
| v-for-tuple-type-bad | vue-tsc | pass | caught 1 error(s) |
| v-for-tuple-type-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| v-for-tuple-type-bad | verter-tsc | pass | caught 1 error(s) |
| v-for-tuple-type-bad | golar-typecheck | pass | caught 1 error(s) |
| v-if-discriminant-bad | vue-tsc | pass | caught 1 error(s) |
| v-if-discriminant-bad | vize-check | **FAIL** | no diagnostic at App.vue:13 (@plant-error) |
| v-if-discriminant-bad | verter-tsc | pass | caught 2 error(s) |
| v-if-discriminant-bad | golar-typecheck | pass | caught 1 error(s) |
| v-if-discriminant-ok | vue-tsc | pass | clean |
| v-if-discriminant-ok | vize-check | pass | clean |
| v-if-discriminant-ok | verter-tsc | **FAIL** | expected clean (0 errors), got 2 |
| v-if-discriminant-ok | golar-typecheck | pass | clean |
| v-if-else-bad | vue-tsc | pass | caught 1 error(s) |
| v-if-else-bad | vize-check | **FAIL** | no diagnostic at App.vue:11 (@plant-error) |
| v-if-else-bad | verter-tsc | pass | caught 1 error(s) |
| v-if-else-bad | golar-typecheck | pass | caught 1 error(s) |
| v-if-else-ok | vue-tsc | pass | clean |
| v-if-else-ok | vize-check | pass | clean |
| v-if-else-ok | verter-tsc | pass | clean |
| v-if-else-ok | golar-typecheck | pass | clean |
| v-if-event-closure | vue-tsc | pass | caught 1 error(s) |
| v-if-event-closure | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| v-if-event-closure | verter-tsc | pass | caught 1 error(s) |
| v-if-event-closure | golar-typecheck | pass | caught 1 error(s) |
| v-if-in-narrow-bad | vue-tsc | pass | caught 1 error(s) |
| v-if-in-narrow-bad | vize-check | **FAIL** | no diagnostic at App.vue:14 (@plant-error) |
| v-if-in-narrow-bad | verter-tsc | pass | caught 1 error(s) |
| v-if-in-narrow-bad | golar-typecheck | pass | caught 1 error(s) |
| v-if-in-narrow-ok | vue-tsc | pass | clean |
| v-if-in-narrow-ok | vize-check | pass | clean |
| v-if-in-narrow-ok | verter-tsc | pass | clean |
| v-if-in-narrow-ok | golar-typecheck | pass | clean |
| v-if-inline-event-bad | vue-tsc | pass | caught 1 error(s) |
| v-if-inline-event-bad | vize-check | **FAIL** | no diagnostic at App.vue:14 (@plant-error) |
| v-if-inline-event-bad | verter-tsc | pass | caught 1 error(s) |
| v-if-inline-event-bad | golar-typecheck | pass | caught 1 error(s) |
| v-if-inline-event-ok | vue-tsc | pass | clean |
| v-if-inline-event-ok | vize-check | pass | clean |
| v-if-inline-event-ok | verter-tsc | pass | clean |
| v-if-inline-event-ok | golar-typecheck | pass | clean |
| v-if-narrow-bad | vue-tsc | pass | caught 1 error(s) |
| v-if-narrow-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| v-if-narrow-bad | verter-tsc | pass | caught 1 error(s) |
| v-if-narrow-bad | golar-typecheck | pass | caught 1 error(s) |
| v-if-narrow-ok | vue-tsc | pass | clean |
| v-if-narrow-ok | vize-check | pass | clean |
| v-if-narrow-ok | verter-tsc | pass | clean |
| v-if-narrow-ok | golar-typecheck | pass | clean |
| v-if-not-ok | vue-tsc | pass | clean |
| v-if-not-ok | vize-check | pass | clean |
| v-if-not-ok | verter-tsc | pass | clean |
| v-if-not-ok | golar-typecheck | pass | clean |
| v-if-optional-prop-bad | vue-tsc | pass | caught 1 error(s) |
| v-if-optional-prop-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| v-if-optional-prop-bad | verter-tsc | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| v-if-optional-prop-bad | golar-typecheck | pass | caught 1 error(s) |
| v-if-optional-prop-ok | vue-tsc | pass | clean |
| v-if-optional-prop-ok | vize-check | pass | clean |
| v-if-optional-prop-ok | verter-tsc | pass | clean |
| v-if-optional-prop-ok | golar-typecheck | pass | clean |
| v-if-typeof-bad | vue-tsc | pass | caught 1 error(s) |
| v-if-typeof-bad | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| v-if-typeof-bad | verter-tsc | pass | caught 1 error(s) |
| v-if-typeof-bad | golar-typecheck | pass | caught 1 error(s) |
| v-if-typeof-ok | vue-tsc | pass | clean |
| v-if-typeof-ok | vize-check | pass | clean |
| v-if-typeof-ok | verter-tsc | pass | clean |
| v-if-typeof-ok | golar-typecheck | pass | clean |
| v-model-type | vue-tsc | **FAIL** | plant at App.vue:11 did not mention modelValue |
| v-model-type | vize-check | **FAIL** | no diagnostic at App.vue:11 (@plant-error) |
| v-model-type | verter-tsc | **FAIL** | no diagnostic at App.vue:11 (@plant-error) |
| v-model-type | golar-typecheck | **FAIL** | plant at App.vue:11 did not mention modelValue |
| v-show-no-narrow | vue-tsc | pass | caught 1 error(s) |
| v-show-no-narrow | vize-check | **FAIL** | no diagnostic at App.vue:10 (@plant-error) |
| v-show-no-narrow | verter-tsc | pass | caught 1 error(s) |
| v-show-no-narrow | golar-typecheck | pass | caught 1 error(s) |
| with-defaults-ok | vue-tsc | pass | clean |
| with-defaults-ok | vize-check | pass | clean |
| with-defaults-ok | verter-tsc | pass | clean |
| with-defaults-ok | golar-typecheck | pass | clean |
| wrong-prop-type | vue-tsc | **FAIL** | plant at App.vue:8 did not mention count |
| wrong-prop-type | vize-check | **FAIL** | no diagnostic at App.vue:8 (@plant-error) |
| wrong-prop-type | verter-tsc | **FAIL** | plant at App.vue:8 did not mention count |
| wrong-prop-type | golar-typecheck | **FAIL** | plant at App.vue:8 did not mention count |

## Summary

- pass: **407**
- fail: **143**
- skip: **6**
- warn: **12**
- total: 568
