/**
 * Shelf adapters. `arrayAdapter` is the base every source resolves to; `okf`
 * and `theorem` map their records onto it. The Node-only `fsAdapter` lives in
 * its own module so browser consumers never pull `node:fs`.
 */

import type { Nodes, Root } from "mdast";
import { extractFrontmatter, parseMarkdown } from "markdown-spine";
import type { ShelfAdapter, ShelfEdge, ShelfItem, ShelfScope } from "./types.js";

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function firstHeadingText(tree: Root): string | undefined {
  const heading = tree.children.find((c) => c.type === "heading");
  if (!heading) return undefined;
  const gather = (n: Nodes): string =>
    "value" in n && typeof n.value === "string"
      ? n.value
      : "children" in n && Array.isArray(n.children)
        ? n.children.map((c) => gather(c as Nodes)).join("")
        : "";
  return gather(heading as Nodes).trim() || undefined;
}

function applyScope(items: ShelfItem[], scope?: ShelfScope): ShelfItem[] {
  if (!scope) return items;
  return items.filter(
    (i) =>
      (!scope.tag || i.tags.includes(scope.tag)) &&
      (!scope.kind || i.kind === scope.kind) &&
      (!scope.project || i.tags.includes(scope.project)),
  );
}

/** Derive a shelf item from a markdown string; frontmatter wins over inference. */
export function itemFromMarkdown(fallbackId: string, md: string): ShelfItem {
  const tree = parseMarkdown(md);
  const fm = extractFrontmatter(tree);
  return {
    id: str(fm.id) ?? fallbackId,
    title: str(fm.title) ?? firstHeadingText(tree) ?? fallbackId,
    gist: str(fm.gist) ?? str(fm.description) ?? str(fm.deck),
    kind: str(fm.type) ?? str(fm.kind),
    tags: strArray(fm.tags),
    date: str(fm.date) ?? str(fm.updated) ?? str(fm.created) ?? str(fm.timestamp),
    body: md,
  };
}

/** The base adapter over an in-memory item list. */
export function arrayAdapter(items: ShelfItem[], edges: ShelfEdge[] = []): ShelfAdapter {
  const byId = new Map(items.map((i) => [i.id, i]));
  return {
    list: (scope) => applyScope(items, scope),
    get: (id) => byId.get(id),
    edges: (id) => edges.filter((e) => e.from === id || e.to === id),
  };
}

// ---- OKF bundle ------------------------------------------------------------

export interface OkfConcept {
  id?: string;
  type?: string;
  title?: string;
  description?: string;
  tags?: string[];
  timestamp?: string;
  body?: string;
  links?: string[];
}
export interface OkfBundle {
  concepts: OkfConcept[];
}

/** Map a parsed OKF bundle (the F4 data layer) onto a shelf adapter. */
export function okfAdapter(bundle: OkfBundle): ShelfAdapter {
  const items: ShelfItem[] = bundle.concepts.map((c, i) => ({
    id: c.id ?? `concept-${i}`,
    title: c.title ?? c.id ?? "Untitled",
    gist: c.description,
    kind: c.type?.toLowerCase(),
    tags: c.tags ?? [],
    date: c.timestamp,
    body: c.body ?? "",
  }));
  const edges: ShelfEdge[] = bundle.concepts.flatMap((c) =>
    (c.links ?? []).map((to) => ({ from: c.id ?? "", to, type: "relates" as const })),
  );
  return arrayAdapter(items, edges);
}

// ---- Theorem tenant memory -------------------------------------------------
// Standalone galley cannot reach a Theorem tenant; the host loads memory docs
// through the console read path and hands them here (already resolved).

export interface TheoremMemoryDoc {
  id: string;
  kind?: string;
  title?: string;
  gist?: string;
  tags?: string[];
  updated_at?: string;
  body?: string;
}

export function theoremAdapter(
  docs: TheoremMemoryDoc[],
  edges: ShelfEdge[] = [],
): ShelfAdapter {
  const items: ShelfItem[] = docs.map((d) => ({
    id: d.id,
    title: d.title ?? d.id,
    gist: d.gist,
    kind: d.kind,
    tags: d.tags ?? [],
    date: d.updated_at,
    body: d.body ?? "",
  }));
  return arrayAdapter(items, edges);
}
