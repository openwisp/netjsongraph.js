# AGENTS.md

## Project Overview

`netjsongraph.js` is a JavaScript library for visualizing NetJSON network graphs with echarts, leaflet, and related tooling.

Core code lives in this repository root:

- `src/` contains source modules.
- `lib/` and `dist/` contain built artifacts.
- `test/`, `examples/`, `docs/`, `scripts/`, and `webpack-plugins/` support tests, demos, documentation, and builds.

## Source of Truth

- Use `README.md` and `docs/` for setup, usage, examples, and build behavior.
- Use `package.json`, `yarn.lock`, and `.github/workflows/ci.yml` for CI-tested dependencies, lint, test, build, and supported Node versions.
- Use GitHub issue/PR templates when asked to open issues or PRs.

If instructions conflict, repository config and CI workflows win first, docs next, and this file is supplemental.

## Development Notes

- Keep changes focused. Avoid unrelated refactors and formatting churn.
- Preserve public APIs, NetJSON compatibility, rendered graph behavior, browser compatibility, and build outputs unless explicitly required.
- Be careful with performance on large graphs, map interactions, accessibility, dependency updates, and bundle size.
- Avoid unnecessary blank lines inside functions and methods.
- Update docs or examples when behavior, options, public APIs, setup steps, or supported versions change.

## Testing and QA

- Add or update tests for every behavior change.
- For bug fixes, write the regression test first, run it against the unfixed code, confirm it fails for the expected reason, then implement the fix.
- Use `yarn test` for unit tests, `yarn coverage` for coverage, and the documented browser test flow for browser-specific behavior.
- Run `openwisp-qa-format`, `yarn lint:fix`, and `./run-qa-checks` when available. Treat failures as blocking unless confirmed unrelated and reported.

## Security Notes

- Watch for unsafe dependency changes, DOM injection, unsafe URL handling, leaked secrets, and performance regressions from untrusted graph data.
- Preserve validation and safe handling around NetJSON input, map tiles, external links, browser APIs, and generated assets.
- Write comments only when they explain why code is shaped a certain way. Put comments before the relevant block instead of scattering them inside it.

## Troubleshooting

- If setup, QA, tests, browser tests, or builds fail, check docs first, then compare with CI. If commands diverge, follow CI.
