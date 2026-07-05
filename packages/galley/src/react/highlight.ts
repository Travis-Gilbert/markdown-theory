/**
 * A Shiki highlighter loaded with the register's generated theme (G1), so code
 * blocks match the page instead of importing a foreign palette.
 *
 * `createHighlighter` is async (it loads grammars + the theme once); the
 * returned instance's `codeToHtml` is synchronous, which is what lets `<Galley>`
 * stay a synchronous, server-safe render. Load once, pass via the `highlighter`
 * prop.
 */

import { createHighlighter } from "shiki";
import { buildShikiTheme } from "../tokens/shiki.js";
import type { Register } from "../tokens/types.js";
import type { GalleyHighlighter } from "./context.js";

export const DEFAULT_LANGS = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "bash",
  "shell",
  "python",
  "rust",
  "css",
  "html",
  "markdown",
  "yaml",
  "sql",
];

export async function createGalleyHighlighter(
  register: Register,
  langs: string[] = DEFAULT_LANGS,
): Promise<GalleyHighlighter> {
  const theme = buildShikiTheme(register, "galley");
  const highlighter = await createHighlighter({
    themes: [theme as never],
    langs,
  });
  return highlighter as unknown as GalleyHighlighter;
}
