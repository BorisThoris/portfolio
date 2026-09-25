import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const site = "https://boris-portfolio-git.pages.dev";
const template = await fs.readFile(path.join(root, "index.html"), "utf8");
const projects = JSON.parse(await fs.readFile("src/project-data.json", "utf8"));
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
const routes = [
  {
    route: "/",
    title: "Boris Bostandzhiev | Full-stack Engineer & Creative Developer",
    description:
      "Full-stack engineer in Sofia building product interfaces, browser music tools, games, and interactive worlds. Explore selected projects and professional experience.",
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
  const image = project?.screenshot
    ? `${site}/project-shots/${project.slug}/latest/card.jpg`
    : `${site}/social-preview-v3.png`;
  let html = template.replace(
    /<title>.*?<\/title>/s,
    `<title>${escape(title)}</title>`,
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
        ? `${project.title} screenshot`
        : "Boris Bostandzhiev — Serious engineering. A playful streak.",
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
    `<noscript><main style="max-width:60rem;margin:3rem auto;padding:1rem;font-family:system-ui"><h1>${escape(project?.title ?? "Boris Bostandzhiev")}</h1><p>${escape(description)}</p>${project?.deploymentUrl ? `<p><a href="${escape(project.deploymentUrl)}">Open live project</a></p>` : ""}<p>This portfolio uses JavaScript for interactive browsing.</p><a href="/">Portfolio</a> · <a href="mailto:borisbostandzhiev@yahoo.com">Contact Boris</a><ul>${visible.map((p) => `<li><a href="/projects/${p.slug}">${escape(p.title)}</a></li>`).join("")}</ul></main></noscript>`,
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
