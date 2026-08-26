# AGENTS.md

## Project Overview

`netjsongraph.js` is a JavaScript library for visualizing NetJSON network graphs with echarts, leaflet, and related tooling.

Core code lives in this repository root:

- `src/` contains source modules.
- `lib/` contains tracked third-party assets; `dist/` is generated, intentionally untracked build output.
- `test/`, `examples/`, `docs/`, `scripts/`, and `webpack-plugins/` support tests, demos, documentation, and builds.

## Source of Truth

- Use `README.md` and `docs/` for setup, usage, examples, and build behavior.
- Use `package.json`, `yarn.lock`, and `.github/workflows/ci.yml` for CI-tested dependencies, lint, test, build, and supported Node versions.
- Use GitHub issue/PR templates when asked to open issues or PRs.

If instructions conflict, repository config and CI workflows win first, docs next, and this file is supplemental.

## Contributing Guidelines

- Before editing, inspect the relevant implementation, tests, documentation, and configuration. Follow existing repository patterns and do not invent behavior or requirements.
- Keep each contribution focused and change only the lines necessary for its goal. Do not include unrelated refactors, formatting churn, or generated and dependency-file changes unless explicitly required.
- Add or update focused tests for every behavior change. Use test-driven development when the scope is very clear, such as bug fixes or narrowly scoped changes. For new features, tests may be added after implementation, but confirm they fail when key feature code is removed. When a test failure does not clearly state the expected outcome that was not met, add an explicit assertion message.
- Run `openwisp-qa-format` and `yarn lint:fix` after each change.
- Run the relevant targeted tests, builds, and documented QA checks, including `./run-qa-checks` when provided. Do not claim a change is complete when verification fails; report the failure or blocker.
- When requirements, intended behavior, or an unexpected failure are unclear, stop and seek clarification instead of making speculative changes.
- When starting work on a new issue, create a new branch from `master`. Use `issues/<issue-number>-<short-title>` for issue work; otherwise, use a short, descriptive branch name.
- Commit messages must be descriptive and use past tense. Past tense is a writing guideline that agents and contributors must follow; it is not checked automatically. For issue work, use an allowed prefix and a capitalized, past-tense subject ending with `#<issue-number>`, for example `[fix] Fixed perennial "modified" state #213`. Repeat the issue reference in the body with `Fixes`, `Closes`, `Resolves`, or `Related to` as appropriate. After creating a commit, use `openwisp-commit --check` to validate the current `HEAD`; it cannot validate a proposed message. Use `openwisp-commit --check --rev-range <range>` for an existing commit range, and `cz -n cz_openwisp info` to view allowed prefixes and message structure.
- Add an explanatory commit body only for substantial changes, new features, or non-obvious bug fixes. The releaser automatically publishes the subject of `[feature]`, `[change]`, `[change!]`, `[deps]`, and `[fix]` commits, including scoped variants, in the changelog. Write those subjects in clear, user-friendly language suitable for release notes.
- Send new commits in response to review feedback instead of amending existing commits.

## Development Rules

- Follow the DRY principle: do not duplicate information or code across files.
- Preserve public APIs, NetJSON compatibility, rendered graph behavior, browser compatibility, and build outputs unless explicitly required.
- Be careful with performance on large graphs, map interactions, accessibility, dependency updates, and bundle size.
- Load paginated API collections one page at a time, following the API's pagination link or cursor.
- Do not fetch every page by default. Prefer normal page navigation when it meets the user need.
- If infinite scrolling is necessary, define a maximum number of records or pages kept in browser memory.
- Tests for code that consumes paginated APIs must cover loading a second page and detecting the end of the list.
- Avoid unnecessary blank lines inside functions and methods.
- Update docs or examples when behavior, options, public APIs, setup steps, or supported versions change, including when a documented feature's behavior changes or a new user-facing feature is added.
- Do not edit `dist/` directly: change `src/`, `public/`, or other build inputs and regenerate it when required.
- Treat `src/css/` as the stylesheet source. Do not edit the copies in `dist/lib/css/`; rebuild them with `yarn build:full` when generated output is required.
- Prefer short, precise names that rely on their nearest meaningful scope. Do not repeat a feature, domain object, or namespace already named by the containing module, class, or function. For example, prefer `EstimatedLocation.refresh()` over `EstimatedLocation.refreshEstimatedLocation()`. Repeat that context only when the name is used outside that scope or is needed to distinguish genuinely different concepts. When a concise name cannot express a necessary distinction, use a concise docstring to describe it rather than encoding it in an excessively long name.
- Before adding a comment or docstring, ask whether it conveys information a reader cannot reasonably infer from clear code, names, and surrounding scope. Add a concise comment when it explains a non-obvious reason, constraint, compatibility or security requirement, side effect, or unavoidable complexity. In opaque syntax or domain-specific code, especially shell scripts, include a concise comment that explains its purpose and why the complexity is necessary. Do not add comments that merely restate adjacent code one-to-one.

## Testing and QA

- Use `yarn test` for unit tests, `yarn coverage` for coverage, and the documented browser test flow for browser-specific behavior.
- Keep helpers and classes used by only one test method inside that method. Promote them to class or module scope only when genuinely reused.

## Security Rules

- Watch for unsafe dependency changes, DOM injection, unsafe URL handling, leaked secrets, and performance regressions from untrusted graph data.
- Preserve validation and safe handling around NetJSON input, map tiles, external links, browser APIs, and generated assets.

## Troubleshooting

- If documentation and CI commands differ, use CI for verification and report the exact documentation path, CI workflow path, and differing commands. Do not change the documentation until the user explicitly chooses one of these actions: update the named documentation file in the current change because the divergence was caused by that change, or leave it unchanged for a separate follow-up. Never decide that scope distinction independently.
