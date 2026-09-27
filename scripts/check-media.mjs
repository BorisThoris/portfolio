import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { preview } from "vite";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { effectiveMedia } from "./lib/effective-media.mjs";

const server = process.env.MEDIA_BASE_URL ? null : await preview({ preview: { host: "127.0.0.1", port: 4188, strictPort: true } });
const base = (process.env.MEDIA_BASE_URL ?? "http://127.0.0.1:4188").replace(/\/$/, "");
const browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { channel: "chrome" } : {}) });
const details = effectiveMedia(
  JSON.parse(await fs.readFile("src/project-details.json", "utf8")),
  JSON.parse(await fs.readFile("src/project-media-overrides.json", "utf8")),
  JSON.parse(await fs.readFile("src/project-access.json", "utf8")));
if (process.env.MEDIA_BASE_URL) {
  const response = await fetch(`${base}/project-media.json`);
  assert(response.ok, 'Published effective media manifest is available');
  const published = await response.json();
  assert(Object.values(published).flat().length > 0, 'Published media inventory is nonempty');
  for (const detail of Object.values(details)) { detail.trailers = []; detail.videos = []; }
  for (const [slug, clips] of Object.entries(published)) {
    details[slug] = { ...details[slug], trailers: clips, videos: [] };
  }
}
for (const detail of Object.values(details)) {
  detail.trailers = [...(detail.trailers ?? []), ...(detail.videos ?? []).filter(video => video.kind === 'video')]
    .filter((clip, index, clips) => clips.findIndex(other => other.url === clip.url) === index)
    .map((clip, index) => ({ ...clip, id: clip.id ?? `native-${index}` }));
}
const errors = [];
const report = [];
const ratios = [];
const network = [];
function observeMediaRequests(page) {
  page.on('response', async response => {
    if (!response.url().includes('.mp4')) return;
    try {
    const headers = await response.allHeaders();
    const request = await response.request().allHeaders();
    network.push({ url: response.url(), status: response.status(), range: request.range,
      contentRange: headers['content-range'], contentLength: headers['content-length'],
      type: headers['content-type'], encoding: headers['content-encoding'], cfRay: headers['cf-ray'], server: headers.server,
      errorBody: response.status() >= 400 ? (await response.text()).slice(0,8000) : undefined });
    } catch (error) { network.push({url:response.url(), status:response.status(), diagnosticError:String(error)}); }
  });
  page.on('requestfailed', request => {
    if (request.url().includes('.mp4')) network.push({url:request.url(), failure:request.failure()});
  });
}
await fs.mkdir("output/playwright", { recursive: true });

