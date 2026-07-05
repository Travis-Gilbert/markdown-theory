/**
 * The one pipeline every galley render shares.
 *
 * remark-parse + gfm + frontmatter + math + directive, then remarkSpine to
 * normalize the vocabulary. `parseDocument` also returns parsed frontmatter and
 * the block-id map, so a caller gets the whole spine model in one call.
 */

import type { Root } from "mdast";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { type BlockRef, blockIds } from "./blocks.js";
import { extractFrontmatter } from "./frontmatter.js";
import { remarkSpine } from "./spine-plugin.js";

/** Build a configured processor. Reuse `defaultProcessor` unless you need to extend it. */
export function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDirective)
    .use(remarkSpine);
}

export type SpineProcessor = ReturnType<typeof createProcessor>;

const defaultProcessor = createProcessor();

/** Parse markdown to a normalized mdast tree. */
export function parseMarkdown(markdown: string, processor: SpineProcessor = defaultProcessor): Root {
  const tree = processor.parse(markdown);
  return processor.runSync(tree) as Root;
}

export interface SpineDocument {
  frontmatter: Record<string, unknown>;
  tree: Root;
  blocks: BlockRef[];
}

/** Parse markdown into the full spine model: frontmatter, tree, and block ids. */
export function parseDocument(
  markdown: string,
  processor: SpineProcessor = defaultProcessor,
): SpineDocument {
  const tree = parseMarkdown(markdown, processor);
  return {
    frontmatter: extractFrontmatter(tree),
    tree,
    blocks: blockIds(tree),
  };
}
