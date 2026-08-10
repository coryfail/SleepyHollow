import {
  sgadGuideUrl,
  sgadSkillInstallCommand,
  sgadTemplatesUrl,
  sitePaths,
} from "../../site";

const inPractice = [
  [
    "What a developer writes",
    "A short file beside the code saying what the software should do, in plain sentences, with the parts nobody has decided yet marked as undecided instead of guessed at.",
  ],
  [
    "What a human approves",
    "That file, exactly as written. The approval records a fingerprint of the words it approved, so editing them afterwards invalidates it rather than silently carrying the old yes forward.",
  ],
  [
    "What a machine checks",
    "That each promise in the file has a test, that those tests failed before the code existed and pass after, and that the checks were run against the code as it stands now — not as the agent remembers it.",
  ],
  [
    "What a finished change is",
    "A set of records that fit together: the approved file, the run that failed for the right reason, the run that passed, the revision that was built, and where it went. Not a message saying it is done.",
  ],
] as const;

const stages = [
  ["1.0", "Specify", "Write the behavior people actually want. Keep assumptions and unresolved decisions visible instead of letting an agent fill the gaps."],
  ["2.0", "Approve", "A human reviews the exact behavioral intent and grants bounded authority. Approval covers that content, not whatever seems plausible later."],
  ["3.0", "Write acceptance tests", "Turn every approved acceptance criterion into a check with a stable identity. Requirements point to their tests, and governed tests point back."],
  ["4.0", "Observe expected red", "Run those checks before implementation. A meaningful expected-red result fails because behavior is missing, not because of syntax, configuration, dependency, or test environment failure."],
  ["5.0", "Implement", "Let the agent create the smallest behavior the approved specification permits. New intent returns to human review instead of entering through a side door."],
  ["6.0", "Verify independently", "Use a deterministic verification command and reproducible tools to inspect the current revision. The producing agent’s confidence is not the verification verdict."],
  ["7.0", "Deliver with evidence", "Connect the approved requirement, red result, passing tests, implementation revision, and deployment. Completion is an evidence bundle, not a status message."],
] as const;

const adoptionSteps = [
  "Store a requirements.md file beside each independently valuable feature.",
  "Give every stable acceptance-criterion ID a test mapping that survives refactoring.",
  "Record approval inside requirements.md, bound to the exact governed-content digest—a fingerprint of the approved intent.",
  "Keep bidirectional traceability: requirements point to tests and tests point back to requirements.",
  "Append expected-red, verification, and applicable delivery results to the same requirements.md governance record.",
  "Use an independent verification command, not the producing agent’s summary, to decide whether evidence passes.",
];

