"""Build compact portfolio films from owned project captures; stage on D:."""

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
STAGE = Path(os.environ.get("PORTFOLIO_MEDIA_STAGE", r"D:\agent-work\portfolio\2026-10-08-new-projects"))
SOURCE_ROOT = Path(os.environ.get("PORTFOLIO_MEDIA_SOURCE_ROOT", Path.home() / "Desktop" / "Repos"))
FLEET = SOURCE_ROOT / "bobMods/publishing/nexus/personal-fleet/media"
BALL = SOURCE_ROOT / "SkillBall/output"
TERRA = Path(os.environ.get("TERRA3D_CAPTURE_DIR", r"D:\agent-work\terraria-minecraft\2026-10-07-proof-of-concept\artifacts\native3d-tests\20261008-004641-390"))
MARKET = SOURCE_ROOT / "marketCheck/artifacts"
FONT_BOLD = Path(r"C:\Windows\Fonts\bahnschrift.ttf")
FONT_BODY = Path(r"C:\Windows\Fonts\segoeui.ttf")
FPS = 24
SIZE = (1280, 720)


def run(*command: str | Path) -> None:
    subprocess.run([str(item) for item in command], check=True, creationflags=subprocess.CREATE_NO_WINDOW)


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def source_id(path: Path) -> str:
    for label, root in (("bobMods", FLEET), ("SkillBall", BALL),
                        ("terraria-proof", TERRA), ("marketCheck", MARKET)):
        try:
            return f"{label}/{path.relative_to(root).as_posix()}"
        except ValueError:
            pass
    raise ValueError(f"Unrecognized media source: {path}")


def duration(path: Path) -> float:
    result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                             "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
                            check=True, capture_output=True, text=True,
                            creationflags=subprocess.CREATE_NO_WINDOW)
    return float(result.stdout.strip())


def card(path: Path, title: str, kicker: str, line: str, accent: str) -> None:
    image = Image.new("RGB", SIZE)
    draw = ImageDraw.Draw(image)
    for y in range(SIZE[1]):
        shade = int(7 + 17 * y / SIZE[1])
        draw.line((0, y, SIZE[0], y), fill=(shade, shade + 4, shade + 11))
    color = tuple(int(accent[i:i + 2], 16) for i in (0, 2, 4))
    draw.rectangle((90, 138, 98, 570), fill=color)
    draw.rectangle((90, 583, 1185, 585), fill=color)
    draw.text((128, 160), kicker.upper(), font=ImageFont.truetype(FONT_BODY, 25), fill=color)
    title_font = ImageFont.truetype(FONT_BOLD, 92 if len(title) < 20 else 68)
    draw.text((123, 270), title.upper(), font=title_font, fill=(245, 247, 247))
    draw.text((128, 428), line.upper(), font=ImageFont.truetype(FONT_BODY, 29), fill=(184, 197, 208))
    image.save(path, optimize=True)


def segment_image(source: Path, target: Path, seconds: float, moving: bool = False) -> None:
    vf = ("scale=1408:792:flags=lanczos,"
          "zoompan=z='min(zoom+0.0007,1.08)':x='iw/2-(iw/zoom/2)':"
          "y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=24,format=yuv420p"
          if moving else "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,format=yuv420p")
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-threads", "2",
        "-loop", "1", "-framerate", str(FPS), "-i", source, "-t", str(seconds),
        "-vf", vf, "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "23", "-pix_fmt", "yuv420p", "-an", target)


def segment_video(source: Path, target: Path, start: float, seconds: float) -> None:
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-threads", "2",
        "-ss", str(start), "-i", source, "-t", str(seconds),
        "-vf", "fps=24,scale=1280:720:flags=lanczos,format=yuv420p",
        "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "23", "-pix_fmt", "yuv420p", "-an", target)


