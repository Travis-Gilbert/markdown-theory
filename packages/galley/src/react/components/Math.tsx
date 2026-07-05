/**
 * Math rendering via KaTeX. Server-safe: `katex.renderToString` is synchronous.
 * The host imports KaTeX's CSS once (gated behind first use per the spec's
 * bundle-weight note).
 */

import katex from "katex";
import type { ReactElement } from "react";

interface HastNode {
  properties?: Record<string, unknown>;
  children?: Array<{ value?: string }>;
}

export function Math({ node }: { node?: HastNode }): ReactElement {
  const tex = (node?.children ?? []).map((c) => c.value ?? "").join("");
  const display = Boolean(node?.properties?.display);
  // Safe: KaTeX escapes its TeX input and emits its own markup; with
  // throwOnError:false a bad expression renders as styled error text, not HTML.
  const html = katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    output: "htmlAndMathml",
  });
  const Tag = display ? "div" : "span";
  return <Tag className="galley-math" dangerouslySetInnerHTML={{ __html: html }} />;
}
