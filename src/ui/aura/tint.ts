import { useEffect } from "react";

/*
 * The aura's palette can be steered by two hues written to
 * <html data-aura-hues="h1,h2">. auraGl turns them into colours that suit the
 * current theme and morphs to them; with no attribute it uses the CSS tokens.
 */
export type Hues = readonly [number, number];

export function setAuraHues(hues: Hues | null) {
  const root = document.documentElement;
  const value = hues ? hues.map((hue) => Math.round(((hue % 360) + 360) % 360)).join(",") : null;
  if (value === (root.dataset.auraHues ?? null)) return;
  if (value) root.dataset.auraHues = value;
  else delete root.dataset.auraHues;
}

/**
 * Homepage: each section steers the aura while it sits in the middle of the
 * screen. Sections not in the map (and the hero) use the default palette.
 */
export function useAuraSections(hues: Record<string, Hues>) {
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("#main-content > section, #main-content > div > section")];
    if (!sections.length) return;
    const active = new Set<HTMLElement>();
    const update = () => {
      const current = sections.find((section) => active.has(section));
      setAuraHues(current ? hues[current.id] ?? null : null);
    };
    // A thin band a little above the middle of the screen decides which section is "current".
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) active.add(entry.target as HTMLElement);
        else active.delete(entry.target as HTMLElement);
      }
      update();
    }, { rootMargin: "-42% 0px -52% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => { observer.disconnect(); setAuraHues(null); };
  }, [hues]);
}

/** The two strongest hues in an image, or null when it is mostly grey. */
export function dominantHues(image: CanvasImageSource): Hues | null {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);
  const buckets = new Float32Array(24);
  let colourful = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const chroma = max - min;
    // Dark UIs with bright accents count; greys, near-blacks and washed-out pixels don't.
    if (max < 0.15 || chroma < 0.12 || chroma / max < 0.3) continue;
    let hue = max === r ? ((g - b) / chroma) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
    hue = (hue * 60 + 360) % 360;
    buckets[Math.floor(hue / 15) % 24] += chroma;
    colourful++;
  }
  // Under ~3.5% colourful pixels the image is a grey screenshot: keep the default palette.
  if (colourful < 20) return null;
  const smooth = buckets.map((value, index) => value + 0.5 * buckets[(index + 23) % 24] + 0.5 * buckets[(index + 1) % 24]);
  let first = 0;
  smooth.forEach((value, index) => { if (value > smooth[first]) first = index; });
  let second = -1;
  smooth.forEach((value, index) => {
    const distance = Math.min(Math.abs(index - first), 24 - Math.abs(index - first));
    if (distance >= 3 && (second < 0 || value > smooth[second])) second = index;
  });
  const h1 = first * 15 + 7.5;
  // A one-colour image gets a neighbour hue so the field still has two tones.
  const h2 = second >= 0 && smooth[second] > smooth[first] * 0.15 ? second * 15 + 7.5 : h1 + 40;
  return [h1, h2];
}

/** Project pages: tint the aura with the colours of the first of `sources` that loads. */
export function useAuraFromImage(...sources: (string | undefined)[]) {
  const key = sources.filter(Boolean).join("|");
  useEffect(() => {
    const list = key ? key.split("|") : [];
    if (!list.length) return;
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    const load = (index: number): Promise<void> => {
      image.src = list[index];
      return image.decode().catch(() => (index + 1 < list.length && !cancelled ? load(index + 1) : Promise.reject()));
    };
    load(0).then(() => {
      if (cancelled) return;
      const pick = () => { if (!cancelled) setAuraHues(dominantHues(image)); };
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(pick, { timeout: 1500 });
      else pick();
    }).catch(() => {});
    return () => { cancelled = true; setAuraHues(null); };
  }, [key]);
}
