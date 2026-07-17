/**
 * Pinned fixture CSS artifacts (M2/M4): the generation path for the files under
 * packages/galley/fixtures/css/, shipped verbatim as dist/fixtures/*.css.
 *
 * Consumers pin an output, not a recipe: an application imports
 * `@travis-gilbert/markdown-theory/fixtures/<name>.css` and gets bytes that
 * never drift under it. Regeneration is deterministic for a pinned seed (the
 * axes plus face variant in fixtures.ts): `emitCss` is pure and the header
 * carries no timestamp. The drift gate in fixtures.test.ts fails when a
 * committed artifact no longer matches its seed; `pnpm emit:fixtures` rewrites
 * them.
 */

import { emitCss } from "./emit.js";
import {
  CONSOLE_DARK_VARIANTS,
  consoleDark,
  consoleDarkSans,
  consoleDarkSerif,
  type FixtureVariant,
} from "./fixtures.js";
import type { Register } from "./types.js";

/**
 * The artifacts the package ships, by fixture name. `console-dark` is the
 * serif default; the face decision reverses by swapping the imported name.
 */
export const FIXTURE_CSS_ARTIFACTS: Record<string, { seed: FixtureVariant; make: () => Register }> =
  {
    "console-dark": { seed: CONSOLE_DARK_VARIANTS["console-dark-serif"], make: consoleDark },
    "console-dark-serif": {
      seed: CONSOLE_DARK_VARIANTS["console-dark-serif"],
      make: consoleDarkSerif,
    },
    "console-dark-sans": {
      seed: CONSOLE_DARK_VARIANTS["console-dark-sans"],
      make: consoleDarkSans,
    },
  };

/** Render one artifact: a seed-stamped header plus the emitted `:root` sheet. */
export function fixtureCss(name: string): string {
  const artifact = FIXTURE_CSS_ARTIFACTS[name];
  if (!artifact) {
    throw new Error(
      `Unknown fixture artifact "${name}"; known: ${Object.keys(FIXTURE_CSS_ARTIFACTS).join(", ")}`,
    );
  }
  const header = [
    "/*",
    ` * ${name} -- a generated register artifact. DO NOT EDIT BY HAND.`,
    " *",
    " * Pinned output of the markdown-theory proportion engine; regenerate with",
    " * `pnpm emit:fixtures` after changing the seed in src/tokens/fixtures.ts.",
    ` * Seed axes: ${JSON.stringify(artifact.seed.axes)}`,
    ` * Seed fonts: ${JSON.stringify(artifact.seed.fonts ?? {})}`,
    " *",
    " * Bridge points for an embedding host (the official console contract):",
    " *   --gy-surface   the reading plane the host maps its pane onto",
    " *   --gy-ground    the canvas the host paints behind the plane",
    " *   --gy-font-mono the code face shared with the host terminal",
    " */",
    "",
  ].join("\n");
  return header + emitCss(artifact.make(), ":root");
}
