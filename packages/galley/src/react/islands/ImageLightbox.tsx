"use client";

/**
 * Image lightbox island. Opt-in: mount `<ImageLightbox>` once inside a Galley
 * subtree and clicking any `.galley img` opens it zoomed. Kept out of the
 * default render so images stay server-safe plain `<img>` unless a host wants
 * this.
 */

import { type ReactElement, useEffect, useState } from "react";

export function ImageLightbox(): ReactElement | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const img = target?.closest?.(".galley img") as HTMLImageElement | null;
      if (img) setSrc(img.currentSrc || img.src);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!src) return null;
  return (
    <div
      className="galley-lightbox"
      role="dialog"
      aria-modal="true"
      onClick={() => setSrc(null)}
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "color-mix(in oklab, black 72%, transparent)",
        cursor: "zoom-out",
        zIndex: 50,
      }}
    >
      {/* alt intentionally empty: decorative zoom of an already-captioned image */}
      <img src={src} alt="" style={{ maxWidth: "92vw", maxHeight: "92vh" }} />
    </div>
  );
}
