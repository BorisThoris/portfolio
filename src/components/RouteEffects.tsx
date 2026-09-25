import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { getProject } from "../projects";

const site = "https://boris-portfolio-git.pages.dev";
const homeTitle =
  "Boris Bostandzhiev | Full-stack Engineer & Creative Developer";
const homeDescription =
  "Full-stack engineer in Sofia building product interfaces, browser music tools, games, and interactive worlds. Explore selected projects and professional experience.";

export function RouteEffects() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const previousPath = useRef(location.pathname);
  const isFirst = useRef(true);
  const initialTitle = useRef(document.title);
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const projectMatch = /^\/projects\/([^/]+)$/.exec(pathname);
  const project = projectMatch ? getProject(projectMatch[1]) : undefined;
  const missing = pathname !== "/" && pathname !== "/cv-print" && !project;
  const title = missing
    ? "Page not found | Boris Bostandzhiev"
    : project
      ? `${project.title} | Boris Bostandzhiev`
      : pathname === "/cv-print"
        ? "Résumé | Boris Bostandzhiev"
        : homeTitle;
  const description = project?.description ?? homeDescription;

  useEffect(() => {
    document.title = title;
    const update = (selector: string, content: string) => {
      document.querySelector(selector)?.setAttribute("content", content);
    };
    update('meta[name="description"]', description);
    update('meta[property="og:title"]', title);
    update('meta[name="twitter:title"]', title);
    update('meta[property="og:description"]', description);
    update('meta[name="twitter:description"]', description);
    update('meta[property="og:url"]', `${site}${location.pathname}`);
    const image = project?.screenshot
      ? `${site}/project-shots/${project.slug}/latest/card.jpg`
      : `${site}/social-preview-v3.png`;
    update('meta[property="og:image"]', image);
    update('meta[property="og:image:secure_url"]', image);
    update('meta[name="twitter:image"]', image);
    update(
      'meta[property="og:image:alt"]',
      project ? `${project.title} screenshot` : "Boris Bostandzhiev portfolio",
    );
    update(
      'meta[name="twitter:image:alt"]',
      project ? `${project.title} screenshot` : "Boris Bostandzhiev portfolio",
    );
    // Project captures vary in dimensions, so do not inherit the homepage size.
    document
      .querySelectorAll(
        'meta[property="og:image:width"], meta[property="og:image:height"], meta[property="og:image:type"]',
      )
      .forEach((node) => node.remove());
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", `${site}${location.pathname}`);
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.append(robots);
    }
    robots.content = missing ? "noindex, follow" : "index, follow";
    const schema = document.querySelector("#site-schema");
    if (schema)
      schema.textContent = JSON.stringify(
        project
          ? {
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              name: project.title,
              description,
              url: `${site}${location.pathname}`,
              author: { "@type": "Person", name: "Boris Bostandzhiev" },
            }
          : {
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Boris Bostandzhiev",
              url: site,
              jobTitle: "Full-stack Engineer",
              sameAs: [
                "https://github.com/BorisThoris",
                "https://www.linkedin.com/in/boris-b-22566b171/",
              ],
            },
      );
  }, [title, description, project, missing, location.pathname]);

  useLayoutEffect(() => {
    const oldRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const saved = positions.current.get(location.key);
    let hashTarget: HTMLElement | null = null;
    try {
      hashTarget = location.hash
        ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
        : null;
    } catch {
      /* A malformed URL fragment must not break navigation. */
    }
    if (navigationType === "POP" && saved !== undefined)
      window.scrollTo({ top: saved, behavior: "instant" });
    else if (hashTarget) hashTarget.scrollIntoView();
    else if (previousPath.current !== location.pathname)
      window.scrollTo({ top: 0, behavior: "instant" });
    if (!isFirst.current && previousPath.current !== location.pathname) {
      document
        .querySelector<HTMLElement>("main")
        ?.focus({ preventScroll: true });
    }
    previousPath.current = location.pathname;
    isFirst.current = false;
    return () => {
      positions.current.set(location.key, window.scrollY);
      window.history.scrollRestoration = oldRestoration;
    };
  }, [location.key, location.pathname, location.hash, navigationType]);
  return (
    <span className="visually-hidden" role="status">
      {title === initialTitle.current ? "" : title}
    </span>
  );
}