async function playing(locator) {
  await locator.evaluate((video) => new Promise((resolve, reject) => {
    let previous = video.currentTime;
    let advanced = 0;
    const timeout = setTimeout(() => { clearInterval(timer); reject(new Error(`Video did not advance: ${video.currentSrc}; paused=${video.paused}; ready=${video.readyState}; network=${video.networkState}; time=${video.currentTime}; media error ${video.error?.code}; hidden=${document.hidden}; hovered=${video.closest('.project-tile')?.matches(':hover')}; rect=${JSON.stringify(video.getBoundingClientRect().toJSON())}`)); }, 30000);
    const timer = setInterval(() => {
      if (!video.paused && video.readyState >= 2) {
        // Looped clips can wrap while an assertion starts near their end.
        const delta = video.currentTime - previous;
        if (delta > 0 && delta < 1) advanced += delta;
        previous = video.currentTime;
      }
      if (advanced > 0.15) {
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
async function unloaded(locator) {
  await locator.evaluate((video) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { clearInterval(timer); reject(new Error(`Offscreen video retained its source: ${video.currentSrc}; ready=${video.readyState}`)); }, 5000);
    const timer = setInterval(() => {
      if (!video.getAttribute('src') && video.readyState === 0) {
        clearInterval(timer); clearTimeout(timeout); resolve();
      }
    }, 25);
  }));
}
async function checkRatio(locator, label, expected) {
  // Visibility changes intentionally unload media. Read fresh decoded metadata,
  // not the zero dimensions between load() and loadedmetadata.
  await locator.evaluate((video) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { clearInterval(timer); reject(new Error(`Video metadata unavailable: ${video.currentSrc}; ready=${video.readyState}; error=${video.error?.code}`)); }, 15000);
    const timer = setInterval(() => {
      if (video.readyState >= 1 && video.videoWidth > 0 && video.videoHeight > 0) {
        clearInterval(timer); clearTimeout(timeout);
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }
    }, 25);
  }));
  const dimensions = await locator.evaluate((video) => {
    const style = getComputedStyle(video);
    const frame = video.parentElement;
    const media = video.closest('.project-media');
    const bar = media?.querySelector('.project-media__bar');
    const stage = media?.querySelector('.project-media__stage');
    return {
      sourceWidth: video.videoWidth, sourceHeight: video.videoHeight,
      width: parseFloat(style.width), height: parseFloat(style.height),
      fit: style.objectFit, padding: parseFloat(style.paddingBottom),
      frameWidth: frame.clientWidth, frameHeight: frame.clientHeight,
      separateControls: !bar || bar.offsetTop >= stage.offsetTop + stage.offsetHeight - 1,
    };
  });
  const ratio = dimensions.sourceWidth / dimensions.sourceHeight;
  assert(Number.isFinite(ratio) && ratio > 0, `${label}: real video dimensions available`);
  assert(Math.abs(dimensions.width - dimensions.height * ratio) <= 1, `${label}: displayed frame matches source ratio ${JSON.stringify(dimensions)}`);
  assert.equal(dimensions.fit, 'contain', `${label}: no crop`);
  assert.equal(dimensions.padding, 0, `${label}: no controls padding inside picture`);
  assert(dimensions.separateControls, `${label}: preview controls stay outside picture`);
  if (expected?.width && expected?.height) {
    assert.equal(dimensions.sourceWidth, expected.width, `${label}: published width matches file`);
    assert.equal(dimensions.sourceHeight, expected.height, `${label}: published height matches file`);
  }
  ratios.push({ label, ...dimensions });
}

const viewports = [{width:1440,height:1000}, {width:768,height:1024}, {width:390,height:844}, {width:320,height:568}, {width:844,height:390}];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  context.on("page", observeMediaRequests);
  let page = await context.newPage();
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
    await checkRatio(preview, `${slug} cover desktop`);
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
    assert.equal(await preview.getAttribute("src"), null, `${slug}: modal releases preview source`);
    for (let step = 0; step < 5; step++) {
      await page.keyboard.press("Tab");
      assert(await dialog.evaluate((el) => el.contains(document.activeElement)), "Keyboard focus stays inside player");
    }
    const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations;
    assert.deepEqual(violations.map((item) => item.id), [], `Player accessibility: ${slug}`);
    for (const trailer of detail.trailers) {
      console.log(`  Playing, seeking and ending: ${slug}/${trailer.id}`);
      if (detail.trailers.length > 1) {
        const previous = await dialog.locator("video").elementHandle();
        await dialog.getByRole("group", { name: "Choose video" }).getByRole("button").filter({ has: page.getByText(trailer.title, { exact: true }) }).click();
        const detached = await previous.evaluate(video => !video.isConnected);
        if (detached) assert.deepEqual(await previous.evaluate(video => ({paused:video.paused, src:video.getAttribute("src")})), {paused:true,src:null}, `${slug}: switching clips releases the detached player`);
        await previous.dispose();
      }
      await playing(dialog.locator("video"));
      assert.equal(await dialog.locator("video").evaluate((video) => video.videoWidth > 0), true);
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await checkRatio(dialog.locator('video'), `${slug}/${trailer.id} player ${viewport.width}x${viewport.height}`, trailer);
        assert(await dialog.evaluate((el) => {
          const bounds = el.getBoundingClientRect();
          const frame = el.querySelector('.video-dialog__frame').getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight
            && frame.top >= bounds.top && frame.bottom <= bounds.bottom + 1;
        }), `${slug}/${trailer.id}: entire player frame fits viewport`);
      }
      await page.setViewportSize({width:1440,height:1000});
      await dialog.locator('video').evaluate(video => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Video seek did not finish: ${video.currentSrc}; time=${video.currentTime}; duration=${video.duration}; paused=${video.paused}; seeking=${video.seeking}; ready=${video.readyState}; error=${video.error?.code}`)), 10000);
        const target = Math.min(video.duration * .6, video.duration - .2);
        video.addEventListener('seeked', () => {
          clearTimeout(timer);
          if (Math.abs(video.currentTime - target) > .6) reject(new Error(`Seek clamped: ${video.currentSrc}; requested=${target}; actual=${video.currentTime}`));
          else resolve();
        }, { once: true });
        video.currentTime = target;
      }));
      await playing(dialog.locator('video'));
      await dialog.locator('video').evaluate(video => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Video did not reach its ending: ${video.currentSrc}; time=${video.currentTime}; duration=${video.duration}; paused=${video.paused}; seeking=${video.seeking}; ready=${video.readyState}; error=${video.error?.code}`)), 10000);
        video.addEventListener('ended', () => { clearTimeout(timer); resolve(); }, { once: true });
        video.currentTime = Math.max(0, video.duration - .3);
      }));
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
    for (let reopen = 0; reopen < 2; reopen++) {
      await watch.click();
      await playing(page.getByRole('dialog').locator('video'));
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(), 0);
    }
    for (const viewport of viewports) {
      // Exercise a real unload/reload at every breakpoint, including immediately
      // after the modal releases its source. No cached metadata is assumed.
      await page.locator(".project-footer").scrollIntoViewIfNeeded();
      await unloaded(preview);
      await page.setViewportSize(viewport);
      await cover.scrollIntoViewIfNeeded();
      await playing(preview);
      await checkRatio(preview, `${slug} cover ${viewport.width}x${viewport.height}`);
    }
    await page.setViewportSize({width:390,height:844});
    await cover.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `output/playwright/cover-${slug}-mobile.png` });
    await page.locator(".project-footer").scrollIntoViewIfNeeded();
    await paused(preview);
    assert.equal(await preview.getAttribute("src"), null, `${slug}: offscreen preview releases source`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const artwork of detail.artwork ?? []) {
      const asset = page.locator(`.artwork__image img[src="${artwork.url}"]`);
      await asset.scrollIntoViewIfNeeded();
      const geometry = await asset.evaluate(async (img) => {
        await img.decode();
        const style = getComputedStyle(img);
        return {width:img.naturalWidth, height:img.naturalHeight, fit:style.objectFit};
      });
      assert.equal(geometry.width / geometry.height, artwork.width / artwork.height, `${artwork.id}: artwork matches published ratio`);
      assert.equal(geometry.fit, 'contain', `${artwork.id}: artwork is uncropped`);
      report.push(`${slug}/${artwork.id}: artwork decoded at ${geometry.width}x${geometry.height}, uncropped`);
    }
  }
  report.push('Every project cover: explicit offscreen unload, viewport resize and genuine playback reload at all five breakpoints');
  // React Router reuses ProjectPage: a paused/failed previous cover must not
  // leak its state into the next project's video during real link navigation.
  await page.goto(`${base}/projects/bobball`);
  await page.locator('.project-cover').scrollIntoViewIfNeeded();
  await playing(page.locator('.project-cover video'));
  await page.locator('.project-cover').getByRole('button', {name:'Pause preview',exact:true}).click();
  await page.locator('.project-recommendations a[href="/projects/bbeats"]').first().click();
  await page.waitForURL('**/projects/bbeats');
  // The URL changes before React commits the keyed destination content.
  await page.getByRole('heading', {level:1, name:'BBeats', exact:true}).waitFor();
  const bbeatsCover = page.locator('.project-cover').filter({has:page.locator('img[alt="BBeats video preview"]')});
  await bbeatsCover.scrollIntoViewIfNeeded();
  const bbeatsPreview = bbeatsCover.locator('video[src*="/bbeats/"]');
  await bbeatsPreview.waitFor();
  await playing(bbeatsPreview);
  assert((await bbeatsPreview.getAttribute('src')).includes('/bbeats/'));
  report.push('In-app navigation: a paused BOBBALL cover does not suppress the next BBeats preview');
  await page.close();
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  const requests = [];
  page.on('response', (response) => { if (response.url().includes('.mp4')) requests.push([response.status(), response.url()]); });
  page.on('requestfailed', (request) => { if (request.url().includes('.mp4')) requests.push([request.failure(), request.url()]); });
  // Screenshot capture restores scroll position; keep that restoration immediate
  // so it cannot move the page underneath the subsequent hover interaction.
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  const hero = page.locator('.hero');
  const heroVideo = hero.locator('video');
  await playing(heroVideo);
  await checkRatio(heroVideo, 'Homepage hero desktop');
  const orbit = hero.locator('.hero__orbits i').first();
  const transform = await orbit.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForFunction((previous) => getComputedStyle(document.querySelector('.hero__orbits i')).transform !== previous, transform);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await paused(heroVideo);
  assert.equal(await orbit.evaluate((el) => getComputedStyle(el).animationPlayState), 'paused');
  assert.equal(await page.getByRole('button', { name: 'Resume motion' }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Resume motion' }).click();
  await playing(heroVideo);
  await page.screenshot({path:'output/playwright/motion-home-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await heroVideo.scrollIntoViewIfNeeded();
  await playing(heroVideo);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await checkRatio(heroVideo, 'Homepage hero mobile');
  await page.screenshot({path:'output/playwright/motion-home-mobile.png'});
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await paused(heroVideo);
  assert.equal(await hero.getAttribute('data-motion'), 'paused');
  await page.setViewportSize({width:1440,height:1000});
  report.push('Homepage hero: real trailer playback on desktop/mobile, changing animation frames, pause/resume controls, offscreen pause');
  await page.getByRole("tab", { name: "02 Memory Dungeon" }).click();
  const featured = page.locator("#project-panel-memory-dungeon");
  await featured.scrollIntoViewIfNeeded();
  await playing(featured.locator("video"));
  await checkRatio(featured.locator('video'), 'Memory Dungeon featured');
  await page.screenshot({ path: "output/playwright/video-featured.png" });
  await page.getByRole("tab", { name: "03 VYB Chess" }).click();
  await paused(featured.locator("video"));
  for (const [tabName, slug] of [['03 VYB Chess', 'vyb-chess'], ['04 BOBBALL', 'bobball']]) {
    await page.getByRole('tab', {name:tabName}).click();
    const slide = page.locator(`#project-panel-${slug}`);
    await slide.scrollIntoViewIfNeeded();
    await playing(slide.locator('video'));
    await checkRatio(slide.locator('video'), `${slug} featured desktop`);
    await page.setViewportSize({width:390,height:844});
    await checkRatio(slide.locator('video'), `${slug} featured mobile`);
    await page.setViewportSize({width:1440,height:1000});
  }
  const card = page.locator(".project-tile").filter({ has: page.getByRole("link", { name: /^BOBBALL / }) });
  // Finish the page's smooth scroll before placing the pointer over the card.
  await card.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center", inline: "center" }));
  await card.hover();
  assert(await card.evaluate((el) => el.matches(":hover")), "Pointer is over the project card");
  await playing(card.locator("video")).catch(async (error) => {
    await page.screenshot({ path: "output/playwright/card-playback-failure.png" });
    console.error(await card.evaluate((el) => ({ rect: el.getBoundingClientRect().toJSON(), hovered: [...document.querySelectorAll(":hover")].map((item) => item.className), focus: document.activeElement?.outerHTML })));
    throw error;
  });
  await checkRatio(card.locator('video'), 'BOBBALL card');
  for (const name of ['Memory Dungeon', 'VYB Chess']) {
    const tile = page.locator('.project-tile').filter({has:page.locator('.project-tile__heading strong', {hasText:name})});
    await tile.evaluate((el) => el.scrollIntoView({behavior:'instant', block:'center'}));
    await tile.hover();
    await playing(tile.locator('video'));
    await checkRatio(tile.locator('video'), `${name} card`);
  }
  await card.getByRole("button", { name: /^Watch video/ }).click();
  await playing(page.getByRole("dialog").locator("video")).catch(async (error) => {
    console.error(requests);
    console.error(await page.getByRole('dialog').locator('video').evaluate((video) => video.outerHTML));
    throw error;
  });
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
  let interrupted = false;
  const transientPattern = '**/project-shots/bobball/latest/trailers/trailer.mp4*';
  await page.route(transientPattern, route => {
    if (!interrupted) { interrupted = true; return route.fulfill({status:503,body:'Temporary media interruption'}); }
    return route.continue();
  });
  await page.goto(`${base}/projects/bobball`);
  await page.locator('.project-cover').scrollIntoViewIfNeeded();
  await playing(page.locator('.project-cover video'));
  assert(interrupted, 'Actual simulated 503 was delivered');
  await page.unroute(transientPattern);
  report.push('Transient network failure: preview automatically recovers after one actual 503');
  await page.route("**/trailers/*.mp4*", (route) => route.abort());
  await page.goto(`${base}/projects/bobball`);
  await page.locator(".project-cover").scrollIntoViewIfNeeded();
  await page.locator(".project-cover").getByRole("button", { name: /^Watch video/ }).click();
  await page.getByText("This video couldn’t load.").waitFor();
  assert(await page.getByRole("link", { name: "Open video directly" }).isVisible());
  await page.unroute("**/trailers/*.mp4*");
  await page.getByRole('button', {name:'Retry video',exact:true}).click();
  await playing(page.getByRole('dialog').locator('video'));
  report.push('Exhausted retries: visible Retry video restores real playback once delivery returns');
  await page.keyboard.press("Escape");
  assert(await page.locator(".project-cover img").evaluate(async (img) => { await img.decode(); return img.naturalWidth > 0; }));
  report.push("Media failure: poster remains visible, direct link provided, player closes");
  assert.deepEqual(errors, []);
  report.push(`${ratios.length} source-to-display aspect ratio checks across hero, cards, featured slides, covers and every trailer in the player`);
  await fs.writeFile("output/playwright/media-verification.json", JSON.stringify({ checkedAt: new Date().toISOString(), report, ratios }, null, 2));
  console.log(report.join("\n"));
} finally {
  await fs.writeFile("output/playwright/media-network.json", JSON.stringify({ base, checkedAt:new Date().toISOString(), report, ratios, network }, null, 2));
  await browser.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
}
