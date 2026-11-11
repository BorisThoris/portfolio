// Recounts the traction figures in src/project-traction.json from their sources.
//
//   node scripts/refresh-traction.mjs            dry run: print what would change
//   node scripts/refresh-traction.mjs --write    write the file (once a day unless --force)
//
// Every figure that has a `source` is recomputed; one without a source is left as
// written by hand. A source that cannot be read keeps its last good value and the
// date it was last confirmed (`checked`), so a failing API never zeroes a number or
// passes an old figure off as new. Sources:
//   nexus        Nexus Mods public GraphQL, no key: { type, uploader, metric }   (sum over all mods; {count} = mods)
//                                                   or { type, mods: [[game, id], ...], metric }
//   youtube      channel RSS feed (newest 15 videos, no key), then the Data API for older
//                videos when YOUTUBE_API_KEY is set: { type, channel, videos: [id, ...] }
//   itch         itch.io server API (api.itch.io/profile/games), needs ITCH_API_KEY: { type, games: [id, ...], metric: views_count|downloads_count }
//   reddit       public post JSON (often blocked for anonymous clients): { type, post, metric: score|num_comments }
// `parts` fills {name} placeholders in a label from further sources, so a label never
// carries a hard-coded number that the value next to it has outgrown.
import fs from 'node:fs/promises';

const file = new URL('../src/project-traction.json', import.meta.url);
const write = process.argv.includes('--write');
const force = process.argv.includes('--force');
const today = new Date().toISOString().slice(0, 10);
const userAgent = 'portfolio-traction-refresh/1.0 (+https://boris-portfolio-git.pages.dev/)';
const cache = new Map();

const raw = await fs.readFile(file, 'utf8');
const data = JSON.parse(raw);
if (write && !force && data.asOf === today) {
  console.log(`Already counted today (${today}); pass --force to recount.`);
  process.exit(0);
}

async function fetchText(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { 'user-agent': userAgent, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${url.split('?')[0]} answered ${response.status}`);
  return response.text();
}
const memo = (key, load) => { if (!cache.has(key)) cache.set(key, load()); return cache.get(key); };

function nexusMods(uploader) {
  return memo(`nexus:${uploader}`, async () => {
    const query = `query { mods(filter: { uploader: { value: ${JSON.stringify(uploader)}, op: EQUALS } }, count: 100) { nodes { modId game { domainName } downloads endorsements } } }`;
    const body = JSON.parse(await fetchText('https://api-router.nexusmods.com/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }) }));
    if (body.errors?.length) throw new Error(`Nexus: ${body.errors[0].message}`);
    return body.data.mods.nodes;
  });
}

function youtubeFeed(channel) {
  return memo(`yt:${channel}`, async () => {
    const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`);
    const views = {};
    for (const entry of xml.split('<entry>').slice(1)) {
      const id = entry.match(/<yt:videoId>([^<]+)/)?.[1];
      const count = entry.match(/views="(\d+)"/)?.[1];
      if (id && count) views[id] = Number(count);
    }
    return views;
  });
}

