import type { Nodes, Root } from "mdast";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { blockIds } from "./blocks.js";
import { parseDocument, parseMarkdown } from "./parse.js";
import { getSpine } from "./spine-plugin.js";

function firstWithSpine(tree: Root): ReturnType<typeof getSpine> {
  let found: ReturnType<typeof getSpine>;
  visit(tree, (node: Nodes) => {
    const s = getSpine(node);
    if (s && !found) found = s;
  });
  return found;
}

function typeSkeleton(node: Nodes): unknown {
  if ("children" in node && Array.isArray(node.children)) {
    return [node.type, node.children.map((c) => typeSkeleton(c as Nodes))];
  }
  return node.type;
}

describe("callout normalization (one component, many syntaxes)", () => {
  it("annotates a :::note directive as a callout", () => {
    const tree = parseMarkdown(":::note\nHeads up.\n:::\n");
    const spine = firstWithSpine(tree);
    expect(spine).toEqual(expect.objectContaining({ type: "callout", kind: "note" }));
  });

  it("annotates a GitHub > [!NOTE] blockquote as the same callout", () => {
    const tree = parseMarkdown("> [!NOTE]\n> Heads up.\n");
    const spine = firstWithSpine(tree);
    expect(spine).toEqual(expect.objectContaining({ type: "callout", kind: "note" }));
  });

  it("directive and blockquote callouts resolve to the identical kind", () => {
    const a = firstWithSpine(parseMarkdown(":::warning\nx\n:::\n"));
    const b = firstWithSpine(parseMarkdown("> [!WARNING]\n> x\n"));
    expect(a).toEqual(b);
  });

  it("maps aliases: [!IMPORTANT] -> warning, [!info] -> note, [!abstract] -> abstract", () => {
    expect(firstWithSpine(parseMarkdown("> [!IMPORTANT]\n> x\n"))).toMatchObject({
      type: "callout",
      kind: "warning",
    });
    expect(firstWithSpine(parseMarkdown("> [!info]\n> x\n"))).toMatchObject({
      type: "callout",
      kind: "note",
    });
    expect(firstWithSpine(parseMarkdown("> [!abstract]\n> x\n"))).toMatchObject({
      type: "abstract",
    });
  });

  it("strips the [!KIND] marker from the callout body text", () => {
    const tree = parseMarkdown("> [!NOTE]\n> The body survives.\n");
    let text = "";
    visit(tree, "text", (n) => {
      text += n.value;
    });
    expect(text).toContain("The body survives.");
    expect(text).not.toContain("[!NOTE]");
  });
});

describe("directive vocabulary", () => {
  it("captures figure attributes and caption", () => {
    const tree = parseMarkdown(
      '::figure{src="chart.png" width="80%" align="center" caption="Fig 1"}\n',
    );
    const spine = firstWithSpine(tree);
    expect(spine?.type).toBe("figure");
    expect(spine?.attributes).toMatchObject({ src: "chart.png", width: "80%", caption: "Fig 1" });
  });

  it("captures embed view and props", () => {
    const tree = parseMarkdown('::embed{view="ledger" query="kind:task status:open"}\n');
    const spine = firstWithSpine(tree);
    expect(spine?.type).toBe("embed");
    expect(spine?.attributes).toMatchObject({ view: "ledger", query: "kind:task status:open" });
  });
});

describe("frontmatter", () => {
  it("parses YAML frontmatter into the document model", () => {
    const doc = parseDocument(
      ["---", "type: article", "title: Hello", "tags: [a, b]", "---", "", "Body."].join("\n"),
    );
    expect(doc.frontmatter).toMatchObject({ type: "article", title: "Hello", tags: ["a", "b"] });
  });

  it("returns an empty object when there is no frontmatter", () => {
    expect(parseDocument("Just body.").frontmatter).toEqual({});
  });
});

describe("block ids", () => {
  it("assigns a stable id per top-level block, skipping frontmatter", () => {
    const md = "---\ntype: note\n---\n\n# Title\n\nA paragraph.\n\nAnother.";
    const a = blockIds(parseMarkdown(md));
    const b = blockIds(parseMarkdown(md));
    expect(a).toEqual(b); // deterministic
    expect(a.map((r) => r.type)).toEqual(["heading", "paragraph", "paragraph"]);
  });

  it("salts by ordinal so identical text in different positions differs", () => {
    const refs = blockIds(parseMarkdown("Same.\n\nSame.\n"));
    expect(refs[0]?.id).not.toBe(refs[1]?.id);
  });
});

describe("plain-remark parity (annotation is additive)", () => {
  it("a directive document has the same node skeleton with and without the spine", () => {
    const md = ':::note\nHi.\n:::\n\n::figure{src="a.png"}\n\n::embed{view="x"}\n';
    const withSpine = parseMarkdown(md);
    const plain = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ["yaml"])
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkDirective)
      .runSync(
        unified().use(remarkParse).use(remarkFrontmatter, ["yaml"]).use(remarkDirective).parse(md),
      ) as Root;
    expect(typeSkeleton(withSpine)).toEqual(typeSkeleton(plain));
    // ...but the spine tree carries the annotation the plain tree lacks.
    expect(firstWithSpine(withSpine)).toBeDefined();
    expect(firstWithSpine(plain)).toBeUndefined();
  });

  it("parses GFM and math nodes", () => {
    const gfm = parseMarkdown("- [x] done\n- [ ] todo\n");
    let hasCheck = false;
    visit(gfm, "listItem", (n) => {
      if (typeof n.checked === "boolean") hasCheck = true;
    });
    expect(hasCheck).toBe(true);

    const math = parseMarkdown("Euler: $e^{i\\pi}+1=0$\n");
    let hasMath = false;
    visit(math, (n) => {
      if (n.type === "inlineMath") hasMath = true;
    });
    expect(hasMath).toBe(true);
  });
});
