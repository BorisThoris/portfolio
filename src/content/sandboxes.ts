// Live projects that run inside the portfolio itself. Each one was loaded in an
// iframe at card size in a headless browser before it was listed here: it drew,
// took input after one click and needed nothing the embed cannot give it.
// Left out on purpose: SkillBall (its server forbids framing), Skyfall, VYB Chess
// and the Gem Dungeon editor (they stop when embedded storage is blocked), and Roam
// Rental, whose dashboard shows an unstyled list that does not answer a click.
// Games go on the arcade shelf; the work you would use rather than play, on the apps shelf.

export type Sandbox = {
  slug: string;
  name: string;
  /** The live build, exactly as deployed. */
  url: string;
  /** What the frame loads, when the build has a mode for being embedded; links still open `url`. */
  frameUrl?: string;
  /** One concrete first thing to do, so the first ten seconds are not spent wondering. */
  dare: string;
  controls: string[];
  /** Measured from click to first input, rounded up. Shown so a wait is expected, not alarming. */
  bootSeconds: number;
  kind: string;
  shelf: "games" | "apps";
  /** The engineering story behind it, on the homepage's Problems list. */
  story?: { teaser: string; problem: string };
};

export const sandboxes: Sandbox[] = [
  {
    slug: "bobball",
    name: "BOBBALL",
    url: "https://bobball.modaxxx009.workers.dev/",
    frameUrl: "https://bobball.modaxxx009.workers.dev/?embed",
    dare: "Press Meet Bob, then throw. A head shot is worth 30.",
    controls: ["Click to throw", "Hold for a power shot"],
    bootSeconds: 12,
    kind: "3D physics game",
    shelf: "games",
    story: { teaser: "Bob used to get launched at 200 m/s after a round. Here is why.", problem: "bobball-ragdoll" },
  },
  {
    slug: "bbeats",
    name: "BBeats",
    url: "https://bbeats-git.pages.dev/",
    dare: "Open City Bounce and press Space. Then change one step.",
    controls: ["Space plays", "Click a step"],
    bootSeconds: 3,
    kind: "Music studio",
    shelf: "games",
    story: { teaser: "A triplet used to sound 42 ms early. How the audio got exact.", problem: "bbeats-audio-truth" },
  },
  {
    slug: "last-levee",
    name: "Last Levee",
    url: "https://last-levee.pages.dev/",
    dare: "Hold the wall until the storm passes.",
    controls: ["Mouse or touch", "The first storm coaches you"],
    bootSeconds: 3,
    kind: "Strategy game",
    shelf: "games",
    story: { teaser: "The frames were going to Chrome’s translator. The hunt.", problem: "last-levee-frames" },
  },
  {
    slug: "threejs-gem-dungeon-editor",
    name: "Gem Dungeon",
    url: "https://threejs-gem-dungeon-editor-git.pages.dev/",
    dare: "Three floors down, and every door out has a price.",
    controls: ["Click in, then WASD", "Mouse to look"],
    bootSeconds: 3,
    kind: "First-person dungeon",
    shelf: "games",
    story: { teaser: "The player fell through the floor, and it was not the physics.", problem: "gem-dungeon-frame-time" },
  },
  {
    slug: "ringer3d",
    name: "Ringer 3D",
    url: "https://ringer3d.modaxxx009.workers.dev/",
    dare: "Press Play and knock the marbles out of the ring.",
    controls: ["Drag back and release, like a slingshot"],
    bootSeconds: 15,
    kind: "Marble game",
    shelf: "games",
  },
  {
    slug: "pedal-rush",
    name: "Pedal Rush",
    url: "https://pedal-rush-git.pages.dev/",
    dare: "Hold the gas and thread the traffic.",
    controls: ["Space for gas", "↑ ↓ change lane"],
    bootSeconds: 1,
    kind: "Arcade driver",
    shelf: "games",
  },
  {
    slug: "runner-score-arcade",
    name: "Dodg’Em Up",
    url: "https://runner-score-arcade-git.pages.dev/",
    dare: "Enter the arena and outlast the first wave. Stars give a heart back.",
    controls: ["← → move", "↑ jump", "↓ duck"],
    bootSeconds: 2,
    kind: "Arcade survival",
    shelf: "games",
  },
  {
    slug: "memory-card-quest",
    name: "Memory Card Quest",
    url: "https://memory-card-quest-git.pages.dev/",
    dare: "Clear the six-pair board without losing a heart.",
    controls: ["Click two cards", "Arrows and Enter work too"],
    bootSeconds: 1,
    kind: "Memory game",
    shelf: "games",
  },
  {
    slug: "bostan",
    name: "Bostan",
    url: "https://bostan.pages.dev/en/3d/",
    dare: "Walk into a hall. These are real garments from my own streetwear label, modelled and lit in 3D.",
    controls: ["Pick a hall", "Browse the drop"],
    bootSeconds: 2,
    kind: "My label · 3D showroom",
    shelf: "apps",
  },
  {
    slug: "cross-repo-libs",
    name: "Cross Repo Libs",
    url: "https://cross-repo-libs-git.pages.dev/",
    dare: "Open ProjectileEffects or Torch: the shared pieces the games above are built from.",
    controls: ["Pick a story", "Every one is live"],
    bootSeconds: 2,
    kind: "Component library",
    shelf: "apps",
  },
  {
    slug: "flowforge-configurator",
    name: "FlowForge",
    url: "https://flowforge-configurator-git.pages.dev/",
    dare: "Clear the label, add a tag, switch the language, then save.",
    controls: ["A form with validation", "Mocked API"],
    bootSeconds: 1,
    kind: "React + Redux form",
    shelf: "apps",
  },
  {
    slug: "gorilla-gainz",
    name: "Gorilla Gainz",
    url: "https://gorilla-gainz-git.pages.dev/",
    dare: "Filter the catalogue, fill the bag and try the demo checkout. Nothing is charged.",
    controls: ["Demo store", "No real purchases"],
    bootSeconds: 1,
    kind: "React store",
    shelf: "apps",
  },
  {
    slug: "org-atlas-directory",
    name: "Org Atlas",
    url: "https://org-atlas-directory-git.pages.dev/",
    dare: "Open a company, then one of its projects. Rename the project and add someone to the team.",
    controls: ["Company → project → people", "Edits stay in this tab"],
    bootSeconds: 1,
    kind: "React directory",
    shelf: "apps",
  },
  {
    slug: "user-hub-admin",
    name: "User Hub",
    url: "https://user-hub-admin-git.pages.dev/",
    dare: "Manage users, type 3 and press Tab, run the setup wizard, then delete someone from the directory.",
    controls: ["Angular + Clarity", "A guided demo flow"],
    bootSeconds: 2,
    kind: "Admin console",
    shelf: "apps",
  },
  {
    slug: "cat-world",
    name: "Cat World",
    url: "https://cat-world-git.pages.dev/",
    dare: "Open All Cats and search by breed. It dates from 2018, and the breed names are in Bulgarian.",
    controls: ["Menu top right on small screens", "Demo data only"],
    bootSeconds: 2,
    kind: "Angular · 2018",
    shelf: "apps",
  },
];

export const getSandbox = (slug: string) => sandboxes.find((sandbox) => sandbox.slug === slug);

/** Ask the homepage arcade to load a sandbox (the Bob toy uses it to hand over to the real game). */
export const PLAY_EVENT = "portfolio:play";
export function requestPlay(slug: string) {
  window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: slug }));
}

/** Announced by a sandbox when it starts, so any other running one stops: one live build at a time, page-wide. */
export const START_EVENT = "portfolio:sandbox-start";
