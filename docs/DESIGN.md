# Portfolio design system

## Direction

A personal engineering portfolio with an editorial rhythm: charcoal canvas, warm-white typography, and a restrained lime accent. Real product interfaces supply the visual variety. There are no continuous background animations, automatic slide changes, or autoplay videos.

The home page answers four questions in order: who Boris is, what he has built, where he has worked, and how to contact him. Five projects receive editorial emphasis; the complete public catalogue remains searchable and filterable.

## Shared foundation

- `src/styles.css`: color, type, spacing, focus, buttons, chips, section headings, fallback logos, and empty states.
- `src/home.css`: homepage layout, project catalogue, carousel, experience disclosures, and contact section.
- `src/project-page.css`: project overview, media galleries, technical disclosure, and next-project navigation.
- `src/cv.css`: screen and print résumé layouts.

Use shared primitives (`btn`, `icon-button`, `chips`, `eyebrow`, `section`, `section__head`) before introducing new controls. Use flat, outlined surfaces. Save shadows for overlapping product imagery. Prefer spacing and typography to additional containers.

The default typeface uses the system font stack, with no external font request. Body copy is warm white with explicit secondary and tertiary contrast levels. Lime identifies primary actions and focus states. The contact panel reverses the colors and uses a dark focus ring.

## Content ownership

- Personal introduction and editorial selection: `src/content/home.ts`.
- Career history and résumé content: `src/content/profile.ts`.
- Project descriptions, tags, and links: generated `src/project-data.json`.
- Extended project facts and media: generated `src/project-details.json`, loaded with the project route.
- Rankings: `src/repo-analysis.json`; they determine catalogue visibility, not the editorial shortlist.

Never invent metrics, testimonials, availability, or endorsements. Present public employer context as context, not as proof that Boris built every visible public product. Self-assigned repository scores and lines-of-code totals do not belong in the visitor experience.

## Interaction requirements

The carousel moves only when requested. Tabs, arrows, swipe, and ArrowLeft/ArrowRight/Home/End control the same selection. Keyboard selection moves tab focus. Inactive panels are inert; the selected project is announced. Reduced motion makes movement immediate.

Career history uses native disclosures with all detail available inline. Search has a label, result announcements, and a clear reset state. Contact supports email and clipboard, including an explicit failure message. Touch controls should be at least 40–44px high.

Every page has a single main landmark and heading. Navigation moves focus to the new content; return links reach the work section. Unknown URLs show an honest recovery page. Never send public visitors to localhost.

## Media and loading

`npm run build` and `npm run dev` generate cached 480px and 960px WebP project previews from the existing screenshots. Original captures remain available on project pages. Preview failures fall back through the original/latest, stable, curated image, then placeholder. Hero imagery has reserved dimensions; other images load lazily. Media is explicitly played by the visitor.

Project and résumé code are loaded on navigation. The static build writes route-specific titles, descriptions, canonical links, social metadata, structured data, and a no-JavaScript fallback for every known route, plus sitemap, robots, and a 404 page. Cloudflare serves these files directly.

## Release checks

Run `npm run build`, then `npm run check:ui`. The browser check covers interactions, keyboard focus, all 19 public project routes, selected WCAG A/AA audits, responsive layouts, image loading, print controls, metadata, and error routes. CI runs the same check and saves screenshots and audit results. Automated accessibility checks supplement visual and keyboard review; they are not a full accessibility certification.
