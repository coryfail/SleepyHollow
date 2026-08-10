import { groups, guidesInGroup } from "../../docs";
import { frameworkInstallCommand, sitePaths } from "../../site";

export default function DocsIndexPage() {
  return (
    <main id="main-content" className="docs-index">
      <header className="docs-index__head">
        <p className="status-line">Sleepy Hollow · Documentation</p>
        <h1>Documentation</h1>
        <p className="docs-index__lede">
          Everything here is generated from the Markdown in the repository, so a
          page can never disagree with the source it documents. Start with{" "}
          <a href="/docs/getting-started/">Getting started</a> if you have not
          installed anything yet.
        </p>
        <div className="install-line install-line--compact">
          <pre tabIndex={0}><code>{frameworkInstallCommand}</code></pre>
        </div>
      </header>

      {groups.map((group) => (
        <section className="docs-index__group" key={group.id} aria-labelledby={`group-${group.id}`}>
          <div className="docs-index__group-head">
            <h2 id={`group-${group.id}`}>{group.title}</h2>
            <p>{group.description}</p>
          </div>
          <ul className="docs-index__list">
            {guidesInGroup(group.id).map((guide) => (
              <li key={guide.route}>
                <a href={guide.route}>{guide.title}</a>
                <span>{guide.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="docs-index__group" aria-labelledby="group-api">
        <div className="docs-index__group-head">
          <h2 id="group-api">Reference</h2>
          <p>
            Every exported symbol, its type, and its documentation comment —
            generated from the framework source by the Deno toolchain, so it
            describes the code as it is rather than as it was written up.
          </p>
        </div>
        <ul className="docs-index__list">
          <li>
            <a href={sitePaths.api}>API reference</a>
            <span>
              Generated from the source documentation comments of every published
              entry point. Opens the generated reference, which uses its own
              layout.
            </span>
          </li>
        </ul>
      </section>
    </main>
  );
}
