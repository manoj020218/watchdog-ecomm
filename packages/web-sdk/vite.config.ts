import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/sdk.ts"),
      name: "CommerceWatchdog",
      fileName: "sdk",
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      output: {
        // UMD build for <script src="..."> usage — self-contained, no external deps
        globals: {},
      },
    },
  },
});
