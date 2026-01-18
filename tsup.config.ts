import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    core: "src/core/index.ts"
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["vue"],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";'
    };
  },
  // Handle Vue SFC files
  esbuildPlugins: [],
  // Skip Vue SFCs for now - they need vite-plugin-vue
  noExternal: ["clsx", "fast-equals"]
});
