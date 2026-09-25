export const home = {
  role: "Full-stack engineer · Creative developer",
  headline: ["Serious engineering.", "A playful streak."],
  introduction:
    "I’m Boris, a software engineer in Sofia. I build complex product interfaces by day, and explore what the browser can do through music tools, games, and interactive worlds.",
  workIntro:
    "Independent projects. Real interfaces. Open one up and try it for yourself.",
  experienceIntro:
    "From investment technology to visual programming and hospitality. The common thread: making complex workflows feel clear.",
  contactTitle: "Have something in mind?",
  contactDescription:
    "A product to build, a tricky interface to untangle, or a team that cares about the details. Let’s talk.",
};
// Editorial selection is independent of generated repo rankings.
export const featuredSlugs = [
  "bbeats",
  "memory-dungeon",
  "vyb-chess",
  "bobball",
  "cross-repo-libs",
];
export const projectCategories = [
  "All work",
  "Apps & tools",
  "Games",
  "Commerce",
] as const;
export type ProjectCategory = (typeof projectCategories)[number];
export function categoryFor(tags: string[]): ProjectCategory {
  if (tags.some((tag) => /e-?commerce|storefront/i.test(tag)))
    return "Commerce";
  if (tags.some((tag) => /game|arcade|roguelite/i.test(tag))) return "Games";
  return "Apps & tools";
}
