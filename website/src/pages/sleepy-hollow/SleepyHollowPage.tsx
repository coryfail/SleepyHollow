import {
  cliInstallCommand,
  frameworkInstallCommand,
  jsrPackageUrl,
  repositoryUrl,
  sitePaths,
} from "../../site";

const routeExample = `// api/bookmarks/[id]/route.ts
import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

const bookmark = z.object({ id: z.string(), url: z.string() }).strict();

export default defineRoute({
  GET: {
    schemas: {
      params: z.object({ id: z.string() }).strict(),
      responses: { 200: bookmark },
    },
    security: { authentication: "none" },
    contract: { summary: "Return one bookmark" },
    handler: ({ params }) =>
      Response.json({ id: params.id, url: "https://example.com" }),
  },
});`;

const checkFailure = `hollow check failed
ERROR SH_CHECK_ROUTE_UNOBSERVED: GET /bookmarks/:id carries approved criteria but runtime capture never observed it
  Exercise the route from a mapped test, or record a justification for the exception.`;

const method = [
  [
    "Write the requirement",
    "You or your agent writes what the endpoint should do, in plain sentences, in a file that sits beside the code.",
  ],
  [
    "You approve it",
    "A human signs off the exact wording. The approval is bound to those words, so nothing can quietly widen the job afterwards.",
  ],
  [
    "Tests come first",
    "The acceptance tests are written from what you approved and run before the code exists. They have to fail because the behavior is missing — not because the setup is broken, which is a different failure and does not count.",
  ],
  [
    "The agent builds it",
    "It writes only enough to turn those tests green, bounded by what you approved. New intent comes back to you instead of arriving inside a commit.",
  ],
  [
    "Evidence closes it",
    "The framework records what actually ran, and the verifier decides whether the work is done. The agent does not get a vote.",
  ],
] as const;

const capabilities = [
  ["Routing", "Routes are files. The directory is the path, so the URL surface cannot drift from the tree."],
  ["Validation", "Every request and response is checked against a Zod schema declared on the route itself."],
  ["Data", "Typed Deno KV resources with declared indexes. Every query carries a bound."],
  ["Security", "Each route states its authentication mode. There is no implicit default to forget."],
  ["Contracts", "OpenAPI documents and typed clients are generated from the schemas already on your routes."],
  ["Deploy", "One command ships a verified revision to your own Deno Deploy account, on your own token."],
];

