const repositoryUrl = "https://github.com/coryfail/SleepyHollow";

export default function SleepyHollowPage() {
  const sgadPageUrl = `${import.meta.env.BASE_URL}sgad/`;

  return (
    <main id="main-content" className="home-page">
      <section className="hero home-hero" aria-labelledby="home-title">
        <div className="hero__copy">
          <p className="status-line">
            <span className="status-line__mark" aria-hidden="true" />
            Sleepy Hollow · In development
          </p>
          <h1 id="home-title">The agent can build it. You decide what holds.</h1>
          <p className="hero__lede">
            Sleepy Hollow is an agentic-first headless API framework for Deno,
            a runtime that runs JavaScript and TypeScript outside the browser.
            It is being designed to turn an application idea into reviewed requirements,
            mapped tests, independently checked code, and a deployable API.
          </p>
        </div>
      </section>

      <section className="framework" aria-labelledby="framework-title">
        <div className="section-intro">
          <h2 id="framework-title">A framework built around review, not guesswork.</h2>
          <p>
            Agents are fast at producing code. Sleepy Hollow is intended to make
            that speed inspectable: an agent skill plans and implements while
            deterministic framework verification uses reproducible tools to check the result.
          </p>
        </div>

        <dl className="framework__ledger">
          <div>
            <dt>Start with intent</dt>
            <dd>Plain language becomes reviewed requirements before production behavior appears.</dd>
          </div>
          <div>
            <dt>Keep context close</dt>
            <dd>Requirements, acceptance tests, and implementation live beside the behavior they govern.</dd>
          </div>
          <div>
            <dt>Make tests earn trust</dt>
            <dd>
              Test-driven development means tests are written first, then shown
              failing for the expected missing behavior before implementation satisfies them.
            </dd>
          </div>
          <div>
            <dt>Separate maker from judge</dt>
            <dd>
              The producing agent does not certify itself. Deterministic checks
              inspect the current repository and retain the evidence.
            </dd>
          </div>
        </dl>
      </section>

      <section className="home-sgad-callout" aria-labelledby="home-sgad-title">
        <div>
          <p className="home-sgad-callout__label">The method beneath the framework</p>
          <h2 id="home-sgad-title">Sleepy Hollow is built through SGAD.</h2>
        </div>
        <div className="home-sgad-callout__copy">
          <p>
            Specification-Governed Agentic Development keeps human-approved
            behavioral intent, bounded agent work, and independent evidence connected.
            The method can be used with or without Sleepy Hollow.
          </p>
          <div className="hero__actions" aria-label="Continue learning">
            <a className="text-action text-action--primary" href={sgadPageUrl}>
              Read how SGAD works <span aria-hidden="true">→</span>
            </a>
            <a className="text-action" href={repositoryUrl}>
              View Sleepy Hollow on GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
