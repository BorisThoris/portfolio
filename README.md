# Portfolio

Local portfolio showcase for Boris Bostandzhiev's demo-ready projects.

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4110/`.

## Local Project Launcher

The portfolio can build and serve the curated project list from `src/project-data.json`.

```bash
npm run projects:status
npm run projects:build
```

Run the portfolio against local build outputs:

```bash
npm run dev:builds
```

Run the portfolio in live mode:

```bash
npm run dev:live
```

`dev:live` probes each project's assigned local URL first. If an app is already running there, the portfolio embeds that live server. If not, it builds the project if needed and serves the local build output on the same port. The portfolio itself runs at `http://127.0.0.1:4110/`.

Start every project with its live dev/server command:

```bash
npm run projects:dev
```

`projects:dev` starts each project from its `runCommand`, writes the runtime status as live, and reuses the portfolio dev server if it is already running.

Each project has a stable port in `src/project-data.json`; avoid starting multiple apps on the same port.

## Repo Analysis And Ranking

The home page is split into a scored top-six showcase and a quieter supporting project catalog. Ranking metadata lives in `src/repo-analysis.json`; local run/build metadata stays in `src/project-data.json`.

Scan every directory under `C:\Users\Gaming PC\Desktop\Repos` and compare it against the curated scoring:

```bash
npm run repos:analyze
npm run repos:analyze -- --json
```

Scoring uses this weighting:

- Demoability: 35%
- Actual depth/features: 25%
- Visual/demo polish: 15%
- Uniqueness/portfolio value: 15%
- Maintainability/docs/tests: 10%

Duplicate families are kept out of the visible portfolio instead of deleted. For example, `BBeats` is the canonical music-app entry over `MusicalAppReactConcept*`, and `skyfall` is the canonical Skyfall entry over `firstNodeProject*`.

## Preview Build

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4110
```

## Capture Project Screenshots

Start any project servers you want to refresh, then run:

```bash
npm run capture
npm run capture -- --project skyfall
```

The script reuses one Chromium browser page and writes screenshots under `public/project-shots/<project>/main.png`.

## Cloudflare Pages

Use the Git-backed Cloudflare Pages project for the canonical public portfolio URL.

- Project name: `portfolio-git`
- Public URL: `https://portfolio-git-4s6.pages.dev/`
- Production branch: `master`
- Root directory: `.`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=22.16.0`

The earlier direct-upload Pages project is no longer the canonical link. The `public/_redirects` file keeps direct links such as `/projects/skyfall` working on Cloudflare Pages. Project embeds prefer `deploymentUrl` from `src/project-data.json` and fall back to `localUrl` when a public deployment URL has not been assigned.
