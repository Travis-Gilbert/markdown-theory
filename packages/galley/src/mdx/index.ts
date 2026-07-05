/**
 * galley/mdx -- the MDX door (G5).
 *
 * !!! TRUSTED INPUT ONLY !!!
 * `renderMDX` compiles and evaluates MDX, which executes JavaScript (via
 * `new Function`). NEVER pass user-authored content here. This door exists for
 * developer-authored pages (docs, the showcase); user markdown always routes
 * through `<Galley>`, which compiles data, not code.
 *
 * The import boundary (from the compose named decision): JSX that maps to
 * registered views should be converted to `::embed`/`:::view` directives before
 * it reaches here; unmapped JSX is a developer concern, kept behind this wall.
 */

import { evaluate } from "@mdx-js/mdx";
import { createElement, type ComponentType, type ReactElement } from "react";
import * as runtime from "react/jsx-runtime";

export type MdxComponents = Record<string, ComponentType<Record<string, unknown>>>;

/**
 * Compile and render a trusted MDX source string to a React element.
 * `components` maps element/JSX names to components (the MDX `components` prop).
 */
export async function renderMDX(
  source: string,
  components: MdxComponents = {},
): Promise<ReactElement> {
  const mod = await evaluate(source, runtime as never);
  const MDXContent = mod.default as ComponentType<{ components?: MdxComponents }>;
  return createElement(MDXContent, { components });
}
