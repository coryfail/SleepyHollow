import type { ContractInventory } from "./types.ts";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;",
  )
    .replaceAll('"', "&quot;");
}

export function renderDocs(
  inventory: ContractInventory,
  openApi: string,
): string {
  const operations = inventory.operations.map((operation) => {
    const inputs = Object.keys(operation.request ?? {}).join(", ") || "None";
    const responses = Object.entries(operation.responses).map((
      [status, response],
    ) =>
      `<li><code>${status}</code> ${
        escapeHtml(
          response.contentType ??
            (response.error ? "application/problem+json" : "application/json"),
        )
      } — ${escapeHtml(response.description)}</li>`
    ).join("");
    const security = operation.security.mode === "none"
      ? "Unauthenticated"
      : `Project scheme: ${escapeHtml(operation.security.scheme)}`;
    return `<article id="${
      escapeHtml(operation.operationId)
    }"><p class="method">${escapeHtml(operation.method)} <code>${
      escapeHtml(operation.path)
    }</code></p><h2>${
      escapeHtml(operation.summary)
    }</h2><dl><dt>Operation</dt><dd><code>${
      escapeHtml(operation.operationId)
    }</code></dd><dt>Inputs</dt><dd>${
      escapeHtml(inputs)
    }</dd><dt>Security</dt><dd>${security}</dd></dl><h3>Responses</h3><ul>${responses}</ul></article>`;
  }).join("\n");
  const navigation = inventory.operations.map((operation) =>
    `<li><a href="#${escapeHtml(operation.operationId)}">${
      escapeHtml(operation.summary)
    }</a></li>`
  ).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(inventory.title)} API</title>
  <style>
    :root{color-scheme:light dark;font:16px/1.55 system-ui,sans-serif}body{margin:0;display:grid;grid-template-columns:minmax(13rem,22rem) minmax(0,1fr);max-width:90rem}nav{padding:2rem;position:sticky;top:0;height:100vh;box-sizing:border-box;border-right:1px solid #8888}main{padding:2rem clamp(1rem,5vw,5rem)}article{padding:0 0 3rem;border-bottom:1px solid #8888;margin-bottom:3rem}code{font-family:ui-monospace,monospace;overflow-wrap:anywhere}.method{font-weight:700}a{color:inherit}a:focus-visible{outline:3px solid currentColor;outline-offset:3px}pre{white-space:pre-wrap;max-height:28rem;overflow:auto;padding:1rem;background:#8882}@media(max-width:48rem){body{display:block}nav{position:static;height:auto;border-right:0;border-bottom:1px solid #8888}}
  </style>
</head>
<body>
  <nav aria-label="API operations"><strong>${
    escapeHtml(inventory.title)
  }</strong><ul>${navigation}</ul><a href="#contract">OpenAPI JSON</a></nav>
  <main><header><h1>${escapeHtml(inventory.title)}</h1><p>${
    escapeHtml(inventory.description ?? "Local read-only API contract")
  }</p></header>${operations}<section id="contract"><h2>Embedded OpenAPI contract</h2><pre>${
    escapeHtml(openApi).replaceAll("https://", "https:&#47;&#47;")
  }</pre></section></main>
</body>
</html>
`;
}
