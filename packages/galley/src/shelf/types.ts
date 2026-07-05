/**
 * The shelf data contract.
 *
 * A shelf renders a collection as a publication. It reads through a small
 * adapter interface so the same views work over a directory of markdown, a
 * parsed OKF bundle, or a tenant's memory. Adapters are synchronous so the
 * shelf stays server-safe; async sources resolve their data first and hand the
 * shelf an array (see `arrayAdapter`).
 */

export interface ShelfItem {
  id: string;
  title: string;
  /** The deck / standfirst line shown on the card. */
  gist?: string;
  /** The document type (drives card shape via the recipe class). */
  kind?: string;
  tags: string[];
  /** ISO date string, if known. Drives stream order and archive grouping. */
  date?: string;
  /** The markdown body (rendered by `<Galley>` on open). */
  body: string;
  /** Optional link target for the card. */
  href?: string;
}

export type ShelfEdgeType = "supersedes" | "relates" | (string & {});

export interface ShelfEdge {
  from: string;
  to: string;
  type: ShelfEdgeType;
}

export interface ShelfScope {
  tag?: string;
  kind?: string;
  project?: string;
}

export interface ShelfAdapter {
  list(scope?: ShelfScope): ShelfItem[];
  get(id: string): ShelfItem | undefined;
  edges?(id: string): ShelfEdge[];
}
