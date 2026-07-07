```markdown
# markdown-theory Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development patterns and workflows used in the `markdown-theory` repository. The codebase is written in TypeScript and focuses on document type taxonomies, recipe resolution, and style token management for markdown document families. It emphasizes strong typing, modular design, and comprehensive testing using Vitest. The repository follows strict coding conventions and leverages automated workflows for adding document types, extending CSS/style tokens, and maintaining formatting standards.

## Coding Conventions

- **File Naming:**  
  Use kebab-case for file names.  
  _Example:_  
  ```
  resolve-type.ts
  fixture-matrix.test.tsx
  galley.css
  ```

- **Import Style:**  
  Use relative imports for internal modules.  
  _Example:_  
  ```ts
  import { resolveType } from './resolve-type'
  import { recipeFromDescriptor } from '../templates/recipes'
  ```

- **Export Style:**  
  Use named exports.  
  _Example:_  
  ```ts
  export function resolveType(descriptor: string): DocumentType { ... }
  export { recipeFromDescriptor }
  ```

- **Commit Messages:**  
  Follow [Conventional Commits](https://www.conventionalcommits.org/) with prefixes like `feat`, `refactor`, `chore`.  
  _Example:_  
  ```
  feat: add legal-brief document type and associated recipe
  refactor: unify type resolution logic
  chore: update Prettier config for markdown files
  ```

## Workflows

### Add or Enhance Document Type or Recipe
**Trigger:** When you want to add a new document type, update the taxonomy, or enhance the recipe resolution logic.  
**Command:** `/add-document-type`

1. **Edit or add to `types.json`**  
   Add new document type data or update existing types:  
   ```json
   {
     "id": "legal-brief",
     "label": "Legal Brief",
     "family": "legal"
   }
   ```
2. **Update TypeScript schema/types**  
   Update or add types in `types.ts` or `recipes.ts`:  
   ```ts
   export type DocumentType = 'article' | 'legal-brief' | ...;
   ```
3. **Update registry/reader logic**  
   Implement or enhance logic in `index.ts`, `resolveType`, or `recipeFromDescriptor`.
4. **Update or add tests**  
   Add or update tests in files like `index.test.ts`, `family.test.ts`, or `fixture-matrix.test.tsx`.
5. **Update `package.json` if needed**  
   If adding a new package or changing scope.
6. **Run typecheck and tests**  
   ```sh
   pnpm typecheck
   pnpm test
   ```

### CSS and Style Token Extension with Test Matrix
**Trigger:** When you want to add or update style rules for new or existing document families/types.  
**Command:** `/extend-family-css`

1. **Edit or add CSS**  
   Update `galley.css` for new/updated families.
2. **Update or add style tokens/types**  
   Modify or add files in `tokens/` as needed.
3. **Update or add test fixture matrix**  
   Add test cases in `fixture-matrix.test.tsx` to cover new styles.
4. **Run tests**  
   ```sh
   pnpm test
   ```

### Repo-wide Formatting Standardization
**Trigger:** When you want to introduce or enforce formatting rules across all code and markdown files.  
**Command:** `/format-repo`

1. **Add or update `.prettierrc` and `.prettierignore`**  
   Configure formatting rules.
2. **Run Prettier across all files**  
   ```sh
   pnpm prettier --write .
   ```
3. **Commit all auto-formatted files**  
   ```
   chore: format repo with Prettier
   ```

## Testing Patterns

- **Framework:** [Vitest](https://vitest.dev/)
- **File Pattern:** `*.test.ts` or `*.test.tsx`
- **Test Example:**
  ```ts
  import { describe, it, expect } from 'vitest'
  import { resolveType } from './resolve-type'

  describe('resolveType', () => {
    it('resolves legal-brief type', () => {
      expect(resolveType('legal-brief')).toEqual({ id: 'legal-brief', ... })
    })
  })
  ```
- **Test Coverage:**  
  Ensure all new types, recipes, and style changes are covered by corresponding test files.

## Commands

| Command              | Purpose                                                      |
|----------------------|--------------------------------------------------------------|
| /add-document-type   | Add or enhance a document type, taxonomy, or recipe logic    |
| /extend-family-css   | Add or update CSS/style tokens for document families/types   |
| /format-repo         | Apply formatting standards across the repository             |
```