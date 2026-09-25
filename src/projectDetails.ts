import projectDetails from "./project-details.json";
import type { ProjectDetails } from "./projects";
const detailsBySlug = projectDetails as Record<string, ProjectDetails>;
export function getProjectDetails(slug: string): ProjectDetails | undefined {
  return detailsBySlug[slug];
}
