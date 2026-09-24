// Registry of every local web project that carries a project.meta.json.
//
// This is the input to scripts/meta/install-project-meta.mjs. For repos that the
// portfolio already knows about, curated fields (title, description, tags,
// commands, capture recipe, scores) are pulled straight out of
// src/project-data.json, src/repo-analysis.json and
// scripts/project-capture.config.mjs, so nothing is duplicated here. Repos the
// portfolio does not list carry their curated block inline.
//
// Adding a new web repo: append an entry, run
//   node scripts/meta/install-project-meta.mjs
//   node scripts/meta/regen-all-meta.mjs

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const portfolioRoot = path.resolve(scriptDir, '..', '..');
export const reposRoot = path.resolve(portfolioRoot, '..');

const repo = (name) => path.join(reposRoot, name);

// The BOBBALL trailer and posters are rendered from the game's own scene, so
// they are stale when any of these change (the published outputs - head tags,
// icons, og-image, trailers - are deliberately not in the list).
const bobballSceneInputs = [
  'game/index.html', 'game/environment.js', 'game/sfx.js', 'game/names.js',
  'game/avatar.json', 'game/ndk_scene.json', 'game/tex', 'game/lib', 'game/music.mp3',
  'game/backdrop.jpg', 'game/HavokPhysics.wasm', 'game/HavokPhysics_umd.js',
  'trailer/index.html', 'trailer/trailer.js', 'trailer/render.mjs', 'trailer/build.mjs', 'trailer/mix_audio.mjs',
  'trailer/timeline.json', 'trailer/timeline_poster.json', 'trailer/assets'
];
const chromeRequirement = {
  name: 'chrome',
  env: 'CHROME',
  candidates: ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
};

/**
 * github / branch: the GitHub repository and the branch Cloudflare Pages builds.
 *   Deployed repos carry both; the per-project refresh workflow runs on that
 *   branch and the portfolio's sync pulls project-media from it.
 *
 * classification:
 *   web-app     a runnable web application
 *   web-site    the portfolio site itself
 *   web-library a package/monorepo consumed by web apps
 *   duplicate   a copy/mirror/predecessor of another repo here
 *   archived    real but no longer developed
 *   template    starter/boilerplate
 *   hosted-only no local source (documented in the portfolio only)
 */
