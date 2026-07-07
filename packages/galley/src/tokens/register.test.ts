import { describe, expect, it } from "vitest";
import { emitCss, emitRegisterVars } from "./emit.js";
import { FIXTURE_AXES, parchment, print, substrate } from "./fixtures.js";
import { generateRegister } from "./register.js";
import { buildShikiTheme } from "./shiki.js";
import { RATIOS, RegisterContrastError } from "./types.js";

describe("generateRegister ramp", () => {
  it("produces the -2..5 ramp with body at 1rem", () => {
    const reg = generateRegister();
    expect(reg.ramp).toHaveLength(8);
    const body = reg.ramp.find((s) => s.step === 0);
    expect(body?.rem).toBe(1);
  });

  it("keeps body leading inside the [1.3, 1.75] band", () => {
    const reg = generateRegister();
    expect(reg.bodyLeading).toBeGreaterThanOrEqual(1.3);
    expect(reg.bodyLeading).toBeLessThanOrEqual(1.75);
    expect(reg.headingLeading).toBe(1.15);
  });

  it("snaps every ramp size to quarter-pixel", () => {
    const reg = generateRegister();
    for (const step of reg.ramp) {
      expect((step.px * 4) % 1).toBe(0);
    }
  });
});

describe("re-derivation from axes (the core claim)", () => {
  it("changing the ratio re-derives the whole ramp", () => {
    const minor = generateRegister({ ratio: RATIOS.minorThird });
    const golden = generateRegister({ ratio: RATIOS.goldenSection });
    const at = (r: typeof minor, step: number) => r.ramp.find((s) => s.step === step)?.px;
    // Body (step 0) is the anchor and stays put; every other step moves.
    expect(at(minor, 0)).toBe(at(golden, 0));
    expect(at(minor, 3)).not.toBe(at(golden, 3));
    expect(at(minor, -2)).not.toBe(at(golden, -2));
  });

  it("changing the base rescales every size", () => {
    const a = generateRegister({ base: 16 });
    const b = generateRegister({ base: 20 });
    expect(a.ramp[0]?.px).not.toBe(b.ramp[0]?.px);
  });

  it("clamps measure into [45, 75]", () => {
    expect(generateRegister({ measure: 10 }).page.measureCh).toBe(45);
    expect(generateRegister({ measure: 200 }).page.measureCh).toBe(75);
  });
});

describe("contrast gate (good by construction)", () => {
  for (const [name, axes] of Object.entries(FIXTURE_AXES)) {
    it(`${name} passes WCAG AA on every generated pairing`, () => {
      const reg = generateRegister(axes);
      expect(reg.contrast.length).toBeGreaterThan(0);
      for (const pairing of reg.contrast) {
        expect(pairing.passesAA, `${name}: ${pairing.pair} = ${pairing.wcag}:1`).toBe(true);
      }
    });
  }

  it("throws RegisterContrastError for an unsolvable (deliberately bad) register", () => {
    // Pin ink to a near-white band in light mode: no lightness there can reach
    // AA against a light surface, so the register is unsolvable and must throw.
    expect(() => generateRegister({}, { inkBand: { lo: 0.9, hi: 0.95 } })).toThrow(
      RegisterContrastError,
    );
  });

  it("the thrown error carries the failing pairings", () => {
    try {
      generateRegister({}, { inkBand: { lo: 0.9, hi: 0.95 } });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(RegisterContrastError);
      expect((err as RegisterContrastError).failures.length).toBeGreaterThan(0);
    }
  });
});

