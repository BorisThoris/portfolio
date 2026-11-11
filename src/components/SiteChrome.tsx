import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Light/dark switch. The page follows the system until the visitor picks a theme;
 * the pick is remembered per browser. index.html applies it before first paint.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => currentTheme());
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => { if (!document.documentElement.dataset.theme) setTheme(currentTheme()); };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", next === "dark" ? "#0e0f11" : "#f5f4f0"));
        try { localStorage.setItem("theme", next); } catch { /* private mode: the choice lasts for this page only */ }
        setTheme(next);
      }}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

const commit = __BUILD_COMMIT__;
const built = new Date(__BUILD_TIME__);

/** "Built 11 Nov 2026 from 103df27": the freshness signal at the foot of every page. */
export function BuildStamp() {
  const date = built.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <span className="build-stamp">
      Built <time dateTime={__BUILD_TIME__}>{date}</time>
      {commit ? (
        <>
          {" "}from{" "}
          <a href={`https://github.com/BorisThoris/portfolio/commit/${commit}`} target="_blank" rel="noreferrer">
            {commit.slice(0, 7)}
          </a>
        </>
      ) : null}
    </span>
  );
}
