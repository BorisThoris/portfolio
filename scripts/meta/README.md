# Project metadata toolkit

Every local web project carries its own `project.meta.json` and its own script to
regenerate it. This directory holds the registry, the template that gets
installed into each repo, and the fan-out/sync commands.

## What lands in each repo

```
<repo>/project.meta.json               generated metadata (commit this)
<repo>/scripts/project-meta.config.mjs curated inputs, unique to that repo
<repo>/scripts/generate-project-meta.mjs the generator (kept in sync from the template)
<repo>/scripts/project.meta.schema.json  JSON schema for the output
<repo>/package.json                     scripts: "meta", "meta:check"
```

Inside a project repo:

```bash
npm run meta         # regenerate project.meta.json
npm run meta:check   # non-zero exit if the file is stale (CI-friendly)
node scripts/generate-project-meta.mjs --json        # print without writing
node scripts/generate-project-meta.mjs --copy-media  # copy shots into ./project-media
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

Images come from the portfolio capture pipeline
(`portfolio/public/project-shots/<slug>/latest`, produced by `npm run capture`).
Each repo's config points at that directory through `PORTFOLIO_ROOT`, which
defaults to this checkout. Two ways to make a repo self-contained:

- run its generator with `--copy-media`, which copies the shots into
  `<repo>/project-media` and switches the metadata to those local files, or
- drop images into `<repo>/project-media` yourself — a local directory always
  wins over the portfolio capture directory.

`media.source` records which of those applied, and reads
`portfolio-capture-missing` when a project has never been photographed.

## Commands in this directory

```bash
node scripts/meta/install-project-meta.mjs             # install/refresh the toolkit everywhere
node scripts/meta/install-project-meta.mjs --dry-run
node scripts/meta/install-project-meta.mjs --only=bbeats,skyfall
node scripts/meta/install-project-meta.mjs --force-config  # rewrite curated configs (destructive)

node scripts/meta/regen-all-meta.mjs                   # run every repo's own generator
node scripts/meta/regen-all-meta.mjs --check           # fail if any repo is stale
node scripts/meta/regen-all-meta.mjs --copy-media

node scripts/meta/sync-project-meta.mjs                # report drift into the portfolio (read-only)
node scripts/meta/sync-project-meta.mjs --write        # apply it to src/*.json
node scripts/meta/sync-project-meta.mjs --write --add-new  # also list new projects on the site
```

The same commands are wired into the portfolio's `package.json` as `meta:install`,
`meta:all`, `meta:check:all`, `meta:sync` and `meta:sync:write`.

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
