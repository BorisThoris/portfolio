import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search, X } from "lucide-react";
import { visibleProjects } from "../projects";
import {
  categoryFor,
  projectCategories,
  ProjectCategory,
} from "../content/home";
import { CaptureImage } from "./CaptureImage";

export function SupportingProjects() {
  const [category, setCategory] = useState<ProjectCategory>("All work");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const matches = visibleProjects.filter(
    (project) =>
      (category === "All work" || categoryFor(project.tags) === category) &&
      `${project.title} ${project.subtitle} ${project.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const shown = expanded ? matches : matches.slice(0, 6);
  return (
    <section
      id="archive"
      className="project-catalog section"
      aria-labelledby="catalog-title"
    >
      <div className="catalog-heading">
        <h3 id="catalog-title">
          The wider collection{" "}
          <span>{visibleProjects.length.toString().padStart(2, "0")}</span>
        </h3>
        <p>Tools, experiments, and earlier chapters.</p>
      </div>
      <div className="catalog-toolbar">
        <div
          className="catalog-filters"
          role="group"
          aria-label="Filter projects"
        >
          {projectCategories.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={category === item}
              onClick={() => {
                setCategory(item);
                setExpanded(false);
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="catalog-search">
          <Search size={16} />
          <span className="visually-hidden">Search projects</span>
          <input
            type="search"
            placeholder="Find a project…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setExpanded(false);
            }}
          />
        </label>
      </div>
      <p className="visually-hidden" role="status">
        {matches.length} projects found
      </p>
      <ul className="catalog-grid">
        {shown.map((project) => (
          <li key={project.slug}>
            <Link className="catalog-card" to={`/projects/${project.slug}`}>
              <div className="catalog-card__image">
                <CaptureImage
                  project={project}
                  sizes="(max-width: 480px) 100vw, (max-width: 760px) 50vw, 33vw"
                />
                <span>{categoryFor(project.tags)}</span>
              </div>
              <div className="catalog-card__title">
                <h4>{project.title}</h4>
                <ArrowUpRight size={20} />
              </div>
              <p>{project.subtitle}</p>
            </Link>
          </li>
        ))}
      </ul>
      {matches.length === 0 ? (
        <div className="catalog-empty">
          <h4>No projects found</h4>
          <p>Try a different name, technology, or category.</p>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All work");
            }}
          >
            <X size={15} />
            Clear filters
          </button>
        </div>
      ) : null}
      {matches.length > 6 ? (
        <button
          type="button"
          className="btn catalog-more"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "Show fewer projects"
            : `View all ${matches.length} projects`}
          <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </button>
      ) : null}
    </section>
  );
}