export const repoRegistry = [
  // ---- projects the portfolio showcases -------------------------------------
  // BOBBALL is a static-assets Worker deployed by the PC's CI chain
  // (ci-failover), not by Cloudflare Pages, and the repo is private with billed
  // hosted minutes: no GitHub workflows, the refresh runs on the PC. Its
  // pictures are posters rendered from the game's own scene, and its trailer is
  // rendered frame by frame through Chrome, so both are `trailers` items here
  // and screenshots are skipped.
  {
    slug: 'bobball', github: 'BorisThoris/bobball', branch: 'main',
    dir: repo('bobball'),
    classification: 'web-app',
    workflows: false,
    curated: {
      title: 'BOBBALL',
      subtitle: 'A dodgeball game against a man who did not sign up for this',
      description:
        'Sixty seconds, endless balls, one Bob: a free browser dodgeball game with an active ragdoll of a photo-scanned man, on a rebuilt National Palace of Culture square in Sofia. Babylon.js and Havok in the page, a Cloudflare Worker leaderboard with a top five and a name filter, a walk-around mode, and a 25-second comedy trailer rendered frame by frame from the same scene through headless Chrome.',
      tags: ['Game', 'Babylon.js', 'Havok', 'Ragdoll', 'Photogrammetry', 'Cloudflare Workers', 'Trailer'],
      accent: '#ff2d95',
      deploymentUrl: 'https://bobball.modaxxx009.workers.dev/',
      localUrl: 'http://127.0.0.1:8765/game/',
      buildCommand: 'bash deploy.sh --assemble',
      buildOutput: 'dist',
      runCommand: 'python -m http.server 8765  (then /game/)',
      devPort: 8765,
      showcaseTier: 'showcase',
      showcaseOrder: 0
    },
    scores: { priorityScore: 99, demoabilityScore: 97, depthScore: 92, polishScore: 90, uniquenessScore: 99, maintenanceScore: 80 },
    analysisNotes:
      'A complete shipped browser game plus its own trailer pipeline: photogrammetry of a real person driven as an active ragdoll, a georeferenced rebuild of a real square, deterministic frame-by-frame rendering, synthesised sky and narration, all in one repository.',
    links: { leaderboardApi: 'https://bobball-scores.modaxxx009.workers.dev/' },
    capture: { skip: 'the pictures are posters rendered from the game scene by trailer/timeline_poster.json (npm run trailers)' },
    social: {
      htmlFile: 'game/index.html',
      pageTitle: 'BOBBALL · a dodgeball game against a man who did not sign up for this',
      staticDir: 'game',
      imageName: 'og-image.jpg',
      imageUrlPath: '/og-image.jpg'
    },
    icons: {
      source: 'game/ball.svg',
      outputDir: 'game',
      urlPrefix: '/',
      background: '#0e3a1c',
      themeColor: '#124a24',
      name: 'BOBBALL',
      shortName: 'BOBBALL',
      manifestName: 'manifest.webmanifest',
      manifest: {
        display: 'fullscreen',
        orientation: 'any',
        lang: 'en',
        categories: ['games', 'sports', 'entertainment'],
        screenshots: [{ src: '/og-image.jpg', sizes: '1200x630', type: 'image/jpeg', form_factor: 'wide', label: 'Bob on the NDK square, mid-hit' }]
      }
    },
    trailers: {
      dir: 'game/trailers',
      urlPathPrefix: '/trailers',
      items: [
        {
          id: 'posters',
          title: 'Poster set',
          kind: 'stills',
          inputs: bobballSceneInputs.concat(['tools_dev/render_posters.mjs']),
          build: 'node tools_dev/render_posters.mjs',
          outputs: ['project-media/card.jpg', 'project-media/og.jpg', 'project-media/desktop.jpg', 'project-media/mobile.jpg', 'project-media/full.jpg', 'project-media/post.jpg', 'project-media/square.jpg', 'project-media/story.jpg'],
          requires: ['ffmpeg', chromeRequirement]
        },
        {
          id: 'trailer',
          title: 'BOBBALL - the trailer',
          kind: 'trailer',
          inputs: bobballSceneInputs,
          build: 'node trailer/build.mjs',
          output: 'trailer/out/bobball_trailer.mp4',
          requires: ['ffmpeg', chromeRequirement, 'nvidia-smi'],
          maxHeight: 1080,
          posterAt: 0.5
        }
      ]
    }
  },
  // BBeats and VYB Chess ship their own PWA icon sets (a manifest, maskable
  // icons, an Apple icon), so the icon script only verifies the head links.
  { slug: 'bbeats', github: 'BorisThoris/BBeats', branch: 'main', dir: repo('BBeats'), classification: 'web-app', icons: { mode: 'check' } },
  {
    slug: 'vyb-chess', github: 'BorisThoris/VYB-Chess', branch: 'main',
    dir: repo('VYB-Chess'),
    classification: 'web-app',
    icons: { mode: 'check' }
    // Note: src/project-data.json still points at the pre-move
    // C:\Users\Gaming PC\VYB-Chess path; the repo lives here now.
  },
  {
    slug: 'memory-dungeon', github: 'BorisThoris/memory-dungeon', branch: 'main',
    dir: repo('memory-dungeon'),
    classification: 'web-app',
    curated: { deploymentUrl: 'https://memory-dungeon.pages.dev/' }
  },
  // github.com/BorisThoris/gem-dungeon builds gem-dungeon-git.pages.dev from
  // main; gem-dungeon-epic-1 is the checkout that tracks it. The
  // game-prototype folder is the same remote parked on a stale branch.
  { slug: 'gem-dungeon', github: 'BorisThoris/gem-dungeon', branch: 'main', dir: repo('gem-dungeon-epic-1'), classification: 'web-app' },
  { slug: 'skyfall', github: 'BorisThoris/skyfall', branch: 'master', dir: repo('skyfall'), classification: 'web-app' },
  { slug: 'cross-repo-libs', github: 'BorisThoris/cross-repo-libs', branch: 'master', dir: repo('cross-repo-libs'), classification: 'web-library', appDir: 'apps/example-web' },
  {
    slug: 'roam-rental-dashboard', github: 'BorisThoris/roam-rental-dashboard', branch: 'main',
    dir: repo('roam-rental-dashboard'),
    classification: 'web-app',
    appDir: 'roam-rental-dashboard-app',
    // Next renders the head from code, so the preview tags live in a component.
    social: {
      renderedFrom: 'roam-rental-dashboard-app/src/components/SocialPreviewHead.tsx',
      staticDir: 'roam-rental-dashboard-app/public',
      imageName: 'og-image.jpg',
      imageUrlPath: '/og-image.jpg'
    }
  },
  { slug: 'runner-score-arcade', github: 'BorisThoris/runner-score-arcade', branch: 'master', dir: repo('runner-score-arcade'), classification: 'web-app' },
  { slug: 'cat-world', github: 'BorisThoris/cat-world', branch: 'master', dir: repo('angular-cat-adoption-app'), classification: 'web-app' },
  { slug: 'user-hub-admin', github: 'BorisThoris/user-hub-admin', branch: 'master', dir: repo('Demo-Using-Clarity'), classification: 'web-app' },
  { slug: 'pedal-rush', github: 'BorisThoris/pedal-rush', branch: 'master', dir: repo('my-hooks-demo'), classification: 'web-app' },
  { slug: 'flowforge-configurator', github: 'BorisThoris/flowforge-configurator', branch: 'master', dir: repo('quick-base-task'), classification: 'web-app' },
  { slug: 'gorilla-gainz', github: 'BorisThoris/gorilla-gainz', branch: 'master', dir: repo('react-fitness-ecommerce-demo'), classification: 'web-app' },
  { slug: 'memory-card-quest', github: 'BorisThoris/memory-card-quest', branch: 'master', dir: repo('react-redux-memory-card-game'), classification: 'web-app' },
  { slug: 'org-atlas-directory', github: 'BorisThoris/org-atlas-directory', branch: 'master', dir: repo('tick42_demo'), classification: 'web-app' },
  // github.com/BorisThoris/threejs-gem-dungeon-editor-live builds
  // threejs-gem-dungeon-editor-git.pages.dev from main: the first-person
  // gem-run game. ThreeJsGem-Fixed is a diverged fork of the same remote.
  { slug: 'threejs-gem-dungeon-editor', github: 'BorisThoris/threejs-gem-dungeon-editor-live', branch: 'main', dir: repo('threejs-gem-dungeon-editor-live'), classification: 'web-app' },

  // ---- the portfolio site itself --------------------------------------------
  {
    slug: 'portfolio',
    dir: repo('portfolio'),
    classification: 'web-site',
    curated: {
      title: 'Portfolio',
      subtitle: 'Local showcase site and demo runner',
      description:
        'The React + Vite portfolio site that indexes every project here: it runs each demo locally on its own port, captures card/desktop/mobile/full screenshots through Playwright, and renders the scored project catalogue from generated metadata.',
      tags: ['React', 'TypeScript', 'Vite', 'Playwright', 'Tooling'],
      accent: '#7aa2f7',
      localUrl: 'http://127.0.0.1:4100/',
      buildCommand: 'npm run build',
      buildOutput: 'dist',
      runCommand: 'npm run dev -- --host 127.0.0.1 --port 4100',
      showcaseTier: 'excluded',
      excludedReason: 'This is the portfolio shell itself, not one of the showcased projects.'
    },
    analysisNotes:
      'Host application for the project catalogue: capture pipeline, per-project runtime orchestration, repo analysis and the metadata toolkit that generates every project.meta.json.'
  },

  // ---- web projects the portfolio does not showcase --------------------------
  {
    slug: 'system-architecture-cheatsheet',
    dir: repo('system-architecture-interview-cheatsheet'),
    classification: 'web-app',
    curated: {
      title: 'System Architecture Cheatsheet',
      subtitle: 'Interview reference as a React single-page app',
      description:
        'A React + Vite single-page reference that lays out system-design building blocks - load balancing, caching, sharding, queues, consistency trade-offs - as a browsable interview cheatsheet.',
      tags: ['React', 'Vite', 'Reference'],
      accent: '#6ee7b7',
      localUrl: 'http://127.0.0.1:5177/',
      buildCommand: 'npm run build',
      buildOutput: 'dist',
      runCommand: 'npm run dev',
      devPort: 5177,
      showcaseTier: 'more'
    },
    analysisNotes: 'Small but genuine web app; not currently listed in the portfolio catalogue.'
  },
  {
    slug: 'ghost-game-3',
    dir: repo('GHOST-GAME-3'),
    classification: 'archived',
    curated: {
      title: 'Ghost Game 3',
      subtitle: 'Early vanilla JavaScript browser game',
      description:
        'A dependency-free browser game built from a single HTML page, stylesheet and JavaScript file - the earliest game experiment in this collection.',
      tags: ['JavaScript', 'HTML', 'Canvas', 'Game'],
      accent: '#9aa0a6',
      buildOutput: '.',
      runCommand: 'npx serve . # then open ghostGame.html',
      showcaseTier: 'excluded',
      excludedReason: 'Early vanilla-JS experiment kept for history; superseded by the later game projects.'
    },
    analysisNotes: 'Static three-file browser game with no build step or dependencies.'
  },
  {
    slug: 'electron-boilerplate',
    dir: repo('electron-boilerplate'),
    classification: 'template',
    curated: {
      title: 'Electron Boilerplate',
      subtitle: 'Vendored Electron starter template',
      description:
        'A minimal Electron application skeleton kept as a reference starting point for the desktop builds of the game and audio projects.',
      tags: ['Electron', 'Template'],
      accent: '#9aa0a6',
      showcaseTier: 'excluded',
      excludedReason: 'Third-party boilerplate kept for reference, not original work.'
    },
    analysisNotes: 'Upstream Electron starter, unmodified reference copy.'
  },
  {
    slug: 'expo-electron-adapter',
    dir: repo('expo-electron-adapter'),
    classification: 'web-library',
    curated: {
      title: 'Expo Electron Adapter',
      subtitle: 'Vendored @expo/electron-adapter package',
      description:
        'A local checkout of the Expo Electron adapter package, used while investigating Expo-to-desktop packaging paths.',
      tags: ['Electron', 'Expo', 'Library'],
      accent: '#9aa0a6',
      showcaseTier: 'excluded',
      excludedReason: 'Third-party library checkout, not original work.'
    },
    analysisNotes: 'Vendored upstream package; no portfolio surface.'
  },

  // ---- copies, mirrors and predecessors --------------------------------------
  {
    slug: 'musical-app-react-concept',
    dir: repo('MusicalAppReactConcept'),
    classification: 'duplicate',
    curated: {
      title: 'Musical App React Concept',
      subtitle: 'Predecessor of BBeats',
      description:
        'The earlier React/Vite music-editor concept that BBeats grew out of: timeline, instruments, beat management and Web Audio workflows with PixiJS and Zustand.',
      tags: ['React', 'Vite', 'Web Audio', 'PixiJS'],
      accent: '#c084fc',
      showcaseTier: 'excluded',
      duplicateOf: 'bbeats',
      excludedReason: 'Superseded by BBeats, which carries the same lineage forward.'
    },
    analysisNotes: 'Kept as project history; BBeats is the maintained descendant.'
  },
  {
    slug: 'musical-app-react-concept-verified',
    dir: repo('MusicalAppReactConcept-all-features-verified'),
    classification: 'duplicate',
    curated: {
      title: 'Musical App React Concept (verified snapshot)',
      subtitle: 'Feature-verification snapshot of the concept build',
      description: 'A frozen snapshot of the musical app concept taken once every feature had been manually verified.',
      tags: ['React', 'Vite', 'Web Audio'],
      accent: '#c084fc',
      showcaseTier: 'excluded',
      duplicateOf: 'musical-app-react-concept',
      excludedReason: 'Verification snapshot of another repo in this list.'
    },
    analysisNotes: 'Snapshot copy; not a separate project.'
  },
  {
    slug: 'bbeats-deploy-mirror',
    dir: repo('bbeats-deploy-main-db542b14'),
    classification: 'duplicate',
    curated: {
      title: 'BBeats deploy mirror',
      subtitle: 'Detached deploy checkout of BBeats',
      description: 'A deploy-time checkout of BBeats at commit db542b14, kept so a known-good bundle can be rebuilt.',
      tags: ['React', 'Vite', 'Deploy'],
      accent: '#c084fc',
      showcaseTier: 'excluded',
      duplicateOf: 'bbeats',
      excludedReason: 'Deploy mirror of BBeats.'
    },
    analysisNotes: 'Build mirror; source of truth is the BBeats repo.'
  },
  {
    slug: 'skyfall-first-node-project',
    dir: repo('firstNodeProject'),
    classification: 'duplicate',
    curated: {
      title: 'Skyfall (firstNodeProject)',
      subtitle: 'Original working copy of the Skyfall game',
      description: 'The original Phaser + Vite checkout the Skyfall arcade game was developed in, including the agent orchestration scripts.',
      tags: ['Phaser', 'Vite', 'Electron', 'Game'],
      accent: '#c084fc',
      showcaseTier: 'excluded',
      duplicateOf: 'skyfall',
      excludedReason: 'Same project as the skyfall repo, under its original folder name.'
    },
    analysisNotes: 'Historical working copy of Skyfall.'
  },
  {
    slug: 'skyfall-first-node-project-merge',
    dir: repo('firstNodeProject-merge'),
    classification: 'duplicate',
    curated: {
      title: 'Skyfall (merge working copy)',
      subtitle: 'Merge-resolution copy of the Skyfall game',
      description: 'A second Skyfall checkout used to resolve a branch merge; retained until the merge is confirmed landed.',
      tags: ['Phaser', 'Vite', 'Game'],
      accent: '#c084fc',
      showcaseTier: 'excluded',
      duplicateOf: 'skyfall',
      excludedReason: 'Merge working copy of the skyfall repo.'
    },
    analysisNotes: 'Temporary merge copy of Skyfall.'
  },
  {
    slug: 'gem-dungeon-prototype-branch',
    dir: repo('gem-dungeon-game-prototype'),
    classification: 'duplicate',
    curated: {
      title: 'Gem Dungeon (prototype branch)',
      subtitle: 'Stale branch checkout of the gem-dungeon repo',
      description: 'The gem-dungeon remote parked on the ai/refine-gem-dungeon-cycle-02 branch, well behind main.',
      tags: ['React Three Fiber', 'Three.js'],
      accent: '#c084fc',
      showcaseTier: 'excluded',
      duplicateOf: 'gem-dungeon',
      excludedReason: 'Stale branch of the gem-dungeon repo; gem-dungeon-epic-1 tracks main.'
    },
    analysisNotes: 'Branch checkout; gem-dungeon-epic-1 is the deployed line.'
  },
  {
    slug: 'threejs-gem-dungeon-editor-fixed',
    dir: repo('ThreeJsGem-Fixed'),
    classification: 'duplicate',
    curated: {
      title: 'ThreeJS Gem Dungeon Editor (fixed fork)',
      subtitle: 'Diverged fork of the dungeon editor',
      description: 'A fork of the threejs-gem-dungeon-editor-live remote that diverged from main before the gem-run rebuild.',
      tags: ['React Three Fiber', 'Three.js', 'Electron'],
      accent: '#c084fc',
      showcaseTier: 'excluded',
      duplicateOf: 'threejs-gem-dungeon-editor',
      excludedReason: 'Diverged fork; threejs-gem-dungeon-editor-live tracks the deployed main.'
    },
    analysisNotes: 'Fork checkout; threejs-gem-dungeon-editor-live is the deployed line.'
  }
];

// Documented in the portfolio but with no local repository, so no metadata file
// is installed for it.
export const hostedOnlyProjects = ['saad-print-on-demand'];

export default repoRegistry;
