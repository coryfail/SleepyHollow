import type { PageId } from "../App";

const repositoryUrl = "https://github.com/coryfail/SleepyHollow";

export default function SiteHeader({ currentPage }: { currentPage: PageId }) {
  const basePath = import.meta.env.BASE_URL;

  return (
    <header className="site-header">
      <nav className="nav-pill" aria-label="Primary navigation">
        <a
          className="wordmark"
          href={basePath}
          aria-current={currentPage === "sleepy-hollow" ? "page" : undefined}
        >
          Sleepy Hollow
        </a>
        <ul className="nav-pill__links">
          <li>
            <a
              href={`${basePath}sgad/`}
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
