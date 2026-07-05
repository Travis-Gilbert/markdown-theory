import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  arrayAdapter,
  okfAdapter,
  theoremAdapter,
} from "./adapters.js";
import { fsAdapter } from "./fsAdapter.js";
import { Shelf, successorOf } from "./Shelf.js";
import type { ShelfEdge, ShelfItem } from "./types.js";

const notesDir = fileURLToPath(new URL("../../fixtures/notes", import.meta.url));

describe("fsAdapter", () => {
  const shelf = fsAdapter(notesDir);

  it("reads a directory of markdown into items", () => {
    expect(shelf.list()).toHaveLength(3);
  });

  it("derives fields from frontmatter, and title from the first heading otherwise", () => {
    const proportion = shelf.get("2026-06-15-proportion");
    expect(proportion?.title).toBe("On computed proportion");
    expect(proportion?.kind).toBe("note");
    expect(proportion?.tags).toContain("typography");
    expect(proportion?.date).toBe("2026-06-15");

    const plain = shelf.get("plain-no-frontmatter");
    expect(plain?.title).toBe("A note without frontmatter");
    expect(plain?.date).toBeUndefined();
  });

  it("scopes by tag", () => {
    expect(fsAdapter(notesDir).list({ tag: "color" })).toHaveLength(1);
  });
});

describe("pure adapters", () => {
  const items: ShelfItem[] = [
    { id: "a", title: "A", tags: ["x"], body: "" },
    { id: "b", title: "B", tags: ["y"], body: "" },
  ];

  it("arrayAdapter lists, gets, and filters edges", () => {
    const edges: ShelfEdge[] = [{ from: "a", to: "b", type: "relates" }];
    const s = arrayAdapter(items, edges);
    expect(s.list()).toHaveLength(2);
    expect(s.get("b")?.title).toBe("B");
    expect(s.edges?.("a")).toHaveLength(1);
  });

  it("okfAdapter maps concepts and their links", () => {
    const s = okfAdapter({
      concepts: [
        { id: "bitcoin", type: "Concept", title: "Bitcoin", tags: ["crypto"], links: ["blockchain"] },
        { id: "blockchain", title: "Blockchain" },
      ],
    });
    expect(s.get("bitcoin")?.kind).toBe("concept");
    expect(s.edges?.("bitcoin")).toEqual([{ from: "bitcoin", to: "blockchain", type: "relates" }]);
  });

  it("theoremAdapter maps memory docs", () => {
    const s = theoremAdapter([
      { id: "m1", kind: "solution", title: "A fix", updated_at: "2026-07-01" },
    ]);
    expect(s.get("m1")).toMatchObject({ kind: "solution", date: "2026-07-01" });
  });
});

describe("<Shelf> views", () => {
  const shelf = fsAdapter(notesDir);

  it("stream renders cards in reverse-chronological order (undated last)", () => {
    const html = renderToStaticMarkup(<Shelf source={shelf} />);
    const i1 = html.indexOf("On computed proportion"); // 2026-06-15
    const i2 = html.indexOf("OKLCH is worth"); // 2026-05-20
    const i3 = html.indexOf("A note without frontmatter"); // undated
    expect(i1).toBeGreaterThanOrEqual(0);
    expect(i1).toBeLessThan(i2);
    expect(i2).toBeLessThan(i3);
  });

  it("archive groups by year", () => {
    const html = renderToStaticMarkup(<Shelf source={shelf} view="archive" />);
    expect(html).toContain('class="galley-shelf-heading"');
    expect(html).toContain(">2026<");
  });

  it("tag lens sections by tag", () => {
    const html = renderToStaticMarkup(<Shelf source={shelf} view="tag" />);
    expect(html).toContain(">#design<");
    expect(html).toContain(">#color<");
  });
});

describe("thread view (supersession lineage)", () => {
  const items: ShelfItem[] = [
    { id: "v2", title: "Design v2", tags: [], date: "2026-07-01", body: "" },
    { id: "v1", title: "Design v1", tags: [], date: "2026-06-01", body: "" },
    { id: "rel", title: "Related idea", tags: [], date: "2026-06-15", body: "" },
  ];
  const edges: ShelfEdge[] = [
    { from: "v2", to: "v1", type: "supersedes" },
    { from: "v2", to: "rel", type: "relates" },
  ];
  const shelf = arrayAdapter(items, edges);

  it("shows the current head with its revised-from lineage and connections", () => {
    const html = renderToStaticMarkup(<Shelf source={shelf} view="thread" />);
    expect(html).toContain("revised from");
    expect(html).toContain("Design v1");
    expect(html).toContain("connected");
    expect(html).toContain("Related idea");
    // v1 is superseded, so it is not a head card of its own.
    const heads = html.match(/galley-thread-item/g) ?? [];
    expect(heads.length).toBe(2); // v2 (head) and rel (head), not v1
  });

  it("successorOf surfaces the superseding document", () => {
    expect(successorOf(shelf, "v1")?.id).toBe("v2");
  });
});
