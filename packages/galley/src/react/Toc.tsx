/**
 * Table of contents, built from the hast heading tree. Used by the reference
 * recipe (persistent ToC + anchor affordances).
 */

import type { Element, Root as HastRoot, RootContent } from "hast";
import type { ReactElement } from "react";

export interface TocEntry {
  depth: number;
  id: string;
  text: string;
}

function text(node: RootContent | Element): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map((c) => text(c as Element)).join("");
  return "";
}

/** Collect headings (h1..maxDepth) with their slug ids from a hast tree. */
export function tocFromHast(root: HastRoot, maxDepth = 3): TocEntry[] {
  const out: TocEntry[] = [];
  function walk(nodes: RootContent[]): void {
    for (const node of nodes) {
      if (node.type === "element") {
        const m = /^h([1-6])$/.exec(node.tagName);
        const id = node.properties?.id;
        if (m && typeof id === "string") {
          const depth = Number(m[1]);
          if (depth <= maxDepth) out.push({ depth, id, text: text(node).trim() });
        }
        walk(node.children as RootContent[]);
      }
    }
  }
  walk(root.children);
  return out;
}

export function Toc({ entries }: { entries: TocEntry[] }): ReactElement | null {
  if (entries.length === 0) return null;
  return (
    <nav className="galley-toc" aria-label="Contents">
      <ol>
        {entries.map((e) => (
          <li key={e.id} data-depth={e.depth}>
            <a href={`#${e.id}`}>{e.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
