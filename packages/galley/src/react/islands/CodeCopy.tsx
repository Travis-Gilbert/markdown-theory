"use client";

/**
 * Copy-to-clipboard button for code blocks. The one island wired into the
 * default render; it hydrates over server-rendered markup.
 */

import { useState } from "react";

export function CodeCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="galley-copy"
      aria-label={copied ? "Copied" : "Copy code"}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
