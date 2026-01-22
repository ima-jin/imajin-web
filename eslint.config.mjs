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
    "docs/api/typedoc-output/**",
    "*.config.js",
    "*.config.mjs",
  ]),
  // Pre-launch phase violation detection
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "types/**/*.ts"],
    rules: {
      "no-warning-comments": [
        "error",
        {
          terms: [
            "Phase 1",
            "Phase 2",
            "Phase 3",
            "Phase 4",
            "DEPRECATED",
            "TODO: Remove",
            "Will be removed",
            "Legacy field",
            "Old field",
            "Added in",
            "v1.0:",
            "v2.0:",
            "@since",
            "@deprecated",
          ],
          location: "anywhere",
        },
      ],
      "no-console": "error", // No console.* allowed in production code
    },
  },
  // Test file overrides - allow flexible mocking and console
  {
    files: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "tests/**/*.spec.ts", "tests/**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Allow any in tests for mocking
      "@typescript-eslint/no-unused-vars": "off", // Allow unused vars in test setup
      "no-warning-comments": "off", // Allow phase markers in test descriptions
      "no-console": "off", // Allow console in tests
    },
  },
  // Script file overrides - allow console
  {
    files: ["scripts/**/*.ts", "scripts/**/*.js"],
    rules: {
      "no-console": "off", // Allow console in scripts
      "no-warning-comments": "off", // Allow TODO in scripts
    },
  },
]);

export default eslintConfig;
