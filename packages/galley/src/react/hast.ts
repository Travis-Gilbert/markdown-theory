/**
 * mdast -> hast, with handlers that turn spine annotations into final semantic
 * markup. Callouts, abstracts, figures, and embeds become plain elements with
 * galley class names (styled by galley/css); only math and code need a React
 * component, and those are routed by tag name in Galley.tsx.
 */

import type { Element, ElementContent, Properties, Root as HastRoot } from "hast";
import type { Root as MdRoot } from "mdast";
import { defaultHandlers, type State, toHast } from "mdast-util-to-hast";
import type { SpineAnnotation } from "@travisgilbert/markdown-spine";
import { visit } from "unist-util-visit";
import { slugify } from "../templates/recipes.js";

/** A remark-directive node, typed locally so galley need not depend on the util. */
interface DirectiveNode {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string | null | undefined> | null;
  children?: unknown[];
  data?: { spine?: SpineAnnotation };
}

function h(tagName: string, properties: Properties, children: ElementContent[]): Element {
  return { type: "element", tagName, properties, children };
}
function text(value: string): ElementContent {
  return { type: "text", value };
}
function capitalize(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s;
}

function spineOf(node: { data?: { spine?: SpineAnnotation } }): SpineAnnotation | undefined {
  return node.data?.spine;
}

function calloutHast(spine: SpineAnnotation, body: ElementContent[]): Element {
  const label = spine.attributes?.title ?? capitalize(spine.kind ?? "note");
  return h("aside", { className: ["galley-callout"], dataKind: spine.kind }, [
    h("div", { className: ["galley-callout-label"] }, [text(label)]),
    ...body,
  ]);
}

function abstractHast(body: ElementContent[]): Element {
  return h("div", { className: ["galley-abstract"] }, [
    h("span", { className: ["galley-abstract-label"] }, [text("Abstract")]),
    ...body,
  ]);
}

function figureHast(attrs: Record<string, string>): Element {
  const children: ElementContent[] = [
    h(
      "img",
      {
        src: attrs.src ?? "",
        alt: attrs.caption ?? attrs.alt ?? "",
        style: attrs.width ? `inline-size:${attrs.width}` : undefined,
      },
      [],
    ),
  ];
  if (attrs.caption) {
    children.push(h("figcaption", { className: ["galley-figcaption"] }, [text(attrs.caption)]));
  }
  return h("figure", { className: ["galley-figure"], dataAlign: attrs.align ?? "center" }, children);
}

function embedHast(spine: SpineAnnotation, inline: boolean, body: ElementContent[]): Element {
  const attrs = spine.attributes ?? {};
  const view = attrs.view ?? attrs.name ?? "view";
  // Route through the Embed component: it renders the registered view live when
  // a host registry supplies one, else the fallback body plus a quiet chip.
  return h(
    "gy-embed",
    { dataView: view, dataProps: JSON.stringify(attrs), dataInline: inline ? "true" : undefined },
    body,
  );
}

function directiveHandler(state: State, node: DirectiveNode): Element {
  const spine = spineOf(node);
  const inline = node.type === "textDirective";
  const body = state.all(node as never) as ElementContent[];
  if (!spine) {
    return h(inline ? "span" : "div", {}, body);
  }
  switch (spine.type) {
    case "callout":
      return calloutHast(spine, body);
    case "abstract":
      return abstractHast(body);
    case "figure":
      return figureHast(spine.attributes ?? {});
    case "embed":
    case "view":
      return embedHast(spine, inline, body);
    case "margin":
      return h("aside", { className: ["galley-margin"] }, body);
    case "stamp":
      return h("div", { className: ["galley-stamp"] }, [text("stamp")]);
    default:
      return h(inline ? "span" : "div", {}, body);
  }
}

/** Convert a spine mdast tree to hast, routing spine annotations to markup. */
export function toGalleyHast(tree: MdRoot): HastRoot {
  const handlers = {
    containerDirective: directiveHandler,
    leafDirective: directiveHandler,
    textDirective: directiveHandler,
    blockquote(state: State, node: { data?: { spine?: SpineAnnotation } }) {
      const spine = spineOf(node);
      if (spine?.type === "callout") return calloutHast(spine, state.all(node as never) as ElementContent[]);
      if (spine?.type === "abstract") return abstractHast(state.all(node as never) as ElementContent[]);
      return defaultHandlers.blockquote(state, node as never);
    },
    inlineMath(_state: State, node: { value: string }) {
      return h("gy-math", { display: false }, [text(node.value)]);
    },
    math(_state: State, node: { value: string }) {
      return h("gy-math", { display: true }, [text(node.value)]);
    },
  };
  const root = toHast(tree, { allowDangerousHtml: false, handlers: handlers as never }) as HastRoot;
  slugHeadings(root);
  return root;
}

function hastText(node: { type?: string; value?: string; children?: unknown[] }): string {
  if (node.type === "text") return node.value ?? "";
  const kids = node.children;
  if (Array.isArray(kids)) {
    return kids.map((c) => hastText(c as { type?: string; value?: string })).join("");
  }
  return "";
}

/** Give every heading a stable slug id (for anchors and the table of contents). */
function slugHeadings(root: HastRoot): void {
  const seen = new Map<string, number>();
  visit(root, "element", (el: Element) => {
    if (!/^h[1-6]$/.test(el.tagName)) return;
    const props: Properties = (el.properties ??= {});
    if (props.id) return;
    const base = slugify(hastText(el)) || "section";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    props.id = n === 0 ? base : `${base}-${n}`;
  });
}
