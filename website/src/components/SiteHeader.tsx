import type { PageId } from "../App";
import { repositoryUrl, sitePaths } from "../site";

export default function SiteHeader({ currentPage }: { currentPage: PageId }) {
  return (
    <header className="site-header">
      <nav className="nav-bar" aria-label="Primary navigation">
        <a
          className="wordmark"
          href={sitePaths.home}
          aria-current={currentPage === "sleepy-hollow" ? "page" : undefined}
        >
          Sleepy Hollow
        </a>
        <div className="nav-bar__links">
          <a
            href={sitePaths.home}
            aria-current={currentPage === "sleepy-hollow" ? "page" : undefined}
          >
            Home
          </a>
          <a
            href={sitePaths.docs}
            aria-current={currentPage === "docs" ? "page" : undefined}
          >
            Docs
          </a>
          <a
            href={sitePaths.sgad}
            aria-current={currentPage === "sgad" ? "page" : undefined}
          >
            SGAD Methodology
          </a>
          <a className="nav-bar__external" href={repositoryUrl}>
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
