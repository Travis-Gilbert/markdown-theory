/**
 * The `fs` adapter: a directory of markdown files becomes a shelf. Node-only
 * (it reads the filesystem synchronously) and kept in its own module so browser
 * bundles that only use arrayAdapter/okf/theorem never pull `node:fs`.
 */

import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { slugify } from "../templates/recipes.js";
import type { ShelfAdapter } from "./types.js";
import { arrayAdapter, itemFromMarkdown } from "./adapters.js";

const MD_EXT = new Set([".md", ".markdown"]);

export function fsAdapter(dir: string): ShelfAdapter {
  const files = readdirSync(dir).filter((f) => MD_EXT.has(extname(f).toLowerCase()));
  const items = files.map((f) => {
    const md = readFileSync(join(dir, f), "utf8");
    const id = slugify(basename(f, extname(f)));
    return itemFromMarkdown(id, md);
  });
  return arrayAdapter(items);
}
