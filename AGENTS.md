# AGENTS.md

## Project Overview

NetJSON NetworkGraph visualizer: A JavaScript library for visualizing network data using NetJSON format, built with echarts, leaflet, and related dependencies.

## Development Setup

- Install dependencies: `yarn install`.
- Set up Python environment for QA tools: `pip install "openwisp-utils[qa]~=1.2.0"` (required for openwisp-qa-format and openwisp-qa-check).
- For browser tests, ensure Chrome and ChromeDriver are available (CI handles this automatically).

## Code Formatting

To format code, run:

```bash
openwisp-qa-format   # python virtualenv needs to be enabled for this command to work, if not, install openwisp-utils as done in .github/workflows/ci.yml
yarn lint:fix         # runs eslint --fix and prettier via lint-staged
```

## QA Checks

Run QA checks with:

```bash
./run-qa-checks
```

This runs yarn lint, openwisp-qa-check (with CSS/JS linting, skipping Python checks), and fails if issues are found.

## Testing

- Unit tests (Jest with jsdom): `yarn test`.
- Browser tests (requires dev server): Start server with `yarn start &`, then run `yarn test test/netjsongraph.browser.test.js` (uses Chrome/ChromeDriver).
- Coverage: `yarn coverage` (excludes browser test file).
- CI runs unit tests with coverage, then browser tests separately (see `.github/workflows/ci.yml`, ignore "build-and-deploy" job).

## Building and Running

- Development server: `yarn dev` (opens browser at localhost:8080).
- Production build: `yarn build`.
- Pre-commit hooks: husky runs lint-staged (prettier on `src/\*_/_.js`).

## General Guidelines

- Avoid other arbitrary formatting changes.
- Check for dependency vulnerabilities: `npm audit` or `yarn audit`.

## Code Review Checklist

When reviewing changes, always watch out for:

- Missing tests (especially browser tests for UI‑intensive features).
- Performance penalties.
- Inconsistencies and duplication which can lead to maintenance overhead.
- Security issues (e.g., no secrets in code, safe dep usage).
- Usability issues.

## Contributing Guidelines

- [Follow OpenWISP contributing guidelines](https://openwisp.io/docs/stable/developer/contributing.html).

## Troubleshooting

- QA/format commands fail: Ensure Python env is active and openwisp-utils is installed.
- Browser tests fail: Check Chrome/ChromeDriver setup; server must be running on `localhost:8080`.
- Deps not found: Run `yarn install` first.
- CI issues: Refer to .github/workflows/ci.yml (ignore install steps if deps are cached locally).
