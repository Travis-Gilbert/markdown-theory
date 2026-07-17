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
const briefDir = resolve(distRoot, "briefs");

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
// Bare-mount brief fixtures (`pnpm demo:briefs`): the galley cedes the page to
// a fixed-width host pane, so they run every content gate but not page-object.
const briefFiles = htmlFiles(briefDir);
const contentFiles = [
  ...permFiles.map((f) => ({ dir: permDir, file: f, label: `permutations/${f}`, bare: false })),
  ...readmeFiles.map((f) => ({ dir: readmeDir, file: f, label: `readmes/${f}`, bare: false })),
  ...briefFiles.map((f) => ({ dir: briefDir, file: f, label: `briefs/${f}`, bare: true })),
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
for (const f of contentFiles.filter((c) => !c.bare)) {
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

// ---- Gate 8: bare mount geometry (M1) ------------------------------------
// `galley--bare` cedes all page geometry to the host: the fixture host fixes
// the pane at 640 or 1040 and bounds the column with the emitted measure. The
// contract: the galley paints no page chrome, the column fills the pane up to
// the measure, prose wraps into a real column, and nothing clips horizontally.
for (const f of contentFiles.filter((c) => c.bare)) {
  test(`bare-mount: ${f.label}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(urlOf(f.dir, f.file), { waitUntil: "load" });

    const r = await page.evaluate(() => {
      const pane = document.querySelector(".host-pane");
      const galley = document.querySelector(".galley");
      if (!pane || !galley) return { ok: false as const, why: "no pane or galley" };
      const paneWidth = Number(pane.getAttribute("data-pane-width"));
      const paneBox = pane.getBoundingClientRect();
      const paneStyle = getComputedStyle(pane);
      const paneContent =
        paneBox.width - parseFloat(paneStyle.paddingLeft) - parseFloat(paneStyle.paddingRight);
      const galleyBox = galley.getBoundingClientRect();
      const galleyStyle = getComputedStyle(galley);
      const measurePx = (() => {
        const probe = document.createElement("div");
        probe.style.cssText = "position:absolute;visibility:hidden;inline-size:var(--gy-measure)";
        galley.appendChild(probe);
        const w = probe.getBoundingClientRect().width;
        probe.remove();
        return w;
      })();
      // Wrapping: a long paragraph must break into multiple line boxes.
      const p = Array.from(galley.querySelectorAll("p")).find(
        (el) => (el.textContent || "").trim().split(/\s+/).length > 30,
      );
      let lineCount = 0;
      if (p) {
        const range = document.createRange();
        range.selectNodeContents(p);
        lineCount = new Set(
          Array.from(range.getClientRects())
            .filter((box) => box.width > 0)
            .map((box) => Math.round(box.top)),
        ).size;
      }
      const clipped: string[] = [];
      [pane, galley, ...Array.from(galley.querySelectorAll("*"))].forEach((el) => {
        const style = getComputedStyle(el);
        const scrollable = style.overflowX === "auto" || style.overflowX === "scroll";
        if (!scrollable && el.scrollWidth > el.clientWidth + 1) {
          clipped.push(el.tagName.toLowerCase());
        }
      });
      return {
        ok: true as const,
        paneWidth,
        paneBoxWidth: Math.round(paneBox.width),
        paneContent: Math.round(paneContent),
        galleyWidth: Math.round(galleyBox.width),
        measurePx: Math.round(measurePx),
        galleyBg: galleyStyle.backgroundColor,
        galleyShadow: galleyStyle.boxShadow,
        lineCount,
        clipped,
      };
    });

    expect(r.ok, r.ok ? "" : r.why).toBe(true);
    if (!r.ok) return;
    // The host fixed the pane; the render honored it.
    expect(r.paneBoxWidth).toBeLessThanOrEqual(r.paneWidth + 1);
    // The column is measured: it fills the pane content box up to the measure.
    expect(r.galleyWidth).toBeLessThanOrEqual(r.paneContent + 1);
    expect(r.galleyWidth, "column must equal min(measure, pane content)").toBeLessThanOrEqual(
      Math.min(r.measurePx, r.paneContent) + 1,
    );
    expect(r.galleyWidth).toBeGreaterThanOrEqual(Math.min(r.measurePx, r.paneContent) - 1);
    // No page chrome: the bare galley paints no surface and casts no shadow.
    expect(r.galleyBg).toBe("rgba(0, 0, 0, 0)");
    expect(r.galleyShadow).toBe("none");
    // Correct wrapping, no horizontal clipping.
    expect(r.lineCount, "a long paragraph must wrap into a column").toBeGreaterThan(1);
    expect(r.clipped, "no element may clip horizontally").toEqual([]);
  });
}

// ---- Gate 9: heading rhythm at pane scale (M3) ----------------------------
// The owl-specificity regression shipped once (0.1.2): per-element `margin: 0`
// resets out-specified `.galley > * + *`, every body block computed
// margin-top: 0, and trimmed heading descenders painted through the first line
// of the following list. This gate pins the fix where it was diagnosed: at
// pane width, the computed margin-top of whatever follows an h2 is nonzero,
// the rendered gap clears the descender band, and the air above stays inside
// the sectional maximum (no orphaned heading spacing).
for (const f of contentFiles.filter((c) => c.bare)) {
  test(`heading-rhythm: ${f.label}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(urlOf(f.dir, f.file), { waitUntil: "load" });

    const findings = await page.evaluate(() => {
      const bad: Array<Record<string, string | number>> = [];
      document.querySelectorAll(".galley :is(h2, h3, h4)").forEach((h) => {
        const next = h.nextElementSibling;
        if (!next || /^H[1-6]$/.test(next.tagName)) return;
        const mt = parseFloat(getComputedStyle(next).marginTop) || 0;
        const hStyle = getComputedStyle(h);
        const fontSize = parseFloat(hStyle.fontSize);
        const gapBelow = next.getBoundingClientRect().top - h.getBoundingClientRect().bottom;
        const nextLh = parseFloat(getComputedStyle(next).lineHeight);
        const hb = h.getBoundingClientRect();
        const prev = h.previousElementSibling;
        const gapAbove =
          prev && !/^H[1-6]$/.test(prev.tagName)
            ? hb.top - prev.getBoundingClientRect().bottom
            : null;
        const text = (h.textContent || "").trim().slice(0, 40);
        if (mt <= 0) {
          bad.push({ text, why: "computed margin-top of the follower is zero", mt });
        }
        // Descender clearance: text-box trims the heading to cap/alphabetic, so
        // descenders hang below the box; the binding gap must clear them.
        if (gapBelow < fontSize * 0.12) {
          bad.push({ text, why: "heading sits flush on its follower", gapBelow });
        }
        // No orphaned heading: air above stays within the sectional maximum.
        if (gapAbove !== null && gapAbove > nextLh * 3.25) {
          bad.push({ text, why: "orphaned heading spacing above", gapAbove });
        }
      });
      return bad;
    });

    expect(findings, `heading rhythm failures:\n${JSON.stringify(findings, null, 2)}`).toEqual([]);
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
