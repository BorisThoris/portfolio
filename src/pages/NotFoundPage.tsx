import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
export function NotFoundPage() {
  return (
    <main className="shell empty-page" tabIndex={-1}>
      <p className="eyebrow">404</p>
      <h1>This page doesn’t exist.</h1>
      <p>The link may be old, or the address may be mistyped.</p>
      <Link className="btn btn--primary" to="/">
        <ArrowLeft size={16} />
        Back to the portfolio
      </Link>
    </main>
  );
}
