import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parchment } from "../tokens/index.js";
import { Galley } from "./Galley.js";

const render = (md: string, props: Record<string, unknown> = {}): string =>
  renderToStaticMarkup(<Galley doc={md} {...props} />);

describe("<Galley> core rendering", () => {
  it("wraps output in .galley and renders headings + prose", () => {
    const html = render("# Title\n\nA paragraph with **bold** and a [link](https://x.y).");
    expect(html).toContain('class="galley"');
    expect(html).toMatch(/<h1[^>]*>Title<\/h1>/);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://x.y"');
  });

  it("renders GFM tables and task lists", () => {
    const html = render("| A | B |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n- [ ] todo");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("checked");
  });
});

describe("spine components", () => {
  it("renders :::note and > [!NOTE] as the same callout markup", () => {
    const a = render(":::note\nHeads up.\n:::");
    const b = render("> [!NOTE]\n> Heads up.");
    for (const html of [a, b]) {
      expect(html).toContain('class="galley-callout"');
      expect(html).toContain('data-kind="note"');
      expect(html).toContain('class="galley-callout-label"');
      expect(html).toContain("Heads up.");
    }
  });

  it("renders an abstract with its small-caps label", () => {
    const html = render(":::abstract\nThe gist.\n:::");
    expect(html).toContain('class="galley-abstract"');
    expect(html).toContain(">Abstract<");
  });

  it("renders a figure with image and caption", () => {
    const html = render('::figure{src="chart.png" width="80%" caption="Fig 1"}');
    expect(html).toContain('class="galley-figure"');
    expect(html).toContain('src="chart.png"');
    expect(html).toContain("Fig 1");
    // A numeric width becomes an inline-size on the image.
    expect(html).toContain("inline-size:80%");
  });

  it("marks a bleed figure with data-width (a mode, not an image size)", () => {
    const html = render('::figure{src="hero.png" width="bleed" caption="Hero"}');
    expect(html).toContain('data-width="bleed"');
    expect(html).toContain('src="hero.png"');
    expect(html).not.toContain("inline-size:bleed");
  });

  it("renders a then/now compare with two labeled panels", () => {
    const html = render('::compare{before="a.png" after="b.png" caption="T/N"}');
    expect(html).toContain('class="galley-figure galley-compare"');
    expect(html).toContain('class="galley-compare-grid"');
    expect(html).toContain('src="a.png"');
    expect(html).toContain('src="b.png"');
    expect(html).toContain(">Then<");
    expect(html).toContain(">Now<");
    expect(html).toContain("T/N");
  });

  it("honors custom compare labels and the bleed width", () => {
    const html = render(
      '::compare{before="a.png" after="b.png" beforelabel="1920" afterlabel="Today" width="bleed"}',
    );
    expect(html).toContain(">1920<");
    expect(html).toContain(">Today<");
    expect(html).toContain('data-width="bleed"');
  });

  it("renders an unknown embed as fallback body plus a quiet chip", () => {
    const html = render(':::embed{view="ledger"}\nSee the ledger.\n:::');
    expect(html).toContain('class="galley-embed"');
    expect(html).toContain('class="galley-chip"');
    expect(html).toContain("ledger (unavailable)");
    expect(html).toContain("See the ledger.");
  });
});

describe("code and math", () => {
  it("renders a code block with the copy island (fallback, no highlighter)", () => {
    const html = render("```ts\nconst x = 1;\n```");
    expect(html).toContain('class="galley-code"');
    expect(html).toContain('class="galley-copy"');
    expect(html).toContain("const x = 1;");
    expect(html).toContain('class="language-ts"');
  });

  it("renders math via KaTeX", () => {
    const html = render("Euler: $e^{i\\pi}+1=0$");
    expect(html).toContain("katex");
    expect(html).toContain('class="galley-math"');
  });
});

describe("tokens, overrides, and safety", () => {
  it("applies a register as scoped --gy-* custom properties", () => {
    const html = render("# Hi", { register: parchment() });
    expect(html).toContain("--gy-surface:oklch");
    expect(html).toContain("--gy-measure:68ch");
  });

  it("honors a component override keyed by tag name", () => {
    const Custom = (props: { children?: unknown }) => (
      <h1 className="custom-h1">{props.children as never}</h1>
    );
    const html = renderToStaticMarkup(
      <Galley doc="# Heading" components={{ h1: Custom as never }} />,
    );
    expect(html).toContain('class="custom-h1"');
  });

  it("drops raw HTML in the source (no dangerous passthrough)", () => {
    const html = render("Hello <script>alert(1)</script> world.");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Hello");
    expect(html).toContain("world.");
  });
});
