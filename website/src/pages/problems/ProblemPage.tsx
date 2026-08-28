import { problemForRoute, problems } from "../../problems";
import { sitePaths } from "../../site";

export default function ProblemPage({ route }: { route: string }) {
  const problem = problemForRoute(route);

  if (!problem) {
    return (
      <main id="main-content" className="problem-page problem-page--missing">
        <h1>Problem type not found</h1>
        <p>
          That problem type is not part of this release.{" "}
          <a href={sitePaths.problems}>Browse all problem details</a>.
        </p>
      </main>
    );
  }

  return (
    <main id="main-content" className="problem-page">
      <nav className="problem-nav" aria-label="Problem details">
        <a className="problem-nav__back" href={sitePaths.problems}>
          <span aria-hidden="true">←</span> All problem details
        </a>
        <p className="problem-nav__label">Published types</p>
        <ul>
          {problems.map((entry) => (
            <li key={entry.route}>
              <a
                className="problem-nav__link"
                href={entry.route}
                aria-current={entry.route === problem.route ? "page" : undefined}
              >
                <span>{entry.status}</span> {entry.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <article className="problem-body">
        <header className="problem-body__head">
          <p className="status-line">
            <a href={sitePaths.docs}>Documentation</a>
            <span aria-hidden="true">·</span>
            Problem details
          </p>
          <div className="problem-body__identity">
            <span className="problem-body__status">HTTP {problem.status}</span>
            <a className="problem-body__uri" href={problem.route}>
              {problem.typeUri}
            </a>
          </div>
          <h1>{problem.title}</h1>
          <p className="problem-body__lede">{problem.summary}</p>
        </header>

        <div className="doc-article" dangerouslySetInnerHTML={{ __html: problem.html }} />

        <footer className="problem-body__foot">
          {problem.next
            ? (
              <a className="docs-next" href={problem.next.route}>
                <span className="docs-next__label">Next problem type</span>
                <span className="docs-next__title">{problem.next.title}</span>
                <span aria-hidden="true">→</span>
              </a>
            )
            : (
              <a className="docs-next" href={sitePaths.problems}>
                <span className="docs-next__label">Back to</span>
                <span className="docs-next__title">All problem details</span>
                <span aria-hidden="true">→</span>
              </a>
            )}
          <p className="problem-body__source">
            This page is generated from the canonical{" "}
            <code>{problem.sourcePath}</code> file.
          </p>
        </footer>
      </article>
    </main>
  );
}