def score(path: Path, seconds: float, motif: str) -> None:
    rate = 32000
    count = int(rate * seconds)
    t = np.arange(count, dtype=np.float64) / rate
    notes = {"fleet": [55.0, 65.4, 73.4, 49.0],
             "skillball": [55.0, 82.4, 73.4, 65.4],
             "terra": [49.0, 65.4, 55.0, 73.4],
             "market": [65.4, 73.4, 82.4, 98.0]}[motif]
    tone = np.zeros(count, dtype=np.float64)
    for index, root in enumerate(notes):
        mask = (t >= index * seconds / 4) & (t < (index + 1) * seconds / 4)
        local = t[mask] - index * seconds / 4
        fade = np.minimum(1.0, local / 0.55) * np.minimum(1.0, (seconds / 4 - local) / 0.65)
        tone[mask] += fade * (0.42 * np.sin(2 * np.pi * root * t[mask]) +
                              0.21 * np.sin(2 * np.pi * root * 1.5 * t[mask]) +
                              0.11 * np.sin(2 * np.pi * root * 2 * t[mask]))
    beat = 0.52 if motif == "skillball" else 0.82 if motif == "fleet" else 1.25
    for start in np.arange(0.5, seconds - 0.2, beat):
        pos = int(start * rate)
        n = min(int(0.26 * rate), count - pos)
        u = np.arange(n) / rate
        kick = np.sin(2 * np.pi * (88 * u - 115 * u * u)) * np.exp(-17 * u)
        tone[pos:pos + n] += (0.18 if motif != "terra" else 0.09) * kick
    fade = np.minimum(1.0, t / 0.6) * np.minimum(1.0, (seconds - t) / 1.2)
    pcm = np.clip(tone * fade * 0.28, -0.9, 0.9)
    with wave.open(str(path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(rate)
        stream.writeframes((pcm * 32767).astype("<i2").tobytes())


def film(slug: str, clips: list[tuple[str, Path, float, float]], title: str,
         kicker: str, line: str, outro: str, accent: str, destination: Path) -> None:
    folder = STAGE / slug
    folder.mkdir(parents=True, exist_ok=True)
    intro = folder / "intro.png"
    ending = folder / "outro.png"
    card(intro, title, kicker, line, accent)
    card(ending, outro, title, "A BORIS BOSTANDZHIEV PROJECT", accent)
    segments = []
    for index, spec in enumerate([("image", intro, 0, 2.5), *clips, ("image", ending, 0, 2.5)]):
        kind, source, start, seconds = spec
        target = folder / f"segment-{index:02}.mp4"
        if kind == "video":
            segment_video(source, target, start, seconds)
        else:
            segment_image(source, target, seconds, moving=index not in (0, len(clips) + 1))
        segments.append(target)
    listing = folder / "segments.txt"
    listing.write_text("".join("file '" + item.as_posix() + "'\n" for item in segments), encoding="utf-8")
    silent = folder / "silent.mp4"
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
        "-i", listing, "-c", "copy", silent)
    length = duration(silent)
    soundtrack = folder / "score.wav"
    score(soundtrack, length, slug)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = folder / "final.mp4"
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", silent, "-i", soundtrack,
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
        "-t", str(length), "-movflags", "+faststart", temporary)
    if temporary.stat().st_size > 25 * 1024 * 1024:
        raise RuntimeError(f"Static hosting cap exceeded: {temporary}")
    shutil.copy2(temporary, destination)
    print(f"{slug}: {length:.1f}s, {destination.stat().st_size / 1024 / 1024:.1f} MiB")


def still(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", source, "-frames:v", "1",
        "-vf", "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720",
        "-q:v", "3", destination)


