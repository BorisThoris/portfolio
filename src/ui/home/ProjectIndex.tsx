import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getProjectAccess } from "../../projectAccess";
import { getProjectTraction } from "../../projectTraction";
import { projectStatus } from "../../projectStatus";
import type { Project } from "../../projects";
import { CaptureImage } from "../../components/CaptureImage";

// Kinds a reviewer actually filters by. Derived, not stored: a mod is a mod by its
// tags, a game by its tags or label, an app when it runs natively.
type Kind = "game" | "mod" | "tool" | "web" | "archive";
const filters: { key: "all" | "live" | Kind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live now" },
  { key: "game", label: "Games" },
  { key: "mod", label: "Mods" },
  { key: "tool", label: "Tools & apps" },
  { key: "web", label: "Web & product" },
  { key: "archive", label: "Archive" },
];

export function projectKind(project: Project): Kind {
  const access = getProjectAccess(project.slug);
  if (access?.kind === "archive") return "archive";
  const text = `${project.tags.join(" ")} ${access?.label ?? ""}`;
  if (/\bmod\b|modding/i.test(text)) return "mod";
  if (/game|arcade|roguelite/i.test(text)) return "game";
  if (access?.kind === "native") return "tool";
  return "web";
}

const initialRows = 12;

/** The complete index: every listed project, one dense, filterable row each. */
export function ProjectIndex({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: 0, live: 0 };
    for (const project of projects) {
      const kind = projectKind(project);
      result[kind] = (result[kind] ?? 0) + 1;
      if (kind !== "archive") result.all += 1;
      if (projectStatus(project).key === "live") result.live += 1;
    }
    return result;
  }, [projects]);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = projects.filter((project) => {
    const kind = projectKind(project);
    if (filter === "all" && kind === "archive" && !terms.length) return false;
    if (filter === "live" && projectStatus(project).key !== "live") return false;
    if (filter !== "all" && filter !== "live" && kind !== filter) return false;
    const haystack = `${project.title} ${project.subtitle} ${project.tags.join(" ")}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
  const limited = !showAll && !terms.length && filter === "all";
  const shown = limited ? matches.slice(0, initialRows) : matches;
  return (
    <section id="index" className="sec" aria-labelledby="index-title">
      <header className="sec__head">
        <p className="label">04 / Index</p>
        <h2 id="index-title">All work <span className="num index__count">{counts.all}</span></h2>
        <p>Every project, filterable. A green light means its live demo answered today’s check; archives hold older work, kept for the record.</p>
      </header>
      <div className="index__tools">
        <div className="index__filters" role="group" aria-label="Filter projects">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => { setFilter(item.key); setShowAll(false); }}
            >
              {item.label} <span className="num">{counts[item.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="index__search">
          <Search size={15} aria-hidden="true" />
          <span className="visually-hidden">Search projects</span>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search by name or technology"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }}
          />
        </label>
      </div>
      <p className="visually-hidden" role="status">{shown.length} of {matches.length} projects shown</p>
      <div className="index__book notebook">
      {matches.length === 0 ? (
        <div className="index__empty">
          <h3>No projects found</h3>
          <p>Try a different name, technology or filter.</p>
          <button className="btn" type="button" onClick={() => { setQuery(""); setFilter("all"); searchRef.current?.focus(); }}>
            <X size={15} /> Clear search
          </button>
        </div>
      ) : (
        <ul className="project-grid" aria-label="Projects">
          {shown.map((project) => <li key={project.slug}><IndexRow project={project} /></li>)}
        </ul>
      )}
      </div>
      {limited && matches.length > initialRows ? (
        <button className="index__more" type="button" aria-expanded={false} onClick={() => setShowAll(true)}>
          Show all {matches.length} projects
        </button>
      ) : showAll && filter === "all" && !terms.length ? (
        <button className="index__more" type="button" aria-expanded={true} onClick={() => setShowAll(false)}>
          Show fewer projects
        </button>
      ) : null}
    </section>
  );
}

function IndexRow({ project }: { project: Project }) {
  const status = projectStatus(project);
  const proof = getProjectTraction(project.slug)?.headline;
  return (
    <div className="row">
      <div className="row__thumb" aria-hidden="true"><CaptureImage project={project} sizes="120px" /></div>
      <div className="row__name">
        <Link to={`/projects/${project.slug}`}><strong>{project.title}</strong></Link>
        <span>{project.subtitle}</span>
      </div>
      <span className="row__kind label">{getProjectAccess(project.slug)?.label ?? "Web application"}</span>
      <span className="row__proof num">{proof ?? ""}</span>
      <span className={`status status--${status.key}`} title={status.detail}>{status.label}</span>
      <ArrowUpRight className="row__arrow" size={16} aria-hidden="true" />
    </div>
  );
}
