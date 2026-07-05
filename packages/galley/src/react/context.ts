/**
 * GalleyContext carries the optional Shiki highlighter and the host view
 * registry down the tree. The highlighter lets code render highlighted and
 * server-safe; the view registry lets a host resolve `::embed`/`:::view`
 * directives to live components (standalone consumers omit it and get the
 * fallback-plus-chip render).
 */

import { createContext, type ComponentType, useContext } from "react";

export interface GalleyHighlighter {
  codeToHtml(code: string, options: { lang: string; theme: string }): string;
  getLoadedLanguages(): string[];
}

/** Props a registered view receives: the parsed directive attributes. */
export type ViewProps = Record<string, string>;

/** A host-injected registry: view name -> component. Compatible with ViewDescriptor. */
export type ViewRegistry = Record<string, ComponentType<ViewProps>>;

export interface GalleyContextValue {
  highlighter?: GalleyHighlighter;
  themeName: string;
  views?: ViewRegistry;
}

export const GalleyContext = createContext<GalleyContextValue>({ themeName: "galley" });

export function useGalley(): GalleyContextValue {
  return useContext(GalleyContext);
}