export default function SleepyHollowPage() {
  return (
    <main id="main-content" className="home-page">
      <section className="hero home-hero" aria-labelledby="home-title">
        <div className="hero__copy">
          <p className="status-line">Sleepy Hollow · In development · Published to JSR</p>
          <h1 id="home-title">Endpoints at agent speed. Standards at senior level.</h1>
          <p className="hero__lede">
            Sleepy Hollow is an agentic-first headless API framework for Deno, the runtime that
            runs JavaScript and TypeScript outside the browser. It has
            Specification-Governed Agentic Development built in — the method that gives an
            AI the requirements, procedures, and proof of work you would expect from a senior
            engineer. Build endpoints rapidly, without giving up the review you would
            demand from any other developer.
          </p>
          <div className="hero__actions" aria-label="Get started">
            <a className="text-action text-action--primary" href={sitePaths.docs}>
              Read the documentation <span aria-hidden="true">→</span>
            </a>
            <a className="text-action" href={jsrPackageUrl}>
              View the package on JSR <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      <section className="home-problem" aria-labelledby="problem-title">
        <div className="section-intro">
          <p className="eyebrow">Why it exists</p>
          <h2 id="problem-title">AI needs what every developer needs.</h2>
        </div>
        <div className="home-problem__copy">
          <p>
            Just like any human developer, an AI agent needs a set of procedures, best
            practices, and requirements to work against. Nobody hands a new
            engineer a vague sentence and merges whatever comes back; they get a
            spec, the team's standards, and a review before anything ships. An
            ordinary API framework gives an agent none of the three.
          </p>
          <p>
            So the agent invents its own. It decides what the endpoint should
            do, writes tests that agree with the code it just wrote, and reports
            success. The result is plausible, fast, and unreviewable — plausible
            code, plausible tests, and a green checkmark that nothing stands
            behind.
          </p>
          <p className="home-problem__line">
            Sleepy Hollow gives the agent the standards. Then it checks the
            work against them.
          </p>
        </div>
      </section>

      <section className="home-method" aria-labelledby="method-title">
        <div className="section-intro">
          <p className="eyebrow">The method, built in</p>
          <h2 id="method-title">Five steps, enforced by the framework.</h2>
          <p>
            Specification-Governed Agentic Development is not a document you are
            asked to follow. It is how the tooling works, so skipping a step
            means the build fails rather than the discipline quietly lapsing.
          </p>
        </div>
        <div className="home-method__body">
          <ol className="home-method__steps">
            {method.map(([title, description], index) => (
              <li key={title}>
                <span className="home-method__number" aria-hidden="true">{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <a className="text-action" href={sitePaths.sgad}>
            Read how SGAD works <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="home-code" aria-labelledby="code-title">
        <div className="section-intro">
          <p className="eyebrow">What you write</p>
          <h2 id="code-title">A route is a file that declares itself.</h2>
          <p>
            Every schema is a Zod schema and every object schema is{" "}
            <code>.strict()</code>. The runtime rejects anything looser when it
            starts, rather than at the first bad request — which means an agent
            cannot ship a route whose inputs, outputs, and authentication were
            left unstated.
          </p>
        </div>
        <div className="code-block" tabIndex={0} role="region" aria-label="A Sleepy Hollow route definition">
          <span className="code-block__lang">ts</span>
          <pre><code>{routeExample}</code></pre>
        </div>
      </section>

      <section className="home-capabilities" aria-labelledby="framework-title">
        <div className="section-intro">
          <p className="eyebrow">What you get</p>
          <h2 id="framework-title">The ordinary things a backend needs.</h2>
          <p>
            None of this is the interesting part. It is here so that the
            interesting part has something to verify, and so that a reviewed
            requirement can become a deployable API without leaving the
            framework.
          </p>
        </div>

        <dl className="framework__ledger framework__ledger--plain">
          {capabilities.map(([term, description]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="home-check" aria-labelledby="check-title">
        <div className="section-intro">
          <p className="eyebrow">The review step</p>
          <h2 id="check-title">The part an agent cannot talk its way through.</h2>
          <p>
            While your tests run, the framework records what each handler
            actually did. Then <code>hollow check</code> reads that recording
            rather than the agent's summary. A route carrying approved criteria
            that no test ever exercised does not pass quietly — it fails, by
            name:
          </p>
        </div>
        <div className="home-check__panel">
          <div className="code-block" tabIndex={0} role="region" aria-label="Example hollow check failure">
            <pre><code>{checkFailure}</code></pre>
          </div>
          <p className="home-check__note">
            The same command fails on a stale or missing evidence artifact, so a
            passing result cannot be inherited from an older revision. This is
            deterministic: the same repository state produces the same verdict,
            on your machine and in CI alike.
            Test-driven development supplies the tests; the recording decides whether
            they meant anything. None of it tells you the code is right — that
            still needs your judgment, and your security review. It tells you
            the work was actually done.
          </p>
        </div>
      </section>

      <section className="home-install" aria-labelledby="install-title">
        <div className="section-intro">
          <p className="eyebrow">Getting it</p>
          <h2 id="install-title">Install</h2>
          <p>
            Sleepy Hollow targets Deno. It uses Deno KV, Deno runtime APIs, and
            Deno Deploy, and does not support Node or Bun. The API is pre-1.0
            and may still change.
          </p>
        </div>
        <div className="home-install__commands">
          <div className="install-line">
            <p id="install-framework">Add the framework to a project</p>
            <pre aria-labelledby="install-framework" tabIndex={0}><code>{frameworkInstallCommand}</code></pre>
          </div>
          <div className="install-line">
            <p id="install-cli">Install the CLI as hollow</p>
            <pre aria-labelledby="install-cli" tabIndex={0}><code>{cliInstallCommand}</code></pre>
          </div>
          <div className="hero__actions" aria-label="Continue">
            <a className="text-action" href={sitePaths.docs}>
              Getting started guide <span aria-hidden="true">→</span>
            </a>
            <a className="text-action" href={repositoryUrl}>
              View Sleepy Hollow on GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      <section className="home-sgad-callout" aria-labelledby="home-sgad-title">
        <div>
          <p className="home-sgad-callout__label">The method beneath the framework</p>
          <h2 id="home-sgad-title">SGAD works without this framework too.</h2>
        </div>
        <div className="home-sgad-callout__copy">
          <p>
            The method Sleepy Hollow implements is open, framework-independent,
            and usable in any language with ordinary Markdown, source control,
            and the test runner you already have. A human approves
            reviewed requirements, an agent implements only what they authorize,
            and evidence — not a status message — decides when the work is done.
          </p>
          <div className="hero__actions" aria-label="Continue learning">
            <a className="text-action text-action--primary" href={sitePaths.sgad}>
              Read how SGAD works <span aria-hidden="true">→</span>
            </a>
            <a className="text-action" href={sitePaths.api}>
              Browse the API reference <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
