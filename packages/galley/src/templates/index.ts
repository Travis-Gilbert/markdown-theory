/**
 * galley/templates -- the type recipes and their registry (G3).
 *
 * A recipe is a declarative object over tokens; the registry is keyed by
 * frontmatter `type` and open for registration. Core four: article, note,
 * reference, log. Unknown types fall back to article with a quiet chip.
 */

export {
  ARTICLE,
  getRecipe,
  LOG,
  NOTE,
  type Recipe,
  type RecipeApparatus,
  type RecipeFamily,
  REFERENCE,
  registerRecipe,
  resolveRecipe,
  type ResolvedRecipe,
  slugify,
} from "./recipes.js";
