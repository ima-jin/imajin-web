import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional project-specific ignores:
    "node_modules/**",
    "coverage/**",
    "docker/**",
    "*.config.js",
    "*.config.mjs",
  ]),
  // Test file overrides - allow flexible mocking
  {
    files: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "tests/**/*.spec.ts", "tests/**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Allow any in tests for mocking
      "@typescript-eslint/no-unused-vars": "off", // Allow unused vars in test setup
    },
  },
]);

export default eslintConfig;
