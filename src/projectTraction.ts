import data from "./project-traction.json";

// Counted by hand from Nexus Mods, YouTube, Reddit and the itch.io dashboard on
// `asOf`. Curated, not generated: refresh the figures and the date together.
export type TractionStat = { value: string; label: string; url?: string };
export type TractionLink = { label: string; url: string };
export type ProjectTraction = { headline?: string; stats?: TractionStat[]; links?: TractionLink[] };
export type TractionSummary = { title: string; lede: string; stats: TractionStat[]; projects: string[] };

type TractionFile = { asOf: string; note: string; summary: TractionSummary; projects: Record<string, ProjectTraction> };
const traction = data as TractionFile;

export const tractionAsOf = traction.asOf;
export const tractionNote = traction.note;
export const tractionSummary = traction.summary;

export function getProjectTraction(slug: string): ProjectTraction | undefined {
  return traction.projects[slug];
}

export function formatAsOf(date = tractionAsOf) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
