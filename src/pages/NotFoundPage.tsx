import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
export function NotFoundPage() {
  return (
    <main className="shell empty-page" tabIndex={-1}>
      <p className="eyebrow">404 / A wrong turn</p>
      <h1>This page doesn’t exist.</h1>
      <p>The address may have changed. There’s plenty more to explore.</p>
      <Link className="btn btn--primary" to="/">
        <ArrowLeft size={16} />
        Back to the portfolio
      </Link>
    </main>
  );
}
