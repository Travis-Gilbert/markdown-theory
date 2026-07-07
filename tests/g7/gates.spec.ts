/**
 * G7 quality gates (docs/plan/g7-browser-harness.md), run in real Chromium.
 *
 * Fixtures are generated first by `pnpm demo:permutations && pnpm demo:readmes`
 * into packages/galley/dist/{permutations,readmes}; `pnpm test:visual` does both
 * then runs this file. Four gates:
 *   1. Overflow    -- nothing scrolls the page horizontally; only elements that
 *                     opt into overflow-x scroll internally.
 *   2. Contrast    -- rendered color vs background clears the register's own AA
 *                     contract (4.5 content, 3.0 faint ink-3 apparatus).
 *   3. Orphan/widow-- no multi-line paragraph ends on a single short word.
 *   4. Snapshots   -- register x recipe permutations at 480 and 1280.
 */
import { test, expect } from "@playwright/test";
import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distRoot = resolve(here, "../../packages/galley/dist");
const permDir = resolve(distRoot, "permutations");
const readmeDir = resolve(distRoot, "readmes");

function htmlFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".html") && f !== "index.html")
      .sort();
  } catch {
    return [];
  }
}

const permFiles = htmlFiles(permDir);
const readmeFiles = htmlFiles(readmeDir);
const contentFiles = [
  ...permFiles.map((f) => ({ dir: permDir, file: f, label: `permutations/${f}` })),
  ...readmeFiles.map((f) => ({ dir: readmeDir, file: f, label: `readmes/${f}` })),
];

function urlOf(dir: string, file: string): string {
  return pathToFileURL(resolve(dir, file)).href;
}

test("G7 fixtures were generated", () => {
  expect(
    contentFiles.length,
    "no fixtures found -- run `pnpm demo:permutations && pnpm demo:readmes` (or `pnpm test:visual`)",
  ).toBeGreaterThan(0);
});

// ---- Gate 1: overflow ----------------------------------------------------
// Narrowest viewport is the binding constraint for horizontal overflow.
for (const f of contentFiles) {
  test(`overflow @480: ${f.label}`, async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 900 });
    await page.goto(urlOf(f.dir, f.file), { waitUntil: "domcontentloaded" });

    const findings = await page.evaluate(() => {
      function cssPath(el) {
        const parts = [];
        let n = el;
        while (n && n.nodeType === 1 && parts.length < 4) {
          let sel = n.tagName.toLowerCase();
          if (n.className && typeof n.className === "string") {
            const c = n.className.trim().split(/\s+/)[0];
            if (c) sel += "." + c;
          }
          parts.unshift(sel);
          n = n.parentElement;
        }
        return parts.join(">");
      }
      const bad = [];
      const de = document.documentElement;
      if (de.scrollWidth > window.innerWidth + 1) {
        bad.push({ sel: "document", sw: de.scrollWidth, cw: window.innerWidth });
      }
      document.querySelectorAll(".galley, .galley *").forEach((el) => {
        const style = getComputedStyle(el);
        const scrollable = style.overflowX === "auto" || style.overflowX === "scroll";
        if (!scrollable && el.scrollWidth > el.clientWidth + 1) {
          bad.push({ sel: cssPath(el), sw: el.scrollWidth, cw: el.clientWidth });
        }
      });
      return bad;
    });

    expect(findings, `horizontal overflow:\n${JSON.stringify(findings, null, 2)}`).toEqual([]);
  });
}

// ---- Gate 2: rendered contrast -------------------------------------------
// The register's solver guarantees 4.5 for ink/ink2/signal/link and 3.0 for the
// faint ink-3 apparatus, against every surface. This backstops it in the real
// cascade. Shiki syntax tokens (intentionally muted) live inside <pre> and are
// excluded -- "code" here means inline code.
const CONTRAST_RULES: Array<{ sel: string; min: number }> = [
  { sel: "p", min: 4.5 },
  { sel: "li", min: 4.5 },
  { sel: "a", min: 4.5 },
  { sel: "strong", min: 4.5 },
  { sel: "blockquote", min: 4.5 },
  { sel: "td", min: 4.5 },
  { sel: "th", min: 4.5 },
  { sel: ":not(pre) > code", min: 4.5 },
  { sel: "h1, h2, h3, h4, h5, h6", min: 4.5 },
  { sel: ".galley-callout-label", min: 4.5 },
  { sel: ".galley-standfirst", min: 4.5 },
  { sel: ".galley-authorline", min: 3.0 },
  { sel: ".galley-figcaption", min: 3.0 },
  { sel: ".galley-chip", min: 3.0 },
];

