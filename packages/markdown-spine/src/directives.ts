/**
 * The directive vocabulary of record (COMPOSE-SURFACE D3 / GALLEY).
 *
 * The spine does not invent new node types. It uses standard remark-directive
 * and remark GFM nodes, then *annotates* them with `node.data.spine` so a plain
 * remark parse of the same document still succeeds byte-for-byte. Galley reads
 * the annotation; a stranger's tool ignores it.
 */

/** Callout kinds rendered by the same component regardless of source syntax. */
export const CALLOUT_KINDS = ["note", "tip", "warning", "danger", "quote"] as const;
export type CalloutKind = (typeof CALLOUT_KINDS)[number];

/** The directive names the spine recognizes. */
export const DIRECTIVE_NAMES = [
  "abstract",
  ...CALLOUT_KINDS,
  "figure",
  "margin",
  "embed",
  "view",
  "stamp",
] as const;
export type DirectiveName = (typeof DIRECTIVE_NAMES)[number];

/** The normalized spine type attached to a node. */
export type SpineType = "callout" | "abstract" | "figure" | "margin" | "embed" | "view" | "stamp";

export interface SpineAnnotation {
  type: SpineType;
  /** Present when `type === "callout"`. */
  kind?: CalloutKind;
  /** Directive attributes (`{key=value}`) or extracted figure/embed props. */
  attributes?: Record<string, string>;
  /** For embed/view: whether a fallback body was provided. */
  hasFallback?: boolean;
}

declare module "mdast" {
  interface BlockquoteData {
    spine?: SpineAnnotation;
  }
  interface ParagraphData {
    spine?: SpineAnnotation;
  }
}

/**
 * Map the many callout aliases (GitHub, Obsidian) onto our five kinds, or
 * "abstract" (its own block), or null when the label is not a known callout.
 */
export function normalizeCalloutKind(raw: string): CalloutKind | "abstract" | null {
  const k = raw.trim().toLowerCase();
  switch (k) {
    case "note":
    case "info":
      return "note";
    case "tip":
    case "hint":
    case "success":
    case "check":
      return "tip";
    case "important":
    case "warning":
    case "caution":
    case "attention":
      return "warning";
    case "danger":
    case "error":
    case "bug":
    case "failure":
      return "danger";
    case "quote":
    case "cite":
      return "quote";
    case "abstract":
    case "summary":
    case "tldr":
      return "abstract";
    default:
      return null;
  }
}
