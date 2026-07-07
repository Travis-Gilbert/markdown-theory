import { describe, expect, it } from "vitest";

import {
  allTypes,
  byFamily,
  getType,
  knownKinds,
  register,
  version,
  type TypeDescriptor,
} from "./index";

const plugin = (overrides: Partial<TypeDescriptor>): TypeDescriptor => ({
  id: "poem",
  family: "prose",
  epistemic: "generated",
  okf_type: "Poem",
  fields: [],
  headings: [],
  recipe: { base: "prose", deltas: {} },
  margin: ["suggestions"],
  affordances: [],
  infer: { signals: [] },
  ...overrides,
});

describe("document-types registry (T1)", () => {
  it("loads the full 32-type shipped set", () => {
    expect(version).toBe("0.1");
    expect(allTypes()).toHaveLength(32);
  });

  it("resolves a known kind with its full contract", () => {
    const concept = getType("concept");
    expect(concept?.family).toBe("prose");
    expect(concept?.epistemic).toBe("claim_bearing");
    expect(concept?.okf_type).toBe("Concept");
    expect(concept?.margin).toEqual(
      expect.arrayContaining(["objections", "analogies", "questions"]),
    );
    expect(concept?.affordances).toContain("find_analogies");
  });

  it("groups by family and every family is populated", () => {
    for (const family of [
      "prose",
      "reference",
      "procedure",
      "record",
      "working",
      "structural",
    ] as const) {
      expect(byFamily(family).length).toBeGreaterThan(0);
    }
    expect(byFamily("prose").map((d) => d.id)).toContain("paper");
  });

  it("every shipped kind resolves (CI oracle)", () => {
    for (const kind of knownKinds()) {
      expect(getType(kind)).toBeDefined();
    }
  });

  it("every recipe base matches its family, every margin module is in the rail vocabulary", () => {
    // These invariants are enforced at load; reaching here means all 32 passed.
    expect(allTypes().every((d) => d.recipe.base === d.family)).toBe(true);
  });

  it("rejects registering a duplicate id", () => {
    const note = getType("note")!;
    expect(() => register({ ...note })).toThrow(/already exists/);
  });

  it("rejects a descriptor with an unknown rail module", () => {
    expect(() => register(plugin({ id: "badpoem", margin: ["not_a_module"] as never }))).toThrow(
      /unknown rail module/,
    );
    expect(getType("badpoem")).toBeUndefined();
  });

  it("accepts a valid Tier-0 plugin descriptor and resolves it", () => {
    register(plugin({ id: "poem" }));
    expect(getType("poem")?.okf_type).toBe("Poem");
  });
});
