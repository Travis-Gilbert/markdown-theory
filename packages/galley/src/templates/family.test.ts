import { describe, expect, it } from "vitest";

import { FAMILY_PROCEDURE, resolveRecipe, resolveType } from "./recipes.js";

// T2 Slice A: the 32 document-types kinds resolve through their family base
// recipe with per-type deltas, while the legacy four and the unknown fallback
// keep their existing behavior.
describe("T2 family recipes over document-types", () => {
  it("resolves a non-legacy kind through its family base + deltas (paper)", () => {
    const { recipe, unknown } = resolveRecipe("paper");
    expect(unknown).toBe(false);
    expect(recipe.id).toBe("paper");
    expect(recipe.family).toBe("prose");
    expect(recipe.toc).toBe(true); // paper's declared delta
  });

  it("adds the previously-missing procedure family (recipe -> numbered)", () => {
    const { recipe } = resolveRecipe("recipe");
    expect(recipe.family).toBe("procedure");
    expect(recipe.numberedHeadings).toBe(true);
    expect(FAMILY_PROCEDURE.family).toBe("procedure");
  });

  it("keeps the legacy registry recipe winning (reference stays the reference recipe)", () => {
    // 'reference' is both a legacy recipe id and a taxonomy kind; the registry wins.
    expect(resolveRecipe("reference").recipe.id).toBe("reference");
    expect(resolveRecipe("reference").recipe.className).toBe("galley-reference");
  });

  it("still falls back to article + chip for a kind in neither registry nor taxonomy", () => {
    const { recipe, unknown, requested } = resolveRecipe("totally-made-up");
    expect(unknown).toBe(true);
    expect(recipe.id).toBe("article");
    expect(requested).toBe("totally-made-up");
  });

  it("resolveType returns the effective recipe for a taxonomy kind, undefined otherwise", () => {
    expect(resolveType("spec")?.family).toBe("working");
    expect(resolveType("spec")?.toc).toBe(true);
    expect(resolveType("nope")).toBeUndefined();
  });
});
