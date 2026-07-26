# Security policy

## Supported versions

This repository is a benchmark harness, not a shipped runtime product. Security fixes apply to the latest commit on `main`.

## Reporting a vulnerability

If you find a security issue in this harness (e.g. unsafe handling of untrusted fixture paths, command injection in scripts, or secrets leaking into logs/artifacts):

1. **Do not** open a public GitHub issue for exploitable details.
2. Report privately via GitHub **Security → Report a vulnerability** on this repository (if available), or contact the maintainers listed in the repository profile.
3. Include: affected path/script, reproduction steps, and impact.

## Scope notes

- Benchmarks intentionally execute third-party CLIs and native binaries from `package.json` dependencies. Treat dependency advisories with `pnpm audit` / GitHub Dependabot.
- Generated fixtures and `work/` directories are local/ephemeral; do not place secrets there.
- CI artifacts may contain machine paths and timing data; they should not contain credentials.
