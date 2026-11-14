// Portfolio-owned screenshots of live builds whose own captures came out empty
// (Org Atlas caught "Directory unavailable"; User Hub caught an empty directory),
// so these show the apps in use: a project drilled open, the setup wizard mid-way.
// Each is taken from the deployed app, after the steps a visitor would take.
// Output: public/project-curated/<slug>/<name>.jpg, referenced from project-access.json.
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { assertBrowserIsolation } from "./browser-safety.mjs";

assertBrowserIsolation();
const browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { channel: "chrome" } : {}) });
const shots = [];
async function shoot(slug, name, viewport, url, steps) {
  const page = await (await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 })).newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await steps(page);
  await page.waitForTimeout(1200);
  await fs.mkdir(`public/project-curated/${slug}`, { recursive: true });
  const path = `public/project-curated/${slug}/${name}.jpg`;
  await page.screenshot({ path, type: "jpeg", quality: 82 });
  shots.push(`${path} ${viewport.width}x${viewport.height}`);
  await page.context().close();
}

const atlas = "https://org-atlas-directory-git.pages.dev/";
await shoot("org-atlas-directory", "desktop", { width: 1440, height: 900 }, atlas, async (page) => {
  await page.getByText("Hackett - Greenfelder").first().click();
  await page.getByText("Incredible Rubber Chicken").first().click();
  await page.getByText("Add Employee").waitFor();
});
await shoot("org-atlas-directory", "mobile", { width: 430, height: 932 }, atlas, async (page) => {
  await page.getByText("Hackett - Greenfelder").first().click();
  await page.getByText("Projects").first().waitFor();
});

const hub = "https://user-hub-admin-git.pages.dev/";
const NAMES = ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Margaret Hamilton"];
const openWizard = async (page) => {
  await page.getByText("Manage users").first().click();
  const count = page.locator("input").first();
  await count.fill(String(NAMES.length));
  await count.press("Tab");
  await page.getByRole("button", { name: "Open user setup wizard" }).click();
  await page.locator(".clr-wizard input:visible").first().waitFor();
};
const nameUsers = async (page, stopAt = NAMES.length) => {
  for (let i = 0; i < stopAt; i++) {
    await page.locator(".clr-wizard input:visible").first().fill(NAMES[i]);
    if (i < stopAt - 1) { await page.getByRole("button", { name: "Next" }).click(); await page.waitForTimeout(300); }
  }
};
await shoot("user-hub-admin", "desktop", { width: 1440, height: 900 }, hub, async (page) => {
  await openWizard(page);
  await nameUsers(page, 2);
});
console.log(shots.join("\n"));
await browser.close();
