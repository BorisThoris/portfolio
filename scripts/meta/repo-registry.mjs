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

/**
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
  { slug: 'bbeats', dir: repo('BBeats'), classification: 'web-app' },
  {
    slug: 'vyb-chess',
    dir: repo('VYB-Chess'),
    classification: 'web-app'
    // Note: src/project-data.json still points at the pre-move
    // C:\Users\Gaming PC\VYB-Chess path; the repo lives here now.
  },
  { slug: 'memory-dungeon', dir: repo('memory-dungeon'), classification: 'web-app' },
  { slug: 'gem-dungeon', dir: repo('gem-dungeon-game-prototype'), classification: 'web-app' },
  { slug: 'skyfall', dir: repo('skyfall'), classification: 'web-app' },
  { slug: 'cross-repo-libs', dir: repo('cross-repo-libs'), classification: 'web-library', appDir: 'apps/example-web' },
  { slug: 'roam-rental-dashboard', dir: repo('roam-rental-dashboard'), classification: 'web-app', appDir: 'roam-rental-dashboard-app' },
  { slug: 'runner-score-arcade', dir: repo('runner-score-arcade'), classification: 'web-app' },
  { slug: 'cat-world', dir: repo('angular-cat-adoption-app'), classification: 'web-app' },
  { slug: 'user-hub-admin', dir: repo('Demo-Using-Clarity'), classification: 'web-app' },
  { slug: 'pedal-rush', dir: repo('my-hooks-demo'), classification: 'web-app' },
  { slug: 'flowforge-configurator', dir: repo('quick-base-task'), classification: 'web-app' },
  { slug: 'gorilla-gainz', dir: repo('react-fitness-ecommerce-demo'), classification: 'web-app' },
  { slug: 'memory-card-quest', dir: repo('react-redux-memory-card-game'), classification: 'web-app' },
  { slug: 'org-atlas-directory', dir: repo('tick42_demo'), classification: 'web-app' },
  { slug: 'threejs-gem-dungeon-editor', dir: repo('ThreeJsGem-Fixed'), classification: 'web-app' },

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
    slug: 'gem-dungeon-editor-epic-1',
    dir: repo('gem-dungeon-epic-1'),
    classification: 'duplicate',
    curated: {
      title: 'ThreeJS Gem Dungeon Editor (epic-1)',
      subtitle: 'Feature-branch copy of the dungeon editor',
      description: 'An epic-1 feature checkout of the React Three Fiber dungeon crawler and editor.',
      tags: ['React Three Fiber', 'Three.js', 'Electron'],
      accent: '#c084fc',
      showcaseTier: 'excluded',
      duplicateOf: 'threejs-gem-dungeon-editor',
      excludedReason: 'Feature-branch copy of the dungeon editor.'
    },
    analysisNotes: 'Branch copy; ThreeJsGem-Fixed is the portfolio surface.'
  },
  {
    slug: 'gem-dungeon-editor-live',
    dir: repo('threejs-gem-dungeon-editor-live'),
    classification: 'duplicate',
    curated: {
      title: 'ThreeJS Gem Dungeon Editor (live)',
      subtitle: 'Live-demo checkout of the dungeon editor',
      description: 'The checkout used to serve the live dungeon-editor demo while the main repo is being edited.',
      tags: ['React Three Fiber', 'Three.js', 'Electron'],
      accent: '#c084fc',
      showcaseTier: 'excluded',
      duplicateOf: 'threejs-gem-dungeon-editor',
      excludedReason: 'Live-demo checkout of the dungeon editor.'
    },
    analysisNotes: 'Serving copy; ThreeJsGem-Fixed is the portfolio surface.'
  }
];

// Documented in the portfolio but with no local repository, so no metadata file
// is installed for it.
export const hostedOnlyProjects = ['saad-print-on-demand'];

export default repoRegistry;
