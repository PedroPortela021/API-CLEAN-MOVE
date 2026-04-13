import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "src/**/*.test.ts",
      "src/**/*.spec.ts",
      "tests/**/*.test.ts",
      "tests/**/*.spec.ts",
    ],
    exclude: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "src/**/*.e2e-spec.ts",
      "tests/e2e/**",
    ],
    clearMocks: true,
    restoreMocks: true,
  },
});
