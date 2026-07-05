import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Galley } from "../react/Galley.js";
import {
  ARTICLE,
  getRecipe,
  type Recipe,
  registerRecipe,
  resolveRecipe,
  slugify,
} from "./recipes.js";

const render = (md: string, props: Record<string, unknown> = {}): string =>
  renderToStaticMarkup(<Galley doc={md} {...props} />);

describe("recipe registry", () => {
  it("resolves a known type", () => {
    expect(resolveRecipe("reference").recipe.id).toBe("reference");
    expect(resolveRecipe("reference").unknown).toBe(false);
  });

  it("falls back to article with a chip flag for an unknown type", () => {
    const r = resolveRecipe("does-not-exist");
    expect(r.recipe).toBe(ARTICLE);
    expect(r.unknown).toBe(true);
    expect(r.requested).toBe("does-not-exist");
  });

  it("passes an explicit recipe object through, and defaults to article", () => {
    const custom: Recipe = { ...ARTICLE, id: "x", className: "galley-x" };
    expect(resolveRecipe(custom).recipe).toBe(custom);
    expect(resolveRecipe(undefined).recipe).toBe(ARTICLE);
  });

  it("registers a custom recipe and rejects a collision", () => {
    const poem: Recipe = {
      id: "poem",
      family: "prose",
      className: "galley-poem",
      rampOffset: 0,
      numberedHeadings: true,
      toc: false,
      apparatus: {},
    };
    registerRecipe(poem);
    expect(getRecipe("poem")).toBe(poem);
    expect(() => registerRecipe(poem)).toThrow();
  });

  it("slugifies heading text", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
  });
});

describe("<Galley template>", () => {
  it("applies the reference recipe: class, ToC, and heading anchors", () => {
    const html = render("# Alpha\n\n## Beta\n\nBody.", { template: "reference" });
    expect(html).toContain("galley-reference");
    expect(html).toContain('class="galley-toc"');
    expect(html).toContain('href="#alpha"');
    expect(html).toContain('href="#beta"');
    expect(html).toContain('id="alpha"');
    expect(html).toContain('id="beta"');
  });

  it("resolves the recipe from frontmatter type and renders a note standfirst", () => {
    const html = render("---\ntype: note\ngist: The single point.\n---\n\n# Title\n\nBody.");
    expect(html).toContain("galley-note");
    expect(html).toContain('class="galley-standfirst"');
    expect(html).toContain("The single point.");
  });

  it("renders an article author line from frontmatter", () => {
    const html = render("---\ntype: article\nbyline: Ada Lovelace\n---\n\n# T\n\nBody.");
    expect(html).toContain("galley-article");
    expect(html).toContain('class="galley-authorline"');
    expect(html).toContain("Ada Lovelace");
  });

  it("shows the quiet fallback chip for an unknown frontmatter type", () => {
    const html = render("---\ntype: zzz-unknown\n---\n\n# T\n\nBody.");
    expect(html).toContain("galley-article");
    expect(html).toContain('class="galley-typechip"');
    expect(html).toContain("zzz-unknown");
  });

  it("marks numbered headings for a recipe that asks for them", () => {
    const html = render("# T\n\n## One\n\n## Two", { template: "poem" });
    expect(html).toContain("galley-poem");
    expect(html).toContain('data-numbered="true"');
  });
});
