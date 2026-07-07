// The document-types registry: a thin reader over types.json. Galley G3 pulls
// recipes from here; margin-apparatus pulls margin sets from here; the OKF
// bridge reads okf_type from here. Types are data, never code.

import file from "../types.json";
import {
  RAIL_MODULES,
  type DescriptorFile,
  type Family,
  type RailModule,
  type TypeDescriptor,
} from "./types";

export * from "./types";

const RAIL_SET = new Set<string>(RAIL_MODULES);

function assertValid(descriptor: TypeDescriptor): void {
  if (!descriptor.id || descriptor.id !== descriptor.id.toLowerCase()) {
    throw new Error(
      `document-types: id must be a non-empty lowercase string, got "${descriptor.id}"`,
    );
  }
  for (const module of descriptor.margin) {
    if (!RAIL_SET.has(module)) {
      throw new Error(
        `document-types: "${descriptor.id}" declares unknown rail module "${module}"`,
      );
    }
  }
  if (descriptor.recipe.base !== descriptor.family) {
    throw new Error(
      `document-types: "${descriptor.id}" recipe.base (${descriptor.recipe.base}) must match family (${descriptor.family})`,
    );
  }
}

const registry = new Map<string, TypeDescriptor>();

for (const descriptor of (file as DescriptorFile).descriptors) {
  if (registry.has(descriptor.id)) {
    throw new Error(`document-types: duplicate id "${descriptor.id}" in types.json`);
  }
  assertValid(descriptor);
  registry.set(descriptor.id, descriptor);
}

/** The types.json schema version. */
export const version: string = (file as DescriptorFile).version;

/** Resolve a descriptor by its storage `kind`. */
export function getType(kind: string): TypeDescriptor | undefined {
  return registry.get(kind);
}

/** Every descriptor in registration order. */
export function allTypes(): TypeDescriptor[] {
  return [...registry.values()];
}

/** Every descriptor in a family. */
export function byFamily(family: Family): TypeDescriptor[] {
  return [...registry.values()].filter((d) => d.family === family);
}

/** The set of shipped kinds (for the CI check that every kind resolves). */
export function knownKinds(): string[] {
  return [...registry.keys()];
}

/** Register a plugin descriptor (Tier 0). Collides loudly on an existing id. */
export function register(descriptor: TypeDescriptor): void {
  if (registry.has(descriptor.id)) {
    throw new Error(`document-types: cannot register, id "${descriptor.id}" already exists`);
  }
  assertValid(descriptor);
  registry.set(descriptor.id, descriptor);
}

/** The nearest family for an unknown kind falls back to `note` at the call
 * site; this exposes the family map for inference to use. */
export function isKnownRailModule(module: string): module is RailModule {
  return RAIL_SET.has(module);
}
