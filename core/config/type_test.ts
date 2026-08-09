import { z } from "zod";

import { defineConfiguration, resolveConfiguration } from "./mod.ts";

const definition = defineConfiguration({
  modes: {
    development: z.strictObject({ PORT: z.coerce.number() }),
    test: z.strictObject({ TEST_ONLY: z.literal(true).default(true) }),
    preview: z.strictObject({ ORIGIN: z.url() }),
    production: z.strictObject({ DATABASE_URL: z.string() }),
  },
});

async function assertions() {
  const development = await resolveConfiguration(definition, {
    mode: "development",
    environment: { PORT: "8000" },
  });
  const port: number = development.values.PORT;
  // @ts-expect-error Selected-mode output must not include production keys.
  const database: string = development.values.DATABASE_URL;

  const production = await resolveConfiguration(definition, {
    mode: "production",
    environment: { DATABASE_URL: "kv://database" },
  });
  const databaseUrl: string = production.values.DATABASE_URL;
  // @ts-expect-error Selected-mode output must not include development keys.
  const productionPort: number = production.values.PORT;

  return { port, database, databaseUrl, productionPort };
}

assertions satisfies () => Promise<object>;
