// Recompress oversized JPEGs in the build output (dist/), never in public/: the
// sources stay byte-identical to what the repos publish, so the hourly sync has
// nothing to fight, and visitors download the smaller file. Same pixels, same
// dimensions; mozjpeg at quality 82. Artwork is left alone because its pages
// show the file size next to the download link.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = "dist";
const MIN_BYTES = 150_000;
const MIN_SAVING = 0.15;
let before = 0;
let after = 0;
let count = 0;
for (const rel of fs.readdirSync(root, { recursive: true })) {
  const file = path.join(root, rel);
  const posix = rel.split(path.sep).join("/");
  if (!/\.jpe?g$/i.test(posix) || posix.includes("/artwork/") || posix.startsWith("artwork/")) continue;
  const size = fs.statSync(file).size;
  if (size < MIN_BYTES) continue;
  const input = fs.readFileSync(file);
  const output = await sharp(input).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  if (output.length > size * (1 - MIN_SAVING)) continue;
  fs.writeFileSync(file, output);
  before += size;
  after += output.length;
  count++;
}
console.log(`Recompressed ${count} large JPEGs in dist: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB.`);
