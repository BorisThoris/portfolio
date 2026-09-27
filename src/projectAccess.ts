import data from "./project-access.json";
import type { ProjectImage, ProjectVideo } from "./projects";
export type ProjectAccess = { kind: "web" | "native" | "archive"; label: string; status: string; environment: string; instructions: string; sourceUrl?: string; sourceStatus?: string; captureNote?: string; creditsUrl?: string; transcriptUrl?: string; downloadUrl?: string; downloadLabel?: string; images: ProjectImage[]; videos: ProjectVideo[] };
export function getProjectAccess(slug: string): ProjectAccess | undefined { return (data as Record<string, ProjectAccess>)[slug]; }
