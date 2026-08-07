import { z } from "zod";

import { createKvRepository, defineKvResource } from "./mod.ts";

const Widget = z.strictObject({
  id: z.string(),
  ownerId: z.string(),
  count: z.int(),
});

const widgets = defineKvResource({
  name: "widgets",
  id: z.string(),
  value: Widget,
  indexes: {
    byOwner: { kind: "belongsTo", value: (widget) => widget.ownerId },
  },
});

async function typeAssertions(kv: Deno.Kv): Promise<void> {
  const repository = createKvRepository(kv, widgets);
  await repository.create("w1", { id: "w1", ownerId: "o1", count: 1 });
  const entry = await repository.get("w1");
  if (entry) {
    const id: string = entry.id;
    const count: number = entry.value.count;
    id satisfies string;
    count satisfies number;
  }

  // @ts-expect-error The ID schema output is a string.
  await repository.get(42);
  // @ts-expect-error The value schema requires a numeric count.
  await repository.create("w2", { id: "w2", ownerId: "o1", count: "two" });
}

typeAssertions satisfies (kv: Deno.Kv) => Promise<void>;
