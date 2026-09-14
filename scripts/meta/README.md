# Project metadata toolkit

Every local web project carries its own `project.meta.json` and its own script to
regenerate it. This directory holds the registry, the template that gets
installed into each repo, and the fan-out/sync commands.

## What lands in each repo

```
<repo>/project.meta.json                 generated metadata (commit this)
<repo>/project-media/                    this project's own screenshots
<repo>/scripts/project-meta.config.mjs   curated inputs, unique to that repo
<repo>/scripts/generate-project-meta.mjs the generator (kept in sync from the template)
<repo>/scripts/capture-project-shots.mjs the screenshot run, using this project's recipe
<repo>/scripts/generate-social-preview.mjs the link-preview card
<repo>/scripts/generate-app-icons.mjs    favicon, Apple and PWA icons + web manifest
<repo>/scripts/refresh-project-meta.mjs  shots -> social -> icons -> meta, in one go
<repo>/scripts/project.meta.schema.json  JSON schema for the output
<repo>/package.json                      scripts: meta, meta:check, shots, social, social:check,
                                         icons, icons:check, meta:refresh
```

Inside a project repo:

```bash
npm run meta:refresh  # a release: new screenshots, card, icons and metadata
npm run meta:refresh -- --check   # verify all of it; non-zero exit on drift

npm run meta          # regenerate project.meta.json
npm run meta:check    # non-zero exit if the file is stale (CI-friendly)
npm run shots         # photograph this project into project-media/
npm run social        # publish the preview image and refresh the page head tags
npm run social:check  # non-zero exit if the preview card drifted
npm run icons         # render the icon set from favicon.svg and link it in the head
npm run icons:check   # non-zero exit if the icons or their links drifted

node scripts/generate-project-meta.mjs --json          # print without writing
node scripts/capture-project-shots.mjs --source=local  # capture from the dev server
node scripts/capture-project-shots.mjs --profiles=og   # just the card image
node scripts/refresh-project-meta.mjs --no-shots       # keep the current screenshots
```

Repos that format their scripts (a prettier in `node_modules`) receive the
installed copies already run through it, so a reinstall never fights the
formatter, and the social and icon scripts treat a re-wrapped head block as the
same markup.

## What is curated vs derived

`scripts/project-meta.config.mjs` is hand-owned and holds the things a machine
cannot know: title, subtitle, description, tags, accent colour, build/run
commands, deployment URL, showcase tier and scores, and the screenshot capture
recipe (route, ready selector, click actions).

The generator derives everything else on each run: package name and version,
package manager, framework/language/library detection, test runners, source and
test file counts, source lines, largest directories, CI/docs/README presence, git
branch, head, last commit and commit count, and the screenshot set with real
pixel dimensions and byte sizes.

Reruns are stable: if only the timestamp or the git snapshot would change, the
file keeps its previous `generatedAt`, so `--check` stays meaningful in CI. The
`git` block is a snapshot of the last regeneration - new commits (including the
one that records the metadata itself) never make a file stale.

## Screenshots

Each project photographs **itself**. `npm run shots` in a repo runs
`scripts/capture-project-shots.mjs`, which drives Playwright through that
project's own capture recipe — its route, its ready selector, its warm-up clicks
(BBeats creates a starter pattern first, VYB Chess waits for the launch screen),
its elements to hide — and writes five profiles into `<repo>/project-media/`:

| profile | size | used for |
|---|---|---|
| `card` | 1600×900 | the portfolio card |
| `desktop` | 1440×900 | desktop view |
| `mobile` | 430×932 | phone view |
| `full` | full page | the whole page |
| `og` | 1200×630 | the link-preview card |

By default it captures the live deployment, so the picture matches what a visitor
sees; `--source=local` starts the project's own dev server instead, and
`--url=...` photographs anything you point it at. Playwright is resolved from the
repo, else from `PORTFOLIO_ROOT`, so no project needs the dependency.

`project-media/capture.json` records the source URL, the recipe used and the
result per profile. Because the images live in the repo, they travel with a clone
and `media.source` reads `repo-local`; the portfolio's own
`public/project-shots/<slug>/latest` remains the fallback for projects that have
not photographed themselves yet.

## Link previews

`npm run social` in a repo makes its deployment URL unfurl into a card when
someone pastes it into a chat: it publishes `project-media/og.jpg` into the
project's own static directory and writes the Open Graph and Twitter tags into
the page head between generated markers, pointing at the absolute deployed image
URL. `npm run social:check` fails when the tags or the published image drift.

