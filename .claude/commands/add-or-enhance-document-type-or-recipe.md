---
name: add-or-enhance-document-type-or-recipe
description: Workflow command scaffold for add-or-enhance-document-type-or-recipe in markdown-theory.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-enhance-document-type-or-recipe

Use this workflow when working on **add-or-enhance-document-type-or-recipe** in `markdown-theory`.

## Goal

Adds a new document type or recipe, or enhances the taxonomy/registry, ensuring both data and code are updated and tested.

## Common Files

- `packages/document-types/types.json`
- `packages/document-types/src/types.ts`
- `packages/document-types/src/index.ts`
- `packages/document-types/src/index.test.ts`
- `packages/galley/src/templates/recipes.ts`
- `packages/galley/src/templates/family.test.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit or add to types.json (document type data)
- Update TypeScript schema/types (e.g., types.ts, recipes.ts)
- Update or add registry/reader logic (e.g., index.ts, resolveType, recipeFromDescriptor)
- Update or add tests for new types/recipes (e.g., index.test.ts, family.test.ts, fixture-matrix.test.tsx)
- Update package.json if new package or scope change

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.