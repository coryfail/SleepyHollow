import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import DocsIndexPage from "./pages/docs/DocsIndexPage";
import DocsPage from "./pages/docs/DocsPage";
import SgadPage from "./pages/sgad/SgadPage";
import SleepyHollowPage from "./pages/sleepy-hollow/SleepyHollowPage";
import { sitePaths } from "./site";

export type PageId = "sleepy-hollow" | "sgad" | "docs";

function currentDocumentPage(): PageId {
  const page = document.body.dataset.page;
  if (page === "sgad") return "sgad";
  if (page === "docs") return "docs";
  return "sleepy-hollow";
}

function currentRoute(): string {
  return document.body.dataset.doc ?? sitePaths.docs;
}

export default function App(
  { page = currentDocumentPage(), route = currentRoute() }: { page?: PageId; route?: string },
) {
  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main-content" tabIndex={0}>Skip to content</a>
      <SiteHeader currentPage={page} />
      {page === "sgad"
        ? <SgadPage />
        : page === "docs"
        ? (route === sitePaths.docs ? <DocsIndexPage /> : <DocsPage route={route} />)
        : <SleepyHollowPage />}
      <SiteFooter />
    </div>
  );
}
