# Portfolio best practices and content freshness (research, 2026-11-11)

This note covers what top personal portfolios do, what reviewers look at, and how good sites keep
numbers, screenshots and project status correct. It ends with a recommended direction for this site.

**How this was checked.** Each site in section 1 was fetched on 2026-11-11 in two ways:
- as text, through a fetch tool;
- as raw HTML plus up to six linked stylesheets, using `curl`.

The HTML and CSS were then searched with deterministic `grep` (no local LLM involved) for:
- `font-family`, `@font-face` and the font file names;
- `clamp(` font sizes, `max-width` and `grid-template-columns`;
- colour custom properties;
- `prefers-reduced-motion` and `prefers-color-scheme`.

Font names in the tables come from that CSS, not from memory. When a page is JS-rendered and the fetch
returned only its title, the claim is marked **not verified**. API claims in section 4 marked
**tested** were checked with live requests from this PC. Claims taken from search-engine summaries,
where the page itself was not opened, are marked **(search summary)**.

---

## 1. The shortlist: 13 live portfolios plus 2 notes

RM and CS mean a `prefers-reduced-motion` or `prefers-color-scheme` rule was found in the home HTML or
the crawled stylesheets. "no" only means none was found there: lazy chunks and CSS-in-JS were not
crawled.

| # | Site | Type (from CSS and font files) | RM / CS | What stands out | Technique worth stealing |
|---|---|---|---|---|---|
| 1 | [brittanychiang.com](https://brittanychiang.com/) | Inter (via next/font), system mono | yes / no | Single column: About, Experience, Projects, Writing. Experience is a dated timeline with tech tags. Project cards carry proof badges, such as Halcyon's "100k+ Installs" and v4's "6k+ stars and 3k+ forks". Links to a résumé and a "full project archive". [site](https://brittanychiang.com/) | **Proof chip on the card**: one platform-sourced number per project, next to the title. |
| 2 | [lynnandtonic.com](https://lynnandtonic.com/) | Sydonia Atramentiqua (serif), Hubano Rough | no / yes | Redesigned every year; the header reads "v. XIX". The [archive](https://lynnandtonic.com/archive/) lists 19 versions (2007-2025), each with a screenshot and year, plus a case-study link from 2017 on. | **Honest versioned archive**: old work stays reachable, dated and labelled, instead of being silently removed. |
| 3 | [bruno-simon.com](https://bruno-simon.com/) | Nunito, Amatic SC, Pally | no / no | A drivable 3D world. It takes keyboard, gamepad and touch input, has a Quality setting and an audio toggle, and works while its score server is offline. [site](https://bruno-simon.com/) The [case study](https://www.awwwards.com/brunos-portfolio-case-study.html) covers Three.js WebGPU with TSL shaders, instancing, culling, a reduced mobile preset, and front-end code that is MIT open source. Awards: Portfolio Honors and a Dev Award (Dec 2025), and Site of the Month (Jan 2026) **(search summary)** of the [Awwwards listing](https://www.awwwards.com/websites/winner_category_portfolio/). | **Quality toggle and a mobile preset** for anything heavy, such as the 3D work and the DAW. |
| 4 | [joshwcomeau.com](https://www.joshwcomeau.com/) | Wotfard, Cartograph CF (mono), Sriracha (accent "spicy" face) | yes / yes | Light/dark toggle, a "Disable sounds" toggle, a numbered "Popular Content" list, eight topic categories, "© 2018-present". Reading column `max-width: 48rem`. [site](https://www.joshwcomeau.com/) | **User-controlled whimsy**: sound and theme are in-page switches, not only OS settings. |
| 5 | [rauno.me](https://rauno.me/) | a custom face aliased "X" (file `dd.woff2`, not identified), JetBrains Mono, Georgia | no / no | One-line role. Links to Craft, Projects and yearly archives (2022, 2023). A seven-line manifesto. Click-to-copy email with a "Copied" state. Greys are defined as an HSL ramp (`--colors-gray10`, `gray11`, ...). [site](https://rauno.me/) | **Yearly archive pages** and a separate "craft" gallery for small interaction studies. |
| 6 | [paco.me](https://paco.me/) | Söhne, Inter, Newsreader (serif), Menlo (files `sohne-subset`, `newsreader-subset`, `inter-subset`) | yes / yes | Sections: Building, Projects, Writing, Now, Connect. Each project is a name and one line, undated. Credibility comes from named employers (Linear, Vercel) and open-source projects. The content column is a CSS grid `auto var(--content-width) auto`. [site](https://paco.me/) | **A "Now" section**: one sentence that is cheap to keep current. |
| 7 | [emilkowal.ski](https://emilkowal.ski/) | self-hosted faces aliased Sans/Serif/Mono (hashed files, not identified), set with `opsz` auto and `cv01`/`ss03` features | yes / yes | Title "Design Engineer". Four projects (Sonner, Vaul, animations.dev, aiforui.dev), one line each. A writing list and named employers. Light/dark fills `#f8f8f8` / `#252525`. [site](https://emilkowal.ski/) | **OpenType features (`ss03`, optical size)** to give a body face its own voice. |
| 8 | [blog.maximeheckel.com](https://blog.maximeheckel.com/) | Inter Variable, Departure Mono, Fira Code | yes / yes | Archive grouped by year, 2026 back to 2018. The footer shows **commit, browser, time, dimensions, source and last updated**. The nav includes "Cmd" and "Ask". Layout grid: `1fr minmax(auto, 712px) 1fr`. Colours use `oklch()` and `light-dark()`. [site](https://blog.maximeheckel.com/) | **Build stamp in the footer** (commit and last updated), the clearest freshness signal in this sample. |
| 9 | [jhey.dev](https://jhey.dev/) | system stacks only (`ui-sans-serif`, `ui-monospace`, `ui-serif`) | yes / yes | Numbered "Latest" list of five prototypes. The footer has live widgets (location, weather, Steam, Spotify) and a **build revision**. Fluid headings: `clamp(2.25rem, 6vw, 3.25rem)`. [site](https://jhey.dev/) | **System fonts plus fluid `clamp()` headings**: no font bytes, and the page still looks distinctive. |
| 10 | [leerob.com](https://leerob.com/) | Iowan Old Style (reading), system UI, Caveat (accent) | yes / yes | Text only: bio, "Notes", dated "Blogs" (Jan 2024 to Jul 2026). No stats and no "last updated" stamp. Reading width 680px; neutral palette `#0a0a0a` / `#f5f5f5`. [site](https://leerob.com/) | **Reading serif plus system UI face**: a cheap, legible pairing for long case studies. |
| 11 | [dennissnellenberg.com](https://dennissnellenberg.com/) | Neue Montreal (OTF files, aliased "Dennis Sans") | no / no | Oversized name headline, a multilingual greeting, a "Local time" readout, footer "2022 © Edition". The [work index](https://dennissnellenberg.com/work) lists 11 projects with **location, services ("Design & Development") and year**. [site](https://dennissnellenberg.com/) | **Index columns of role and year**: a reviewer sees what you did on each project without opening it. |
| 12 | [elliott.mangham.dev](https://elliott.mangham.dev) | Neue Montreal, Roobert Mono | yes / no | The live HTML has a **"Credentials" panel** with tenure (2013-26), revenue band, typical project cost, award counts (for example "24x Site Of The Day", "10x Developer Award") and client names. It adds the caveat "Figures describe our clients, not value created. Nov 2026", plus "Booking from December 2026". Fluid type via `clamp()`; 5- and 8-column grids. Awwwards gave it Site of the Day (2 Dec 2025) and a Dev Award (7.4/10), with WPO 8.2 the top sub-score ([Awwwards](https://www.awwwards.com/sites/elliott-mangham)). | **Dated, caveated numbers**: an "as of" month and a sentence saying what the figures do and do not mean. |
| 13 | [olhalazarieva.com](https://www.olhalazarieva.com/) | Sofia Sans Condensed, Spline Sans Mono | no / no | The live page is a JS shell, so its content was **not verified**; this row rests on its CSS and the [Awwwards page](https://www.awwwards.com/sites/olha-lazarieva) (SOTD and Dev Award 7.32/10; tags Typography, Gallery, 3D, React). Palette `#f7f7f7` / `#101010` with two greys. | **Condensed display face**, which fits long project titles into a dense grid. |
| - | [henryheffernan.com](https://henryheffernan.com/) | OCR-A Std (from CSS) | - | **Not verified.** The page is JS-rendered and returned only the title "Portfolio 2022". | - |
| - | cassie.codes | - | - | **Retired.** The site is now a farewell note linking to LinkedIn and Discord ([site](https://www.cassie.codes/)). Not a current example. | - |

**Award context**
- Awwwards' Site of the Day weights Design 40%, Usability 30%, Creativity 20% and Content 10%. Its Dev Award scores semantics/SEO, animation, accessibility, WPO, responsiveness and markup ([Mangham's scores](https://www.awwwards.com/sites/elliott-mangham)).
- Both winners checked scored 7.0 on accessibility ([Mangham](https://www.awwwards.com/sites/elliott-mangham), [Lazarieva](https://www.awwwards.com/sites/olha-lazarieva)). Treat award sites as a reference for look and motion, not for accessibility.
- Awwwards has no "Portfolio of the Year" title; it awards a "Portfolio Honors" badge **(search summary)** ([listing](https://www.awwwards.com/websites/winner_category_portfolio/)).
- Most entries in Readymag's "Websites of the Year" are portfolios ([Readymag](https://blog.readymag.com/award-winning-portfolios/)).

**Not included**
- No single site matched the "Sam Kuo-type minimal" example. The minimal pattern is covered by Paco, Emil, Lee and Jhey.

---

## 2. Cross-cutting patterns

### Typography and type scale
- **Two families, sometimes three.** All of these were read from the sites' CSS (section 1):
  - a sans for UI plus a mono for data: Mangham (Neue Montreal and Roobert Mono), Heckel (Inter and Departure Mono), Comeau (Wotfard and Cartograph CF);
  - a sans plus a reading serif: Paco (Söhne and Newsreader), Lee (system UI and Iowan Old Style).
- **System stacks are respectable.** Jhey uses only `ui-*` stacks ([jhey.dev](https://jhey.dev/)).
- **Fluid type with `clamp()`** where scale matters, for example:
  - Jhey: `clamp(2.25rem, 6vw, 3.25rem)`;
  - Lee: `clamp(2.2rem, 3.5vw, 2.65rem)`;
  - Mangham: `clamp()` from 11px up for body, labels and display sizes.
  - The text-list sites (Paco, Emil, Heckel) had no `clamp()` in the crawled CSS.
- **Tuned stock faces.** Emil sets `font-feature-settings` (`cv01`, `ss03`) and `font-variation-settings` (`opsz` auto) ([emilkowal.ski](https://emilkowal.ski/)).
- Readymag's team lists five patterns in award-winning portfolios: "strong typography" first, then restraint balanced with richness, motion, personality and small details ([Readymag](https://blog.readymag.com/award-winning-portfolios/)).

### Whitespace and grid
- **Narrow reading measures are the norm.** Crawled `max-width` values:
  - Brittany: 640px;
  - Paco: 688-768px;
  - Lee: 680px;
  - Heckel: 663-712px centre column;
  - Comeau: 48rem (768px);
  - Olha: 620-1100px;
  - Mangham: 1024px.
- **Common grid techniques:**
  - a centre column built as a three-track grid: Heckel `1fr minmax(auto, 712px) 1fr`, Paco `auto var(--content-width) auto`;
  - plain 8- or 12-column grids for wide layouts: Brittany 8, Lee 12, Mangham 5 and 8;
  - 2-3 column card grids: Rauno, Lynn, Olha.
- Source for all of the above: the crawled CSS in section 1.

### Colour, light and dark
- **Neutral grounds, with colour saved for accents.** Examples:
  - Emil: `#f8f8f8` / `#252525`;
  - Lee: `#0a0a0a` / `#f5f5f5`;
  - Olha: `#f7f7f7` / `#101010`;
  - Paco: `#fff` / `#000`, with a single orange `#ff9f0a` for an active state;
  - Rauno: an HSL grey ramp;
  - Comeau: the most colourful, with an oklch yellow button and amber alerts.
- **Modern colour functions.** Heckel derives tokens with `oklch(from ...)` and `light-dark()`.
- **Dark mode.** 7 of the 13 sites had a `prefers-color-scheme` rule in the crawled CSS; Comeau also has an explicit toggle.
- Source for all of the above: the crawled CSS in section 1.

### Navigation and IA
- **The engineer-leaning sites are lists, not galleries.** Emil, Paco, Lee and Jhey show a project name and one line, with no thumbnails ([emilkowal.ski](https://emilkowal.ski/), [paco.me](https://paco.me/), [leerob.com](https://leerob.com/), [jhey.dev](https://jhey.dev/)). The designer-leaning sites use image cards plus an index with role and year ([dennissnellenberg.com/work](https://dennissnellenberg.com/work)).
- **A few featured items, with the full archive behind a link:**
  - Brittany features a few projects and links a full project archive ([brittanychiang.com](https://brittanychiang.com/));
  - Dennis features 4 of 11 ([dennissnellenberg.com](https://dennissnellenberg.com/));
  - Jhey shows 5 ([jhey.dev](https://jhey.dev/));
  - this matches NN/g's advice of 3-5 detailed case studies ([NN/g](https://www.nngroup.com/articles/ux-design-portfolios/)).
- **Archives grouped by year:** Heckel ([blog](https://blog.maximeheckel.com/)), Rauno ([rauno.me](https://rauno.me/)) and Lynn's version archive ([archive](https://lynnandtonic.com/archive/)).
- **Navs are short (3-5 items):** for example, Dennis has Home/Work/About/Contact and Heckel has Index/Articles/Cmd/Ask (section 1 fetches).

### Case-study structure
- **Bruno's case study is a build narrative.** Its sections, in order:
  - origin;
  - why rebuild;
  - world-building tools;
  - visual style;
  - simulation systems;
  - how the projects are shown;
  - multiplayer limits;
  - "When performance defines possibilities";
  - sound;
  - turning the portfolio into a game;
  - shipping ("More than a year, but done").

  Source: [Awwwards case study](https://www.awwwards.com/brunos-portfolio-case-study.html).
- **NN/g's structure:** problem, your role, constraints, timeline, process including iterations, the value created, and what was left out and why ([NN/g](https://www.nngroup.com/articles/ux-design-portfolios/)).
- **Lynn** attaches a case study to each yearly redesign ([archive](https://lynnandtonic.com/archive/)).

### Proof and numbers
- **Three ways the sample shows proof:**
  - a single platform-sourced number on the card (Brittany's installs, stars and forks) ([brittanychiang.com](https://brittanychiang.com/));
  - a dated, caveated credentials panel (Mangham's "Nov 2026" and "Figures describe our clients, not value created") ([elliott.mangham.dev](https://elliott.mangham.dev));
  - named employers and named open-source work instead of numbers (Paco, Emil) ([paco.me](https://paco.me/), [emilkowal.ski](https://emilkowal.ski/)).

### Motion and reduced motion
- **MDN's pattern:** keep the default animation, override it under `@media (prefers-reduced-motion: reduce)`, and replace scale, pan and parallax with fades instead of removing feedback ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).
- **8 of 13** sites had a reduced-motion rule in the crawled CSS.
- **In-page switches:** Comeau has a sound switch ([joshwcomeau.com](https://www.joshwcomeau.com/)); Bruno has a quality switch and a mobile preset ([site](https://bruno-simon.com/), [case study](https://www.awwwards.com/brunos-portfolio-case-study.html)).

### Performance and accessibility budgets
- **Core Web Vitals, "good" thresholds:** LCP at most 2.5 s, INP at most 200 ms and CLS at most 0.1, measured at the 75th percentile, separately for mobile and desktop ([web.dev](https://web.dev/articles/vitals)).
- **Awwwards scores WPO and accessibility separately** in its Dev Award. Mangham's best sub-score is WPO at 8.2 ([Awwwards](https://www.awwwards.com/sites/elliott-mangham)).

### What the sample avoids (observed in 13 sites, not a researched rule)
- Thumbnails on every item, on the engineer-leaning sites.
- Live counter dashboards on the home page.
- Undated "latest" lists: dates appear on Heckel, Lee, Lynn, Dennis and Mangham.

---

## 3. What reviewers look at (evidence, graded)

**No rigorous eye-tracking study of developer portfolios was found.** The evidence below is résumé
research, one design-portfolio survey, and practitioner opinion.

| Grade | Finding | Source |
|---|---|---|
| Survey, opened (n=204 hiring UX professionals) | Show the process as well as the final product, and choose 3-5 projects as detailed case studies. Hiring managers "don't have a lot of time" and rarely read everything, so make the work scannable. Cover the problem, your role, the constraints and the value created. | [NN/g, 5 Steps to Creating a UX-Design Portfolio](https://www.nngroup.com/articles/ux-design-portfolios/) |
| Secondary coverage of a résumé study **(search summary)** | TheLadders' 2018 eye-tracking study put the initial résumé screen at about 7.4 s, and found that simple layouts, clear headers and short statements helped. A critic notes the sample size is not reported. This is about résumés, not portfolios. | [HR Dive](https://www.hrdive.com/news/eye-tracking-study-shows-recruiters-look-at-resumes-for-7-seconds/541582/), [ERE critique](https://www.ere.net/articles/is-the-6-second-resume-scan-a-myth) |
| NN/g **(search summary)** | Researcher portfolios should show business impact and metrics. Document projects as you go and review the portfolio yearly. | [NN/g researcher portfolios](https://www.nngroup.com/articles/ux-researcher-portfolio/), [NN/g maintaining a portfolio](https://www.nngroup.com/articles/maintain-ux-portfolio/) |
| Practitioner, engineering **(search summary)** | A hiring manager reads candidates' personal sites and repos and asks about them in interviews. | [dev.to comment](https://dev.to/danielsobrado/comment/1916d) |
| Practitioner, engineering **(search summary)** | A personal site helps as a hub of project links and as a demonstration of frontend skill, depending on the role. | [Holloway, Technical Recruiting](https://holloway.com/g/technical-recruiting-hiring/sections/linkedin-github-and-personal-websites) |
| Practitioner, engineering **(search summary)** | A VP of engineering likes to see recent work in current languages and frameworks. | [Built In](https://builtin.com/articles/what-companies-look-for-on-github) |
| Vendor blogs, weak **(search summary)** | Use "7 seconds" style framing with caution; it traces back to résumé research. Review-time estimates of 5-10 minutes come from an ADPList-attributed survey that was not checked. | [Fueler](https://www.fueler.io/blog/your-portfolio-has-7-seconds-what-recruiters-look-at-first), [ADPList](https://adplist.org/blog/what-is-a-hiring-manager-looking-for-in-a-design-portfolio) |

Two figures were left out because no primary source could be found:
- "73% of hiring managers (Stack Overflow 2024)";
- "NN/g: 70% filtered out for no quantified impact".

**What this means for the site.** Within seconds, the first screen must state the role, the domain
and one proof point. Each case study should lead with the problem, constraints, role and result.
Depth on 3-5 projects beats breadth.

---

## 4. Keeping content fresh and correct

### 4.1 Practices and tooling

| Practice | How it works | Source |
|---|---|---|
| **Build stamp** | Heckel's footer shows the commit and the last-updated time; Jhey's shows a build revision. | [blog.maximeheckel.com](https://blog.maximeheckel.com/), [jhey.dev](https://jhey.dev/) |
| **"As of" plus caveat on numbers** | Mangham dates his figures ("Nov 2026") and says what they measure. Brittany names the metric ("Installs", "stars"). This repo's `src/project-traction.json` already has `asOf` and a source note, but the numbers are counted by hand. | [elliott.mangham.dev](https://elliott.mangham.dev), [brittanychiang.com](https://brittanychiang.com/) |
| **Badge caching (shields.io)** | Each badge has its own default cache lifetime. `cacheSeconds` (legacy `maxAge`) can lengthen it but not shorten it below that default. Live counters are cached by design, so a stamp is still needed. **(search summary)** | [shields.io badge page](https://shields.io/badges/git-hub-code-search-count) |
| **Scheduled rebuild via deploy hook** | A Pages deploy hook is a secret POST URL that starts a build; scheduled cron is a listed use case. Anyone with the URL can trigger builds, so store it as a secret. | [Cloudflare Pages deploy hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/) |
| **Worker cron** | Set `triggers.crons` in the Wrangler config and add a `scheduled()` handler. Crons run in UTC; changes take up to 15 min to propagate. | [Cloudflare cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) |
| **Runtime data via bindings** | Pages Functions can bind KV namespaces and R2 buckets, read through `context.env` at request time. A redeploy is needed after adding a binding. | [Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/) |
| **Build budget** | The Pages Free plan allows 500 builds a month, a 20-minute build timeout, 20,000 files per site and 25 MiB per file. | [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) |
| **GitHub Actions schedule caveats** | Scheduled runs can be delayed under load and run no more often than every 5 minutes, on the default branch only. In public repos they are disabled after 60 days without activity. | [GitHub docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) |
| **Git scraping** | A scheduled job fetches the data and commits **only if it changed**, so the history becomes a dataset. Good for a separate data repo or branch. | [Simon Willison](https://simonwillison.net/2020/Oct/9/git-scraping/) |
| **ISR / stale-while-revalidate** | The cached page is served while a fresh one renders in the background. If regeneration errors, the last good data keeps being served. Not available for static export, but the "serve last good" rule applies to any stats fetcher. | [Next.js ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration) |
| **Schema-validated content** | Astro validates collection entries against a Zod schema, fails the build on a mismatch, and supports custom loaders for remote APIs and request-time "live collections". Velite does the same for any bundler and reports the file and property path. | [Astro collections](https://docs.astro.build/en/guides/content-collections/), [Astro error reference](https://docs.astro.build/en/reference/errors/content-entry-data-error/), [Velite](https://velite.js.org/guide/introduction) |
| **Link checking** | Run `lycheeverse/lychee-action@v2` on a cron with `fail: false`. Open an issue when the exit code is non-zero, and cache `.lycheecache` with `--max-cache-age 1d`. | [lychee-action](https://github.com/lycheeverse/lychee-action) |
| **Visual regression** | Playwright's `toHaveScreenshot()` keeps baselines next to the tests, with `threshold` and `maxDiffPixels` tolerances. Baselines depend on the platform, so generate them where the checks run. | [Playwright](https://playwright.dev/docs/test-snapshots) |
| **Hosted screenshots** | Cloudflare Browser Run (formerly Browser Rendering) offers a one-request screenshot "Quick Action" with a free tier. | [Cloudflare Browser Run](https://developers.cloudflare.com/browser-rendering/) |
| **Honest archive** | Lynn Fisher keeps every version of the site, each with its year and a case study. | [lynnandtonic.com/archive](https://lynnandtonic.com/archive/) |

### 4.2 Platform APIs for live traction (checked 2026-11-11)

| Platform | Endpoint and auth | Fields | Notes |
|---|---|---|---|
| **Nexus Mods** | `POST https://api.nexusmods.com/v2/graphql` is the documented endpoint; `https://api-router.nexusmods.com/graphql` gave the same answer. **No auth needed** for this query (**tested**). | `legacyMods(ids:[{gameId,modId}]) { nodes { name downloads endorsements updatedAt } }` returned SkyUI with 26,492,681 downloads. `uniqueDownloads` is on **`ModFile`** (the `modFiles` query), not on `Mod`. | The docs call V2 a work in progress ([Nexus GraphQL docs](https://graphql.nexusmods.com/)). Choose total or unique downloads and say which on the page. |
| **YouTube RSS (no key)** | `https://www.youtube.com/feeds/videos.xml?channel_id=UC...` | `media:community > media:statistics@views` (**tested**). `media:starRating@count` is present, but whether it is the like count is unconfirmed. | Carries only the **latest 15 videos**, so older trailers drop out ([tested feed](https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw)). |
| **YouTube Data API** | `videos.list?part=statistics&id=a,b,c` with an API key; **1 quota unit per call**. | `statistics.viewCount`, `likeCount`, `commentCount`. `dislikeCount` has been private since Dec 2021. | From **24 Aug 2026**, `viewCount` counts a view when playback begins, including autoplay and hover, so the date of a count matters ([videos resource](https://developers.google.com/youtube/v3/docs/videos), [videos.list](https://developers.google.com/youtube/v3/docs/videos/list)). The daily quota and the maximum ids per call are **not verified**. |
| **itch.io** | Current: `GET https://api.itch.io/profile/games` with `Authorization: Bearer <API key>`. The `itch.io/api/1/KEY/my-games` form is the **legacy** API. | `views_count`, `downloads_count`, `purchases_count`, `published_at`, `url`. | Keys from account settings are unscoped, so keep the key server-side as a secret. No rate limits are documented ([itch serverside API](https://itch.io/docs/api/serverside)). |
| **Reddit** | OAuth2 required for API clients, with a unique User-Agent in the form `<platform>:<app id>:<version> (by /u/name)`. | The post's `score` and `num_comments`. | An unauthenticated `about.json` request returned **403** from this PC (**tested**, one data point). The archived wiki gives 60 requests/min for OAuth clients ([Reddit API wiki](https://github.com/reddit-archive/reddit/wiki/API)); secondary sources cite 100 per minute ([data365](https://data365.co/blog/reddit-oauth-api-documentation)). |
| **GitHub** | REST allows 60 requests/h unauthenticated, 5,000/h with a token, and 1,000/h per repo for `GITHUB_TOKEN`. | Stars, `pushed_at`, `archived`. | [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) |

### 4.3 Rules for showing live numbers

These rules are derived from the sources above, not quoted from them.

1. **Every number carries a value, a source URL and a `fetchedAt` date.** Render it as "536 downloads on Nexus Mods, as of 11 Nov 2026" and link the platform page. Brittany names the metric and Mangham dates it.
2. **Never show a failed fetch as zero.** Keep the last good value, as ISR does. If the value is older than N days, show its date prominently or drop it.
3. **Keep exact values in the data.** Round only in display ("500+"), and only where the label says the number is rounded.
4. **Freeze what does not move.** Launch-post upvotes stop moving after the first days. Record them once, dated, rather than maintaining Reddit OAuth.
5. **Name the metric exactly**: total or unique downloads, and YouTube's changed view definition.

---

## 5. Recommended direction for this site

### What the repo and live site show today (2026-11-11)

**Rendering**
- Both routes checked, `/` and `/projects/vyb-chess/`, serve an empty `<div id="root"></div>` (checked with curl).
- Each has its own `<title>`, OG tags and a `<noscript>` sentence; `scripts/build-pages.mjs` writes these per route.
- So link previews work, but without JS the body is empty. Crawlers that do not run JS, and reader modes, see one sentence.

**Sync**
- `.github/workflows/sync-project-shots.yml` runs hourly (cron `17 * * * *`) on self-hosted ARM runners, because Actions billing is suspended.
- Its comments record a 7-hour stall when no runner was eligible.
- It commits only what changed. Each such commit makes Cloudflare rebuild, so on the Free plan (500 builds/month) frequent changes could hit the limit. The account's plan tier was not checked.

**Traction**
- `src/project-traction.json` is counted by hand and has an `asOf` date.

### Design concept: "Workshop logbook"

**Ground and colour**
- Warm off-white by default, with a true dark mode.
- One ink colour, plus one signal accent used only for status and numbers.
- This follows the neutral-ground pattern of Emil, Lee and Olha, and Paco's single accent.

**Type**
- A neutral grotesk for UI and headings, such as Inter or a Söhne-like face, tuned with stylistic sets the way Emil does.
- **A mono for every number, date and status**, such as Departure Mono or JetBrains Mono (as on Heckel, Rauno and Mangham).
- A reading serif, such as Newsreader or Iowan, for case-study prose (Paco, Lee).
- Fluid headings with `clamp()`.
- A reading measure of about 680-720px inside a three-track grid.

**Home page, in order**
1. One sentence of positioning: full-stack engineer, risk software at Man Group, Sofia.
2. A **proof strip** of three dated numbers.
3. **3-5 featured case studies**, following NN/g's advice.
4. A dense **project index** for all 53 projects, grouped by year like Heckel's archive. Columns: name, kind, role, status light, last deploy, one proof number, year (Dennis-style columns).

**Signature moments**
- The project index rendered as a departure-board table.
- Project pages that open on the trailer, with an "autoplay/quality" switch in the spirit of Bruno and Comeau.
- A Lynn-style **archive** for retired projects.
- A Heckel-style footer build stamp.
- A Mangham-style caveat line under the proof strip.

**Case studies**
- Order: problem, constraints, role, approach, result (with a dated number), what I would change.

**Motion and performance**
- Every animation has a reduced-motion variant, following MDN's pattern.
- Budget LCP at 2.5 s or less on mobile (web.dev).
- Prerender each route's main text into its HTML.

### Freshness architecture

| Concern | Recommendation | Why / source |
|---|---|---|
| Traction numbers | A **Worker cron**, every 6 h, fetches:<br>- Nexus: GraphQL, no key;<br>- YouTube: Data API, key as a secret;<br>- itch: `/profile/games`, key as a secret.<br><br>It writes `{value, metric, source, fetchedAt}` to **KV** and keeps the last good value on failure. A Pages Function serves `/api/traction` from KV; the client hydrates the numbers and shows the dates. A Pages build has no KV binding, so the build script **fetches that public endpoint** and bakes a snapshot into the HTML as the no-JS fallback. Reddit: record once per launch post, with the date. | No commits and no rebuilds for numbers, and no dependency on the self-hosted runners ([cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [bindings](https://developers.cloudflare.com/pages/functions/bindings/)); APIs in 4.2. |
| Screenshots, trailers and meta from about 20 repos | Each repo's deploy uploads `project-media/` and `project.meta.json` to **R2** under content-hashed names, then calls the portfolio's **deploy hook**. The portfolio build reads the R2 manifest instead of committing images. If repo commits are kept, follow git-scraping rules: commit to a **`data` branch** and only on a real change. | Removes the bot commits from `master` ([deploy hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/), [bindings](https://developers.cloudflare.com/pages/functions/bindings/), [git scraping](https://simonwillison.net/2020/Oct/9/git-scraping/)). |
| Build cadence | Event-driven builds from each repo's deploy hook, plus **one scheduled rebuild a day** from the Worker cron. That stays well under 500 a month. | [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) |
| Descriptions drifting | Treat each repo's `project.meta.json` as the source of truth, and validate it with a **Zod schema** in the portfolio build. Fail the build when `status`, `summary` or `reviewedAt` is missing. Warn when the repo's last commit is much newer than `reviewedAt`. | [Astro and Zod](https://docs.astro.build/en/guides/content-collections/), [Velite](https://velite.js.org/guide/introduction) |
| Dead or abandoned projects | Add a `status` enum (`active`, `maintained`, `finished`, `archived`, `offline`) and show it as a label. The health check below can demote a project to `offline` automatically. `archived` moves a project to the archive page with its dates; nothing is deleted. | [Lynn's archive](https://lynnandtonic.com/archive/) |
| Live demo links | The same Worker cron requests every `deploymentUrl` and stores the status code and time in KV; this drives the status light. Also run **lychee** with its cache over the built site, weekly or before each deploy. It needs a runner, so use the self-hosted runner or a local pre-deploy script while Actions billing is suspended. | [lychee-action](https://github.com/lycheeverse/lychee-action) |
| Stale screenshots | Store `capturedAt` with each image and show it on the project page. Optionally re-capture through Cloudflare Browser Run. Keep Playwright `toHaveScreenshot` baselines for the portfolio's own pages, generated on the machine that runs the checks. | [Browser Run](https://developers.cloudflare.com/browser-rendering/), [Playwright](https://playwright.dev/docs/test-snapshots) |
| Date stamps | Footer: commit and build time, as Heckel does. Each number: an "as of" date. Each project: "last deployed", from the repo's own metadata. | [blog.maximeheckel.com](https://blog.maximeheckel.com/) |
| Crawlable content | Prerender each route's main text into its HTML at build. The build already writes one file per route. | curl of the live site, above. |
