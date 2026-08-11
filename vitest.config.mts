import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Without this, `@/...` imports resolve under `next build` but not under vitest,
// so a tested module could only import via relative paths -- and adding a normal
// aliased import to one silently broke its whole test file.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    include: ["src/**/*.test.ts"]
  }
});
