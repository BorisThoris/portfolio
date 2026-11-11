# The November 2026 rebuild

The portfolio was rebuilt from scratch on 11 November 2026: new structure, new
components and a new design system. The project data, the media playback engine
(`ProjectMedia`, `VideoDialog`, `CaptureImage`) and the build scripts were kept;
every page, section and stylesheet was replaced. The evidence behind the choices
is in [portfolio-best-practices-2026.md](portfolio-best-practices-2026.md). The
sites were also screenshotted headless and studied visually; the captures are not
kept in the repo.

## What the study showed

| Site | Taken from it |
|---|---|
| Brittany Chiang | A sticky identity column (name, role, section navigation that tracks the reading position, links) beside a scrolling work column. A reviewer never loses who and what. |
| Maxime Heckel | A dense archive with one row per entry, and a build stamp in the footer. |
| Elliott Mangham | A credentials panel packed with information, and a strip of real project imagery. |
| Rauno Freiberg, Dennis Snellenberg | One signature moment, not decoration everywhere. Here it is the showreel plate and the italic serif voice line. |
| Paco, Emil Kowalski, Lee Robinson | Restraint: small type, generous space, a reading serif for prose. |
| Brittany Chiang, NN/g | One platform-sourced number per project; 3-5 projects in depth, then the full archive. |

## Structure

**Homepage (`src/ui/home/`).** On wide screens it has two columns.

The left column is the identity rail and stays sticky. It holds:
- name, role and a one-line positioning statement;
- section navigation that highlights the current section;
- three counted proof figures;
- links, the theme switch, the motion switch and the build stamp.

The right column scrolls through:
1. **Showreel**: one trailer (the page's only automatic video) and a dated
   "Shipped lately" log.
2. **Selected work**: the other featured projects as large stacked cases, each a
   still until hovered or focused. No carousel.
3. **Released mods**: counted figures and the three mod families.
4. **Problems solved**: the engineering write-ups as a numbered accordion.
5. **All work**: the complete index, one row per project, with filters (All, Live
   now, Games, Mods, Tools & apps, Web & product, Archive), search, and a status
   light from the daily demo check.
6. **Experience**: a dated timeline with the detail behind each role, then the
   skills.
7. **Contact**.

On narrow screens the identity rail becomes the opening block, and the section
navigation becomes a sticky chip bar.

**Project page (`src/ui/project/`).** Full width, so covers keep their real aspect
ratio. It runs:
1. title block and actions;
2. full-width cover;
3. a sticky spec sheet (status, kind, stack, last change, technologies) beside the
   article: overview in the reading serif, counted reception, run and
   availability, under the hood;
4. screenshots, artwork and the related-projects shelf.

## Design system (`src/ui/base.css`)

- **Themes.** The page follows the system theme; the toggle overrides it and is
  remembered. An inline script in `index.html` applies the choice before first
  paint. Both themes are audited for WCAG A/AA (`check:ui` runs axe in light and
  dark).
- **Colour.** One neutral ink scale. One signal colour (`--signal`, orange-red),
  used only for numbers, status and the current item. `--signal-text` is the
  contrast-safe variant for text.
- **Type.** Geist for text and headings, Geist Mono for every number, date and
  label, and Newsreader italic for the voice lines (headline, subtitles,
  overviews, problem write-ups). All are self-hosted variable fonts; Geist
  covers Cyrillic.
- **Media.** Frames sit on a dark screen in both themes, so letterboxing reads
  as a player.
- **Motion.** One trailer and a three-bar signal meter. Both pause with the
  in-page switch and are removed under `prefers-reduced-motion`.

## Second pass: "the workbench" (same day)

The owner's verdict on the first rebuild was that it still did not look new: the
structure had changed, but the restrained grotesk-on-paper look was close to the
old site. They asked for a new identity with post-it notes, animation and
marketing structure.

**What was studied.** The free and paid desk-style Framer templates: Canvas
(design-tool canvas, highlighted words), Taped (grid paper, taped polaroids,
floating sticky notes, handwritten accents), Sketchfolio (dashed paper cards,
tinted sticky-note testimonials) and Pinmat (a desk with ruled notebook paper
and a "come work with me" sticky note). None were copied; their visual language
was rebuilt here in plain CSS:
[Canvas](https://www.framer.com/templates/canvas/),
[Taped](https://www.framer.com/marketplace/templates/taped/),
[Sketchfolio](https://www.framer.com/marketplace/templates/sketchfolio/),
[Pinmat](https://www.framer.com/marketplace/templates/pinmat/).
CSS note techniques: tape from a rotated pseudo-element, depth from a blurred
shadow, notes tilted a few degrees
([kingkool68 pen](https://codepen.io/kingkool68/pen/poORVzg),
[Tuts+](https://webdesign.tutsplus.com/create-a-sticky-note-effect-in-5-easy-steps-with-css3-and-html5--net-13934a)).

**Marketing structure.** These are freelancer and builder blogs, not A/B studies,
so they are treated as conventions:
- A headline, a one-line value statement and one primary action ("Email me"),
  repeated at the end
  ([Pixpa](https://www.pixpa.com/blog/how-to-optimize-the-hero-section-of-your-portfolio-website),
  [Millo](https://millo.co/landing-page-tactics-freelancers-can-use-to-turn-portfolio-visitors-into-clients)).
- Proof next to the claim it supports, not parked at the bottom: the counted
  figures sit on post-its around the headline, and employers sit under the call
  to action (Millo).
- A visitor can tell what is on offer within seconds
  ([one practitioner's rule](https://vighnesh-salunkhe.vercel.app/blog/ui-ux-portfolio-principles)).

**What changed.**
- Grid-paper background, with four post-it colours, tape and taped polaroids.
- Ruled notebook pages with margin and binder holes for the shipped log, the
  index and the timeline.
- Index cards for the problems, and divider tabs as the index filters.
- Caveat for handwritten accents (it covers Cyrillic); Newsreader was removed.
- Floating pill navigation in place of the sticky identity column. It still
  tracks the current section.

**Animation**, all paused by the in-page switch and removed under reduced motion:
- notes and prints pin in as they scroll into view;
- figures count up once;
- the headline's underline draws itself;
- hero notes bob gently;
- a tape-strip marquee of the stack;
- hover lifts and straightens prints.

## Freshness

| Problem | What runs |
|---|---|
| Hand-counted numbers | `scripts/refresh-traction.mjs`, daily inside the sync job. Nexus GraphQL and the YouTube feed need no key; itch.io and the YouTube Data API need `ITCH_API_KEY` / `YOUTUBE_API_KEY` secrets. A failed source keeps its last value and date. |
| Dead demos | `scripts/check-deployments.mjs`, daily. Drives the index's status lights; a demo shows as down only after two failed days. |
| "Is this current?" | Build stamp (date and commit) on every page; "counted <date>" on the figures; a dated shipped log on the homepage. |

## Still open (needs the owner's accounts)

- `ITCH_API_KEY` and `YOUTUBE_API_KEY` as repository secrets.
- Cloudflare Pages Free allows 500 builds a month, and every bot commit is a
  build. A Worker cron writing numbers to KV, or data committed to a separate
  branch, would take the numbers out of the build path.
- Moving project media to R2 with a deploy hook, which would end the screenshot
  commits on `master`.
- Schema-checked project metadata (status, summary, reviewed-at).
- Prerendered page bodies for crawlers and reader modes. Today they get the
  `<noscript>` summary.
