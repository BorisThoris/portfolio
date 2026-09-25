# Design rules

The portfolio is one design system, written down here and enforced by
`src/styles.css` (tokens and primitives), `src/project-page.css` and
`src/cv.css`. A change that needs a value not in the tokens is a change to
the tokens first.

## Scales

| Scale   | Values                                                          | Token            |
| ------- | --------------------------------------------------------------- | ---------------- |
| Space   | 4, 8, 12, 16, 24, 32, 48, 64 px                                 | `--space-1..8`   |
| Radius  | 8 (chips, images inside cards), 14 (cards), 22 (sections), pill | `--radius-*`     |
| Type    | 11, 13, 15, 18 px; xl, 2xl and display as clamps                | `--text-*`       |
| Surface | 1: 4 % paper, 2: 7 % paper, 3: near-black at 82 % (floating)    | `--surface-1..3` |
| Text    | paper, 72 % paper, 50 % paper                                   | `--text-1..3`    |
| Motion  | 160 ms ease-out; 240–320 ms only for a picture or a slide       | `--fast`, `--ease` |

## Rules

1. **Corners are symmetric.** One radius per element from the family. No
   ridge borders, no double frames.
2. **Depth is flat.** Every card is a 1 px `--line` border on a surface.
   Shadows and blur belong to what floats: the top bar and dialogs.
3. **The accent means something.** A project's accent colours its eyebrow,
   its primary button, its tab mark, focus rings and links, nothing else.
   Body text is never accent-coloured.
4. **One primitive per job.** `.btn` (`--primary`, `--quiet`, `--small`,
   `--large`), `.icon-button`, `.chips`, `.eyebrow`, `.surface`, `.section`
   with `.section__head`. A new component composes these before it adds a
   class of its own.
5. **Type hierarchy is the scale.** `h1` display, `h2` 2xl, `h3` xl, body
   md, meta sm, eyebrow xs uppercase tracked. Headlines balance; body text
   measures at most 72 characters.
6. **Motion is short and optional.** Hover moves 2 px at most. Nothing
   sweeps, shimmers or loops. `prefers-reduced-motion` turns every transition
   off and stops the carousel.
7. **Copy lives in content modules** (`src/content/`), not in components.
   Project facts live in each repo's `project.meta.json` and reach the site
   through the meta sync; the site never hand-copies them.
8. **Every state is reachable by keyboard** and named for assistive
   technology: tabs are tabs, dialogs are dialogs, the carousel is a
   carousel with a live region.

## The carousel

- One slide in view, the neighbours peeking in at the edges so the strip
  reads as a strip. Every slide has the same shape: a 16:9 picture and the
  copy beside it (below it under 1100 px).
- Tabs, arrows, dots and a drag all move the same index; tabs and arrows on
  a desktop, tabs and dots on a phone.
- Autoplay only when nothing else is happening: it pauses on hover, focus,
  a drag, an open dialog and a hidden tab, and never runs with reduced motion
  or on a phone.
- The picture opens the project page; the buttons open the app. A drag
  never counts as a click.

## The project page

Billboard (trailer playing muted, or the latest capture), one primary
action, then the rails: **Watch** (trailers and videos, every card the same
height, its width from its own aspect), **Posters & wallpapers** (the
project's published artwork with a download), **Screenshots**, and the
fact sheet from `project.meta.json`.
