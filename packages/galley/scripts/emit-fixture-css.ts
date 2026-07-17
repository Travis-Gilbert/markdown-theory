/**
 * Write the pinned fixture CSS artifacts (M2/M4) to packages/galley/fixtures/css/.
 *
 * The generation path lives in src/tokens/fixture-css.ts (shared with the drift
 * gate in fixtures.test.ts); this script only writes the files. Deterministic
 * for a pinned seed: rerunning it without a seed change is a no-op diff.
 * Run: `pnpm emit:fixtures`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FIXTURE_CSS_ARTIFACTS, fixtureCss } from "../src/tokens/fixture-css.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../fixtures/css");
mkdirSync(outDir, { recursive: true });

for (const name of Object.keys(FIXTURE_CSS_ARTIFACTS)) {
  writeFileSync(resolve(outDir, `${name}.css`), fixtureCss(name), "utf8");
  console.log(`wrote fixtures/css/${name}.css`);
}
