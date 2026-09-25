import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RouteEffects } from "./components/RouteEffects";
import "./styles.css";

const ProjectPage = lazy(() =>
  import("./pages/ProjectPage").then((module) => ({
    default: module.ProjectPage,
  })),
);
const CvPrintPage = lazy(() =>
  import("./pages/CvPrintPage").then((module) => ({
    default: module.CvPrintPage,
  })),
);

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="shell empty-page">
          <p className="eyebrow">Something didn’t load</p>
          <h1>Let’s try that again.</h1>
          <p>A connection or update may have interrupted this page.</p>
          <button
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
          <a className="text-link" href="/">
            Return home
          </a>
        </main>
      );
    return this.props.children;
  }
}
function App() {
  return (
    <PageErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Suspense
          fallback={
            <main className="shell empty-page" role="status">
              Loading page…
            </main>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cv-print" element={<CvPrintPage />} />
            <Route path="/projects/:slug" element={<ProjectPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <RouteEffects />
        </Suspense>
      </BrowserRouter>
    </PageErrorBoundary>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
