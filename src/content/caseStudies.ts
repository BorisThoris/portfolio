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
    slug: 'dynamic-damage-field-reports',
    title: 'Two bug reports from players, traced into a 2005 game binary',
    kicker: 'Dynamic Damage for Need for Speed: Most Wanted, published on Nexus',
    problem:
      'Dynamic Damage adds real-time crash deformation to Most Wanted by hooking the game’s own code. Once players had it, two reports came back. Some said the game would not start alongside their other mods. Another called the mod “resource-hungry”: with traffic on the road, frames took 60 to 90 ms.',
    approach:
      'For the start-up crashes, the hook gate turned out to be far too trusting. Version 5.1 recognised each hook site by a generic function prologue — a byte pattern that occurs 374 times in the game’s executable — so a different build of the game, or another mod that had already patched a site, could be overwritten blindly. Version 5.2 checks the exact 16 original bytes at every one of its 11 hook sites and hooks nothing if any differs, naming the site and, when it finds a jump, the module of the mod that put it there. Each hook body also runs inside a structured-exception guard, so a fault in the mod switches the mod off and the game carries on stock.',
    hardPart:
      'The performance report needed a profiler that does not exist for a game like this, so I built per-hook timers into a separate diagnostic build. They put the cost on one Windows call: VirtualQuery, used to check that game memory was safe to read, cost 1 to 1.4 ms inside the game, and the part-drawing hook made about 30 of those a frame — 30 to 45 ms of every frame. The checked regions are now cached across frames, and the cache is thrown away exactly when the memory could have changed: a vehicle created or destroyed, a car model loaded, or the game changing state.',
    outcome:
      'The mod’s own time fell from 31–47 ms to 0.4–1.6 ms a frame, and whole frames from 62–88 ms to 20–29 ms in the same scripted collision scenario. Purpose-built test builds force a hook conflict and a fault in the mod’s code to prove the game survives both. The start-up crash itself never reproduced on my machine, so rather than guess, 5.2 makes the game log exactly which site and which other mod were involved.',
    tags: ['C++', 'Reverse engineering', 'x86 hooking', 'Profiling', 'Windows'],
    projectSlug: 'dynamic-damage',
  },
  {
    slug: 'bbeats-audio-truth',
    title: 'A browser DAW that plays exactly what it shows',
    kicker: 'Audio correctness in BBeats, a 6,000-commit music studio',
    problem:
      'In a DAW the screen, the speakers and the exported file have to agree, and in BBeats they quietly did not. A triplet sounded 42 ms early. Bounce in Place turned a clip on a −6 dB track into −12 dB. A render starting after a tempo change from 120 to 60 bpm came out twice as fast. The stereo meters split one downmixed buffer in half and called the halves left and right, so a hard-panned sound read as centred.',
    approach:
      'Each defect was measured before it was fixed, and each fix moved timing onto the audio clock instead of the UI clock. Notes are scheduled at their written position rather than the sixteenth they start in. Volume and pan automation is handed to the Web Audio parameter as a curve sampled every 10 ms over a look-ahead horizon, because a hidden browser tab only ticks every 250 ms and had been playing automation as a quarter-second staircase. Renders leave out the destination track’s own fader, write 32-bit float when a hot mix would clip the 16-bit encoder, and read the tempo map from where the selection starts.',
    hardPart:
      'The bugs that only exist at a boundary. After a loop wraps, the playhead lands past the loop start by however long the frame was; once that overshoot exceeds the trigger window — about 31 ms at 120 bpm — a note sitting exactly on the downbeat is never inside it and silently does not play. The scheduler scans every beat between the previous frame and this one by index instead of polling with a tolerance, and a test pins both strategies so nobody simplifies it back. A second one: voice teardown cleaned up before it stopped, inside one try block, so a throw from disconnecting an already-disconnected node skipped the stop and deleted the voice anyway — a note still sounding that nothing could ever stop again.',
    outcome:
      'An audio-integrity suite builds a reference beat and checks the exported render sample by sample: the grid to within 0.5 ms, loop passes identical, mute and solo truly silent. Hidden-tab automation went from a mean deviation of 0.069 against the export to 0.007–0.023, off-grid notes now land within 0.5 ms of where they are written, and the fixed meter reads 0.04 left and 0 right for a hard-left signal where it used to read 0.0425 in both.',
    tags: ['Web Audio', 'TypeScript', 'Scheduling', 'Playwright', 'DSP'],
    projectSlug: 'bbeats',
  },
  {
    slug: 'gem-dungeon-frame-time',
    title: 'The player fell through the floor, and it was not the physics',
    kicker: 'Frame-time bugs in a three.js dungeon game',
    problem:
      'In Gem Dungeon the player dropped straight through solid floors. Every instinct said collision: thin colliders, tunnelling, a missing flag. A few days later a second symptom looked unrelated — the monster chasing you could close a whole room in an instant, although its measured speed was exactly what the tuning said.',
    approach:
      'Instrumenting the render loop found the floor problem was not collision at all. The canvas was mounted to render on demand and nothing ever asked it to, so the simulation only stepped when React happened to re-render, and with a variable timestep each of those steps handed the physics engine a full second of gravity at once. A single text label waiting on its font, with no Suspense boundary inside the canvas, had also silently stopped the whole scene from committing. The fix was a fixed 1/60 s step, a Suspense boundary per asset, solid box floors, continuous collision detection and a terminal velocity no single step can exceed.',
    hardPart:
      'Averages hide this class of bug. The monster crossed rooms at a median 4.35 m/s against a 4.4 tuning, yet its worst single frame was 36.8 m/s: it moved by speed × frame time with nothing bounding the frame, so one 0.9-second hitch carried it four metres against a strike radius of 1.05. The player ran on the fixed physics step and the monster did not, so a dropped frame moved the threat and not the target. Its step is now capped at a quarter of its reach, which only binds below about seventeen frames a second. The same hunt found the gamepad camera turning 124 degrees on one stalled frame.',
    outcome:
      'Before the fix the game route fired 0 animation-frame callbacks in 3 seconds against 1,862 on the editor route in the same browser; after it, a player dropped from 200 m lands on the slab and stays there. A smoke test now stalls the main thread for 900 ms on purpose and records the largest single step: the monster’s went from 4.08 m to 0.26 m, and the gamepad turn from 124 degrees to 7. Each check was run against the old code first to watch it fail.',
    tags: ['three.js', 'React Three Fiber', 'Rapier', 'Game loops', 'Playwright'],
    projectSlug: 'threejs-gem-dungeon-editor',
  },
  {
    slug: 'bobball-ragdoll',
    title: 'Why the ragdoll got hit like a truck',
    kicker: 'Physics ground truth in BOBBALL, a Babylon.js and Havok game',
    problem:
      'BOBBALL is a dodgeball game against a physically simulated man. After a round ended, after he got back up, or after a level switch, the next ball sometimes launched him across the map — his chest measured at 100 to 200 m/s after a trip to the airport level. The throw itself was not the problem: the same ball behaved normally on a fresh start.',
    approach:
      'Two causes, both in what the physics engine believed about him before the hit. While animated, his body parts are kinematic and placed each frame by a plain transform set, so the engine never updates their velocity: each part kept whatever it had the instant it was handed to the animation — a foot mid-stride at 7 m/s, a limb still spinning from a fall — and switching to dynamic on the next hit released all of it into the joint chain at once. Separately, on two levels the physics floor sat at 0 while the visible lawn sat at −0.06, so his feet started 6 cm inside the floor and the solver ejected them at 20 m/s.',
    hardPart:
      'Neither cause shows up where you would look. The velocities were invisible because nothing reads a kinematic body’s velocity until the moment it becomes dynamic, and the floor offset only existed on two of three levels. The fix zeroes linear and angular velocity on the way into animation, and on the way out gives each part only the animation clip’s own motion for that step, so a hit while he walks carries his stride and nothing else. Both floors now share one constant.',
    outcome:
      'A level-parity test (10 checks) plants him on each level, asserts no animated part carries any velocity, and requires a two-ball hit to throw him the same on all three levels.',
    tags: ['Babylon.js', 'Havok', 'Physics', 'Ragdolls', 'Game testing'],
    projectSlug: 'bobball',
  },
  {
    slug: 'vyb-chess-reader',
    title: 'A reading app that scrolled at 7 frames a second',
    kicker: 'Main-thread work and a browser race in an interactive chess book',
    problem:
      'Живият ум is a chess book you read and play through in the browser, and it remembers your reading position. On a slow device continuous scrolling ran at 7 frames a second, and after a reload the restored page would sit still on your line, then jump about 300 pixels on its own.',
    approach:
      'The jitter came from saving the reading position on every scrolled frame: each one built a fresh location object, put it in React state and wrote localStorage synchronously, re-rendering the whole section and blocking the main thread sixty times a second. The exact position now lives in a ref, state only changes on a new block or a 5% move within one, and storage is written when scrolling rests, when the page hides and on entering a section. Figures take their size from the content manifest, so a loading image no longer shifts the page.',
    hardPart:
      'The jump was the browser, not the app. history.scrollRestoration was still "auto" while the document loaded, so the browser queued its own replay of the old scroll offset and applied it whenever the page first grew tall enough — on a loaded machine, seconds after the app had already restored the reader’s line. React did set it to "manual", but from an effect, which runs after first paint and after the browser had scheduled its replay. The fix moves that one assignment into the inline boot script in index.html, before any content exists, so the replay is never scheduled at all.',
    outcome:
      'Scrolling on the same CPU throttle went from 7 to 30 frames a second with long-task time nearly halved. Traced at 4× CPU throttle on a slow network, the scroll position now moves exactly once, before first paint, and never again.',
    tags: ['React', 'Performance', 'Browser internals', 'Android TWA'],
    projectSlug: 'vyb-chess',
  },
  {
    slug: 'last-levee-frames',
    title: 'The frames were going to Chrome’s translator',
    kicker: 'Real-device performance work on Last Levee, a canvas game',
    problem:
      'Last Levee is tested on two weak devices as well as a desktop: an Android tablet and a TV box stuck on Chrome 79. Opening a storm froze the screen for 270 to 350 ms, one such stall could drop the whole session to low quality for good, and the hardest storm kept losing frames that the canvas profile could not account for.',
    approach:
      'Starting a storm baked its artwork, laid out and baked again, and then the guide laid out and baked a third time; every bake allocates and uploads canvases. Each screen now measures first and bakes once. The adaptive-quality step had been reading raw frame times, so a single stall while a screen opened looked like a slow device and cut the resolution to 0.64 for the rest of the session; it now caps the frame time it reads at 50 ms.',
    hardPart:
      'The lost frames were not in the game. Switching off rain, particles and the terrain drawing changed nothing beyond noise. The tablet’s Chrome auto-translates the page into Bulgarian, and its translator re-translates any text the page rewrites — in 8 to 16 ms bursts that took about a quarter of the main thread in the worst storm — while the HUD rewrote its stats as HTML up to ten times a second. The words now stay put and only the numbers are written, as text, into nodes marked translate="no", with spaces in their own nodes because the translator trims the words it is given.',
    outcome:
      'Measured on the devices themselves: a late storm now opens with a worst frame of 101–150 ms instead of 270–350 ms, and is interactive 250–300 ms sooner on the Chrome 79 box. The translator fix was A/B-tested on the tablet with alternating builds, quality pinned and 10-second windows: the worst storm went from 56.4 fps to 57.4–57.7, against 58.9 with translation switched off entirely.',
    tags: ['Canvas', 'Performance', 'Chrome DevTools Protocol', 'Low-end devices'],
    projectSlug: 'last-levee',
  },
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
      'Living inside a protected system process. The first working build loaded into the audio engine and changed nothing: the engine runs as LOCAL SERVICE, which lacks the privilege to create a Global\\ shared section, so the plug-in quietly fell back to a session-local one the app could never see. Settings now travel through a memory-mapped file under ProgramData with ACLs the installer grants to both sides. Later, about half of all renders came out silent (18 of 40): five bundled third-party effects never initialised their state, so whatever was in memory decided the output — the compressor’s gain could sit near zero for seconds. The budget is unforgiving throughout: about 0.3 ms of CPU per 10 ms buffer, roughly 3% of one core.',
    outcome:
      'The same audio is rendered through the JavaScript core and the C++ core and has to match sample for sample, so the two implementations cannot quietly drift apart. The effects are patched before they are built, and a test renders each one four times and requires identical output; it fails on the unpatched build. A heartbeat returns the microphone to normal within two seconds if the app dies.',
    tags: ['C++', 'Electron', 'DSP', 'Windows audio', 'Native addons'],
    projectSlug: 'voxshift',
  },
  {
    slug: 'first-person-core',
    title: 'Putting a first-person camera into games that never had one',
    kicker: 'A game-agnostic rig, plus thin per-game adapters',
    problem:
      'Plenty of third-person games would be better from inside the character’s head, and modders rebuild that from scratch for every title. The naive version is unplayable: copy the animated head rotation into the view and, in the design notes’ own word, it is nauseating.',
    approach:
      'A dependency-free C++17 rig that knows nothing about any particular game, and a thin adapter per game. The adapter reads memory and fills a snapshot each frame; the rig decides the state, the blend weight, where the eye belongs and what the field of view should be; the adapter writes the result back. The core never touches game memory itself, which is what makes the next game an adapter rather than a rewrite.',
    hardPart:
      'Everything is a timing or frame-of-reference problem. The hook has to overwrite the camera after the game has updated it but before the view matrix is used — wrong order is one frame of lag and jitter. Vehicle seats are built from basis vectors rather than Euler angles, which flip past 90 degrees of roll. Aim stays slightly off because of parallax between the game’s aim origin, behind the player, and the eye. And the current adapter can only reach per-clip joint matrices rather than the blended pose, so it places the eye at a fixed height instead of on the real head bone — which is written down as a known limitation, not hidden.',
    outcome:
      'The rig is tested on its own with no game attached, which is the only way to test this kind of code honestly: the suite bounds how much error the camera may introduce, and reports a worst pose-interpolation error of 0.027 m and 0.0004 rad. The ordering problem was real in Driver: Parallel Lines, where a frame-by-frame timeline I built into the adapter showed the game bakes the camera into its draw list a frame early but reads the car body live; drawing the body at the camera’s pose cut the eye’s movement inside the car from 28 cm to 0.8 cm a frame. Adapters check code bytes before hooking and refuse builds they do not recognise, so a game update cannot silently turn the mod into a crash.',
    tags: ['C++17', 'Game modding', '3D maths', 'Reverse engineering'],
    projectSlug: 'first-person-core',
  },
];
