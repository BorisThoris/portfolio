import health from "./project-health.json";
import { getProjectAccess } from "./projectAccess";
import { getProjectTraction } from "./projectTraction";
import type { Project } from "./projects";

// One honest word for where a project stands, shown as a status light in the index.
// "Live" comes from the daily link check (scripts/check-deployments.mjs), not from
// the catalogue's say-so.
export type ProjectStatus = { key: "live" | "down" | "release" | "download" | "source" | "archive"; label: string; detail: string };

type Health = { checkedAt: string | null; projects: Record<string, { up: boolean; lastUp: string | null }> };
const checks = health as Health;

export function projectStatus(project: Project): ProjectStatus {
  const access = getProjectAccess(project.slug);
  if (access?.kind === "archive") return { key: "archive", label: "Archive", detail: "Historical work, kept for the record" };
  if (project.deploymentUrl && (!access || access.kind === "web")) {
    const check = checks.projects[project.slug];
    if (check && !check.up) return { key: "down", label: "Not responding", detail: `The live demo has failed its daily check since ${check.lastUp ?? "it was added"}` };
    return { key: "live", label: "Live", detail: checks.checkedAt ? `Live demo answered on ${checks.checkedAt}` : "Live demo" };
  }
  if (getProjectTraction(project.slug)?.links?.length) return { key: "release", label: "Released", detail: "Published on public platforms" };
  if (access?.downloadUrl) return { key: "download", label: "Download", detail: "Packaged download available" };
  return { key: "source", label: access?.kind === "native" ? "Native" : "In progress", detail: access?.status ?? "No public demo yet" };
}
