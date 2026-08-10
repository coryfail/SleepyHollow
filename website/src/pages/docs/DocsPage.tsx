import { guideForRoute } from "../../docs";
import { repositoryUrl, sitePaths } from "../../site";
import DocsNav from "./DocsNav";

export default function DocsPage({ route }: { route: string }) {
  const guide = guideForRoute(route);

  if (!guide) {
    return (
      <main id="main-content" className="docs-page docs-page--missing">
        <h1>Guide not found</h1>
        <p>
          That guide is not part of this release.{" "}
          <a href={sitePaths.docs}>Browse the documentation index</a>.
        </p>
      </main>
    );
  }

  const sourceUrl = `${repositoryUrl}/blob/main/${guide.sourcePath}`;

  return (
    <main id="main-content" className="docs-page">
      <DocsNav current={guide.route} />

      <article className="docs-body">
        <header className="docs-body__head">
          <p className="status-line">
            <a href={sitePaths.docs}>Documentation</a>
            <span aria-hidden="true">·</span>
            {guide.group === "framework" ? "Framework" : "SGAD methodology"}
          </p>
          <h1>{guide.title}</h1>
          {guide.summary ? <p className="docs-body__lede">{guide.summary}</p> : null}
        </header>

        {/* Generated at build time from the canonical Markdown; see scripts/generate-docs.mjs. */}
        <div className="doc-article" dangerouslySetInnerHTML={{ __html: guide.html }} />

        <footer className="docs-body__foot">
          {guide.next
            ? (
              <a className="docs-next" href={guide.next.route}>
                <span className="docs-next__label">Next</span>
                <span className="docs-next__title">{guide.next.title}</span>
                <span aria-hidden="true">→</span>
              </a>
            )
            : (
              <a className="docs-next" href={sitePaths.docs}>
                <span className="docs-next__label">Back to</span>
                <span className="docs-next__title">All documentation</span>
                <span aria-hidden="true">→</span>
              </a>
            )}
          <p className="docs-body__source">
            This page is generated from{" "}
            <a href={sourceUrl}>
              {guide.sourcePath} <span aria-hidden="true">↗</span>
            </a>{" "}
            in the repository. Corrections belong in that file.
          </p>
        </footer>
      </article>
    </main>
  );
}
