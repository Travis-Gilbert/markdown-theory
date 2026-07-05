/**
 * galley/shelf -- collection views plus the adapter interface (G4).
 *
 * `<Shelf source>` over `{ list, get, edges? }`. Adapters: fs (a directory of
 * markdown), okf (a parsed bundle), theorem (host-resolved tenant memory), and
 * arrayAdapter (the base). Views: stream, archive, tag, thread.
 */

export type {
  ShelfAdapter,
  ShelfEdge,
  ShelfEdgeType,
  ShelfItem,
  ShelfScope,
} from "./types.js";

export {
  arrayAdapter,
  itemFromMarkdown,
  type OkfBundle,
  type OkfConcept,
  okfAdapter,
  type TheoremMemoryDoc,
  theoremAdapter,
} from "./adapters.js";

export { fsAdapter } from "./fsAdapter.js";

export { Shelf, type ShelfProps, type ShelfView, successorOf } from "./Shelf.js";
