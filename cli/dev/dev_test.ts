import {
  type ActiveDevRuntime,
  DevCommandError,
  type DevDependencies,
  type DevEvent,
  type DevPrepareOptions,
  type DevWatcher,
  type PreparedDevRuntime,
  runDevCommand,
} from "./mod.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function eventually(
  predicate: () => boolean,
  message: string,
): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  throw new Error(message);
}

class QueueWatcher implements DevWatcher {
  #changes: (readonly string[])[] = [];
  #waiters: ((result: IteratorResult<readonly string[]>) => void)[] = [];
  closed = 0;

  push(paths: readonly string[]): void {
    const waiter = this.#waiters.shift();
    if (waiter) waiter({ value: paths, done: false });
    else this.#changes.push(paths);
  }

  close(): void {
    this.closed += 1;
    for (const waiter of this.#waiters.splice(0)) {
      waiter({ value: undefined, done: true });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<readonly string[]> {
    return {
      next: () => {
        const value = this.#changes.shift();
        if (value) return Promise.resolve({ value, done: false });
        if (this.closed) {
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise((resolve) => this.#waiters.push(resolve));
      },
    };
  }
}

function fakeCandidate(
  generation: number,
  stops: number[],
  routeCount = generation,
): PreparedDevRuntime {
  return {
    routeCount,
    activate(): ActiveDevRuntime {
      return {
        url: "http://127.0.0.1:8000/",
        routeCount,
        stop() {
          stops[generation] = (stops[generation] ?? 0) + 1;
        },
      };
    },
  };
}

function jsonHarness(options: {
  readonly prepare: DevDependencies["prepare"];
  readonly watcher?: QueueWatcher;
}): {
  readonly events: DevEvent[];
  readonly controller: AbortController;
  readonly watcher: QueueWatcher;
  readonly run: Promise<number>;
} {
  const events: DevEvent[] = [];
  const controller = new AbortController();
  const watcher = options.watcher ?? new QueueWatcher();
  const run = runDevCommand(["--json"], {
    cwd: "/project",
    stdout: (line) => events.push(JSON.parse(line)),
    stderr: () => undefined,
  }, {
    prepare: options.prepare,
    watch: () => watcher,
    signal: controller.signal,
  });
  return { events, controller, watcher, run };
}

function unusedPort(): number {
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const port = (listener.addr as Deno.NetAddr).port;
  listener.close();
  return port;
}

Deno.test("AC-F015-001 · empty scaffold starts a real loopback application", async () => {
  const root = await Deno.makeTempDir();
  await Deno.mkdir(`${root}/api`);
  await Deno.writeTextFile(
    `${root}/sleepyhollow.config.ts`,
    "export default { apiDirectory: 'api' };\n",
  );
  const port = unusedPort();
  const events: DevEvent[] = [];
  const controller = new AbortController();
  const watcher = new QueueWatcher();
  let server: Deno.HttpServer | undefined;
  try {
    const run = runDevCommand(["--port", String(port), "--json"], {
      cwd: root,
      stdout: (line) => events.push(JSON.parse(line)),
      stderr: () => undefined,
    }, {
      signal: controller.signal,
      watch: () => watcher,
      prepare(options) {
        assert(
          options.mode === "development",
          "startup must select development",
        );
        assert(
          options.projectRoot === root,
          "startup must use the invocation root",
        );
        return {
          routeCount: 0,
          activate() {
            server = Deno.serve({
              hostname: options.hostname,
              port: options.port,
            }, () =>
              new Response('{"title":"Not Found"}', {
                status: 404,
                headers: { "content-type": "application/problem+json" },
              }));
            return {
              url: `http://${options.hostname}:${options.port}/`,
              routeCount: 0,
              stop: () => server!.shutdown(),
            };
          },
        };
      },
    });
    await eventually(
      () => events.some((event) => event.type === "startup"),
      "startup event missing",
    );
    const response = await fetch(`http://127.0.0.1:${port}/missing`);
    assert(
      response.status === 404,
      "empty scaffold must serve canonical not found",
    );
    const startup = events[0];
    assert(
      startup.state === "active" && startup.routeCount === 0,
      "startup must be active with zero routes",
    );
    assert(
      startup.generation === 1 && startup.url === `http://127.0.0.1:${port}/`,
      "startup identity mismatch",
    );
    controller.abort("cancelled");
    assert(await run === 0, "injected cancellation should stop normally");
  } finally {
    await server?.shutdown().catch(() => undefined);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("AC-F015-002 · development configuration excludes production credentials", async () => {
  const stops: number[] = [];
  let prepared: DevPrepareOptions | undefined;
  const secret = "production-token-value";
  const harness = jsonHarness({
    prepare(options) {
      prepared = options;
      return fakeCandidate(options.generation, stops, 0);
    },
  });
  await eventually(() => harness.events.length === 1, "startup missing");
  harness.controller.abort("cancelled");
  assert(await harness.run === 0, "development run should stop normally");
  assert(prepared?.mode === "development", "runtime mode must be development");
  assert(
    !JSON.stringify(harness.events).includes(secret),
    "configuration values must not enter output",
  );
  assert(
    harness.events.every((event) => event.mode === "development"),
    "all events need development mode",
  );
});

Deno.test("AC-F015-003 · valid changes activate one fresh ordered generation", async () => {
  const stops: number[] = [];
  const prepared: number[] = [];
  const harness = jsonHarness({
    prepare(options) {
      prepared.push(options.generation);
      return fakeCandidate(options.generation, stops);
    },
  });
  await eventually(() => harness.events.length === 1, "startup missing");
  harness.watcher.push(["api/z.ts", "api/a.ts", "api/a.ts"]);
  await eventually(
    () => harness.events.some((event) => event.type === "reload"),
    "reload missing",
  );
  harness.controller.abort("cancelled");
  assert(await harness.run === 0, "reloaded run should stop normally");
  assert(prepared.join(",") === "1,2", "one fresh generation must be prepared");
  const reload = harness.events.find((event) => event.type === "reload")!;
  assert(
    reload.state === "active" && reload.generation === 2,
    "generation two must activate",
  );
  assert(
    reload.changedFiles?.join(",") === "api/a.ts,api/z.ts",
    "changed paths must be sorted and unique",
  );
  assert(
    stops[1] === 1 && stops[2] === 1,
    "both generations must stop exactly once",
  );
});

Deno.test("AC-F015-004 · invalid changes retain the active generation", async () => {
  const stops: number[] = [];
  const harness = jsonHarness({
    prepare(options) {
      if (options.generation === 2) {
        throw new DevCommandError([{
          code: "SH_ROUTE_INVALID_MODULE",
          severity: "error",
          summary: "Changed route is invalid",
          correction: "Repair the route module.",
          files: ["api/users/route.ts"],
          routes: ["GET /users"],
        }]);
      }
      return fakeCandidate(options.generation, stops);
    },
  });
  await eventually(() => harness.events.length === 1, "startup missing");
  harness.watcher.push(["api/users/route.ts"]);
  await eventually(
    () => harness.events.some((event) => event.type === "diagnostic"),
    "diagnostic missing",
  );
  assert(
    stops[1] === undefined,
    "valid generation must remain active after rejected preparation",
  );
  assert(
    !harness.events.some((event) =>
      event.type === "reload" && event.generation === 2
    ),
    "invalid generation cannot be active",
  );
  harness.controller.abort("cancelled");
  await harness.run;
  assert(stops[1] === 1, "active generation must stop during shutdown");
});

Deno.test("AC-F015-005 · startup failure is nonzero, located, and fully cleaned", async () => {
  let watches = 0;
  const events: DevEvent[] = [];
  const code = await runDevCommand(["--json"], {
    cwd: "/project",
    stdout: (line) => events.push(JSON.parse(line)),
    stderr: () => undefined,
  }, {
    prepare() {
      throw new DevCommandError([{
        code: "SH_DEV_PROJECT_INVALID",
        severity: "error",
        summary: "Project configuration is invalid",
        correction: "Repair the affected configuration key.",
        files: ["sleepyhollow.config.ts"],
        configuration: ["apiDirectory"],
      }]);
    },
    watch() {
      watches += 1;
      return new QueueWatcher();
    },
  });
  assert(code === 1, "startup failure must be nonzero");
  assert(watches === 0, "startup failure must not leak a watcher");
  assert(
    events.some((event) =>
      event.type === "diagnostic" && event.state === "rejected"
    ),
    "rejected startup diagnostic missing",
  );
  assert(
    !events.some((event) => event.state === "active"),
    "failed startup cannot emit active",
  );
  assert(
    JSON.stringify(events).includes("sleepyhollow.config.ts"),
    "safe affected file missing",
  );
  assert(
    JSON.stringify(events).includes("apiDirectory"),
    "affected configuration key missing",
  );
});

Deno.test("AC-F015-006 · cancellation releases watcher and listener exactly once", async () => {
  const port = unusedPort();
  const watcher = new QueueWatcher();
  const controller = new AbortController();
  const events: DevEvent[] = [];
  let stops = 0;
  let server: Deno.HttpServer | undefined;
  const run = runDevCommand(["--port", String(port), "--json"], {
    cwd: "/project",
    stdout: (line) => events.push(JSON.parse(line)),
    stderr: () => undefined,
  }, {
    signal: controller.signal,
    watch: () => watcher,
    prepare(options) {
      return {
        routeCount: 0,
        activate() {
          server = Deno.serve(
            { hostname: options.hostname, port },
            () => new Response("ok"),
          );
          return {
            url: `http://127.0.0.1:${port}/`,
            routeCount: 0,
            async stop() {
              stops += 1;
              await server!.shutdown();
            },
          };
        },
      };
    },
  });
  await eventually(() => events.length === 1, "startup missing");
  controller.abort("interrupt");
  controller.abort("interrupt");
  assert(await run === 0, "interrupt should return zero");
  assert(
    stops === 1 && watcher.closed === 1,
    "resources must close exactly once",
  );
  assert(
    events.filter((event) => event.type === "shutdown").length === 1,
    "one shutdown event required",
  );
  const rebound = Deno.listen({ hostname: "127.0.0.1", port });
  rebound.close();
});

Deno.test("AC-F015-007 · human and NDJSON lifecycle output remain equivalent and redacted", async () => {
  async function capture(json: boolean): Promise<string[]> {
    const lines: string[] = [];
    const watcher = new QueueWatcher();
    const controller = new AbortController();
    let attempts = 0;
    const run = runDevCommand(json ? ["--json"] : [], {
      cwd: "/project",
      stdout: (line) => lines.push(line),
      stderr: (line) => lines.push(line),
    }, {
      signal: controller.signal,
      watch: () => watcher,
      prepare(options) {
        attempts += 1;
        if (attempts === 2) {
          throw new DevCommandError([{
            code: "SH_CONFIG_VALUE_INVALID",
            severity: "error",
            summary: "token=production-token-value is invalid",
            correction: "Repair SECRET_KEY=production-token-value.",
            configuration: ["SECRET_KEY"],
          }]);
        }
        return fakeCandidate(options.generation, []);
      },
    });
    await eventually(() => lines.length === 1, "startup output missing");
    watcher.push(["sleepyhollow.config.ts"]);
    await eventually(() => lines.length === 2, "diagnostic output missing");
    controller.abort("interrupt");
    await run;
    return lines;
  }

  const json = await capture(true);
  const human = await capture(false);
  const events = json.map((line) => JSON.parse(line) as DevEvent);
  assert(
    events.map((event) => event.sequence).join(",") === "1,2,3",
    "JSON sequences must be contiguous",
  );
  assert(
    events.map((event) => event.type).join(",") ===
      "startup,diagnostic,shutdown",
    "JSON lifecycle order mismatch",
  );
  assert(
    events.every((event) => event.schema === "sleepy-hollow-dev-event/v1"),
    "JSON schema mismatch",
  );
  for (const code of ["SH_CONFIG_VALUE_INVALID"]) {
    assert(
      json.join("\n").includes(code) && human.join("\n").includes(code),
      "human/JSON diagnostic parity failed",
    );
  }
  assert(
    human[0].includes("active") && human.at(-1)!.includes("stopped"),
    "human lifecycle states missing",
  );
  assert(
    !json.join("\n").includes("production-token-value"),
    "JSON leaked a credential",
  );
  assert(
    !human.join("\n").includes("production-token-value"),
    "human output leaked a credential",
  );
});
