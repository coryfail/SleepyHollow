import { normalizeArchitecture } from "./architecture.ts";
import {
  ServiceArchitectureError,
  ServiceCancelledError,
  ServiceDeadlineError,
  ServiceUnavailableError,
} from "./errors.ts";
import type {
  CreateServiceClientOptions,
  DeadlineScheduler,
  ServiceClientOptions,
} from "./types.ts";

const defaultScheduler: DeadlineScheduler = {
  set(callback, delayMs) {
    return globalThis.setTimeout(callback, delayMs);
  },
  clear(handle) {
    globalThis.clearTimeout(handle as number);
  },
};

function invalid(
  summary: string,
  correction: string,
): ServiceArchitectureError {
  return new ServiceArchitectureError([{
    code: "SH_SERVICE_CLIENT_INVALID",
    summary,
    correction,
  }]);
}

export function serviceClientOptions(
  options: CreateServiceClientOptions,
): ServiceClientOptions {
  const architecture = normalizeArchitecture(options.architecture);
  const caller = architecture.services.find((item) =>
    item.id === options.callerServiceId
  );
  const target = architecture.services.find((item) =>
    item.id === options.targetServiceId
  );
  if (!caller || !target) {
    throw invalid(
      "The outbound service caller or target is undeclared",
      "Declare both services in the approved normalized architecture.",
    );
  }
  if (!caller.dependencies.some((item) => item.serviceId === target.id)) {
    throw invalid(
      `${caller.id} has no approved dependency on ${target.id}`,
      "Declare the target, authentication requirement, and caller failure criteria before constructing a client.",
    );
  }
  let url: URL;
  try {
    url = new URL(options.baseUrl);
  } catch {
    throw invalid(
      "The outbound service base URL is invalid",
      "Configure one explicit absolute HTTP or HTTPS service URL.",
    );
  }
  if (
    !(["http:", "https:"].includes(url.protocol)) || url.username ||
    url.password
  ) {
    throw invalid(
      "The outbound service base URL is unsafe",
      "Use an HTTP or HTTPS URL without embedded credentials.",
    );
  }
  if (
    !Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0 ||
    options.timeoutMs > 120_000
  ) {
    throw invalid(
      "The outbound service timeout is unbounded or invalid",
      "Set a positive integer timeout no greater than 120000 milliseconds.",
    );
  }
  if (
    !options.requestId || options.requestId.length > 200 ||
    /[\r\n]/.test(options.requestId)
  ) {
    throw invalid(
      "The outbound service request ID is missing or unsafe",
      "Propagate one bounded request ID without control characters.",
    );
  }
  const scheduler = options.scheduler ?? defaultScheduler;

  return {
    baseUrl: url.toString().replace(/\/$/, ""),
    responseValidation: "error",
    authenticate: async (context) => {
      const authenticated = options.authenticate
        ? await options.authenticate(context)
        : context.request;
      if (!(authenticated instanceof Request)) {
        throw invalid(
          "The approved authentication hook returned an invalid request",
          "Return a Web Standards Request without storing credentials in the client.",
        );
      }
      const headers = new Headers(authenticated.headers);
      headers.set("x-request-id", options.requestId);
      return new Request(authenticated, { headers });
    },
    fetch: async (request) => {
      const controller = new AbortController();
      let cause: "deadline" | "cancelled" | undefined;
      const cancel = () => {
        if (!cause) cause = "cancelled";
        controller.abort();
      };
      const deadline = () => {
        if (!cause) cause = "deadline";
        controller.abort();
      };
      const signals = [request.signal, options.parentSignal].filter(
        (signal): signal is AbortSignal => Boolean(signal),
      );
      for (const signal of signals) {
        if (signal.aborted) cancel();
        else signal.addEventListener("abort", cancel, { once: true });
      }
      const timer = scheduler.set(deadline, options.timeoutMs);
      try {
        if (cause === "deadline") throw new ServiceDeadlineError();
        if (cause === "cancelled") throw new ServiceCancelledError();
        const response = await options.fetch(
          new Request(request, { signal: controller.signal }),
        );
        if (cause === "deadline") throw new ServiceDeadlineError();
        if (cause === "cancelled") throw new ServiceCancelledError();
        return response;
      } catch (error) {
        if (error instanceof ServiceDeadlineError || cause === "deadline") {
          throw new ServiceDeadlineError();
        }
        if (error instanceof ServiceCancelledError || cause === "cancelled") {
          throw new ServiceCancelledError();
        }
        if (error instanceof ServiceUnavailableError) throw error;
        throw new ServiceUnavailableError();
      } finally {
        scheduler.clear(timer);
        for (const signal of signals) {
          signal.removeEventListener("abort", cancel);
        }
      }
    },
  };
}
