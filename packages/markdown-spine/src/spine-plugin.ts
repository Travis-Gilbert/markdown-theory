/**
 * remarkSpine -- normalize the directive vocabulary and GitHub/Obsidian
 * callouts into `node.data.spine` annotations.
 *
 * It never changes a node's `type`; it annotates. That is what lets a document
 * written for galley parse identically in plain remark, and what lets a
 * `> [!NOTE]` blockquote and a `:::note` directive resolve to the same callout.
 */

import type { Blockquote, Nodes, Paragraph, Root, Text } from "mdast";
import type { ContainerDirective, LeafDirective, TextDirective } from "mdast-util-directive";
import { visit } from "unist-util-visit";
import {
  type CalloutKind,
  DIRECTIVE_NAMES,
  type DirectiveName,
  normalizeCalloutKind,
  type SpineAnnotation,
} from "./directives.js";

type AnyDirective = ContainerDirective | LeafDirective | TextDirective;

const DIRECTIVE_SET = new Set<string>(DIRECTIVE_NAMES);
const CALLOUT_SET = new Set<string>(["note", "tip", "warning", "danger", "quote"]);

function annotate(node: Nodes, spine: SpineAnnotation): void {
  const data = (node.data ?? (node.data = {})) as { spine?: SpineAnnotation };
  data.spine = spine;
}

/** Read the spine annotation off a node (typed helper for consumers/tests). */
export function getSpine(node: Nodes): SpineAnnotation | undefined {
  return (node.data as { spine?: SpineAnnotation } | undefined)?.spine;
}

function cleanAttributes(attrs: AnyDirective["attributes"]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!attrs) return out;
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

/** The `[label]` on a directive, flattened to text (used as a figure caption etc.). */
function directiveLabel(node: AnyDirective): string | undefined {
  const label = (node.children ?? [])
    .filter((c): c is Text => c.type === "text")
    .map((c) => c.value)
    .join("")
    .trim();
  return label.length > 0 ? label : undefined;
}

function annotateDirective(node: AnyDirective): void {
  const name = node.name as DirectiveName;
  if (!DIRECTIVE_SET.has(name)) return;
  const attributes = cleanAttributes(node.attributes);

  if (name === "abstract") {
    annotate(node, { type: "abstract", attributes });
    return;
  }
  if (CALLOUT_SET.has(name)) {
    annotate(node, { type: "callout", kind: name as CalloutKind, attributes });
    return;
  }
  if (name === "figure") {
    const caption = attributes.caption ?? directiveLabel(node);
    annotate(node, { type: "figure", attributes: caption ? { ...attributes, caption } : attributes });
    return;
  }
  if (name === "margin") {
    annotate(node, { type: "margin", attributes });
    return;
  }
  if (name === "embed" || name === "view") {
    annotate(node, {
      type: name,
      attributes,
      hasFallback: node.type === "containerDirective" && (node.children?.length ?? 0) > 0,
    });
    return;
  }
  if (name === "stamp") {
    annotate(node, { type: "stamp", attributes });
  }
}

const CALLOUT_MARKER = /^\[!(\w+)\]\s?/;

/** GitHub/Obsidian `> [!KIND]` blockquotes -> the same callout annotation. */
function annotateBlockquoteCallout(node: Blockquote): void {
  const first = node.children[0];
  if (!first || first.type !== "paragraph") return;
  const firstText = (first as Paragraph).children[0];
  if (!firstText || firstText.type !== "text") return;

  const match = firstText.value.match(CALLOUT_MARKER);
  if (!match || !match[1]) return;
  const kind = normalizeCalloutKind(match[1]);
  if (kind === null) return;

  // Strip the marker from the leading text; a bare marker line collapses away.
  const stripped = firstText.value.slice(match[0].length).replace(/^\n/, "");
  firstText.value = stripped;
  if (stripped.length === 0 && (first as Paragraph).children.length === 1) {
    node.children.shift();
  }

  // Keep the annotation shape consistent with the directive path (attributes
  // always present) so a callout is the same object regardless of source syntax.
  if (kind === "abstract") annotate(node, { type: "abstract", attributes: {} });
  else annotate(node, { type: "callout", kind, attributes: {} });
}

export function remarkSpine() {
  return (tree: Root): void => {
    visit(tree, (node) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        annotateDirective(node as AnyDirective);
      } else if (node.type === "blockquote") {
        annotateBlockquoteCallout(node as Blockquote);
      }
    });
  };
}
