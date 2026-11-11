import covers from "./project-covers.json";

/** The hand-picked best picture of a project, if one was chosen (public path). */
export function getProjectCover(slug: string): string | undefined {
  const value = (covers as Record<string, string>)[slug];
  return slug.startsWith("_") ? undefined : value;
}
