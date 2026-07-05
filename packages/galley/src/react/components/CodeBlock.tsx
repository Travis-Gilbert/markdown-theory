/**
 * The default `pre` renderer: a code block with the copy island, highlighted by
 * Shiki when a highlighter is in context, otherwise a clean token-styled
 * fallback. Server-safe (the copy button is the only client island).
 */

import type { ReactElement } from "react";
import { useGalley } from "../context.js";
import { CodeCopy } from "../islands/CodeCopy.js";

interface HastNode {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

function langOf(codeEl: HastNode | undefined): string | undefined {
  const cn = codeEl?.properties?.className;
  const list = Array.isArray(cn) ? cn.map(String) : typeof cn === "string" ? cn.split(" ") : [];
  const match = list.find((c) => c.startsWith("language-"));
  return match ? match.slice("language-".length) : undefined;
}

export function CodeBlock({ node }: { node?: HastNode }): ReactElement {
  const { highlighter, themeName } = useGalley();
  const codeEl = (node?.children ?? []).find((c) => c.tagName === "code");
  const code = codeEl ? hastText(codeEl) : node ? hastText(node) : "";
  const lang = langOf(codeEl);

  let inner: ReactElement;
  if (highlighter && lang && highlighter.getLoadedLanguages().includes(lang)) {
    // Safe: Shiki HTML-escapes the source before wrapping it in spans; it emits
    // markup FROM code, never passes raw HTML through. No sanitizer needed.
    const html = highlighter.codeToHtml(code, { lang, theme: themeName });
    inner = <div dangerouslySetInnerHTML={{ __html: html }} />;
  } else {
    inner = (
      <pre>
        <code className={lang ? `language-${lang}` : undefined}>{code}</code>
      </pre>
    );
  }

  return (
    <div className="galley-code">
      {inner}
      <CodeCopy text={code} />
    </div>
  );
}
