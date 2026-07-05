"use client";

/**
 * Footnote popover island. Opt-in: mount once inside a Galley subtree and
 * hovering a footnote reference previews its definition inline, so a reader does
 * not lose their place jumping to the notes section. Footnotes still render
 * their standard section for no-JS and print.
 */

import { type ReactElement, useEffect, useState } from "react";

interface Preview {
  html: string;
  x: number;
  y: number;
}

export function FootnotePopover(): ReactElement | null {
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const ref = target?.closest?.("[data-footnote-ref], sup > a") as HTMLAnchorElement | null;
      if (!ref) return;
      const id = decodeURIComponent((ref.getAttribute("href") ?? "").replace(/^#/, ""));
      const def = id ? document.getElementById(id) : null;
      const body = def?.querySelector("p");
      if (!body) return;
      const rect = ref.getBoundingClientRect();
      setPreview({ html: body.innerHTML, x: rect.left, y: rect.bottom });
    }
    function onOut() {
      setPreview(null);
    }
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  if (!preview) return null;
  return (
    <div
      className="galley-footnote-popover"
      role="tooltip"
      // Safe: innerHTML is copied from an already-rendered footnote definition
      // node in this same document, not from untrusted input.
      dangerouslySetInnerHTML={{ __html: preview.html }}
      style={{
        position: "fixed",
        left: preview.x,
        top: preview.y,
        maxWidth: "32ch",
        background: "var(--gy-top)",
        color: "var(--gy-ink)",
        border: "var(--gy-border-width) solid var(--gy-hairline)",
        borderRadius: "var(--gy-radius)",
        padding: "var(--gy-space-1) var(--gy-space-2)",
        font: "var(--gy-text-small) var(--gy-font-ui)",
        zIndex: 40,
      }}
    />
  );
}
