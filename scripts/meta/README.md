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
<repo>/scripts/project.meta.schema.json  JSON schema for the output
<repo>/package.json                      scripts: meta, meta:check, shots, social, social:check
```

Inside a project repo:

```bash
npm run meta          # regenerate project.meta.json
npm run meta:check    # non-zero exit if the file is stale (CI-friendly)
npm run shots         # photograph this project into project-media/
npm run social        # publish the preview image and refresh the page head tags
npm run social:check  # non-zero exit if the preview card drifted

node scripts/generate-project-meta.mjs --json          # print without writing
node scripts/capture-project-shots.mjs --source=local  # capture from the dev server
node scripts/capture-project-shots.mjs --profiles=og   # just the card image
```

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

node scripts/meta/validate-project-meta.mjs            # schema-check every project.meta.json

node scripts/meta/sync-project-meta.mjs                # report drift into the portfolio (read-only)
node scripts/meta/sync-project-meta.mjs --write        # apply it to src/*.json
node scripts/meta/sync-project-meta.mjs --write --add-new  # also list new projects on the site
```

The same commands are wired into the portfolio's `package.json` as `meta:install`,
`meta:all`, `meta:check:all`, `meta:shots`, `meta:social`, `meta:social:check`,
`meta:validate`, `meta:sync` and `meta:sync:write`.

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
