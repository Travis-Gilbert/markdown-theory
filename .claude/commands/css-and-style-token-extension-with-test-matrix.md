---
name: css-and-style-token-extension-with-test-matrix
description: Workflow command scaffold for css-and-style-token-extension-with-test-matrix in markdown-theory.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /css-and-style-token-extension-with-test-matrix

Use this workflow when working on **css-and-style-token-extension-with-test-matrix** in `markdown-theory`.

## Goal

Extends or refines CSS and style tokens for new document families/types, and verifies via fixture/test matrix.

## Common Files

- `packages/galley/src/css/galley.css`
- `packages/galley/src/templates/fixture-matrix.test.tsx`
- `packages/galley/src/tokens/*.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit or add CSS for new/updated families (e.g., galley.css)
- Update or add style tokens/types if needed
- Update or add test fixture matrix to cover new styles (e.g., fixture-matrix.test.tsx)
- Run tests to verify all types/families render correctly

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.