import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderMDX } from "../mdx/index.js";
import { Galley } from "./Galley.js";

describe("embed views registry (G5)", () => {
  it("renders the fallback body plus a quiet chip when no view is registered", () => {
    const html = renderToStaticMarkup(
      <Galley doc={':::embed{view="ledger"}\nfallback text\n:::'} />,
    );
    expect(html).toContain("galley-embed");
    expect(html).toContain("galley-chip");
    expect(html).toContain("ledger (unavailable)");
    expect(html).toContain("fallback text");
  });

  it("renders a registered view live with its parsed props", () => {
    const Ledger = (props: Record<string, string>) => (
      <div className="live-ledger" data-query={props.query}>
        {`LEDGER: ${props.query}`}
      </div>
    );
    const html = renderToStaticMarkup(
      <Galley doc={'::embed{view="ledger" query="kind:task"}'} views={{ ledger: Ledger }} />,
    );
    expect(html).toContain("live-ledger");
    expect(html).toContain("kind:task");
    expect(html).not.toContain("unavailable");
  });

  it("still falls back to a chip for a view name the registry lacks", () => {
    const Ledger = () => <div>x</div>;
    const html = renderToStaticMarkup(
      <Galley doc={'::embed{view="unknown-one"}'} views={{ ledger: Ledger }} />,
    );
    expect(html).toContain("unknown-one (unavailable)");
  });
});

describe("galley/mdx -- trusted door (G5)", () => {
  it("renders trusted MDX with a custom component", async () => {
    const el = await renderMDX("# Title\n\n<Callout>hi there</Callout>", {
      Callout: (p: { children?: ReactNode }) => <aside className="mdx-callout">{p.children}</aside>,
    });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain('class="mdx-callout"');
    expect(html).toContain("hi there");
  });
});
