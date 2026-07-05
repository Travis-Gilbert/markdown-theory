/**
 * Frontmatter extraction.
 *
 * remark-frontmatter leaves a `yaml` node at the top of the tree; we parse it
 * to a plain object and expose it on the document model. The spine never writes
 * frontmatter back into the text -- reading only.
 */

import yaml from "js-yaml";
import type { Root, RootContent, Yaml } from "mdast";

export function extractFrontmatter(tree: Root): Record<string, unknown> {
  const node = tree.children.find((c: RootContent): c is Yaml => c.type === "yaml");
  if (!node) return {};
  try {
    // CORE_SCHEMA (safe: no custom type construction, no code execution) also
    // avoids the YAML 1.1 timestamp type, so `date: 2026-06-15` stays the string
    // it is in the source rather than becoming a JS Date -- the predictable
    // behavior for document frontmatter.
    const parsed = yaml.load(node.value, { schema: yaml.CORE_SCHEMA });
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    // Malformed frontmatter is a document problem, not a parser crash.
    return {};
  }
}
