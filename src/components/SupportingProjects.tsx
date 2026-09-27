import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { getProjectAccess } from "../projectAccess";
import { visibleProjects } from "../projects";
import { ProjectTile } from "./ProjectShelf";

export function SupportingProjects() {
  const [includeArchives, setIncludeArchives] = useState(false);
  const archiveCount = visibleProjects.filter(project => getProjectAccess(project.slug)?.kind === "archive").length;
  const catalogProjects = visibleProjects.filter(project => includeArchives || getProjectAccess(project.slug)?.kind !== "archive");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const matches = catalogProjects.filter(
    (project) =>
      query.trim().toLowerCase().split(/\s+/).every(term =>
          `${project.title} ${project.subtitle} ${project.tags.join(" ")}`.toLowerCase().includes(term)),
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
          <span>{catalogProjects.length.toString().padStart(2, "0")}</span>
        </h3>
        <label className="catalog-search">
          <Search size={16} />
          <span className="visually-hidden">Search projects</span>
          <input
            ref={searchRef}
            type="search"
            placeholder="Find a project…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }}
          />
        </label>
      </div>
      {archiveCount > 0 && <label className="catalog-archives-toggle">
        <input type="checkbox" checked={includeArchives} onChange={event => setIncludeArchives(event.target.checked)} />
        Include historical archives ({archiveCount})
      </label>}
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
              searchRef.current?.focus();
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
