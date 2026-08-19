import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@sleepy-hollow/framework/database", replacement: fileURLToPath(new URL("./core/database/mod.ts", import.meta.url)) },
      { find: "@sleepy-hollow/framework/routing", replacement: fileURLToPath(new URL("./core/routing/mod.ts", import.meta.url)) },
      { find: "@sleepy-hollow/framework/security", replacement: fileURLToPath(new URL("./core/security/mod.ts", import.meta.url)) },
      { find: "@sleepy-hollow/framework/testing", replacement: fileURLToPath(new URL("./core/testing/mod.ts", import.meta.url)) },
      { find: "@sleepy-hollow/framework/validation", replacement: fileURLToPath(new URL("./core/validation/mod.ts", import.meta.url)) },
      { find: "@sleepy-hollow/framework", replacement: fileURLToPath(new URL("./mod.ts", import.meta.url)) },
    ],
  },
  test: {
    globals: true,
    setupFiles: ["./tests/vitest.setup.ts"],
    include: ["**/*_test.ts", "**/*.test.ts"],
    exclude: ["node_modules", "**/node_modules/**", "dist", "website", "**/type_test.ts"]
  }
});
