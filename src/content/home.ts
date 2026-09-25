export const home = {
  role: "Full-stack engineer in Sofia",
  headline: ["I build software.", "Some of it gets weird."],
  introduction:
    "I’m Boris. At work I build financial and product software. After hours I make browser music tools, games, and 3D experiments.",
  workIntro:
    "These are the projects I keep coming back to. Most are live, so you can try them.",
  experienceIntro:
    "I’ve worked in investment technology, hospitality, low-code tools, and telecoms. Here’s what I did at each.",
  contactTitle: "Want to talk?",
  contactDescription:
    "If you’re hiring, building something interesting, or just want to compare notes, send me an email.",
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
