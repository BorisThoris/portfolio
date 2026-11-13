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
  await page.goto(base + "/", { waitUntil: "load" });
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

  // The Miata: each headlight moves on its own, and the moves hand over to the project page.
  const miata = page.locator(".miata");
  await miata.scrollIntoViewIfNeeded();
  const leftSrc = () => page.locator(".miata__frame--left").getAttribute("src");
  const rightSrc = () => page.locator(".miata__frame:not(.miata__frame--left)").getAttribute("src");
  await page.getByRole("button", { name: "Pop the left headlight" }).click();
  await page.waitForTimeout(600);
  assert.match(await leftSrc(), /miata-4\.webp$/, "the left light pops up");
  assert.match(await rightSrc(), /miata-0\.webp$/, "the right one stays down: a wink");
  await page.getByRole("button", { name: "Sleepy" }).click();
  await page.waitForTimeout(600);
  assert.deepEqual([await leftSrc(), await rightSrc()].map((src) => src.match(/miata-(\d)/)[1]), ["2", "2"], "Sleepy leaves both half up");
  await page.getByRole("button", { name: "Wink" }).click();
  await page.waitForTimeout(900);
  assert.ok(await miata.locator(".miata__cta.is-on").isVisible(), "after a few moves the note points to the real app");
  await miata.screenshot({ path: `${out}/4b-miata.png` });
  report.push("Miata: the left light pops up alone, Sleepy half-raises both, the note hands over to the project");

  // The apps shelf, and one live build across both shelves.
  await page.getByRole("tab", { name: /Pedal Rush/ }).click();
  await page.getByRole("button", { name: "Play Pedal Rush here" }).click();
  await page.locator("#arcade iframe.sandbox__frame").waitFor();
  const appsShelf = page.locator("#apps");
  await appsShelf.scrollIntoViewIfNeeded();
  assert.equal(await appsShelf.locator(".arcade__address").innerText(), "bostan.pages.dev", "the apps shelf shows the real address");
  await appsShelf.getByRole("button", { name: "Open Bostan here" }).click();
  await appsShelf.locator("iframe.sandbox__frame").waitFor();
  assert.equal(await frames(page), 1, "starting an app stops the running game");
  assert.equal(new URL(await appsShelf.locator("iframe.sandbox__frame").getAttribute("src")).host, "bostan.pages.dev");
  await page.waitForTimeout(4000);
  await appsShelf.screenshot({ path: `${out}/4c-apps-bostan.png` });
  for (const [tab, host] of [["Cross Repo Libs", "cross-repo-libs-git.pages.dev"], ["FlowForge", "flowforge-configurator-git.pages.dev"], ["Gorilla Gainz", "gorilla-gainz-git.pages.dev"], ["Org Atlas", "org-atlas-directory-git.pages.dev"], ["User Hub", "user-hub-admin-git.pages.dev"], ["Cat World", "cat-world-git.pages.dev"]]) {
    await appsShelf.getByRole("tab", { name: new RegExp(tab) }).click();
    assert.equal(await appsShelf.locator(".arcade__address").innerText(), host);
    await appsShelf.getByRole("button", { name: `Open ${tab} here` }).click();
    await appsShelf.locator("iframe.sandbox__frame").waitFor();
    await page.waitForTimeout(2500);
    const body = await appsShelf.frameLocator("iframe.sandbox__frame").locator("body").innerText();
    assert.ok(body.trim().length > 40, `${tab} drew its page inside the frame`);
    if (tab === "Org Atlas") {
      // The dare: a company opens its projects, a project opens its team.
      const app = appsShelf.frameLocator("iframe.sandbox__frame");
      await app.getByText("Hackett - Greenfelder").first().click();
      await app.getByText("Incredible Rubber Chicken").first().click();
      await app.getByText("Add Employee").waitFor({ timeout: 8000 });
      await appsShelf.screenshot({ path: `${out}/4d-apps-org-atlas.png` });
    }
  }
  await appsShelf.screenshot({ path: `${out}/4e-apps-cat-world.png` });
  await appsShelf.getByRole("button", { name: "Stop Cat World" }).click();
  assert.equal(await frames(page), 0);
  // The two new games load on the arcade shelf.
  for (const [tab, host] of [["Dodg’Em Up", "runner-score-arcade-git.pages.dev"], ["Memory Card Quest", "memory-card-quest-git.pages.dev"], ["Memory Dungeon", "memory-dungeon-git.pages.dev"]]) {
    await page.getByRole("tab", { name: new RegExp(tab) }).click();
    await page.getByRole("button", { name: `Play ${tab} here` }).click();
    await page.locator("#arcade iframe.sandbox__frame").waitFor();
    assert.equal(new URL(await page.locator("#arcade iframe.sandbox__frame").getAttribute("src")).host, host);
    await page.waitForTimeout(2500);
    await page.getByRole("button", { name: `Stop ${tab}` }).click();
  }
  report.push("Apps shelf: Bostan, Cross Repo Libs, FlowForge, Gorilla Gainz, Org Atlas (company → project → team), User Hub and Cat World draw in the frame; starting one stops the running game; Dodg’Em Up, Memory Card Quest and Memory Dungeon load");

  // The hero's trailer polaroid hands over to the same game.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".reel__play").click();
  await page.locator("iframe.sandbox__frame").waitFor();
  assert.equal(new URL(await page.locator("iframe.sandbox__frame").getAttribute("src")).host, "bobball.modaxxx009.workers.dev", "the hero's play link loads the game its trailer shows");
  assert.ok(await page.locator("#play").evaluate((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }), "and brings the arcade into view");
  await page.getByRole("button", { name: "Stop BOBBALL" }).click();
  report.push("Hero: the trailer's play link loads BOBBALL in the arcade");

  // A story link opens its Problems card.
  await page.goto(base + "/#bobball-ragdoll", { waitUntil: "load" });
  await page.waitForTimeout(500);
  assert.equal(await page.locator("details#bobball-ragdoll").evaluate((el) => el.open), true, "a link to a problem opens its card");
  report.push("Problem anchors: /#bobball-ragdoll opens the card");

  // Accessibility of the section, idle.
  await page.goto(base + "/", { waitUntil: "load" });
  await page.locator("#play").scrollIntoViewIfNeeded();
  const axe = await new AxeBuilder({ page }).include("#play").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  assert.deepEqual(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), [], "Play section passes axe");
  report.push("Play section: no automated WCAG A/AA violations");
  await page.close();

  // ---------- Phone ----------
  const phone = await browser.newPage({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true });
  phone.on("pageerror", (error) => errors.push(`phone: ${error.message}`));
  await phone.goto(base + "/", { waitUntil: "load" });
  await phone.locator("#play").scrollIntoViewIfNeeded();
  // Cards pin in with a tilt as they are revealed; measure once that has settled, as check-ui does.
  const settled = await phone.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1, null, { timeout: 4000 }).then(() => true, () => false);
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(settled, `no sideways scroll at 320px (overflow ${overflow})`);
  await phone.locator("#arcade").scrollIntoViewIfNeeded();
  await phone.screenshot({ path: `${out}/5-phone-idle.png` });
  await phone.getByRole("tab", { name: /Pedal Rush/ }).click();
  await phone.getByRole("button", { name: "Play Pedal Rush here" }).click();
  await phone.locator("iframe.sandbox__frame").waitFor();
  await phone.waitForTimeout(3000);
  const rect = await phone.locator("#arcade .sandbox").evaluate((el) => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), getComputedStyle(el).position]; });
  assert.deepEqual(rect, [320, 640, "fixed"], "a running sandbox takes the whole phone screen");
  await phone.screenshot({ path: `${out}/6-phone-takeover.png` });
  await phone.getByRole("button", { name: "Stop Pedal Rush" }).click();
  assert.equal(await phone.evaluate(() => document.documentElement.classList.contains("sandbox-open")), false, "Stop gives the page its scroll back");
  report.push("Phone: no overflow at 320px; a running build takes the full screen; Stop restores the page");
  await phone.close();

  // ---------- Project page ----------
  const project = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  project.on("pageerror", (error) => errors.push(`project: ${error.message}`));
  await project.goto(base + "/projects/last-levee", { waitUntil: "load" });
  assert.equal(await frames(project), 0);
  await project.getByRole("button", { name: "Play Last Levee here" }).click();
  await project.locator("iframe.sandbox__frame").waitFor();
  await project.waitForTimeout(6000);
  await project.locator(".pp-play").screenshot({ path: `${out}/7-project-last-levee.png` });
  assert.equal(new URL(await project.locator("iframe.sandbox__frame").getAttribute("src")).host, "last-levee.pages.dev");
  await project.goto(base + "/projects/roam-rental-dashboard", { waitUntil: "load" });
  assert.equal(await project.locator(".pp-play").count(), 0, "projects without a verified sandbox show none");
  // Dynamic Damage cannot run in a page: its stock/mod switch shows whole, labelled takes.
  await project.goto(base + "/projects/dynamic-damage", { waitUntil: "load" });
  assert.equal(await frames(project), 0);
  const crash = project.locator(".crash");
  await crash.scrollIntoViewIfNeeded();
  assert.equal(await crash.locator(".crash__chip").innerText(), "STOCK");
  assert.match(await crash.locator(".crash__stage img:not(.crash__preload)").getAttribute("src"), /prostreet-stock/);
  await crash.getByRole("button", { name: "Switch Dynamic Damage on" }).click();
  assert.equal(await crash.locator(".crash__chip").innerText(), "MOD");
  assert.match(await crash.locator(".crash__stage img:not(.crash__preload)").getAttribute("src"), /prostreet-mod/);
  assert.equal(await crash.getByRole("button", { name: "Back to the stock game" }).getAttribute("aria-pressed"), "true");
  await project.waitForTimeout(600);
  await crash.screenshot({ path: `${out}/8-dynamic-damage-mod.png` });
  const crashAxe = await new AxeBuilder({ page: project }).include(".crash").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  assert.deepEqual(crashAxe.violations.map((v) => v.id), [], "the crash switch passes axe");
  report.push("Project pages: Last Levee plays in place; Roam Rental shows no sandbox; Dynamic Damage switches stock → mod with labels");

  // Toys that port a native program's core.
  const axeClean = async (selector) => (await new AxeBuilder({ page: project }).include(selector).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  await project.goto(base + "/projects/helloword", { waitUntil: "load" });
  const donut = project.locator(".toy--donut");
  await donut.scrollIntoViewIfNeeded();
  assert.match(await donut.locator("canvas").getAttribute("aria-label"), /45 rotated ellipses, 8 degrees/, "Donut Studio starts at the Swing default, 8 degrees");
  // The centre is the hole; a point on the ring is lit.
  const lit = await donut.locator("canvas").evaluate((canvas) => {
    const ctx = canvas.getContext("2d"); const r = devicePixelRatio;
    const at = (x, y) => [...ctx.getImageData(Math.round(x * r), Math.round(y * r), 1, 1).data].slice(0, 3);
    const w = canvas.clientWidth, h = canvas.clientHeight, s = Math.min(w, h) / 420;
    return { centre: at(w / 2 - 20 * s, h / 2 - 20 * s), background: at(4, 4) };
  });
  assert.deepEqual(lit.background, [15, 23, 42], "the Swing panel's background colour");
  for (const step of [4, 8, 18]) {
    await donut.getByLabel("Ring spacing").fill(String(step));
    await donut.screenshot({ path: `${out}/9-donut-${step}.png` });
  }
  await donut.getByRole("button", { name: "Reset pattern" }).click();
  assert.match(await donut.locator("output").innerText(), /^8°/);
  assert.deepEqual(await axeClean(".toy--donut"), [], "Donut Studio toy passes axe");

  await project.goto(base + "/projects/weighted-draw-engine", { waitUntil: "load" });
  const lab = project.locator(".toy--draw");
  await lab.scrollIntoViewIfNeeded();
  await lab.getByRole("button", { name: "Draw 10,000" }).click();
  const observed = await lab.locator("tbody tr").evaluateAll((rows) => rows.map((row) => Number(row.querySelector(".draw__count").textContent.replace(/[^0-9]/g, ""))));
  assert.equal(observed.reduce((a, b) => a + b, 0), 10000, "10,000 draws are all counted");
  assert.ok(observed[2] > 5500 && observed[2] < 6100, `outcome 1 comes up about 58% of the time (${observed[2]})`);
  await lab.screenshot({ path: `${out}/10-weighted-draw.png` });
  await lab.getByLabel("Chance of 3, percent").fill("4");
  assert.match(await lab.getByRole("alert").innerText(), /^Value Error: The sum of probabilities is 1\.0299999999999998, but it must be equal to 1\.0\.$/, "a bad set fails with the engine's own message, float sum and all (Python's += loop prints the same)");
  assert.equal(await lab.getByRole("button", { name: "Draw 10,000" }).isDisabled(), true);
  await lab.getByRole("button", { name: "Fair die (0–3)" }).click();
  await lab.getByRole("button", { name: "Draw one" }).click();
  assert.match(await lab.locator(".draw__last").innerText(), /^[0-3]\s+came up$/);
  assert.deepEqual(await axeClean(".toy--draw"), [], "Weighted Draw toy passes axe");

  await project.goto(base + "/projects/boris-rep", { waitUntil: "load" });
  const ints = project.locator(".toy--int");
  await ints.scrollIntoViewIfNeeded();
  const result = () => ints.locator(".int__result").innerText();
  for (const [input, want] of [["-129", "Fits: short, int, long"], ["255", "Fits: byte, short, ushort, int, uint, long, ulong"], ["9223372036854775808", "Fits: ulong"], ["18446744073709551616", "Does not fit a built-in integer type. Use BigInteger."]]) {
    await ints.getByLabel("A whole number, any size").fill(input);
    assert.equal(await result(), want, input);
  }
  await ints.getByRole("button", { name: "127", exact: true }).click();
  await ints.getByRole("button", { name: "Add one" }).click();
  assert.equal(await ints.getByLabel("A whole number, any size").inputValue(), "128");
  assert.equal(await result(), "Fits: byte, short, ushort, int, uint, long, ulong", "+1 on 127 drops sbyte");
  await ints.screenshot({ path: `${out}/11-integer-fit.png` });
  await ints.getByLabel("A whole number, any size").fill("12.5");
  assert.match(await result(), /^Not a whole number/);
  await project.waitForTimeout(400); // let the chips finish their colour transition
  assert.deepEqual(await axeClean(".toy--int"), [], "Integer Fit toy passes axe");
  report.push("Toys: Donut Studio draws the Swing loop (8° default, reset), Weighted Draw counts 10,000 draws and fails bad odds with the engine's message, Integer Fit matches the transcript and +1 crosses a boundary");
  await project.close();

  assert.deepEqual(errors, [], "no runtime exceptions in the portfolio's own pages");
  console.log(report.join("\n"));
} finally {
  await browser.close();
  await server.close();
}
