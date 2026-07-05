/**
 * `::embed` / `:::view` renderer. Resolves the view name against the host
 * registry from context: a match renders live with the parsed props; no match
 * renders the fallback body plus a quiet chip naming the unavailable view (the
 * D6 rule). Standalone consumers pass no registry and always get the fallback.
 */

import type { ReactElement, ReactNode } from "react";
import { useGalley, type ViewProps } from "../context.js";

interface HastNode {
  properties?: Record<string, unknown>;
}

export function Embed({
  node,
  children,
}: {
  node?: HastNode;
  children?: ReactNode;
}): ReactElement {
  const { views } = useGalley();
  const view = String(node?.properties?.dataView ?? "view");
  const inline = node?.properties?.dataInline === "true";

  let props: ViewProps = {};
  try {
    const raw = node?.properties?.dataProps;
    if (typeof raw === "string") props = JSON.parse(raw) as ViewProps;
  } catch {
    props = {};
  }

  const View = views?.[view];
  if (View) return <View {...props} />;

  const Tag = inline ? "span" : "div";
  return (
    <Tag className="galley-embed">
      <span className="galley-chip">{`${view} (unavailable)`}</span>
      {children}
    </Tag>
  );
}
