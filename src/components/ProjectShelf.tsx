import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { categoryFor } from "../content/home";
import { Project } from "../projects";
import { useMediaQuery } from "../lib/runtime";
import { ProjectMedia } from "./ProjectMedia";
import "../project-shelf.css";

type ProjectShelfProps = {
  title: string;
  projects: Project[];
  eyebrow?: string;
  className?: string;
  headingLevel?: 2 | 3;
};

export function ProjectShelf({
  title,
  projects,
  eyebrow,
  className = "",
  headingLevel = 3,
}: ProjectShelfProps) {
  const headingId = useId();
  const railRef = useRef<HTMLUListElement>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const Heading = headingLevel === 2 ? "h2" : "h3";

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanScrollBack(rail.scrollLeft > 4);
    setCanScrollForward(
      rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4,
    );
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [projects, updateScrollState]);

  function scroll(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(280, rail.clientWidth * 0.82),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }

  if (projects.length === 0) return null;

  return (
    <section
      className={`project-shelf ${className}`.trim()}
      aria-labelledby={headingId}
    >
      <header className="project-shelf__header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <Heading id={headingId}>{title}</Heading>
        </div>
        <div
          className="project-shelf__controls"
          role="group"
          aria-label={`${title} controls`}
        >
          <button
            type="button"
            className="icon-button"
            aria-label={`Scroll ${title} backward`}
            disabled={!canScrollBack}
            onClick={() => scroll(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`Scroll ${title} forward`}
            disabled={!canScrollForward}
            onClick={() => scroll(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>
      <ul
        className="project-shelf__rail"
        ref={railRef}
        onScroll={updateScrollState}
      >
        {projects.map((project) => (
          <li className="project-shelf__item" key={project.slug}>
            <ProjectTile project={project} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectTile({ project }: { project: Project }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="project-tile"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <ProjectMedia project={project} mode="card" active={hovered || focused} />
      <Link className="project-tile__body" to={`/projects/${project.slug}`}>
        <span className="project-tile__heading">
          <strong>{project.title}</strong>
          <span>{categoryFor(project.tags)}</span>
        </span>
        <span className="project-tile__subtitle">{project.subtitle}</span>
        <span className="project-tile__tags" aria-hidden="true">
          {project.tags.slice(0, 3).join(" · ")}
        </span>
      </Link>
    </div>
  );
}
