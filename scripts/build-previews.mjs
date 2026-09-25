import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
const projects = JSON.parse(await fs.readFile("src/project-data.json", "utf8"));
const directory = "public/project-previews";
await fs.mkdir(directory, { recursive: true });
const manifestPath = path.join(directory, "manifest.json");
const previous = JSON.parse(
  await fs.readFile(manifestPath, "utf8").catch(() => "{}"),
);
const manifest = {};
let originalBytes = 0;
let previewBytes = 0;
for (const project of projects) {
  const candidates = [
    `public/project-shots/${project.slug}/latest/card.jpg`,
    `public/project-shots/${project.slug}/stable/card.jpg`,
    ...(project.screenshot ? [`public${project.screenshot}`] : []),
    "public/project-shots/portfolio-placeholder.svg",
  ];
  let source;
  for (const candidate of candidates) {
    try {
      source = await fs.readFile(candidate);
      break;
    } catch {}
  }
  if (!source) continue;
  originalBytes += source.length;
  const digest = createHash("sha256")
    .update(source)
    .update("webp-v1-76")
    .digest("hex");
  manifest[project.slug] = digest;
  for (const width of [480, 960]) {
    const destination = path.join(directory, `${project.slug}-${width}.webp`);
    const cached =
      previous[project.slug] === digest &&
      (await fs.stat(destination).catch(() => null));
    if (!cached)
      await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 76 })
        .toFile(destination);
    if (width === 960) previewBytes += (await fs.stat(destination)).size;
  }
}
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
console.log(
  `Optimized ${Object.keys(manifest).length} project previews: ${(originalBytes / 1024 / 1024).toFixed(1)} MB original → ${(previewBytes / 1024 / 1024).toFixed(1)} MB at 960px.`,
);