for (const f of contentFiles) {
  test(`contrast: ${f.label}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(urlOf(f.dir, f.file), { waitUntil: "domcontentloaded" });

    const findings = await page.evaluate((rules) => {
      function parseRgb(s) {
        const m = s && s.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(",").map((x) => parseFloat(x));
        return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
      }
      function lum(rgb) {
        const f = (c) => {
          c /= 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
      }
      function contrast(a, b) {
        const l1 = lum(a);
        const l2 = lum(b);
        const hi = Math.max(l1, l2);
        const lo = Math.min(l1, l2);
        return (hi + 0.05) / (lo + 0.05);
      }
      function effBg(el) {
        let n = el;
        while (n && n.nodeType === 1) {
          const rgba = parseRgb(getComputedStyle(n).backgroundColor);
          if (rgba && rgba[3] > 0) return rgba;
          n = n.parentElement;
        }
        return (
          parseRgb(getComputedStyle(document.documentElement).backgroundColor) || [255, 255, 255, 1]
        );
      }
      function hasOwnText(el) {
        return Array.from(el.childNodes).some(
          (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
        );
      }
      const bad = [];
      for (const rule of rules) {
        document.querySelectorAll(".galley " + rule.sel).forEach((el) => {
          if (el.closest("pre")) return;
          if (!hasOwnText(el)) return;
          const color = parseRgb(getComputedStyle(el).color);
          if (!color) return;
          const ratio = contrast(color, effBg(el));
          if (ratio < rule.min - 0.01) {
            bad.push({
              sel: rule.sel,
              min: rule.min,
              ratio: Math.round(ratio * 100) / 100,
              text: (el.textContent || "").trim().slice(0, 40),
            });
          }
        });
      }
      return bad;
    }, CONTRAST_RULES);

    expect(findings, `AA contrast failures:\n${JSON.stringify(findings, null, 2)}`).toEqual([]);
  });
}

// ---- Gate 3: orphan / widow ----------------------------------------------
// A multi-line paragraph must not end on a single short word. Words are wrapped
// ephemerally to read their line-box tops; the last-line group is inspected.
for (const f of contentFiles) {
  test(`widows: ${f.label}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(urlOf(f.dir, f.file), { waitUntil: "domcontentloaded" });

    const findings = await page.evaluate(() => {
      function esc(w) {
        return w.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
      const bad = [];
      document.querySelectorAll(".galley p").forEach((p) => {
        const raw = (p.textContent || "").trim();
        const words = raw ? raw.split(/\s+/) : [];
        if (words.length < 8) return;
        const original = p.innerHTML;
        p.innerHTML = words.map((w) => `<span data-w>${esc(w)}</span>`).join(" ");
        const spans = Array.from(p.querySelectorAll("span[data-w]"));
        const tops = spans.map((s) => Math.round(s.getBoundingClientRect().top));
        const lineCount = new Set(tops).size;
        if (lineCount >= 2) {
          const maxTop = Math.max(...tops);
          const lastLine = spans.filter((_, i) => tops[i] === maxTop);
          const containerWidth = p.getBoundingClientRect().width;
          if (lastLine.length === 1) {
            const w = lastLine[0].getBoundingClientRect().width;
            if (w < containerWidth * 0.15) {
              bad.push({
                word: lastLine[0].textContent,
                lastWidth: Math.round(w),
                container: Math.round(containerWidth),
                text: raw.slice(0, 50),
              });
            }
          }
        }
        p.innerHTML = original;
      });
      return bad;
    });

    expect(findings, `widowed last lines:\n${JSON.stringify(findings, null, 2)}`).toEqual([]);
  });
}

