# Resource probe (memory + allocations + CPU)

Isolated from timing benchmarks: each tool runs in its **own process** so RSS, allocation proxies, and CPU time are not mixed with sibling tools or the speed suite.

| Metric                | CLI tools                                                     | In-process (NAPI / eslint / ...)  |
| --------------------- | ------------------------------------------------------------- | --------------------------------- |
| **RSS min/max/avg**   | Child WorkingSet / RSS                                        | RSS during work minus GC baseline |
| **Alloc min/max/avg** | Linux: n/a (RSS only); Windows private bytes when run locally | V8 `heapUsed` delta               |
| **CPU total / %**     | Process CPU when available                                    | `process.cpuUsage()`              |
| **Wall**              | Elapsed while the tool ran                                    | Same                              |

**CI:** Linux (`ubuntu-latest`) only, via the **Benchmark** workflow (`memory` job). Results below are auto-committed on `main` with `[skip ci]`.

Local:

```bash
pnpm bench:memory:small
pnpm bench:memory
node --expose-gc scripts/bench-memory.mjs --fixture fixtures/200 --file-limit 100 --samples 3
```

<!-- MEMORY_RESULTS_START -->

> Auto-updated 2026-07-26 from the **Benchmark** workflow (**Linux** resource probe). Commit uses `[skip ci]`.

#### Source: `memory-linux-20.md`

# Resource probe results (memory + allocations + CPU)

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-07-26T13:30:56.783Z
- **Fixture:** `fixtures/20`
- **Samples per tool:** 1
- **File limit:** 20 (typecheck 50, meta 30)

### Metrics

| Column                | Meaning                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| **RSS min/max/avg**   | Resident set: CLI = child WorkingSet/RSS; in-process = delta vs GC baseline           |
| **Alloc min/max/avg** | In-process: V8 `heapUsed` delta; CLI (Windows): private bytes (`PrivateMemorySize64`) |
| **CPU total / %**     | Process CPU time (user+system) and % of wall time on one core (`cpu/wall×100`)        |

### compile

| Tool                                     | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms |
| ---------------------------------------- | ------ | ------: | ------: | ------: | --------: | --------: | --------: | -----: | ----: | ------: |
| Vize native loop (1T) vdom-prod          | ok     |    3.85 |    3.85 |    3.85 |      0.48 |      0.48 |      0.48 |  16.00 | 120.0 |   13.34 |
| Vize native batch vdom-prod              | ok     |    9.45 |    9.45 |    9.45 |      0.46 |      0.46 |      0.46 |  16.00 |  90.1 |   17.76 |
| Verter compileMany (stateless) vdom-prod | ok     |   19.11 |   19.11 |   19.11 |      0.53 |      0.53 |      0.53 |  16.00 |  73.2 |   21.86 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod     | ok     |   27.29 |   27.29 |   27.29 |     17.06 |     17.06 |     17.06 | 281.00 | 141.2 |  199.06 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod     | ok     |   27.71 |   27.71 |   27.71 |     11.50 |     11.50 |     11.50 | 266.00 | 127.5 |  208.68 |

### typecheck

| Tool            | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg |  CPU ms | CPU % | Wall ms |
| --------------- | ------ | ------: | ------: | ------: | --------: | --------: | --------: | ------: | ----: | ------: |
| verter-tsc      | ok     |   46.23 |   55.52 |   54.19 |      8.02 |     19.43 |     17.80 |   62.50 |  18.0 |  346.95 |
| Vize check      | ok     |   45.86 |   66.14 |   59.33 |      7.55 |     26.84 |     20.50 |   93.75 |  39.0 |  240.27 |
| Golar typecheck | ok     |   45.82 |  213.66 |  134.97 |      7.52 |    213.48 |    118.40 |  953.12 | 168.5 |  565.52 |
| vue-tsc         | ok     |   48.99 |  262.96 |  166.18 |     10.75 |    246.39 |    156.74 | 1734.38 | 187.6 |  924.53 |

### Versions

- node: v24.16.0
- vue: 3.5.40
- @vue/compiler-sfc: 3.5.40
- @vue/compiler-sfc-36: 3.6.0-rc.2
- vize: 0.291.0
- @vizejs/native: 0.291.0
- @verter/native: 0.0.1-beta.2
- verter-tsc: 0.0.1-beta.2
- @verter/component-meta: 0.0.1-beta.2
- vue-tsc: 3.3.8
- vue-component-meta: 3.3.8
- golar: 0.1.10
- @golar/vue: 0.1.10
- prettier: 3.9.6
- oxfmt: 0.60.0
- typescript: 5.9.3
- cli:vize: 0.291.0
- cli:vue-tsc: 5.9.3
- cli:verter-tsc: 0.0.1-beta.2
- cli:golar: 0.1.10
- cli:prettier: 3.9.6
- cli:oxfmt: 0.60.0
- vue-jsx-vapor: 3.2.19
- @vue-jsx-vapor/compiler-rs: 3.2.19
- @vue/babel-plugin-jsx: 2.0.1
- @babel/core: 7.28.5