export default function SgadPage() {
  return (
    <main id="main-content" className="sgad-page">
      <article className="methodology-document">
        <header className="methodology-hero">
          <p className="status-line">An open methodology · Public draft</p>
          <h1>Specification-Governed Agentic Development</h1>
          <p className="methodology-hero__lede">
            SGAD is a proposed open methodology for connecting human intent,
            agent work, and independently checkable evidence. You can use it
            without Sleepy Hollow, a particular agent, or a new platform.
          </p>
          <div className="methodology-install">
            <p id="sgad-install-label">Install the standalone SGAD skill</p>
            <pre
              aria-labelledby="sgad-install-label"
              tabIndex={0}
            ><code>{sgadSkillInstallCommand}</code></pre>
          </div>
        </header>

        <section className="methodology-practice" aria-labelledby="practice-title">
          <div className="methodology-section-head">
            <p>Before the vocabulary</p>
            <h2 id="practice-title">What changes in practice.</h2>
          </div>
          <dl className="practice-ledger">
            {inPractice.map(([term, description]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
          <p className="methodology-practice__note">
            That is the whole idea. The rest of this page names the parts and
            says how they connect. If you would rather read the full
            specification, it is{" "}
            <a href={`${sitePaths.docs}sgad/`}>published on this site</a>.
          </p>
        </section>

        <section className="methodology-prose" aria-labelledby="authority-title">
          <h2 id="authority-title">Behavioral intent stays human.</h2>
          <p>
            Humans review and approve what the software should do. The approved
            specification gives an agent bounded authority to implement it.
            Evidence-based completion comes only after independent verification
            checks the current work. Generation can be delegated; behavioral
            authority and acceptance are not silently delegated with it.
          </p>
          <blockquote>
            Humans approve the intent. Agents implement the specification.
            Independent evidence decides whether the work is complete.
          </blockquote>
        </section>

        <section className="methodology-workflow" aria-labelledby="workflow-title">
          <div className="methodology-section-head">
            <p>Seven responsibilities, one connected record</p>
            <h2 id="workflow-title">The SGAD lifecycle</h2>
          </div>
          <ol className="lifecycle">
            {stages.map(([number, title, body]) => (
              <li key={number}>
                <span className="lifecycle__number" aria-hidden="true">{number}</span>
                <div><h3>{title}</h3><p>{body}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="methodology-adoption" aria-labelledby="adoption-title">
          <div className="methodology-section-head">
            <h2 id="adoption-title">Apply SGAD with tools you already trust.</h2>
            <p>
              Start with Markdown, source control, and your existing test runner.
              The value comes from the connected approval and evidence trail,
              not from adopting a particular framework.
            </p>
          </div>
          <ol className="adoption__steps">
            {adoptionSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>

          <figure className="file-map" aria-labelledby="feature-record-title">
            <figcaption>
              <strong id="feature-record-title">An application record, kept connected.</strong>
              <span>Keep the working files small and the complete governance history beside the behavior it governs.</span>
            </figcaption>

            <div className="file-map__tree">
              <div className="file-map__root"><code>my-application/</code></div>
              <ul className="file-map__files" aria-label="Example SGAD application files">
                <li className="file-map__entry">
                  <code>requirements/application.md</code>
                  <span className="file-map__role">application intent</span>
                </li>
                <li className="file-map__folder">
                  <div className="file-map__folder-head">
                    <code>feature/</code>
                    <span className="file-map__role">colocated behavior</span>
                  </div>
                  <ul className="file-map__nested" aria-label="Files inside the feature folder">
                    <li>
                      <code>requirements.md</code>
                      <span className="file-map__role">intent + governance</span>
                    </li>
                    <li>
                      <code>feature.test.ts</code>
                      <span className="file-map__role">acceptance check</span>
                    </li>
                    <li>
                      <code>feature.ts</code>
                      <span className="file-map__role">implementation</span>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>

            <p className="file-map__evidence">
              Each feature&apos;s requirements.md contains its complete governance
              history: exact-content approval, criterion mapping, red-state
              evidence, independent verification, and applicable delivery results.
              Git reviews and CI runs can be linked as supporting provenance.
              Application-wide intent belongs in requirements/application.md;
              component requirements stay beside their behavior; and optional
              root requirements.md is reserved for repository-wide behavior.
            </p>
          </figure>
        </section>

        <aside className="methodology-caution" aria-labelledby="caution-title">
          <h2 id="caution-title">What SGAD does not promise.</h2>
          <p>
            SGAD is not an established industry standard or a guarantee of correct
            software. Automated checks do not replace human judgment, security
            review, domain expertise, or production monitoring. The method makes
            approval and evidence more explicit so those judgments are easier to inspect.
          </p>
        </aside>

        <nav className="methodology-close" aria-label="Continue with SGAD">
          <a className="text-action text-action--primary" href={`${sitePaths.docs}sgad/`}>
            Read the SGAD guide <span aria-hidden="true">→</span>
          </a>
          <a className="text-action" href={sgadTemplatesUrl}>
            Browse reusable templates <span aria-hidden="true">↗</span>
          </a>
          <a className="text-action" href={sgadGuideUrl}>
            View the sources on GitHub <span aria-hidden="true">↗</span>
          </a>
          <a className="text-action" href={sitePaths.home}>
            Back to Sleepy Hollow <span aria-hidden="true">→</span>
          </a>
        </nav>
      </article>
    </main>
  );
}
