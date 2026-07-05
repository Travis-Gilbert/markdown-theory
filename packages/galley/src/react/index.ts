/**
 * galley/react -- the render surface.
 *
 * `<Galley>` renders spine mdast as a pure projection of tokens. Server-safe;
 * three interactive islands ship alongside (code copy is wired by default;
 * footnote popover and image lightbox are opt-in enhancers).
 */

export { Galley, type GalleyProps } from "./Galley.js";
export {
  GalleyContext,
  type GalleyContextValue,
  type GalleyHighlighter,
  useGalley,
  type ViewProps,
  type ViewRegistry,
} from "./context.js";
export { Embed } from "./components/Embed.js";
export { createGalleyHighlighter, DEFAULT_LANGS } from "./highlight.js";
export { toGalleyHast } from "./hast.js";
export { Toc, tocFromHast, type TocEntry } from "./Toc.js";
export { CodeBlock } from "./components/CodeBlock.js";
export { Math } from "./components/Math.js";
export { CodeCopy } from "./islands/CodeCopy.js";
export { FootnotePopover } from "./islands/FootnotePopover.js";
export { ImageLightbox } from "./islands/ImageLightbox.js";
