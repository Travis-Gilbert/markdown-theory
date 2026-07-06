/**
 * `<Galley doc register components? template? highlighter? />` -- the render surface.
 *
 * A pure projection of spine mdast plus tokens: parse (if given a string) ->
 * spine-aware hast -> React, with a register applied as scoped `--gy-*` custom
 * properties and a type recipe applied as a root modifier class plus apparatus
 * (standfirst, author line, table of contents). Server-safe; the only
 * interactivity is the code-copy island. Every node type is overridable.
 */

import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import type { Root as MdRoot } from "mdast";
import { extractFrontmatter, parseMarkdown } from "@travis-gilbert/markdown-spine";
import type { CSSProperties, ReactElement } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { type Recipe, resolveRecipe } from "../templates/recipes.js";
import { emitRegisterVars } from "../tokens/emit.js";
import type { Register } from "../tokens/types.js";
import { CodeBlock } from "./components/CodeBlock.js";
import { Embed } from "./components/Embed.js";
import { Math } from "./components/Math.js";
import { GalleyContext, type GalleyHighlighter, type ViewRegistry } from "./context.js";
import { toGalleyHast } from "./hast.js";
import { Toc, tocFromHast } from "./Toc.js";

export interface GalleyProps {
  /** A markdown string or an already-parsed spine mdast tree. */
  doc: string | MdRoot;
  /** The register whose tokens scope this instance. Omit to inherit page tokens. */
  register?: Register;
  /** A recipe or a type id; when omitted, resolved from frontmatter `type`. */
  template?: string | Recipe;
  /** Component overrides, keyed by tag name (standard or `gy-*`). */
  components?: Components;
  /** A Shiki highlighter (from `createGalleyHighlighter`) for highlighted code. */
  highlighter?: GalleyHighlighter;
  /** Host view registry: resolves `::embed`/`:::view` names to live components. */
  views?: ViewRegistry;
  /** Extra class on the `.galley` root. */
  className?: string;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
function authorOf(fm: Record<string, unknown>): string | undefined {
  return (
    str(fm.byline) ??
    str(fm.author) ??
    (Array.isArray(fm.authors) ? fm.authors.filter((a) => typeof a === "string").join(", ") : undefined)
  );
}

export function Galley({
  doc,
  register,
  template,
  components,
  highlighter,
  views,
  className,
}: GalleyProps): ReactElement {
  const tree = typeof doc === "string" ? parseMarkdown(doc) : doc;
  const frontmatter = extractFrontmatter(tree);
  const hast = toGalleyHast(tree);

  // A recipe applies only when a type is declared (via prop or frontmatter);
  // an untyped document renders as a plain `.galley` page.
  const requestedType = template ?? str(frontmatter.type);
  const hasType = requestedType !== undefined;
  const { recipe, unknown, requested } = resolveRecipe(requestedType);

  const merged: Components = {
    pre: CodeBlock as never,
    "gy-math": Math as never,
    "gy-embed": Embed as never,
    ...components,
  };
  const rendered = toJsxRuntime(hast, {
    Fragment,
    jsx: jsx as never,
    jsxs: jsxs as never,
    components: merged,
    passNode: true,
  });

  const style = register
    ? (emitRegisterVars(register) as unknown as CSSProperties)
    : undefined;
  const cls = ["galley", hasType ? recipe.className : "", className]
    .filter(Boolean)
    .join(" ");

  const gist =
    hasType && recipe.apparatus.standfirst
      ? (str(frontmatter.gist) ?? str(frontmatter.description) ?? str(frontmatter.standfirst))
      : undefined;
  const author = hasType && recipe.apparatus.authorLine ? authorOf(frontmatter) : undefined;
  const numbered = hasType && recipe.numberedHeadings ? "true" : undefined;
  const showToc = hasType && recipe.toc;

  return (
    <GalleyContext.Provider value={{ highlighter, themeName: "galley", views }}>
      <div className={cls} style={style} data-numbered={numbered}>
        {unknown ? <div className="galley-typechip">{`type: ${requested} → article`}</div> : null}
        {gist ? <p className="galley-standfirst">{gist}</p> : null}
        {author ? <p className="galley-authorline">{author}</p> : null}
        {showToc ? <Toc entries={tocFromHast(hast)} /> : null}
        {rendered}
      </div>
    </GalleyContext.Provider>
  );
}
