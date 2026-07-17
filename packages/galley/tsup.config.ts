import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { defineConfig } from "tsup";

// Build every subpath export to dist (.js + .d.ts). The key line is
// jsx: "automatic": it compiles JSX against react/jsx-runtime so the shipped
// .js needs no React in scope and no consumer JSX config -- the raw-.tsx ship
// was hostage to each consumer's transpiler (see the external smoke test).
// clean is off because the demo scripts also write under dist/ (gitignored);
// the published `files` list ships only these built subpaths.
export default defineConfig({
  entry: {
    "tokens/index": "src/tokens/index.ts",
    "react/index": "src/react/index.ts",
    "templates/index": "src/templates/index.ts",
    "shelf/index": "src/shelf/index.ts",
    "mdx/index": "src/mdx/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: false,
  // Self-contained entries (no shared chunk files at the dist root), so the
  // published `files` list is exactly the five subpaths plus the stylesheet.
  splitting: false,
  target: "es2022",
  external: ["react", "react-dom", "react/jsx-runtime"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  async onSuccess() {
    copyFileSync("src/css/galley.css", "dist/galley.css");
    copyFileSync("src/css/fonts.css", "dist/fonts.css");
    // Pinned fixture artifacts (M2/M4): committed under fixtures/css (the
    // drift gate keeps them honest), shipped verbatim as dist/fixtures/*.css.
    mkdirSync("dist/fixtures", { recursive: true });
    for (const f of readdirSync("fixtures/css").filter((n) => n.endsWith(".css"))) {
      copyFileSync(`fixtures/css/${f}`, `dist/fixtures/${f}`);
    }
  },
});
