import { useState } from "react";
import { Search, X } from "lucide-react";
import { visibleProjects } from "../projects";
import { ProjectTile } from "./ProjectShelf";

export function SupportingProjects() {
  const [query, setQuery] = useState("");
  const matches = visibleProjects.filter(
    (project) =>
      `${project.title} ${project.subtitle} ${project.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <section
      id="archive"
      className="project-catalog section"
      aria-labelledby="catalog-title"
    >
      <div className="catalog-heading">
        <h3 id="catalog-title">
          More projects{" "}
          <span>{visibleProjects.length.toString().padStart(2, "0")}</span>
        </h3>
        <label className="catalog-search">
          <Search size={16} />
          <span className="visually-hidden">Search projects</span>
          <input
            type="search"
            placeholder="Find a project…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <p className="visually-hidden" role="status">
        {matches.length} projects found
      </p>
      {matches.length === 0 ? (
        <div className="catalog-empty">
          <h4>No projects found</h4>
          <p>Try a different name or technology.</p>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setQuery("");
            }}
          >
            <X size={15} />
            Clear search
          </button>
        </div>
      ) : (
        <ul className="project-grid" aria-label="Projects">
          {matches.map((project) => (
            <li key={project.slug}><ProjectTile project={project} /></li>
          ))}
        </ul>
      )}
    </section>
  );
}