def market_scene(desktop: Path, compact: Path, destination: Path, mobile_focus: bool) -> None:
    """Frame current UI test captures as a film still; labels disclose sample data."""
    canvas = Image.new("RGB", SIZE, (8, 23, 21))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((55, 55, 1225, 665), outline=(84, 158, 125), width=2)
    draw.text((86, 77), "MARKETCHECK  /  VERIFIED INTERFACE", font=ImageFont.truetype(FONT_BOLD, 28), fill=(224, 245, 232))
    draw.text((88, 627), "SAMPLE DATA SHOWN · NOT LIVE MARKET VALUES", font=ImageFont.truetype(FONT_BODY, 21), fill=(152, 185, 171))
    with Image.open(desktop) as image:
        shot = image.convert("RGB").crop((0, 0, min(image.width, 1234), min(image.height, 960)))
    with Image.open(compact) as image:
        phone = image.convert("RGB").crop((0, 0, image.width, min(image.height, 850)))
    if mobile_focus:
        phone = ImageOps.fit(phone, (300, 512), Image.Resampling.LANCZOS, centering=(0.5, 0))
        shot = ImageOps.fit(shot, (780, 512), Image.Resampling.LANCZOS, centering=(0.5, 0))
        canvas.paste(phone, (100, 107))
        canvas.paste(shot, (415, 107))
    else:
        shot = ImageOps.fit(shot, (1060, 512), Image.Resampling.LANCZOS, centering=(0.5, 0))
        canvas.paste(shot, (110, 107))
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, optimize=True)


