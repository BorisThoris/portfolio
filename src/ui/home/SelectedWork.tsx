import { useState, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Project } from "../../projects";
import { getProjectTraction } from "../../projectTraction";
import { projectStatus } from "../../projectStatus";
import { ProjectMedia } from "../../components/ProjectMedia";

const tilts = ["-1.4deg", "1.1deg", "0.8deg", "-1deg", "1.3deg"];
const stickers = ["yellow", "pink", "blue", "green"] as const;

/** The projects shown in depth: taped polaroids, each with a proof sticker. */
export function SelectedWork({ projects, intro }: { projects: Project[]; intro: string }) {
  return (
    <section id="work" className="sec" aria-labelledby="work-title">
      <header className="sec__head">
        <p className="label">01 / Selected work</p>
        <h2 id="work-title"><span className="sweep">Projects I’d show first.</span></h2>
        <p>{intro}</p>
        <p className="hand sec__aside" aria-hidden="true">hover one, it plays →</p>
      </header>
      <ol className="cases">
        {projects.map((project, index) => (
          <li key={project.slug}><Case project={project} index={index} /></li>
        ))}
      </ol>
    </section>
  );
}

function Case({ project, index }: { project: Project; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const proof = getProjectTraction(project.slug)?.headline;
  const status = projectStatus(project);
  return (
    <article
      className="case"
      id={`case-${project.slug}`}
      aria-labelledby={`case-title-${project.slug}`}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      // The player opens over the card and the browser sends no pointer-leave when a
      // modal covers it, so forget the hover here; otherwise the preview resumes
      // after the player closes until the card is hovered again.
      onClickCapture={(event) => { if ((event.target as HTMLElement).closest(".project-media__watch")) setHovered(false); }}
      onFocus={() => setFocused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <div className="case__media polaroid" data-reveal style={{ "--tilt": tilts[index % tilts.length] } as CSSProperties}>
        <ProjectMedia project={project} mode="card" active={hovered || focused} />
        <p className="case__caption hand">{project.title}</p>
        <span className={`case__sticker note note--${stickers[index % stickers.length]}`} aria-hidden="true">
          {proof ?? status.label}
        </span>
      </div>
      <div className="case__body">
        <div className="case__meta">
          <span className="num case__index">{String(index + 1).padStart(2, "0")}</span>
          <span className={`status status--${status.key}`} title={status.detail}>{status.label}</span>
          {proof ? <span className="case__proof num">{proof}</span> : null}
        </div>
        <h3 id={`case-title-${project.slug}`}>
          <Link to={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        <p className="case__line">{project.subtitle}</p>
        <p className="case__text">{project.description}</p>
        <ul className="tags" aria-label={`${project.title} technologies`}>
          {project.tags.slice(0, 4).map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
        <div className="case__actions">
          <Link className="btn btn--primary" to={`/projects/${project.slug}`}>
            Explore project <ArrowUpRight size={15} />
          </Link>
          {project.deploymentUrl ? (
            <a className="link" href={project.deploymentUrl} target="_blank" rel="noreferrer">
              Live demo <ArrowUpRight size={14} />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
