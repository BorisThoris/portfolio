import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { preview } from "vite";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const server = await preview({ preview: { host: "127.0.0.1", port: 4188, strictPort: true } });
const base = "http://127.0.0.1:4188";
const browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { channel: "chrome" } : {}) });
const details = JSON.parse(await fs.readFile("src/project-details.json", "utf8"));
const errors = [];
const report = [];
await fs.mkdir("output/playwright", { recursive: true });

async function playing(locator) {
  await locator.evaluate((video) => new Promise((resolve, reject) => {
    const started = video.currentTime;
    const timeout = setTimeout(() => { clearInterval(timer); reject(new Error(`Video did not advance: ${video.currentSrc}; media error ${video.error?.code}`)); }, 30000);
    const timer = setInterval(() => {
      if (!video.paused && video.readyState >= 2 && video.currentTime > started + 0.15) {
        clearInterval(timer); clearTimeout(timeout); resolve();
      }
    }, 100);
  }));
}
async function paused(locator) {
  await locator.evaluate((video) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { clearInterval(timer); reject(new Error("Preview did not pause")); }, 3000);
    const timer = setInterval(() => { if (video.paused) { clearInterval(timer); clearTimeout(timeout); resolve(); } }, 50);
  }));
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [slug, detail] of Object.entries(details).filter(([, item]) => item.trailers?.length)) {
    console.log(`Checking video: ${slug}`);
    await page.goto(`${base}/projects/${slug}`);
    const cover = page.locator(".project-cover");
    await cover.scrollIntoViewIfNeeded();
    const preview = cover.locator("video");
    await preview.waitFor();
    await playing(preview);
    assert.equal(await preview.evaluate((video) => video.muted), true);
    await cover.getByRole("button", { name: "Pause preview", exact: true }).click();
    await paused(preview);
    await cover.getByRole("button", { name: "Play preview", exact: true }).click();
    await playing(preview);
    await cover.getByRole("button", { name: "Unmute preview", exact: true }).click();
    assert.equal(await preview.evaluate((video) => video.muted), false);
    await cover.getByRole("button", { name: "Mute preview", exact: true }).click();
    const watch = cover.getByRole("button", { name: /^Watch video/ });
    await watch.click();
    const dialog = page.getByRole("dialog");
    await playing(dialog.locator("video"));
    await paused(preview);
    for (let step = 0; step < 5; step++) {
      await page.keyboard.press("Tab");
      assert(await dialog.evaluate((el) => el.contains(document.activeElement)), "Keyboard focus stays inside player");
    }
    const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations;
    assert.deepEqual(violations.map((item) => item.id), [], `Player accessibility: ${slug}`);
    for (const trailer of detail.trailers) {
      if (detail.trailers.length > 1) await dialog.getByRole("button", { name: new RegExp(trailer.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
      await playing(dialog.locator("video"));
      assert.equal(await dialog.locator("video").evaluate((video) => video.videoWidth > 0), true);
      report.push(`${slug}/${trailer.id}: real media decoded and playback time advanced`);
    }
    await page.screenshot({ path: `output/playwright/video-${slug}-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `output/playwright/video-${slug}-mobile.png` });
    assert(await dialog.evaluate((el) => el.getBoundingClientRect().right <= innerWidth && el.scrollWidth <= el.clientWidth + 1));
    await page.keyboard.press("Escape");
    assert.equal(await dialog.count(), 0);
    assert.equal(await watch.evaluate((el) => el === document.activeElement), true);
    await cover.scrollIntoViewIfNeeded();
    await playing(preview);
    await page.screenshot({ path: `output/playwright/cover-${slug}-mobile.png` });
    await page.locator(".project-footer").scrollIntoViewIfNeeded();
    await paused(preview);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto(base);
  await page.getByRole("tab", { name: "02 Memory Dungeon" }).click();
  const featured = page.locator("#project-panel-memory-dungeon");
  await featured.scrollIntoViewIfNeeded();
  await playing(featured.locator("video"));
  await page.screenshot({ path: "output/playwright/video-featured.png" });
  await page.getByRole("tab", { name: "03 VYB Chess" }).click();
  await paused(featured.locator("video"));
  const card = page.locator(".project-tile").filter({ has: page.getByRole("link", { name: /BOBBALL Games/ }) });
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await playing(card.locator("video"));
  await card.getByRole("button", { name: /^Watch video/ }).click();
  await playing(page.getByRole("dialog").locator("video"));
  await page.getByRole("button", { name: "Close video" }).click();
  await page.getByRole("heading", { level: 1 }).focus();
  await page.getByRole("heading", { level: 1 }).hover();
  await paused(card.locator("video"));
  report.push("Homepage: featured playback, inactive slide pauses, card hover and full player");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/projects/bobball`);
  await page.locator(".project-cover").scrollIntoViewIfNeeded();
  assert.equal(await page.locator(".project-cover video").count(), 0);
  await page.locator(".project-cover").getByRole("button", { name: /^Watch video/ }).click();
  await playing(page.getByRole("dialog").locator("video"));
  await page.keyboard.press("Escape");
  report.push("Reduced motion: still cover, explicit playback available");

  const saverContext = await browser.newContext();
  await saverContext.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true }));
  const saverPage = await saverContext.newPage();
  await saverPage.goto(`${base}/projects/bobball`);
  await saverPage.locator(".project-cover").scrollIntoViewIfNeeded();
  assert.equal(await saverPage.locator(".project-cover video").count(), 0);
  assert(await saverPage.locator(".project-cover").getByRole("button", { name: /^Watch video/ }).isVisible());
  await saverContext.close();
  report.push("Data saver: no automatic video request, Watch video remains available");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/trailers/*.mp4", (route) => route.abort());
  await page.goto(`${base}/projects/bobball`);
  await page.locator(".project-cover").scrollIntoViewIfNeeded();
  await page.locator(".project-cover").getByRole("button", { name: /^Watch video/ }).click();
  await page.getByText("This video couldn’t load.").waitFor();
  assert(await page.getByRole("link", { name: "Open video directly" }).isVisible());
  await page.keyboard.press("Escape");
  assert(await page.locator(".project-cover img").evaluate(async (img) => { await img.decode(); return img.naturalWidth > 0; }));
  report.push("Media failure: poster remains visible, direct link provided, player closes");
  assert.deepEqual(errors, []);
  await fs.writeFile("output/playwright/media-verification.json", JSON.stringify({ checkedAt: new Date().toISOString(), report }, null, 2));
  console.log(report.join("\n"));
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
