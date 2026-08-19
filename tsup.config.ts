import { platform } from "#platform";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "mod.ts",
    cli: "cli/main.ts",
    database: "core/database/mod.ts",
    routing: "core/routing/mod.ts",
    validation: "core/validation/mod.ts",
    security: "core/security/mod.ts",
    testing: "core/testing/mod.ts",
    server: "runtime/server.ts"
  },
  clean: true,
  dts: true,
  format: ["esm"],
  platform: "node",
  sourcemap: true,
  target: "node24"
});
