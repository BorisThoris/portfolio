import { useState } from "react";
import { Search, X } from "lucide-react";
import { visibleProjects } from "../projects";
import {
  categoryFor,
  projectCategories,
  ProjectCategory,
} from "../content/home";
import { ProjectShelf } from "./ProjectShelf";

export function SupportingProjects() {
  const [category, setCategory] = useState<ProjectCategory>("All work");
  const [query, setQuery] = useState("");
  const matches = visibleProjects.filter(
    (project) =>
      (category === "All work" || categoryFor(project.tags) === category) &&
      `${project.title} ${project.subtitle} ${project.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const isFiltered = category !== "All work" || query.trim().length > 0;
  const shelves = isFiltered
    ? [
        {
          title: query.trim() ? `Results for “${query.trim()}”` : category,
          projects: matches,
        },
      ]
    : projectCategories
        .filter((item) => item !== "All work")
        .map((item) => ({
          title: item,
          projects: visibleProjects.filter(
            (project) => categoryFor(project.tags) === item,
          ),
        }));
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
        <p>Tools, games, experiments, and older work.</p>
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
              onClick={() => setCategory(item)}
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
      ) : (
        <div className="catalog-shelves">
          {shelves.map((shelf) => (
            <ProjectShelf
              key={shelf.title}
              title={shelf.title}
              projects={shelf.projects}
            />
          ))}
        </div>
      )}
    </section>
  );
}
