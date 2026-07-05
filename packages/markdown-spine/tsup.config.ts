import { defineConfig } from "tsup";

// Compile the spine to dist (.js + .d.ts) so published consumers never have to
// transpile our source. Runtime deps stay external (bundler/node resolves them).
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  target: "es2022",
});
