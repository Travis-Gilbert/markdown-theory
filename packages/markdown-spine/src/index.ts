/**
 * markdown-spine -- the remark parse pipeline behind galley.
 *
 * One mdast, one directive vocabulary. Published MIT alongside galley; galley
 * consumes its output and never re-implements parsing.
 */

export {
  CALLOUT_KINDS,
  type CalloutKind,
  DIRECTIVE_NAMES,
  type DirectiveName,
  normalizeCalloutKind,
  type SpineAnnotation,
  type SpineType,
} from "./directives.js";

export { getSpine, remarkSpine } from "./spine-plugin.js";

export { extractFrontmatter } from "./frontmatter.js";

export { type BlockRef, blockIds, gatherText } from "./blocks.js";

export {
  createProcessor,
  parseDocument,
  parseMarkdown,
  type SpineDocument,
} from "./parse.js";
