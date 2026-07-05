# G7 browser harness (spec for CI)

The G7 gates measure *rendered pixels*, so they need a real browser. This
environment has none (Playwright cannot find a system Chrome), so the harness is
specified here and the fixtures are generated (`pnpm demo:permutations`,
`fixtures/readmes/`) but the pixel assertions are not run locally. Drop this into
CI with `@playwright/test` + a Chromium install.

## Inputs (generated, runnable without a browser)
- `pnpm demo:permutations` -> `dist/permutations/{register}-{recipe}.html` (3x4 matrix) + `index.html`.
- `pnpm demo:render` -> `dist/render-demo.html` (full vocabulary).
- `fixtures/readmes/*.md` -> the uncurated-README robustness corpus; render each through `<Galley>` to HTML in the harness setup.

## Gates (Playwright, Chromium 133+ for text-box-trim)

1. **Overflow lint.** For every rendered block, assert `el.scrollWidth <= el.clientWidth + 1` on `.galley` and its children; the page body must never scroll horizontally (`document.documentElement.scrollWidth <= innerWidth + 1`). Fail lists the offending selector + widths.
2. **Contrast gate (rendered).** Sample computed `color` vs background for body, links, callout labels, code; assert WCAG AA (reuse `wcagContrast` from `galley/tokens` against parsed rendered colors). This backstops the G1 generation-time solver with real cascade + inheritance.
3. **Orphan / widow gate.** For each paragraph, assert no last line is a single word narrower than a threshold (measure the last line-box via Range rects). `text-wrap: pretty` should already prevent this; the gate proves it on uncurated content.
4. **Register-permutation snapshots.** Screenshot each `dist/permutations/*.html` at two viewports (e.g. 480 and 1280). Store as Playwright snapshots; churn requires an intentional token change to explain it.

## Acceptance (spec G7)
- The full matrix runs headless and fails on any overflow, contrast, or orphan regression.
- A dozen uncurated READMEs render with zero horizontal overflow, zero AA failures, no single-word last lines, in all three registers.

## Wiring
- Add `@playwright/test` (dev), `playwright.config.ts` (Chromium project), and `tests/g7/*.spec.ts` implementing the four gates above.
- `package.json`: `"test:visual": "playwright test"`; run in CI after `pnpm demo:permutations`.
- Keep it separate from the vitest suite (that stays browser-free and fast).