async function youtubeApi(ids) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !ids.length) return {};
  const body = JSON.parse(await fetchText(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(',')}&key=${key}`));
  return Object.fromEntries(body.items.map((item) => [item.id, Number(item.statistics.viewCount)]));
}

function itchGames() {
  return memo('itch', async () => {
    const key = process.env.ITCH_API_KEY;
    if (!key) throw new Error('itch: ITCH_API_KEY not set');
    // Current server API (the /api/1/KEY/my-games form is the legacy one). The key is
    // unscoped, so it lives only in a CI secret.
    const body = JSON.parse(await fetchText('https://api.itch.io/profile/games', { headers: { authorization: `Bearer ${key}` } }));
    return body.games;
  });
}

// Each resolver returns { value, count?, partial?, known? } or throws.
// `known` carries per-item numbers so a source that only answers for some items
// (the YouTube feed) can be completed from the last confirmed figures.
const resolvers = {
  async nexus(source) {
    const mods = await nexusMods(source.uploader ?? 'Bostannn');
    const wanted = source.mods ? mods.filter((mod) => source.mods.some(([game, id]) => game === mod.game.domainName && id === mod.modId)) : mods;
    if (source.mods && wanted.length !== source.mods.length) throw new Error(`Nexus: found ${wanted.length} of ${source.mods.length} mods`);
    return { value: wanted.reduce((sum, mod) => sum + (mod[source.metric ?? 'downloads'] ?? 0), 0), count: wanted.length };
  },
  async youtube(source, previous) {
    const feed = await youtubeFeed(source.channel).catch(() => ({}));
    const missing = source.videos.filter((id) => !(id in feed));
    const api = await youtubeApi(missing).catch(() => ({}));
    const known = { ...(previous?.known ?? {}), ...feed, ...api };
    const unknown = source.videos.filter((id) => !(id in known));
    if (unknown.length) throw new Error(`YouTube: no count yet for ${unknown.join(', ')}`);
    const fresh = source.videos.filter((id) => id in feed || id in api).length;
    if (!fresh) throw new Error('YouTube: no video answered');
    return { value: source.videos.reduce((sum, id) => sum + known[id], 0), known, partial: fresh < source.videos.length };
  },
  async itch(source) {
    const games = await itchGames();
    const wanted = games.filter((game) => source.games.includes(game.id));
    if (wanted.length !== source.games.length) throw new Error(`itch: found ${wanted.length} of ${source.games.length} games`);
    return { value: wanted.reduce((sum, game) => sum + (game[source.metric] ?? 0), 0), count: wanted.length };
  },
  async reddit(source) {
    const body = JSON.parse(await fetchText(`https://www.reddit.com/comments/${source.post}.json?raw_json=1`, { headers: { accept: 'application/json' } }));
    return { value: body[0].data.children[0].data[source.metric ?? 'score'] };
  },
};

export function formatCount(value, style = 'exact') {
  if (style === 'compact' && value >= 1000) {
    const thousands = value / 1000;
    return `${thousands >= 100 ? Math.round(thousands) : Number(thousands.toFixed(1))}K`;
  }
  return value.toLocaleString('en-US');
}

const report = [];
async function refresh(stat, where) {
  if (!stat.source) return;
  const sources = [['value', stat.source], ...Object.entries(stat.parts ?? {}).map(([name, part]) => [name, part])];
  stat.counts ??= {};
  for (const [name, source] of sources) {
    const previous = stat.counts[name];
    try {
      const result = await resolvers[source.type](source, previous);
      stat.counts[name] = { value: result.value, ...(result.count != null ? { count: result.count } : {}), ...(result.known ? { known: result.known } : {}), checked: today };
      if (previous?.value !== result.value) report.push(`${where} ${name}: ${previous?.value ?? '-'} -> ${result.value}`);
    } catch (error) {
      report.push(`${where} ${name}: kept ${previous?.value ?? 'nothing'} (${error.message})`);
    }
  }
  const main = stat.counts.value;
  if (main) stat.value = formatCount(main.value, stat.source.format);
  if (stat.template) {
    stat.label = stat.template.replace(/\{(\w+)\}/g, (match, name) => {
      if (name === 'count') return main?.count != null ? String(main.count) : match;
      const part = stat.counts[name];
      return part ? formatCount(part.value, stat.parts?.[name]?.format) : match;
    });
  }
  const dates = Object.values(stat.counts).map((count) => count.checked).filter(Boolean).sort();
  if (dates.length) stat.checked = dates[0];
}

for (const stat of data.summary.stats) await refresh(stat, 'summary');
for (const [slug, project] of Object.entries(data.projects)) {
  for (const stat of project.stats ?? []) await refresh(stat, slug);
  if (project.headlineFrom != null && project.stats?.[project.headlineFrom]) {
    const stat = project.stats[project.headlineFrom];
    project.headline = `${stat.value} ${project.headlineUnit ?? ''}`.trim();
  }
}
const allChecked = [data.summary.stats, ...Object.values(data.projects).map((project) => project.stats ?? [])].flat().map((stat) => stat.checked).filter(Boolean);
if (allChecked.includes(today)) data.asOf = today;

console.log(report.join('\n') || 'No sourced figures.');
const next = JSON.stringify(data, null, 2).replace(/\n/g, '\r\n') + '\r\n';
if (write && next !== raw) {
  await fs.writeFile(file, next);
  console.log(`Wrote src/project-traction.json (as of ${data.asOf}).`);
} else if (!write) {
  console.log('Dry run: nothing written.');
}