Where each project keeps those two things differs, so the `social` block in its
config records them — `public/` for Vite and CRA, `src/assets/` for Angular,
`app/public/` for VYB Chess, `apps/example-web/public/` for the monorepo. A
project that renders its head from code (the Next dashboard) sets `renderedFrom`
instead: the script publishes and checks its image and leaves the tags to the
component.

A card only appears once the site is redeployed — the tags have to be live for a
chat client to read them.

## Icons

`npm run icons` in a repo renders the whole icon set from one source SVG
(`<staticDir>/favicon.svg` by default) through Chromium: `favicon.ico` (16, 32,
48), `apple-touch-icon.png` (180, on the configured background because iOS
squares off transparency), `icon-192.png`, `icon-512.png`,
`icon-maskable-512.png` (padded to the safe zone) and a `site.webmanifest`, and
writes the `<link>` tags plus a `theme-color` into the page head between
generated markers. `project-media/icons.json` records the source hash, so the
set is only re-rendered when the SVG or the background changes, and
`npm run icons:check` fails when either drifted.

The `icons` block in the config sets `background`, `themeColor`, `name`,
`shortName`, or a different `source` / `outputDir` / `urlPrefix`. A project that
already ships its own PWA icon set (BBeats, VYB Chess) sets `mode: 'check'`, and
the script only verifies that the favicon, Apple icon and manifest links in its
head resolve to real files.

## Releases

`npm run meta:refresh` sequences the four steps for a release: photograph the
deployment, publish the card, render the icons, regenerate `project.meta.json`.
`--no-shots` keeps the current screenshots, `--source=local` photographs the dev
server, `--check` only verifies. Commit `project.meta.json`, `project-media/`,
the page head and the static icon/image files it touched, and push: the card
and icons go live with the next deployment.

## Commands in this directory

```bash
node scripts/meta/install-project-meta.mjs             # install/refresh the toolkit everywhere
node scripts/meta/install-project-meta.mjs --dry-run
node scripts/meta/install-project-meta.mjs --only=bbeats,skyfall
node scripts/meta/install-project-meta.mjs --force-config  # rewrite curated configs (destructive)

node scripts/meta/regen-all-meta.mjs                   # run every repo's own generator
node scripts/meta/regen-all-meta.mjs --check           # fail if any repo is stale
node scripts/meta/regen-all-meta.mjs --copy-media

node scripts/meta/capture-all-shots.mjs                # every project photographs itself
node scripts/meta/capture-all-shots.mjs --profiles=og
node scripts/meta/capture-all-shots.mjs --include-local   # also run dev servers for undeployed projects

node scripts/meta/apply-social-previews.mjs            # refresh every link-preview card
node scripts/meta/apply-social-previews.mjs --check

node scripts/meta/apply-app-icons.mjs                  # render every project's icon set
node scripts/meta/apply-app-icons.mjs --check

node scripts/meta/validate-project-meta.mjs            # schema-check every project.meta.json

node scripts/meta/sync-project-meta.mjs                # report drift into the portfolio (read-only)
node scripts/meta/sync-project-meta.mjs --write        # apply it to src/*.json
node scripts/meta/sync-project-meta.mjs --write --add-new  # also list new projects on the site
```

The same commands are wired into the portfolio's `package.json` as `meta:install`,
`meta:all`, `meta:check:all`, `meta:shots`, `meta:social`, `meta:social:check`,
`meta:icons`, `meta:icons:check`, `meta:validate`, `meta:sync` and
`meta:sync:write`.

Existing configs are never overwritten by `install-project-meta.mjs` without
`--force-config`; the generator and schema are always refreshed from
`scripts/meta/template/`, so fix the template, not the copies.

## Direction of truth

At install time the portfolio's `src/project-data.json`,
`src/repo-analysis.json` and `scripts/project-capture.config.mjs` seeded each
repo's config, so nothing was retyped. From then on the repo owns its facts and
`sync-project-meta.mjs` pushes them back into the portfolio data files. The sync
leaves a curated `screenshot` alone while the file it points at still exists, and
only repoints broken references at the latest capture.

## Adding a repo

1. Add an entry to `repo-registry.mjs` (`slug`, `dir`, `classification`, plus a
   `curated` block if the portfolio does not already describe it).
2. `node scripts/meta/install-project-meta.mjs`
3. `node scripts/meta/regen-all-meta.mjs`
4. `node scripts/meta/sync-project-meta.mjs` and, when it looks right, `--write`.

`hostedOnlyProjects` in the registry lists projects that exist only as a
deployment (no local repo), for which the portfolio data stays authoritative.
