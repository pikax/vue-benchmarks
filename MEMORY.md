# Resource probe (memory + allocations + CPU)

Isolated from timing benchmarks: each tool runs in its **own process** so RSS, allocation proxies, and CPU time are not mixed with sibling tools or the speed suite.

| Metric                | CLI tools                                                     | In-process (NAPI / eslint / ...)  |
| --------------------- | ------------------------------------------------------------- | --------------------------------- |
| **RSS min/max/avg**   | Child WorkingSet / RSS                                        | RSS during work minus GC baseline |
| **Alloc min/max/avg** | Linux: n/a (RSS only); Windows private bytes when run locally | V8 `heapUsed` delta               |
| **CPU total / %**     | Process CPU when available                                    | `process.cpuUsage()`              |
| **Wall**              | Elapsed while the tool ran                                    | Same                              |

**CI:** Linux (`ubuntu-latest`) only, via the **Benchmark** workflow (`memory` job, manual dispatch). Results below are auto-committed on a `main` dispatch with `[skip ci]`.

Once published, each block below states the platform it came from and carries a per-row **Samples** column. `⚠` on a sample count means that row recorded **fewer** samples than were requested — its numbers rest on less evidence than its neighbours.

### Reading these numbers

- **Rows from different platforms are not comparable.** Each block names its own source platform; the banner names every platform spliced. Published figures are the Linux ones.
- **The `Alloc` column is not available for CLI tools on Linux.** The probe samples private bytes only on Windows (`scripts/memory-worker.mjs`); on Linux a CLI row reports RSS and CPU, and `Alloc` is `n/a`. An `Alloc` figure on a CLI row in a block labelled Linux is not a Linux measurement — treat the block as mislabelled rather than the number as real.
- **⚠ Volar's LSP rows cover the Vue server only.** Vue language-tools v3 is two processes; the probe samples one pid, and the tsserver half is the larger of the two. Volar's LSP memory is therefore a **lower bound on the Vue half**, not Volar's footprint — while the LSP *timing* tables in the README charge Volar **both** processes. Vize and Verter are single-process, so their rows are whole. The `Notes` column on each row carries this warning as emitted by the probe.

Local:

```bash
pnpm bench:memory:small
pnpm bench:memory
node --expose-gc scripts/bench-memory.mjs --fixture fixtures/200 --file-limit 100 --samples 3
```

<!-- MEMORY_RESULTS_START -->

_Awaiting a CI run._ No resource-probe artifacts are currently published here.

This section previously held output from a local Windows run spliced under a **Linux** banner, with an `Alloc` column the Linux CLI code path cannot produce and no per-row **Samples** column. Those numbers were not salvageable and have been removed rather than corrected.

Run the **Benchmark** workflow (`workflow_dispatch`, `main`) to regenerate. Its `memory` job publishes `memory-linux-<limit>.{json,md}`, and `scripts/update-memory-readme.mjs` splices them between these markers with the platform banner, the per-row **Samples** column, and the per-row **Notes** column derived from the artifacts themselves.

<!-- MEMORY_RESULTS_END -->
