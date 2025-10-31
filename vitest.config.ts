import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/helpers/vitest.setup.ts"],
    env: {
      // Set NODE_ENV to test - database will auto-select imajin_test
      NODE_ENV: "test",
    },
    fileParallelism: false, // Run test files sequentially to avoid database conflicts
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        ".next/",
        "**/*.config.*",
        "**/dist/**",
        "**/.next/**",
        "**/coverage/**",
      ],
    },
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.{ts,tsx}",
    ],
    // Smoke tests are excluded by default - run with npm run test:smoke
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "tests/smoke/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