// ---- Gate 5: page object present (P8) ------------------------------------
// The regression that shipped once (full-bleed flush-left prose) must fail CI.
// A page is present when its background differs from the ground AND content sits
// inset from the viewport edge -- at every viewport, so a phone counts too.
for (const f of contentFiles) {
  for (const width of [360, 768, 1280, 2560]) {
    test(`page-object @${width}: ${f.label}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(urlOf(f.dir, f.file), { waitUntil: "load" });

      const r = await page.evaluate(() => {
        const galley = document.querySelector(".galley");
        if (!galley) return { ok: false, why: "no .galley" };
        const pageBg = getComputedStyle(galley).backgroundColor;
        const groundBg = getComputedStyle(document.documentElement).backgroundColor;
        // First child that actually renders text (skip the type-chip if any).
        const content = Array.from(galley.children).find(
          (el) => (el.textContent || "").trim().length > 0,
        );
        const left = content ? content.getBoundingClientRect().left : 0;
        return { ok: true, pageBg, groundBg, left: Math.round(left) };
      });

      expect(r.ok, r.why).toBe(true);
      expect(r.pageBg, "page background must differ from the ground").not.toBe(r.groundBg);
      expect(r.left, "content must sit inset from the viewport edge").toBeGreaterThan(0);
    });
  }
}

// ---- Gate 6: heading binding ratio (P5/P8) -------------------------------
// A heading belongs to what follows it: the gap above must be clearly larger
// than the gap below (spec: at least 2x). Measured on rendered line boxes.
for (const f of contentFiles) {
  test(`heading-binding: ${f.label}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(urlOf(f.dir, f.file), { waitUntil: "load" });

    const findings = await page.evaluate(() => {
      const bad: Array<{ text: string; above: number; below: number }> = [];
      document.querySelectorAll(".galley h2").forEach((h2) => {
        const prev = h2.previousElementSibling;
        const next = h2.nextElementSibling;
        if (!prev || !next) return;
        // Skip when the neighbour is itself a heading (no body gap to compare).
        if (/^H[1-6]$/.test(prev.tagName) || /^H[1-6]$/.test(next.tagName)) return;
        const hb = h2.getBoundingClientRect();
        const above = Math.round(hb.top - prev.getBoundingClientRect().bottom);
        const below = Math.round(next.getBoundingClientRect().top - hb.bottom);
        if (below > 0 && above < 2 * below - 1) {
          bad.push({ text: (h2.textContent || "").trim().slice(0, 40), above, below });
        }
      });
      return bad;
    });

    expect(findings, `heading gap above < 2x below:\n${JSON.stringify(findings, null, 2)}`).toEqual(
      [],
    );
  });
}

// ---- Gate 7: block spacing (the owl holds) -------------------------------
// Every flow sibling after the first must have a real gap from the previous one.
// A zero top margin means a per-element `margin: 0` reset out-specified the owl
// and blocks collapsed together (paragraphs, lists, quotes touching).
for (const f of contentFiles) {
  test(`block-spacing: ${f.label}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(urlOf(f.dir, f.file), { waitUntil: "load" });

    const findings = await page.evaluate(() => {
      const bad: Array<{ tag: string; cls: string }> = [];
      const galley = document.querySelector(".galley");
      if (!galley) return bad;
      const kids = Array.from(galley.children);
      kids.forEach((el, i) => {
        if (i === 0) return; // first child legitimately has no top margin
        const mt = parseFloat(getComputedStyle(el).marginTop) || 0;
        if (mt <= 0) {
          bad.push({ tag: el.tagName.toLowerCase(), cls: el.className || "" });
        }
      });
      return bad;
    });

    expect(
      findings,
      `flow blocks collapsed (0 top margin):\n${JSON.stringify(findings, null, 2)}`,
    ).toEqual([]);
  });
}

// ---- Gate 4: register x recipe permutation snapshots ---------------------
for (const f of permFiles) {
  for (const width of [480, 1280]) {
    test(`snapshot @${width}: ${f}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(urlOf(permDir, f), { waitUntil: "load" });
      await expect(page).toHaveScreenshot(`${f.replace(/\.html$/, "")}-${width}.png`, {
        fullPage: true,
      });
    });
  }
}
