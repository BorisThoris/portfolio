// Live projects that run inside the portfolio itself. Each one was loaded in an
// iframe at card size in a headless browser before it was listed here: it drew,
// took input after one click and needed nothing the embed cannot give it.
// Left out on purpose: SkillBall (its server forbids framing), Skyfall, VYB Chess
// and the Gem Dungeon editor (they stop when embedded storage is blocked), and
// the storefronts (not something you play).

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
  },
  {
    slug: "pedal-rush",
    name: "Pedal Rush",
    url: "https://pedal-rush-git.pages.dev/",
    dare: "Hold the gas and thread the traffic.",
    controls: ["Space for gas", "↑ ↓ change lane"],
    bootSeconds: 1,
    kind: "Arcade driver",
  },
];

export const getSandbox = (slug: string) => sandboxes.find((sandbox) => sandbox.slug === slug);

/** Ask the homepage arcade to load a sandbox (the Bob toy uses it to hand over to the real game). */
export const PLAY_EVENT = "portfolio:play";
export function requestPlay(slug: string) {
  window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: slug }));
}
