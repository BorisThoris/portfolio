// Metadata inputs for this repository - unique to portfolio.
//
// Everything here is curated by hand. Derived facts (stack, metrics, git,
// screenshots) are computed by scripts/generate-project-meta.mjs, which writes
// project.meta.json. Run it with:
//   npm run meta          regenerate project.meta.json
//   npm run meta:check    fail if project.meta.json is stale

import path from 'node:path';

// Screenshots are captured by the portfolio (npm run capture there). Point
// PORTFOLIO_ROOT elsewhere, or drop images in ./project-media, to override.
const portfolioRoot = process.env.PORTFOLIO_ROOT ?? String.raw`C:\Users\Gaming PC\Desktop\Repos\portfolio`;

export default {
  slug: "portfolio",
  classification: "web-site",

  curated: {
    "title": "Portfolio",
    "subtitle": "Local showcase site and demo runner",
    "description": "The React + Vite portfolio site that indexes every project here: it runs each demo locally on its own port, captures card/desktop/mobile/full screenshots through Playwright, and renders the scored project catalogue from generated metadata.",
    "tags": [
      "React",
      "TypeScript",
      "Vite",
      "Playwright",
      "Tooling"
    ],
    "accent": "#7aa2f7",
    "localUrl": "http://127.0.0.1:4100/",
    "buildCommand": "npm run build",
    "buildOutput": "dist",
    "runCommand": "npm run dev -- --host 127.0.0.1 --port 4100",
    "showcaseTier": "excluded",
    "excludedReason": "This is the shell that presents the work, not a portfolio project card."
  },

  scores: {
    "priorityScore": 0,
    "demoabilityScore": 0,
    "depthScore": 0,
    "polishScore": 0,
    "uniquenessScore": 0,
    "maintenanceScore": 0
  },

  analysisNotes:
    "Excluded from visible project sections to keep the catalog focused on external demos.",

  media: {
    sourceDir: path.join(portfolioRoot, "public", "project-shots", "portfolio", "latest"),
    publicPathPrefix: "/project-shots/portfolio/latest",
    primaryProfile: "card"
  }
};
