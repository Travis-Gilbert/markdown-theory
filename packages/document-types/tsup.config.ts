import { defineConfig } from "tsup";

// Compile to dist (.js + .d.ts). types.json is imported by the reader; esbuild
// inlines it into dist/index.js, and the raw file also ships via `files` so the
// Rust reader (theorem-harness-core) and other consumers can read it directly.
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  target: "es2022",
});
