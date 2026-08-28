import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import DocsIndexPage from "./pages/docs/DocsIndexPage";
import DocsPage from "./pages/docs/DocsPage";
import ProblemIndexPage from "./pages/problems/ProblemIndexPage";
import ProblemPage from "./pages/problems/ProblemPage";
import SgadPage from "./pages/sgad/SgadPage";
import SleepyHollowPage from "./pages/sleepy-hollow/SleepyHollowPage";
import { sitePaths } from "./site";

export type PageId = "sleepy-hollow" | "sgad" | "docs" | "problems";

function currentDocumentPage(): PageId {
  const page = document.body.dataset.page;
  if (page === "sgad") return "sgad";
  if (page === "docs") return "docs";
  if (page === "problems") return "problems";
  return "sleepy-hollow";
}

function currentRoute(): string {
  return document.body.dataset.doc ?? document.body.dataset.problem ?? sitePaths.docs;
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
        : page === "problems"
        ? (route === sitePaths.problems ? <ProblemIndexPage /> : <ProblemPage route={route} />)
        : <SleepyHollowPage />}
      <SiteFooter />
    </div>
  );
}
