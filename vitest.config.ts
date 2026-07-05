import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx"],
    environment: "node",
  },
});
