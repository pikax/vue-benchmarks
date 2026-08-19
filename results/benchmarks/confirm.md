# Confirmation suite (correctness, not performance)

Tools are checked against planted expectations (compile → mount, lint counts, type diagnostics, component-meta shapes, format parse/idempotence/tokens).
Skip = missing API/binary or out of scope. Fail = plant expectation not met. Warn = extra harness behaviour for one tool (not a pass).

## typecheck-all

| Case | Tool | Status | Notes |
| --- | --- | --- | --- |
| all-plants | vue-tsc | pass | 84% (119/142) · median 3.18s of 5 after 1 warmup(s) |
| all-plants | vize-check | pass | 52% (71/136) · median 0.60s of 5 after 1 warmup(s) |
| all-plants | verter-tsc | pass | 70% (100/142) · median 0.76s of 5 after 1 warmup(s) |
| all-plants | golar-typecheck | pass | 82% (117/142) · median 0.91s of 5 after 1 warmup(s) |

## Summary

- pass: **4**
- fail: **0**
- skip: **0**
- warn: **0**
- total: 4
