// The homepage's sections, in order. The navigation and its scroll tracking both
// read this list, so a section added here appears in both.
export const homeSections = [
  { id: "play", label: "Play" },
  { id: "work", label: "Work" },
  { id: "mods", label: "Mods" },
  { id: "problems", label: "Problems" },
  { id: "index", label: "Index" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
] as const;

export type HomeSectionId = (typeof homeSections)[number]["id"];
