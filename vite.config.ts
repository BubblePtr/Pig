import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  resolve: {
    alias: {
      "@pig/core/testing": resolve(__dirname, "packages/core/src/testing.ts"),
      "@pig/core": resolve(__dirname, "packages/core/src/index.ts"),
      "@pig/backend": resolve(__dirname, "packages/backend/src/index.ts"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    pool: "forks",
    setupFiles: ["./src/test/setup.ts"],
  },
});
