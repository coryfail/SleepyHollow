import { spawn as spawnChild } from "child_process";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "fs/promises";
import { readdirSync, watch, type FSWatcher } from "fs";
import { symlink } from "fs/promises";
import { Readable } from "stream";
import { tmpdir } from "os";
import { join } from "path";
import {
  serve as nodeServe,
  type FetchHandler,
  type HttpServer,
  type ServerOptions,
} from "./server.ts";

export type { HttpServer, ServerOptions } from "./server.ts";

export interface PlatformDirEntry {
  readonly name: string;
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly isSymlink: boolean;
}

export interface PlatformCommandOutput {
  readonly code: number;
  readonly success: boolean;
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
}

class NotFound extends Error {
  constructor(path?: string) {
    super(path ? `Not found: ${path}` : "Not found");
    this.name = "NotFound";
  }
}

function normalizeFilesystemError(error: unknown, path?: string): never {
  if (typeof error === "object" && error !== null && "code" in error &&
    (error as { readonly code?: unknown }).code === "ENOENT") {
    throw new NotFound(path);
  }
  throw error;
}

async function filesystem<T>(operation: Promise<T>, path?: string): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    return normalizeFilesystemError(error, path);
  }
}

interface CommandOptions {
  readonly args?: readonly string[];
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly clearEnv?: boolean;
  readonly stdin?: "null" | "piped";
  readonly stdout?: "piped" | "null";
  readonly stderr?: "piped" | "null";
}

export class Command {
  readonly #command: string;
  readonly #options: CommandOptions;

  constructor(command: string, options: CommandOptions = {}) {
    this.#command = command;
    this.#options = options;
  }

  async output(): Promise<PlatformCommandOutput> {
    const child = spawnChild(this.#command, this.#options.args ?? [], {
      cwd: this.#options.cwd,
      env: this.#options.clearEnv ? this.#options.env : { ...process.env, ...this.#options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    const code = await new Promise<number>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (status) => resolve(status ?? 1));
    });
    return { code, success: code === 0, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) };
  }

  spawn() {
    const child = spawnChild(this.#command, this.#options.args ?? [], {
      cwd: this.#options.cwd,
      env: this.#options.clearEnv ? this.#options.env : { ...process.env, ...this.#options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return {
      stdout: Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>,
      stderr: Readable.toWeb(child.stderr) as ReadableStream<Uint8Array>,
      status: new Promise<{ code: number; success: boolean }>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code) => {
          const resolved = code ?? 1;
          resolve({ code: resolved, success: resolved === 0 });
        });
      }),
      kill: (signal?: NodeJS.Signals) => child.kill(signal),
    };
  }
}

class Watcher implements AsyncIterable<{ readonly paths: readonly string[] }> {
  readonly #watcher: FSWatcher;
  #closed = false;
  #pending: Array<{ readonly paths: readonly string[] }> = [];
  #resolve?: (event: IteratorResult<{ readonly paths: readonly string[] }>) => void;
  #reject?: (reason: unknown) => void;
  #failure?: unknown;

  constructor(root: string) {
    this.#watcher = watch(root, { recursive: true }, (_event, filename) => {
      const event = { paths: [join(root, String(filename ?? ""))] };
      if (this.#resolve) {
        this.#resolve({ done: false, value: event });
        this.#resolve = undefined;
      } else this.#pending.push(event);
    });
    this.#watcher.on("error", (error) => {
      if (this.#closed) return;
      this.#failure = error;
      this.#closed = true;
      this.#reject?.(error);
      this.#resolve = undefined;
      this.#reject = undefined;
    });
  }

  close(): void {
    this.#closed = true;
    this.#watcher.close();
    this.#resolve?.({ done: true, value: undefined });
    this.#resolve = undefined;
    this.#reject = undefined;
  }

  [Symbol.asyncIterator](): AsyncIterator<{ readonly paths: readonly string[] }> {
    return {
      next: () => {
        const value = this.#pending.shift();
        if (value) return Promise.resolve({ done: false, value });
        if (this.#failure) return Promise.reject(this.#failure);
        if (this.#closed) return Promise.resolve({ done: true, value: undefined });
        return new Promise((resolve, reject) => {
          this.#resolve = resolve;
          this.#reject = reject;
        });
      },
    };
  }
}

export const platform = Object.freeze({
  args: process.argv.slice(2),
  cwd: () => process.cwd(),
  exit: (code?: number) => process.exit(code),
  execPath: () => process.execPath,
  env: Object.freeze({
    get: (name: string) => process.env[name],
    toObject: () => ({ ...process.env }),
  }),
  errors: Object.freeze({
    NotFound,
    AddrInUse: class AddrInUse extends Error {},
    PermissionDenied: class PermissionDenied extends Error {},
  }),
  isNotFound: (error: unknown) =>
    error instanceof NotFound ||
    (typeof error === "object" && error !== null &&
      "code" in error && (error as { readonly code?: unknown }).code === "ENOENT"),
  readTextFile: async (path: string) => filesystem(readFile(path, "utf8"), path),
  readFile: async (path: string) => filesystem(readFile(path), path),
  writeTextFile: async (path: string, text: string, options?: { readonly createNew?: boolean }) =>
    writeFile(path, text, options?.createNew ? { flag: "wx" } : undefined),
  stat: (path: string) => filesystem(stat(path), path),
  lstat: (path: string) => filesystem(lstat(path), path),
  mkdir,
  rename,
  remove: (path: string, options?: { readonly recursive?: boolean }) => rm(path, { recursive: options?.recursive, force: true }),
  realPath: (path: string) => filesystem(realpath(path), path),
  copyFile: (source: string, target: string) => filesystem(copyFile(source, target), source),
  symlink: (target: string, path: string) => filesystem(symlink(target, path), path),
  readDirSync: (path: string) => readdirSync(path, { withFileTypes: true }).map((entry) => ({ name: entry.name, isFile: entry.isFile(), isDirectory: entry.isDirectory(), isSymlink: entry.isSymbolicLink() })),
  makeTempDir: async (options?: { readonly prefix?: string; readonly dir?: string }) =>
    mkdtemp(join(options?.dir ?? tmpdir(), options?.prefix ?? "sleepy-hollow-")),
  async *readDir(path: string): AsyncIterable<PlatformDirEntry> {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      yield { name: entry.name, isFile: entry.isFile(), isDirectory: entry.isDirectory(), isSymlink: entry.isSymbolicLink() };
    }
  },
  watchFs: (root: string, _options?: { readonly recursive?: boolean }) => new Watcher(root),
  addSignalListener: (signal: NodeJS.Signals, listener: () => void) => process.on(signal, listener),
  removeSignalListener: (signal: NodeJS.Signals, listener: () => void) => process.off(signal, listener),
  serve: (options: ServerOptions, handler: FetchHandler): HttpServer => nodeServe(handler, options),
  Command,
});
