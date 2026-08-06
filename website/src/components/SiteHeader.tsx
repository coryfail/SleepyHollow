import type { PageId } from "../App";
import { repositoryUrl, sitePaths } from "../site";

export default function SiteHeader({ currentPage }: { currentPage: PageId }) {
  return (
    <header className="site-header">
      <nav className="nav-pill" aria-label="Primary navigation">
        <a
          className="wordmark"
          href={sitePaths.home}
          aria-current={currentPage === "sleepy-hollow" ? "page" : undefined}
        >
          Sleepy Hollow
        </a>
        <ul className="nav-pill__links">
          <li>
            <a
              href={sitePaths.sgad}
              aria-current={currentPage === "sgad" ? "page" : undefined}
            >
              SGAD
            </a>
          </li>
        </ul>
        <a className="nav-pill__external" href={repositoryUrl}>
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}