def main() -> None:
    if not str(STAGE).startswith("D:\\agent-work\\"):
        raise RuntimeError("Staging must remain on D:")
    STAGE.mkdir(parents=True, exist_ok=True)
    sources = [
        FLEET / "Personal-Fleet-One-Call-Away.mp4",
        BALL / "gameplay/skillball-recoil-pov.mp4", BALL / "gameplay/skillball-pov.mp4",
        BALL / "playwright/eightball-overview.png", BALL / "playwright/production-gameplay.png",
        TERRA / "terra3d-start.png", TERRA / "terra3d-travel.png",
        TERRA / "terra3d-scene.png", TERRA / "terra3d-map-icons.png",
        MARKET / "desktop.png", MARKET / "mobile.png", MARKET / "compact.png",
    ]
    for source in sources:
        if not source.is_file():
            raise FileNotFoundError(source)
    outputs = {
        "fleet": ROOT / "public/native/gta-sa-mod/personal-fleet-film.mp4",
        "skillball": ROOT / "public/videos/skillball/skillball-film.mp4",
        "terra": ROOT / "public/native/terraria-depth/terra3d-film.mp4",
        "market": ROOT / "public/videos/marketcheck/marketcheck-film.mp4",
    }
    still_outputs = [
        ROOT / "public/native/gta-sa-mod/poster.jpg",
        ROOT / "public/project-shots/skillball/arena.jpg",
        ROOT / "public/project-shots/skillball/gameplay.jpg",
        ROOT / "public/native/terraria-depth/travel.jpg",
        ROOT / "public/native/terraria-depth/map.jpg",
        ROOT / "public/project-shots/marketcheck/dashboard.jpg",
        ROOT / "public/project-shots/marketcheck/compact.jpg",
    ]
    manifest_path = ROOT / "public/feature-media-manifest.json"
    dependencies = {
        "fleet": [sources[0]],
        "skillball": [sources[1], sources[2], sources[3], sources[4]],
        "terra": sources[5:9],
        "market": sources[9:],
    }
    previous = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    recipes = {"fleet": "nexus-original-v1", "skillball": "gameplay-edit-v1", "terra": "verified-stills-v1", "market": "ui-capture-montage-v2"}
    input_hashes = {name: {"recipe": recipes[name], **{source_id(item): digest(item) for item in paths}}
                    for name, paths in dependencies.items()}
    def stale(name: str, paths: list[Path]) -> bool:
        entry = previous.get("outputs", {}).get(name, {})
        prior_inputs = previous.get("inputsByProject", {}).get(name, {})
        inputs_changed = any(prior_inputs.get(source_id(item), prior_inputs.get(str(item))) != input_hashes[name][source_id(item)]
                             for item in dependencies[name])
        recipe_changed = prior_inputs.get("recipe") not in (None, recipes[name])
        return (inputs_changed or recipe_changed
                or not all(path.is_file() for path in paths)
                or entry.get("sha256") != digest(outputs[name]))

    if stale("fleet", [outputs["fleet"], still_outputs[0]]):
        # The Nexus release already has a finished trailer. Publish it verbatim.
        shutil.copy2(sources[0], outputs["fleet"])
        fleet_poster = STAGE / "fleet-poster-source.jpg"
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", "22", "-i", sources[0],
            "-frames:v", "1", "-q:v", "3", fleet_poster)
        still(fleet_poster, still_outputs[0])
    else:
        print("fleet: source unchanged; keeping Nexus trailer.")
    if stale("skillball", [outputs["skillball"], *still_outputs[1:3]]):
        film("skillball", [("video", sources[1], 0, 14), ("video", sources[2], 8, 12)],
             "SkillBall", "Momentum arena FPS", "NO MOVEMENT KEYS. SHOOT TO MOVE.",
             "MOMENTUM IS THE WEAPON.", "D9F464", outputs["skillball"])
        still(sources[3], still_outputs[1])
        still(sources[4], still_outputs[2])
    else:
        print("skillball: inputs unchanged; keeping film and stills.")
    if stale("terra", [outputs["terra"], *still_outputs[3:]]):
        film("terra", [("image", sources[5], 0, 4), ("image", sources[6], 0, 4),
                        ("image", sources[7], 0, 4), ("image", sources[8], 0, 4)],
             "Terraria Depth Experiment", "Highly experimental 3D mod",
             "REAL NATIVE SCENE CAPTURES", "AN UNFINISHED 3D PROTOTYPE.",
             "60D88B", outputs["terra"])
        still(sources[6], still_outputs[3])
        still(sources[7], still_outputs[4])
    else:
        print("terra: inputs unchanged; keeping film and stills.")
    if stale("market", [outputs["market"], *still_outputs[5:]]):
        desktop_scene = STAGE / "market-dashboard-scene.png"
        compact_scene = STAGE / "market-compact-scene.png"
        market_scene(sources[9], sources[11], desktop_scene, False)
        market_scene(sources[9], sources[11], compact_scene, True)
        film("market", [("image", desktop_scene, 0, 6), ("image", compact_scene, 0, 6)],
             "marketCheck", "European bank environment dashboard",
             "TWENTY SIGNALS. ONE CLEAR VIEW.", "CONTEXT, NOT A PREDICTION.",
             "8ACFA4", outputs["market"])
        still(desktop_scene, still_outputs[5])
        still(compact_scene, still_outputs[6])
    else:
        print("market: inputs unchanged; keeping film and stills.")
    manifest = {"schemaVersion": 2, "inputsByProject": input_hashes,
                "outputs": {name: {"path": str(path.relative_to(ROOT)).replace("\\", "/"),
                                   "sha256": digest(path), "bytes": path.stat().st_size,
                                   "duration": duration(path)} for name, path in outputs.items()},
                "provenance": {
                    "fleet": "Unmodified Personal Fleet trailer from the project's Nexus publishing folder.",
                    "skillball": "Edited from SkillBall's recorded browser gameplay.",
                    "terra": "Motion montage of verified 2026-10-08 native 3D scene screenshots; not real-time gameplay footage.",
                    "market": "Motion montage of current marketCheck UI test screenshots using fictional sample values, not live market data."}}
    serialized = json.dumps(manifest, indent=2) + "\n"
    if not manifest_path.exists() or manifest_path.read_text(encoding="utf-8") != serialized:
        manifest_path.write_text(serialized, encoding="utf-8")
        print(f"Manifest updated: {manifest_path}")
    else:
        print("Manifest unchanged.")


if __name__ == "__main__":
    main()
