import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { preview } from "vite";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const server = await preview({
  preview: { host: "127.0.0.1", port: 4187, strictPort: true },
});
const base = "http://127.0.0.1:4187";
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "win32" ? { channel: "chrome" } : {}),
});
const output = "output/playwright";
await fs.mkdir(output, { recursive: true });
const errors = [];
const report = [];
const projectData = JSON.parse(
  await fs.readFile("src/project-data.json", "utf8"),
);
const rankings = JSON.parse(
  await fs.readFile("src/repo-analysis.json", "utf8"),
);

const visibleProjects = projectData.filter(
  (p) => rankings.find((r) => r.slug === p.slug)?.showcaseTier !== "excluded",
);
async function audit(page, name) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  await fs.writeFile(
    path.join(output, `${name}-accessibility.json`),
    JSON.stringify(results.violations, null, 2),
  );
  assert.equal(
    results.violations.length,
    0,
    `${name} accessibility: ${results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`).join("; ")}`,
  );
  report.push(`${name}: no automated WCAG A/AA violations`);
  console.log(`Passed accessibility: ${name}`);
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .getByRole("link", { name: "Skip to content" })
      .evaluate((el) => el === document.activeElement),
    true,
    "First tab reaches skip link",
  );
  await page.keyboard.press("Enter");
  assert.equal(
    await page.locator("main").evaluate((el) => el === document.activeElement),
    true,
    "Skip link focuses main",
  );
  await audit(page, "home-desktop");
  const labels = await new AxeBuilder({ page })
    .withRules(["label-content-name-mismatch", "aria-allowed-role"])
    .analyze();
  assert.equal(
    labels.violations.length,
    0,
    "Visible labels and ARIA roles agree",
  );
  await page.getByRole("button", { name: "Next project", exact: true }).click();
  assert.equal(
    await page
      .getByRole("tab", { name: "02 Memory Dungeon" })
      .getAttribute("aria-selected"),
    "true",
  );
  await page.getByRole("tab", { name: "02 Memory Dungeon" }).focus();
  await page.keyboard.press("End");
  assert.equal(
    await page
      .getByRole("tab", { name: "05 Cross Repo Libs" })
      .evaluate(
        (el) =>
          el === document.activeElement &&
          el.getAttribute("aria-selected") === "true",
      ),
    true,
  );
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page
      .getByRole("tab", { name: "01 BBeats" })
      .getAttribute("aria-selected"),
    "true",
  );
  assert.equal(await page.locator('[role="tabpanel"][inert]').count(), 4);
  await page.getByRole("button", { name: "Commerce", exact: true }).click();
  assert(
    (await page.locator(".project-tile__heading > span").allTextContents()).every(
      (text) => text === "Commerce",
    ),
  );
  await page
    .getByRole("searchbox", { name: "Search projects" })
    .fill("no-match-xyz");
  assert(
    await page.getByRole("heading", { name: "No projects found" }).isVisible(),
  );
  await page.getByRole("button", { name: "Clear filters" }).click();
  assert.equal(
    await page.locator(".project-tile").count(),
    visibleProjects.length,
  );
  const appsShelf = page.locator(".project-shelf").filter({
    has: page.getByRole("heading", { name: "Apps & tools", exact: true }),
  });
  const appsRail = appsShelf.locator(".project-shelf__rail");
  const appsForward = appsShelf.getByRole("button", {
    name: "Scroll Apps & tools forward",
  });
  assert.equal(await appsForward.isEnabled(), true);
  await appsForward.click();
  assert(
    await appsRail.evaluate((rail) => rail.scrollLeft > 0),
    "Project shelf moves forward",
  );
  await page.waitForFunction(() => {
    const button = document.querySelector(
      'button[aria-label="Scroll Apps & tools backward"]',
    );
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  assert.equal(
    await appsShelf
      .getByRole("button", { name: "Scroll Apps & tools backward" })
      .isEnabled(),
    true,
  );
  const job = page.locator(".experience-item").first();
  await job.locator("summary").first().focus();
  await page.keyboard.press("Enter");
  assert.notEqual(await job.getAttribute("open"), null);
  await audit(page, "experience-expanded");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Copy email address" }).click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    "borisbostandzhiev@yahoo.com",
  );
  report.push(
    "Desktop: featured carousel, shelf controls, catalogue filters/search/reset, disclosure, clipboard",
  );
  // Chromium rounds fractional layout widths to integers; allow one CSS pixel.
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .waitForFunction(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
        null,
        { timeout: 3000 },
      )
      .catch(async (error) => {
        console.error(
          await page.evaluate(() => ({
            w: innerWidth,
            s: document.documentElement.scrollWidth,
            els: [...document.querySelectorAll("body *")]
              .filter(
                (el) =>
                  el.getBoundingClientRect().right > innerWidth + 1 &&
                  !el.closest("[inert]"),
              )
              .map((el) => ({
                tag: el.tagName,
                cls: el.className,
                right: el.getBoundingClientRect().right,
                width: el.getBoundingClientRect().width,
              }))
              .slice(0, 20),
          })),
        );
        await page.screenshot({
          path: "output/playwright/overflow.png",
          fullPage: true,
        });
        throw error;
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".project-shelf__rail").evaluateAll((rails) => {
    rails.forEach((rail) => rail.scrollTo({ left: 0, behavior: "instant" }));
  });
  await audit(page, "home-mobile");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `${output}/release-mobile.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: `${output}/release-desktop.png`,
    fullPage: true,
  });
  await page.locator(".featured").getByRole("link", { name: "Explore BBeats", exact: true }).click();
  await page
    .getByRole("heading", { level: 1, name: "BBeats", exact: true })
    .waitFor();
  assert.equal(await page.title(), "BBeats | Boris Bostandzhiev");
  assert.equal(
    await page.locator("main").evaluate((el) => el === document.activeElement),
    true,
    "Route transition moves focus to content",
  );
  await page.getByRole("link", { name: "All work", exact: true }).click();
  await page
    .getByRole("heading", { name: "Projects I’d show first." })
    .waitFor();
  assert(
    await page
      .locator("#work")
      .evaluate((el) => Math.abs(el.getBoundingClientRect().top) < 150),
    "Work anchor restored",
  );
  for (const project of projectData.filter(
    (p) => rankings.find((r) => r.slug === p.slug)?.showcaseTier !== "excluded",
  )) {
    await page.goto(`${base}/projects/${project.slug}`);
    await page
      .getByRole("heading", { level: 1, name: project.title, exact: true })
      .waitFor();
    assert.equal(await page.title(), `${project.title} | Boris Bostandzhiev`);
    await page.locator(".project-cover img").evaluate(async (img) => {
      await img.decode();
    });
    assert.equal(
      await page.locator('a[href*="127.0.0.1"],a[href*="localhost"]').count(),
      0,
    );
    assert.equal(await page.locator(".project-media video").count(), 0, "Reduced motion suppresses automatic previews");
    const recommendations = page.locator(
      ".project-recommendations .project-tile",
    );
    assert.equal(
      await recommendations.count(),
      Math.min(7, visibleProjects.length - 1),
      `Related shelf: ${project.slug}`,
    );
    assert.equal(
      await page.locator(
        `.project-recommendations a[href="/projects/${project.slug}"]`,
      ).count(),
      0,
      `Related shelf excludes current project: ${project.slug}`,
    );
    await recommendations.first().scrollIntoViewIfNeeded();
    const relatedImageWidth = await recommendations
      .first()
      .locator("img")
      .evaluate(async (image) => {
        await image.decode();
        return image.naturalWidth;
      });
    assert(relatedImageWidth > 0, "Related project image rendered");
    const html = await fs.readFile(
      `dist/projects/${project.slug}/index.html`,
      "utf8",
    );
    assert(
      html.includes(
        `<title>${project.title.replaceAll("&", "&amp;")} | Boris Bostandzhiev</title>`,
      ),
      `Static title: ${project.slug}`,
    );
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
        null,
        { timeout: 3000 },
      );
    }
    if (["bbeats", "memory-dungeon", "bobball"].includes(project.slug))
      await audit(page, project.slug);
  }
  report.push(
    `All ${visibleProjects.length} projects: direct routes, static metadata, valid cover and related-shelf images, seven recommendations excluding the current project, no localhost links, no automatic playback with reduced motion, mobile/desktop overflow`,
  );
  await page.goto(`${base}/cv-print/`);
  await page.getByRole("button", { name: "Print / Save PDF" }).waitFor();
  assert.equal(await page.title(), "Résumé | Boris Bostandzhiev");
  await audit(page, "resume-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await audit(page, "resume-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(".cv-toolbar").isVisible(), false);
  await page.pdf({ path: `${output}/resume.pdf`, format: "A4" });
  await page.emulateMedia({ media: "screen" });
  for (const route of [
    "/projects/not-a-project",
    "/missing",
    "/projects/bbeats/invalid",
  ]) {
    await page.goto(base + route);
    await page
      .getByRole("heading", { name: "This page doesn’t exist." })
      .waitFor();
    assert.equal(
      await page.locator('meta[name="robots"]').getAttribute("content"),
      "noindex, follow",
    );
  }
  assert.equal(errors.length, 0, errors.join("\n"));
  report.push(
    "Résumé print controls, trailing slash routes, missing pages, zero runtime exceptions",
  );
  await context.close();
  await fs.writeFile(
    `${output}/verification.json`,
    JSON.stringify({ checkedAt: new Date().toISOString(), report }, null, 2),
  );
  console.log(report.join("\n"));
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
