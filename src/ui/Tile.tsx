import { useState } from "react";
import "./parts.css";
import { Link } from "react-router-dom";
import { getProjectAccess } from "../projectAccess";
import { getProjectTraction } from "../projectTraction";
import type { Project } from "../projects";
import { ProjectMedia } from "../components/ProjectMedia";

/** A compact project card as a taped polaroid: media (plays on hover or focus), name, proof, line. */
export function ProjectTile({ project }: { project: Project }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const headline = getProjectTraction(project.slug)?.headline;
  return (
    <div
      className="project-tile polaroid"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      // The player opens over the card and the browser sends no pointer-leave when a
      // modal covers it, so forget the hover here; otherwise the preview resumes
      // after the player closes until the card is hovered again.
      onClickCapture={(event) => { if ((event.target as HTMLElement).closest(".project-media__watch")) setHovered(false); }}
      onFocus={() => setFocused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <ProjectMedia project={project} mode="card" active={hovered || focused} />
      <Link className="project-tile__body" to={`/projects/${project.slug}`}>
        <span className="project-tile__heading"><strong>{project.title}</strong></span>
        <span className="label">{getProjectAccess(project.slug)?.label ?? "Web application"}</span>
        {headline ? <span className="project-tile__proof hand">{headline}</span> : null}
        <span className="project-tile__line">{project.subtitle}</span>
      </Link>
    </div>
  );
}
