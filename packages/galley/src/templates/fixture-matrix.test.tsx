import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { allTypes } from "@travis-gilbert/document-types";
import type { TypeDescriptor } from "@travis-gilbert/document-types";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { parchment, print, substrate } from "../tokens/fixtures.js";
import type { Register } from "../tokens/types.js";
import { Galley } from "../react/Galley.js";
import { recipeFromDescriptor, resolveRecipe } from "./recipes.js";

// T2 acceptance, criterion 1: "each of the 32 types renders through its family
// recipe with deltas applied in the Galley fixture matrix." This file IS that
// matrix -- the shipped set crossed with the three shipped registers, asserting
// the resolved recipe is the family base with the descriptor's deltas applied,
// and that it renders (no throw, class on the root, register vars scoped) under
// every register. Criteria 2 and 3 (okf_type export, kind round-trip) live in
// the Rust OKF bridge.

const REGISTERS: Record<string, () => Register> = { parchment, substrate, print };

// Ids that predate the taxonomy and are also registered as legacy recipes. The
// registry intentionally wins for these (see family.test.ts / templates.test.tsx),
// so they carry their legacy `galley-<id>` className, not a `galley-family-*` one.
const LEGACY_IDS = new Set(["article", "note", "reference", "log"]);

// One representative body that exercises what the families lean on: a title
// (numbered-heading counter source + ToC anchor), sub-headings, prose, an
// ordered list (procedure steps), a definition list (reference), and a table.
function fixtureFor(d: TypeDescriptor): string {
  const frontmatter = [
    "---",
    `type: ${d.id}`,
    "gist: A one-line deck, shown as a standfirst where the family carries one.",
    "byline: Ada Lovelace",
    "---",
    "",
  ].join("\n");
  const body = [
    `# ${d.okf_type}`,
    "",
    "An opening paragraph that establishes the measure and the reading colour.",
    "",
    "## First section",
    "",
    "1. First step or point.",
    "2. Second step or point.",
    "",
    "### A sub-point",
    "",
    "Term",
    ": Its definition, for the reference families.",
    "",
    "## Second section",
    "",
    "| Field | Shape |",
    "| --- | --- |",
    "| id | string |",
    "",
    "> A closing quote.",
  ].join("\n");
  return `${frontmatter}${body}`;
}

const types = allTypes();

describe("T2 fixture matrix: the shipped set x the three registers", () => {
  it("ships exactly the 32-type set", () => {
    expect(types).toHaveLength(32);
  });

  for (const d of types) {
    describe(d.id, () => {
      const resolved = resolveRecipe(d.id);

      it("resolves to a known, family-consistent recipe with deltas applied", () => {
        expect(resolved.unknown).toBe(false);
        if (LEGACY_IDS.has(d.id)) {
          // Legacy registry recipe wins; className is `galley-<id>`.
          expect(resolved.recipe.className).toBe(`galley-${d.id}`);
        } else {
          // Taxonomy path: the family base carries the render load...
          expect(resolved.recipe.family).toBe(d.family);
          expect(resolved.recipe.className).toBe(`galley-family-${d.family}`);
          // ...with the descriptor's declarative deltas applied onto it.
          const effective = recipeFromDescriptor(d);
          expect(resolved.recipe.numberedHeadings).toBe(effective.numberedHeadings);
          expect(resolved.recipe.toc).toBe(effective.toc);
        }
      });

      for (const [name, make] of Object.entries(REGISTERS)) {
        it(`renders under the ${name} register`, () => {
          const html = renderToStaticMarkup(<Galley doc={fixtureFor(d)} register={make()} />);
          // The recipe className is on the root.
          expect(html).toContain(resolved.recipe.className);
          // The register scoped its --gy-* custom properties onto the instance.
          expect(html).toContain("--gy-ink");
          expect(html).toContain("--gy-surface");
          // Numbered / ToC deltas are reflected in the rendered apparatus.
          if (resolved.recipe.numberedHeadings) {
            expect(html).toContain('data-numbered="true"');
          }
          if (resolved.recipe.toc) {
            expect(html).toContain('class="galley-toc"');
          }
        });
      }
    });
  }
});

describe("T2 family CSS: every family base className is styled", () => {
  const css = readFileSync(fileURLToPath(new URL("../css/galley.css", import.meta.url)), "utf8");
  const families = ["prose", "reference", "procedure", "record", "working", "structural"] as const;
  for (const family of families) {
    it(`galley.css carries a .galley-family-${family} rule`, () => {
      expect(css).toContain(`.galley-family-${family}`);
    });
  }
});
