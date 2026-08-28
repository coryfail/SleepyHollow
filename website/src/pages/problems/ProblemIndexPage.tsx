import { problems } from "../../problems";
import { sitePaths } from "../../site";

export default function ProblemIndexPage() {
  return (
    <main id="main-content" className="problem-index">
      <header className="problem-index__head">
        <p className="status-line">RFC 9457 · Problem details</p>
        <h1>Every failure has a stable address.</h1>
        <p className="problem-index__lede">
          These are the machine-readable problem types Sleepy Hollow emits at
          the request boundary. Use the type URI as a stable link in logs,
          clients, and support playbooks.
        </p>
        <p className="problem-index__backline">
          <a className="text-action" href={sitePaths.docs}>
            Read the documentation <span aria-hidden="true">→</span>
          </a>
        </p>
      </header>

      <section className="problem-index__list" aria-labelledby="problem-index-title">
        <div className="problem-index__section-head">
          <p className="eyebrow">The catalogue</p>
          <h2 id="problem-index-title">Published problem types</h2>
        </div>
        <ol>
          {problems.map((problem) => (
            <li key={problem.route}>
              <a className="problem-card" href={problem.route}>
                <span className="problem-card__status">{problem.status}</span>
                <span className="problem-card__body">
                  <span className="problem-card__title">{problem.title}</span>
                  <span className="problem-card__uri">
                    {problem.typeUri}
                  </span>
                  <span className="problem-card__summary">{problem.summary}</span>
                </span>
                <span className="problem-card__arrow" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
