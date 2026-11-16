import fs from "node:fs/promises";
import path from "node:path";
import { effectiveMedia } from "./lib/effective-media.mjs";
const root = path.resolve("dist");
const site = "https://boris-portfolio-git.pages.dev";
// Preload the two Latin fonts the first screen is set in, so text is laid out
// once: without them the fallback fonts wrap the hero differently and the page
// jumps when the real fonts arrive.
const fontPreloads = (await fs.readdir(path.join(root, "assets")))
  .filter((file) => /^(geist|caveat)-latin-wght-normal-.*\.woff2$/.test(file))
  .map((file) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${file}" crossorigin />`)
  .join("");
const template = (await fs.readFile(path.join(root, "index.html"), "utf8"))
  .replace("</title>", `</title>${fontPreloads}`);
// The hand-picked best picture per project doubles as its link-preview image.
const covers = JSON.parse(await fs.readFile(path.resolve("src/project-covers.json"), "utf8"));
const projects = JSON.parse(await fs.readFile("src/project-data.json", "utf8"));
const access = JSON.parse(await fs.readFile("src/project-access.json", "utf8"));
const analysis = JSON.parse(
  await fs.readFile("src/repo-analysis.json", "utf8"),
);
const visible = projects.filter(
  (project) =>
    analysis.find((row) => row.slug === project.slug)?.showcaseTier !==
    "excluded",
);
const escape = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
// The home hero plays the first featured project with a landscape video (same rule
// as HomePage's reel); preload that video's poster rather than a preview it doesn't show.
const featuredSlugs = [...(await fs.readFile("src/content/home.ts", "utf8"))
  .match(/featuredSlugs = \[([\s\S]*?)\]/)[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
const homeMedia = effectiveMedia(
  JSON.parse(await fs.readFile("src/project-details.json", "utf8")),
  JSON.parse(await fs.readFile("src/project-media-overrides.json", "utf8")),
  access);
const ratio = (clip) => clip.width > 0 && clip.height > 0 ? clip.width / clip.height : clip.orientation === "portrait" ? 9 / 16 : clip.orientation === "square" ? 1 : 16 / 9;
const reelPoster = featuredSlugs.map((slug) => {
  const media = homeMedia[slug] ?? {};
  const clips = [...(media.trailers ?? []).map((clip) => ({ ...clip, kind: "video" })), ...(media.videos ?? []).map((clip) => ({ ...clip, kind: clip.kind ?? "link" }))];
  return clips.find((clip) => clip.kind === "video" && ratio(clip) >= 1)?.poster;
}).find(Boolean);
const routes = [
  {
    route: "/",
    title: "Boris Bostandzhiev | Full-stack Engineer & Creative Developer",
    description:
      "Boris Bostandzhiev is a full-stack engineer in Sofia. See his product work, browser music tools, games, and 3D projects.",
  },
  {
    route: "/cv-print",
    title: "Résumé | Boris Bostandzhiev",
    description:
      "Professional experience, technical capabilities, and selected projects by Boris Bostandzhiev, full-stack engineer in Sofia.",
  },
  ...visible.map((project) => ({
    route: `/projects/${project.slug}`,
    title: `${project.title} | Boris Bostandzhiev`,
    description: project.description,
    project,
  })),
];
for (const { route, title, description, project } of routes) {
  const entry = access[project?.slug];
  const availability = entry ? `<section><h2>${escape(entry.label)}</h2><p>${escape(entry.status)}</p><p>Environment: ${escape(entry.environment)}</p><pre>${escape(entry.instructions)}</pre>${entry.downloadUrl ? `<p><a href="${escape(entry.downloadUrl)}">${escape(entry.downloadLabel || "Download")}</a></p>` : ""}</section>` : "";
  const cover = project ? covers[project.slug] : undefined;
  const image = cover ? `${site}${cover}` : entry?.kind === "web" && entry.images[0]?.path ? `${site}${entry.images[0].path}` : entry && entry.kind !== "web" ? `${site}${entry.images[0]?.path ?? "/social-preview-v4.png"}` : project?.screenshot
    ? `${site}${project.screenshot}`
    : `${site}/social-preview-v4.png`;
  let html = template.replace(
    /<title>.*?<\/title>/s,
    `<title>${escape(title)}</title>`,
  );
  html = html.replace(
    /<link data-project-preload[^>]*>/,
    route === "/cv-print"
      ? ""
      : route === "/" && reelPoster
        // Below 1001px (one column) the reel sits under the first screen; don't let it compete with the script there.
        ? `<link rel="preload" as="image" href="${escape(reelPoster)}" media="(min-width: 1001px)" fetchpriority="high" />`
      : entry && entry.kind !== "web"
        ? `<link rel="preload" as="image" href="${escape(entry.images[0]?.path ?? "/project-shots/native-placeholder.svg")}" fetchpriority="high" />`
        : `<link rel="preload" as="image" href="/project-previews/${project?.slug ?? "bbeats"}-960.webp" imagesrcset="/project-previews/${project?.slug ?? "bbeats"}-480.webp 480w, /project-previews/${project?.slug ?? "bbeats"}-960.webp 960w, /project-previews/${project?.slug ?? "bbeats"}-1600.webp 1600w" imagesizes="${project ? "(max-width: 760px) 100vw, 1280px" : "(max-width: 480px) 100vw, (max-width: 760px) 70vw, 50vw"}" fetchpriority="high" />`,
  );
  const setMeta = (attribute, name, content) => {
    const pattern = new RegExp(
      `<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*\\/?>`,
      "g",
    );
    html = html.replace(
      pattern,
      `<meta ${attribute}="${name}" content="${escape(content)}" />`,
    );
  };
  setMeta("name", "description", description);
  for (const prefix of ["og", "twitter"]) {
    const attr = prefix === "og" ? "property" : "name";
    setMeta(attr, `${prefix}:title`, title);
    setMeta(attr, `${prefix}:description`, description);
    setMeta(attr, `${prefix}:image`, image);
    setMeta(
      attr,
      `${prefix}:image:alt`,
      project
        ? entry?.transcriptUrl ? `${project.title}: captured console output` : entry && entry.kind !== "web" && !entry.images.length ? `${project.title}: capture unavailable` : `${project.title} screenshot`
        : "Selected work by Boris Bostandzhiev",
    );
  }
  setMeta("property", "og:url", `${site}${route}`);
  setMeta("property", "og:image:secure_url", image);
  html = html.replace(
    /<meta property="og:image:(?:width|height|type)"[^>]*>/g,
    "",
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${site}${route}" />`,
  );
  const schema = project
    ? {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: project.title,
        description,
        url: `${site}${route}`,
        author: { "@type": "Person", name: "Boris Bostandzhiev" },
      }
    : {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Boris Bostandzhiev",
        url: site,
        jobTitle: "Full-stack Engineer",
        sameAs: [
          "https://github.com/BorisThoris",
          "https://www.linkedin.com/in/boris-b-22566b171/",
        ],
      };
  html = html.replace(
    /<script id="site-schema"[^>]*>[\s\S]*?<\/script>/,
    `<script id="site-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>`,
  );
  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript><main style="max-width:44rem;margin:4rem auto;padding:1rem 1.25rem;font:16px/1.6 system-ui,sans-serif;color:CanvasText;background:Canvas"><h1>${escape(project?.title ?? "Boris Bostandzhiev")}</h1><p>${escape(description)}</p>${availability}${project?.deploymentUrl && (!entry || entry.kind === "web") ? `<p><a href="${escape(project.deploymentUrl)}">Open live project</a></p>` : ""}<p>This portfolio uses JavaScript for interactive browsing.</p><a href="/">Portfolio</a> · <a href="mailto:borisbostandzhiev@yahoo.com">Contact Boris</a><ul>${visible.filter(p => access[p.slug]?.kind !== "archive").map((p) => `<li><a href="/projects/${p.slug}">${escape(p.title)}</a></li>`).join("")}</ul><details><summary>Historical archives</summary><ul>${visible.filter(p => access[p.slug]?.kind === "archive").map(p => `<li><a href="/projects/${p.slug}">${escape(p.title)}</a></li>`).join("")}</ul></details></main></noscript>`,
  );
  const directory = path.join(root, route);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "index.html"), html);
}
await fs.writeFile(
  path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(({ route }) => `<url><loc>${site}${route}</loc></url>`).join("")}</urlset>\n`,
);
await fs.writeFile(
  path.join(root, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`,
);
console.log(
  `Generated metadata and no-JavaScript fallback for ${routes.length} routes, sitemap.xml, and robots.txt.`,
);

// Every known route has its own HTML. Cloudflare can therefore serve a real
// HTTP 404 for unknown URLs while React renders the matching recovery screen.
await fs.writeFile(
  path.join(root, "404.html"),
  template
    .replace(/<link data-project-preload[^>]*>/, "")
    .replace(
      /<title>.*?<\/title>/s,
      "<title>Page not found | Boris Bostandzhiev</title>",
    )
    .replace(
      "</head>",
      '<meta name="robots" content="noindex, follow" /></head>',
    )
    .replace(
      /<noscript>[\s\S]*?<\/noscript>/,
      '<noscript><h1>Page not found</h1><p><a href="/">Return to the portfolio</a></p></noscript>',
    ),
);

// A public inventory of the exact effective media exposed by the React UI.
const media = effectiveMedia(
  JSON.parse(await fs.readFile("src/project-details.json", "utf8")),
  JSON.parse(await fs.readFile("src/project-media-overrides.json", "utf8")),
  access);
await fs.writeFile(path.join(root, "project-media.json"), JSON.stringify(Object.fromEntries(
  Object.entries(media).map(([slug, details]) => [slug,
    [...(details.trailers ?? []), ...(details.videos ?? [])]
      .filter((clip, index, clips) => clips.findIndex(other => other.url === clip.url) === index)
  ]).filter(([, clips]) => clips.length)
), null, 2));
