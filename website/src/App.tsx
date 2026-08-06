import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import SgadPage from "./pages/sgad/SgadPage";
import SleepyHollowPage from "./pages/sleepy-hollow/SleepyHollowPage";

export type PageId = "sleepy-hollow" | "sgad";

function currentDocumentPage(): PageId {
  return document.body.dataset.page === "sgad" ? "sgad" : "sleepy-hollow";
}

export default function App({ page = currentDocumentPage() }: { page?: PageId }) {
  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader currentPage={page} />
      {page === "sgad" ? <SgadPage /> : <SleepyHollowPage />}
      <SiteFooter />
    </div>
  );
}
