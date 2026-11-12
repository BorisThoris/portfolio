// The Play section and project-page sandboxes, end to end in a real browser:
// nothing framed before a click, exactly one frame after it, on the project's own
// host; Bob takes hits and hands over to the real game; a phone gets a takeover.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { preview } from "vite";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { assertBrowserIsolation } from "./browser-safety.mjs";

assertBrowserIsolation();
const server = await preview({ preview: { host: "127.0.0.1", port: 4188, strictPort: true } });
const base = "http://127.0.0.1:4188";
const out = "output/playwright/play";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "win32" ? { channel: "chrome", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] } : {}),
});
const report = [];
const errors = [];
const frames = (page) => page.locator("iframe.sandbox__frame").count();

try {
  // ---------- Desktop homepage ----------
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.on("pageerror", (error) => errors.push(`home: ${error.message}`));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.locator("#play").scrollIntoViewIfNeeded();
  assert.equal(await frames(page), 0, "no live build may load before a click");
  assert.equal(await page.locator('.topnav__links a[href="#play"]').count(), 1, "Play is in the navigation");
  await page.screenshot({ path: `${out}/1-play-idle.png` });

  // Bob: throw at his chest until he has been hit three times.
  const bob = page.locator(".toss__bob img");
  await bob.waitFor();
  const box = await bob.boundingBox();
  let hits = 0;
  for (let i = 0; i < 10 && hits < 3; i++) {
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.35);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(700);
    hits = Number((await page.locator(".toss__foot .label").innerText()).match(/(\d+)\//)?.[1] ?? 0);
  }
  assert.ok(hits >= 3, `three throws at Bob's chest should land (landed ${hits})`);
  const score = Number(await page.locator(".toss__score").evaluate((el) => el.firstChild.textContent));
  assert.ok(score >= 30, `three body hits score at least 30 (got ${score})`);
  // A throw at empty paper misses.
  const stage = await page.locator(".toss__stage").boundingBox();
  await page.mouse.click(stage.x + 12, stage.y + stage.height - 12);
  await page.waitForTimeout(700);
  assert.match(await page.locator(".toss__foot .label").innerText(), new RegExp(`${hits}/${hits + 1}`), "a throw at empty paper is a miss");
  await page.screenshot({ path: `${out}/2-bob-hit.png` });
  report.push(`Bob: ${hits} hits, score ${score}, a miss counted as a miss`);

  // The hand-over: Bob's note starts the real game in the arcade.
  const cta = page.getByRole("button", { name: "Play the real BOBBALL here" });
  await cta.waitFor({ state: "visible" });
  await cta.click();
  await page.locator("iframe.sandbox__frame").waitFor();
  assert.equal(await frames(page), 1, "exactly one live build after the hand-over");
  const src = await page.locator("iframe.sandbox__frame").getAttribute("src");
  assert.equal(new URL(src).host, "bobball.modaxxx009.workers.dev", "the frame shows BOBBALL's own deployment");
  assert.ok(new URL(src).searchParams.has("embed"), "the frame asks BOBBALL for its embed mode");
  assert.ok(await page.locator("iframe.sandbox__frame").getAttribute("title"), "the frame has a title");
  // Give the real game time to boot, then prove it drew something that is not blank.
  await page.waitForTimeout(22000);
  await page.screenshot({ path: `${out}/3-bobball-live.png` });
  const frame = page.frameLocator("iframe.sandbox__frame");
  const drew = await frame.locator("body").evaluate(() => {
    const canvas = document.querySelector("canvas");
    return { canvas: canvas ? `${canvas.width}x${canvas.height}` : null, text: document.body.innerText.slice(0, 80).replace(/\s+/g, " ") };
  });
  assert.ok(drew.canvas, "BOBBALL drew a canvas inside the frame");
  report.push(`BOBBALL live in the arcade: canvas ${drew.canvas}, "${drew.text}"`);

  // Switching cartridges unloads the running build: one at a time.
  await page.getByRole("tab", { name: /BBeats/ }).click();
  assert.equal(await frames(page), 0, "switching cartridges stops the running build");
  await page.getByRole("button", { name: "Play BBeats here" }).click();
  await page.locator("iframe.sandbox__frame").waitFor();
  assert.equal(await frames(page), 1);
  assert.equal(new URL(await page.locator("iframe.sandbox__frame").getAttribute("src")).host, "bbeats-git.pages.dev");
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${out}/4-bbeats-live.png` });
  await page.getByRole("button", { name: "Stop BBeats" }).click();
  assert.equal(await frames(page), 0, "Stop unloads the build");
  report.push("Cartridges: switching and Stop both unload; one frame at a time");

  // The hero's trailer polaroid hands over to the same game.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".reel__play").click();
  await page.locator("iframe.sandbox__frame").waitFor();
  assert.equal(new URL(await page.locator("iframe.sandbox__frame").getAttribute("src")).host, "bobball.modaxxx009.workers.dev", "the hero's play link loads the game its trailer shows");
  assert.ok(await page.locator("#play").evaluate((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }), "and brings the arcade into view");
  await page.getByRole("button", { name: "Stop BOBBALL" }).click();
  report.push("Hero: the trailer's play link loads BOBBALL in the arcade");

  // A story link opens its Problems card.
  await page.goto(base + "/#bobball-ragdoll", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  assert.equal(await page.locator("details#bobball-ragdoll").evaluate((el) => el.open), true, "a link to a problem opens its card");
  report.push("Problem anchors: /#bobball-ragdoll opens the card");

  // Accessibility of the section, idle.
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.locator("#play").scrollIntoViewIfNeeded();
  const axe = await new AxeBuilder({ page }).include("#play").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  assert.deepEqual(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), [], "Play section passes axe");
  report.push("Play section: no automated WCAG A/AA violations");
  await page.close();

  // ---------- Phone ----------
  const phone = await browser.newPage({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true });
  phone.on("pageerror", (error) => errors.push(`phone: ${error.message}`));
  await phone.goto(base + "/", { waitUntil: "networkidle" });
  await phone.locator("#play").scrollIntoViewIfNeeded();
  // Cards pin in with a tilt as they are revealed; measure once that has settled, as check-ui does.
  const settled = await phone.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1, null, { timeout: 4000 }).then(() => true, () => false);
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(settled, `no sideways scroll at 320px (overflow ${overflow})`);
  await phone.locator(".arcade").scrollIntoViewIfNeeded();
  await phone.screenshot({ path: `${out}/5-phone-idle.png` });
  await phone.getByRole("tab", { name: /Pedal Rush/ }).click();
  await phone.getByRole("button", { name: "Play Pedal Rush here" }).click();
  await phone.locator("iframe.sandbox__frame").waitFor();
  await phone.waitForTimeout(3000);
  const rect = await phone.locator(".sandbox").evaluate((el) => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), getComputedStyle(el).position]; });
  assert.deepEqual(rect, [320, 640, "fixed"], "a running sandbox takes the whole phone screen");
  await phone.screenshot({ path: `${out}/6-phone-takeover.png` });
  await phone.getByRole("button", { name: "Stop Pedal Rush" }).click();
  assert.equal(await phone.evaluate(() => document.documentElement.classList.contains("sandbox-open")), false, "Stop gives the page its scroll back");
  report.push("Phone: no overflow at 320px; a running build takes the full screen; Stop restores the page");
  await phone.close();

  // ---------- Project page ----------
  const project = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  project.on("pageerror", (error) => errors.push(`project: ${error.message}`));
  await project.goto(base + "/projects/last-levee", { waitUntil: "networkidle" });
  assert.equal(await frames(project), 0);
  await project.getByRole("button", { name: "Play Last Levee here" }).click();
  await project.locator("iframe.sandbox__frame").waitFor();
  await project.waitForTimeout(6000);
  await project.locator(".pp-play").screenshot({ path: `${out}/7-project-last-levee.png` });
  assert.equal(new URL(await project.locator("iframe.sandbox__frame").getAttribute("src")).host, "last-levee.pages.dev");
  await project.goto(base + "/projects/cat-world", { waitUntil: "networkidle" });
  assert.equal(await project.locator(".pp-play").count(), 0, "projects without a verified sandbox show none");
  report.push("Project pages: Last Levee plays in place; projects without a verified sandbox show none");
  await project.close();

  assert.deepEqual(errors, [], "no runtime exceptions in the portfolio's own pages");
  console.log(report.join("\n"));
} finally {
  await browser.close();
  await server.close();
}
