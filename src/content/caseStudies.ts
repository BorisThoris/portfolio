// Engineering case studies: the problems behind the projects, written long-hand.
// Project cards show what a thing is; these say what was hard about it and how
// it was settled. Copy lives here, not in the component.

export type CaseStudy = {
  slug: string;
  title: string;
  kicker: string;
  problem: string;
  approach: string;
  hardPart: string;
  outcome: string;
  tags: string[];
  projectSlug?: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: 'hosted-failover',
    title: 'One URL that survives the machine being switched off',
    kicker: 'Failover hosting for 17 project sites',
    problem:
      'Seventeen of these projects are deployed demos. If a hosting account lapses or the machine serving them goes to sleep, every link in my portfolio dies at once — usually while someone is clicking it.',
    approach:
      'I built a mirror that serves all seventeen builds from a single address. My PC serves them while it is on; an always-on tablet takes over when it is not. The front door lives on the always-on device deliberately: if the PC were the entry point, nothing could redirect callers elsewhere while it slept.',
    hardPart:
      'Each site had to be rebuilt to live under its own sub-path, and no two frameworks agree on how. Vite takes --base and --outDir, Angular wants --base-href and --deploy-url, Next reads basePath from the environment, and Create React App has no output-path option at all, so those build in place with relative asset paths and get copied. One webpack app reads its public path from an env var nothing else uses.',
    outcome:
      'Verification goes past the homepage: every index page and every asset it references has to answer 200. A repeatable demo starts both servers on random ports, kills the primary, and proves fallback and recovery in about twenty seconds without touching anything live.',
    tags: ['Node', 'HTTP', 'Vite', 'Angular', 'Next.js', 'Failover'],
    projectSlug: 'hosted-failover',
  },
  {
    slug: 'android-ci',
    title: 'Continuous integration on a phone, a tablet and a TV box',
    kicker: 'Playwright suites on hardware Playwright refuses to support',
    problem:
      'End-to-end suites need machines, and machines cost money to rent. I had idle ARM devices doing nothing, and Playwright flatly refuses to run on Android. Before this there were drifting copies of the pipeline on each device and manual shell sessions that died the moment a screen slept.',
    approach:
      'One pipeline — install, test, build, end-to-end — deployed to a priority chain of three devices. Each node probes its higher-priority peers and stands down if one answers, so exactly one machine runs the job and there is no coordinator to keep alive. A strained node can hand its build to a peer instead of failing.',
    hardPart:
      'Getting a browser to run at all. A Node preload hook reports the platform as Linux while Playwright initialises, but lets Rollup and esbuild still see Android so they load the correct native bindings. Chromium is symlinked from the system package because Playwright ships none for this platform. Headless Chromium segfaulted in its GPU process whenever WebGL1 and WebGL2 contexts overlapped. Node defaults to a 1.1 GB heap on Android, which is not enough to build with, and the OS kills background process trees, so runs are triggered through Android’s own job scheduler.',
    outcome:
      'The judgement call that made it usable was separating "degraded" from "failed". A sixty-second budget that takes seventy-nine seconds on a TV box is a statement about the hardware, not a regression, so it is recorded and allowed. The desktop node runs the same suite in strict mode with those allowances switched off — so when it fails, something is genuinely broken.',
    tags: ['Bash', 'Playwright', 'Android', 'Termux', 'Distributed systems'],
  },
  {
    slug: 'voxshift',
    title: 'A voice changer that lives inside the Windows audio engine',
    kicker: 'Real-time DSP as an audio processing object',
    problem:
      'Voice changers normally ask you to install a virtual cable and route everything through it, which adds a device buffer and a setup step that most people get wrong. And shifting pitch on its own makes everyone sound like a chipmunk.',
    approach:
      'A pitch-synchronous overlap-add engine that moves pitch and formant independently, shipped two ways: as an Electron app, and as a Windows audio processing object that runs inside the system audio engine. Applications hear the altered voice through the ordinary microphone — no cable, no extra buffer.',
    hardPart:
      'Living inside a protected system process. The audio engine runs as LOCAL SERVICE without the privilege needed to open a global shared section, so the obvious way to pass settings in was never available. Windows will only load an unsigned plug-in into that process with a developer switch set, so the installer sets it and puts the previous value back on removal. The budget is unforgiving: about 0.3 ms of CPU per 10 ms buffer, roughly 3% of one core.',
    outcome:
      'The same audio is rendered through the JavaScript core and the C++ core and has to match sample for sample, so the two implementations cannot quietly drift apart. A COM host test drives the plug-in exactly as the audio engine does. A heartbeat returns the microphone to normal within two seconds if the app dies, and the smoke test refuses to run when the virtual cable is missing, so test audio can never reach the speakers.',
    tags: ['C++', 'Electron', 'DSP', 'Windows audio', 'Native addons'],
    projectSlug: 'voxshift',
  },
  {
    slug: 'self-updating-portfolio',
    title: 'A portfolio that updates itself',
    kicker: 'The site you are reading',
    problem:
      'Portfolios go stale the moment you stop hand-editing them, and the screenshots rot first. I did not want a site that needed me to remember it.',
    approach:
      'Every deployed project photographs itself after each deployment and publishes its own metadata — stack, test counts, commit dates, screenshots, trailers. This site pulls all of that hourly, syncs its catalogue and commits, which triggers a rebuild. Adding a trailer or a wallpaper to a project means adding one entry to that project’s config; the portfolio picks it up on the next pass.',
    hardPart:
      'An automated job that can fail is a job that will eventually wedge and go quiet. The media tests had to encode two rules that are easy to get wrong: a published file is never treated as one of its own inputs, and a trailer this particular machine cannot render is a warning rather than a failure — otherwise the hourly sync would stop dead on any machine without the renderer installed.',
    outcome:
      'Every page is audited against WCAG 2.1 A and AA on each build, along with keyboard order, skip-link focus, reduced-motion behaviour, and a check that no project card has shipped pointing at localhost.',
    tags: ['GitHub Actions', 'Playwright', 'axe', 'Cloudflare', 'React'],
    // No projectSlug: this site is not one of its own cards.
  },
  {
    slug: 'local-model-toolkit',
    title: 'Running the generative work locally instead of paying for it',
    kicker: 'Shared tooling for a dozen side projects',
    problem:
      'A dozen side projects needed images, music, textures and 3D assets. Paid APIs bill per call, need network access, and mean sending unfinished work to someone else’s server.',
    approach:
      'A workspaces monorepo of generators — image, music, 3D, procedural textures — plus a server that exposes them to an AI client as callable tools, so an assistant can produce assets directly. Work is routed between a strong remote model and a local one depending on what the task actually needs.',
    hardPart:
      'Making generated assets trustworthy in a build. Texture generation is deterministic and needs no network: the same input always produces the same file, with hashes and manifests to prove it, which is what makes it safe to regenerate assets in CI rather than committing binaries. The tools that do reach outside support a dry run.',
    outcome:
      'Asset generation became a build step instead of a bill, and the same components, primitives and notification system are now shared across every project rather than copied between them.',
    tags: ['Node', 'MCP', 'npm workspaces', 'Generative models', 'Storybook'],
    projectSlug: 'cross-repo-libs',
  },
];