#### Source: `memory-win32-20.md`

# Resource probe results (memory + allocations + CPU)

Separate from timing benches. Each tool runs in its own process so metrics are not mixed with siblings.

- **Generated:** 2026-07-26T13:23:17.307Z
- **Fixture:** `fixtures/20`
- **Samples per tool:** 1
- **File limit:** 20 (typecheck 50, meta 30)

### Metrics

| Column                | Meaning                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| **RSS min/max/avg**   | Resident set: CLI = child WorkingSet/RSS; in-process = delta vs GC baseline           |
| **Alloc min/max/avg** | In-process: V8 `heapUsed` delta; CLI (Windows): private bytes (`PrivateMemorySize64`) |
| **CPU total / %**     | Process CPU time (user+system) and % of wall time on one core (`cpu/wall×100`)        |

### compile

| Tool                                     | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms |
| ---------------------------------------- | ------ | ------: | ------: | ------: | --------: | --------: | --------: | -----: | ----: | ------: |
| Vize native loop (1T) vdom-prod          | ok     |    3.81 |    3.81 |    3.81 |      0.48 |      0.48 |      0.48 |  16.00 | 136.7 |   11.71 |
| Vize native batch vdom-prod              | ok     |    9.18 |    9.18 |    9.18 |      0.46 |      0.46 |      0.46 |  15.00 | 153.4 |    9.78 |
| Verter compileMany (stateless) vdom-prod | ok     |   19.52 |   19.52 |   19.52 |      0.53 |      0.53 |      0.53 |  46.00 | 234.5 |   19.61 |
| @vue/compiler-sfc 3.6 (1T) vdom-prod     | ok     |   25.26 |   25.26 |   25.26 |     15.68 |     15.68 |     15.68 | 235.00 | 138.3 |  169.92 |
| @vue/compiler-sfc 3.5 (1T) vdom-prod     | ok     |   27.09 |   27.09 |   27.09 |     17.11 |     17.11 |     17.11 | 250.00 | 148.5 |  168.31 |

### jsx-compile

| Tool                                      | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg | CPU ms | CPU % | Wall ms |
| ----------------------------------------- | ------ | ------: | ------: | ------: | --------: | --------: | --------: | -----: | ----: | ------: |
| @vue-jsx-vapor/compiler-rs (interop VDOM) | ok     |    1.50 |    1.50 |    1.50 |      0.31 |      0.31 |      0.31 |   0.00 |   0.0 |    4.98 |
| @vue-jsx-vapor/compiler-rs (vapor)        | ok     |    1.60 |    1.60 |    1.60 |      0.30 |      0.30 |      0.30 |   0.00 |   0.0 |    5.77 |
| @vue/babel-plugin-jsx                     | ok     |   36.66 |   36.66 |   36.66 |     31.47 |     31.47 |     31.47 | 328.00 | 107.5 |  304.99 |

### typecheck

| Tool            | Status | RSS min | RSS max | RSS avg | Alloc min | Alloc max | Alloc avg |  CPU ms | CPU % | Wall ms |
| --------------- | ------ | ------: | ------: | ------: | --------: | --------: | --------: | ------: | ----: | ------: |
| verter-tsc      | ok     |   44.24 |   55.46 |   53.59 |      3.19 |     19.40 |     16.70 |   62.50 |  21.0 |  297.30 |
| Vize check      | ok     |   44.46 |   66.88 |   60.27 |      3.43 |     26.66 |     20.74 |  125.00 |  54.9 |  227.87 |
| Golar typecheck | ok     |   46.41 |  221.44 |  126.60 |      8.38 |    219.63 |    109.97 | 1234.38 | 246.7 |  500.31 |
| vue-tsc         | ok     |   46.36 |  263.02 |  141.77 |      8.38 |    246.71 |    128.55 | 1437.50 | 177.7 |  809.15 |

### Versions

- node: v24.16.0
- vue: 3.5.40
- @vue/compiler-sfc: 3.5.40
- @vue/compiler-sfc-36: 3.6.0-rc.2
- vize: 0.291.0
- @vizejs/native: 0.291.0
- @verter/native: 0.0.1-beta.2
- verter-tsc: 0.0.1-beta.2
- @verter/component-meta: 0.0.1-beta.2
- vue-tsc: 3.3.8
- vue-component-meta: 3.3.8
- golar: 0.1.10
- @golar/vue: 0.1.10
- prettier: 3.9.6
- oxfmt: 0.60.0
- typescript: 5.9.3
- cli:vize: 0.291.0
- cli:vue-tsc: 5.9.3
- cli:verter-tsc: 0.0.1-beta.2
- cli:golar: 0.1.10
- cli:prettier: 3.9.6
- cli:oxfmt: 0.60.0
- vue-jsx-vapor: 3.2.19
- @vue-jsx-vapor/compiler-rs: 3.2.19
- @vue/babel-plugin-jsx: 2.0.1
- @babel/core: 7.28.5

<!-- MEMORY_RESULTS_END -->