describe("parchment resolves near the Compose light values", () => {
  const lightnessOf = (oklch: string): number => {
    const m = oklch.match(/oklch\(([\d.]+)%/);
    if (!m) throw new Error(`not an oklch percentage: ${oklch}`);
    return Number(m[1]);
  };

  it("gives a light warm surface and a confident off-black ink", () => {
    const reg = parchment();
    // Surface is an off-white (Compose #FAF9F5 ~ L97%); ink is a dark off-black
    // (Compose #2A2723 ~ L25%), not a barely-passing medium grey.
    expect(lightnessOf(reg.palette.surface)).toBeGreaterThan(90);
    expect(lightnessOf(reg.palette.ink)).toBeLessThan(35);
    // The hierarchy widens toward the surface: ink < ink2 < ink3.
    expect(lightnessOf(reg.palette.ink)).toBeLessThan(lightnessOf(reg.palette.ink2));
    expect(lightnessOf(reg.palette.ink2)).toBeLessThan(lightnessOf(reg.palette.ink3));
  });
});

describe("emit", () => {
  it("emits oklch colors and no raw hex (hairline excepted as rgba)", () => {
    const css = emitCss(parchment());
    expect(css).toContain("--gy-surface: oklch(");
    expect(css).toContain("--gy-measure: 68ch");
    expect(css).toContain("--gy-leading-body:");
    // No six-digit hex colors leak into the token sheet.
    expect(css).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("scopes a register under a class selector", () => {
    const css = emitCss(substrate(), ".gy-substrate");
    expect(css.startsWith(".gy-substrate {")).toBe(true);
  });

  it("emits a full variable map with the four font roles", () => {
    const vars = emitRegisterVars(print());
    expect(Object.keys(vars).length).toBeGreaterThan(30);
    expect(vars["--gy-font-prose"]).toContain("IBM Plex Sans");
    expect(vars["--gy-font-title"]).toContain("Encode Sans Semi Expanded");
    expect(vars["--gy-font-ui"]).toContain("IBM Plex Sans");
    expect(vars["--gy-font-mono"]).toContain("JetBrains Mono");
  });
});

describe("page object + shape tokens (HANDOFF-GALLEY-PAGE P1/P3/P4)", () => {
  it("spends the canon into page pads: block-start smaller than block-end", () => {
    const vars = emitRegisterVars(parchment());
    const px = (v: string) => Number(v.replace("px", ""));
    expect(vars["--gy-page-pad-inline"]).toMatch(/^clamp\(\d+px, [\d.]+vw, \d+px\)$/);
    // Content optically high: less pad above the block than below it.
    expect(px(vars["--gy-page-pad-block-start"]!)).toBeLessThan(
      px(vars["--gy-page-pad-block-end"]!),
    );
  });

  it("differentiates elevation by register: parchment/print float, substrate sits flat", () => {
    expect(emitRegisterVars(parchment())["--gy-shadow"]).not.toBe("none");
    expect(emitRegisterVars(print())["--gy-shadow"]).not.toBe("none");
    expect(emitRegisterVars(substrate())["--gy-shadow"]).toBe("none");
    expect(emitRegisterVars(substrate())["--gy-page-border"]).toBe("none");
  });

  it("caps the small radius at a hairline-adjacent 2-3px (nothing inline is a pill)", () => {
    for (const reg of [parchment(), substrate(), print()]) {
      const r = Number(emitRegisterVars(reg)["--gy-radius-sm"]!.replace("px", ""));
      expect(r).toBeGreaterThanOrEqual(2);
      expect(r).toBeLessThanOrEqual(3);
    }
  });

  it("emits a tint distinct from the surface, and the ink-on-tint pairing clears AA", () => {
    const reg = parchment();
    const vars = emitRegisterVars(reg);
    expect(vars["--gy-tint"]).toContain("oklch(");
    expect(vars["--gy-tint"]).not.toBe(vars["--gy-surface"]);
    const onTint = reg.contrast.find((c) => c.pair === "ink on tint");
    expect(onTint?.passesAA).toBe(true);
  });
});

describe("shiki theme from the register", () => {
  it("produces a parseable theme with hex token colors", () => {
    const theme = buildShikiTheme(parchment());
    expect(theme.type).toBe("light");
    expect(theme.colors["editor.background"]).toMatch(/^#[0-9a-f]{6}$/);
    for (const tc of theme.tokenColors) {
      if (tc.settings.foreground) {
        expect(tc.settings.foreground).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it("tracks mode: substrate is a dark theme", () => {
    expect(buildShikiTheme(substrate()).type).toBe("dark");
  });
});
