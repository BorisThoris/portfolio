import projectDetails from "./project-details.json";
import mediaOverrides from "./project-media-overrides.json";
import type { ProjectDetails } from "./projects";
import { getProjectAccess } from "./projectAccess";
const detailsBySlug = projectDetails as Record<string, ProjectDetails>;
export function getProjectDetails(slug: string): ProjectDetails | undefined {
  // Curated, verified clips are owned by the portfolio; repository metadata syncs cannot replace them.
  const override = (mediaOverrides as Record<string, Partial<ProjectDetails>>)[slug];
  const details = override ? { ...detailsBySlug[slug], ...override, slug } : detailsBySlug[slug];
  const access = getProjectAccess(slug);
  if (!access) return details;
  if (access.kind === "web") return access.images.length ? { ...details, slug, images: access.images } : details;
  return { ...details, slug, images: access.images, videos: access.videos, trailers: [], artwork: [], links: access.sourceUrl ? { repository: access.sourceUrl } : {}, runtime: access.kind === "archive" ? undefined : { runCommand: access.instructions }, stack: access.kind === "archive" ? undefined : { runtimeTargets: [access.environment] } };
}
