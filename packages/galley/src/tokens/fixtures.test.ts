/**
 * Console fixture acceptance (SPEC-MDT-CONSOLE-FIXTURE M2/M4).
 *
 * M2: `console-dark` is a first-class fixture: generated, AA-solved on its dark
 * ground, deterministic for its pinned seed, and shipped as a pinned CSS
 * artifact whose bytes the drift gate keeps equal to the seed's output. The
 * bridge points (--gy-surface, --gy-ground, --gy-font-mono) are declared.
 *
 * M4: the face decision. Two variants over one solved palette: serif body (the
 * publication register) and sans body with serif display (the IDE-adjacent
 * register). Swapping is a name change; the artifacts differ only in the font
 * role tokens, so neither introduces a raw value downstream.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { emitRegisterVars } from "./emit.js";
import { FIXTURE_CSS_ARTIFACTS, fixtureCss } from "./fixture-css.js";
import {
  CONSOLE_DARK_AXES,
  consoleDark,
  consoleDarkSans,
  consoleDarkSerif,
  FIXTURE_REGISTERS,
} from "./fixtures.js";
import { SERIF_PROSE } from "./register.js";

const here = dirname(fileURLToPath(import.meta.url));
const artifactDir = resolve(here, "../../fixtures/css");

describe("console-dark fixture (M2)", () => {
  it("solves WCAG AA on every pair it declares, on the dark ground", () => {
    for (const make of [consoleDarkSerif, consoleDarkSans]) {
      const reg = make();
      expect(reg.axes.mode).toBe("dark");
      expect(reg.contrast.length).toBeGreaterThan(0);
      for (const pairing of reg.contrast) {
        expect(pairing.passesAA, `${pairing.pair} = ${pairing.wcag}:1`).toBe(true);
      }
    }
  });

  it("declares the console bridge points as emitted tokens", () => {
    const vars = emitRegisterVars(consoleDark());
    for (const bridge of ["--gy-surface", "--gy-ground", "--gy-font-mono"]) {
      expect(vars[bridge], `${bridge} must be emitted`).toBeTruthy();
    }
  });

  it("regenerates deterministically for the pinned seed", () => {
    for (const name of Object.keys(FIXTURE_CSS_ARTIFACTS)) {
      expect(fixtureCss(name)).toBe(fixtureCss(name));
    }
    expect(consoleDark()).toEqual(consoleDark());
  });

  it("keeps the committed artifacts equal to their seeds (the drift gate)", () => {
    for (const name of Object.keys(FIXTURE_CSS_ARTIFACTS)) {
      const committed = readFileSync(resolve(artifactDir, `${name}.css`), "utf8");
      expect(committed, `fixtures/css/${name}.css drifted; run pnpm emit:fixtures`).toBe(
        fixtureCss(name),
      );
    }
  });

  it("is registered as a named fixture", () => {
    const make = FIXTURE_REGISTERS["console-dark"];
    expect(make).toBeDefined();
    expect(make!().axes).toEqual(CONSOLE_DARK_AXES);
  });
});

describe("the face decision (M4)", () => {
  it("serif variant reads with a serif body; sans variant with a serif display", () => {
    expect(consoleDarkSerif().fonts.prose).toBe(SERIF_PROSE);
    expect(consoleDarkSans().fonts.prose).not.toBe(SERIF_PROSE);
    expect(consoleDarkSans().fonts.title).toBe(SERIF_PROSE);
  });

  it("both variants share one solved palette (faces never affect contrast)", () => {
    expect(consoleDarkSerif().palette).toEqual(consoleDarkSans().palette);
    expect(consoleDarkSerif().contrast).toEqual(consoleDarkSans().contrast);
  });

  it("the artifacts differ only in font-role tokens (a one-line swap downstream)", () => {
    const varsOf = (css: string): Map<string, string> => {
      const m = new Map<string, string>();
      for (const line of css.split("\n")) {
        const match = line.match(/^\s*(--gy-[a-z0-9-]+):\s*(.+);$/);
        if (match) m.set(match[1] as string, match[2] as string);
      }
      return m;
    };
    const serif = varsOf(readFileSync(resolve(artifactDir, "console-dark-serif.css"), "utf8"));
    const sans = varsOf(readFileSync(resolve(artifactDir, "console-dark-sans.css"), "utf8"));
    expect([...serif.keys()]).toEqual([...sans.keys()]);
    const differing = [...serif.keys()].filter((k) => serif.get(k) !== sans.get(k));
    expect(differing.sort()).toEqual(["--gy-font-prose", "--gy-font-title"]);
  });

  it("console-dark (the default name) is the serif publication face", () => {
    expect(fixtureCss("console-dark").replace("console-dark --", "console-dark-serif --")).toBe(
      fixtureCss("console-dark-serif"),
    );
  });
});
