---
name: repo-wide-formatting-standardization
description: Workflow command scaffold for repo-wide-formatting-standardization in markdown-theory.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /repo-wide-formatting-standardization

Use this workflow when working on **repo-wide-formatting-standardization** in `markdown-theory`.

## Goal

Applies formatting standards (e.g., Prettier) across the repository to maintain consistent code and prose style.

## Common Files

- `.prettierrc`
- `.prettierignore`
- `Specs/*.md`
- `docs/**/*.md`
- `packages/**/*.ts`
- `packages/**/*.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Add or update .prettierrc and .prettierignore
- Run Prettier across all relevant files (code, markdown, etc.)
- Commit all reflowed/auto-formatted files

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.