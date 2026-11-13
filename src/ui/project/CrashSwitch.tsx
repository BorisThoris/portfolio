import { useRef, useState } from "react";
import { useMediaQuery } from "../../lib/runtime";

// Dynamic Damage is a PC game mod, so it cannot run in a page. What can: the same
// ProStreet hit, filmed once on the stock game and once with the mod. The two
// takes are not the same camera, so this switches whole pictures, each one
// labelled, instead of wiping between them and implying a pixel match.
const SHOTS = {
  stock: { src: "/native/dynamic-damage/prostreet-stock.jpg", label: "Stock", alt: "ProStreet without the mod: the bonnet and bumper crumple and a wheel comes off" },
  mod: { src: "/native/dynamic-damage/prostreet-mod.jpg", label: "Mod", alt: "ProStreet with Dynamic Damage: the nose is crushed open to the engine bay and a wheel lies torn off on the track" },
} as const;

export function CrashSwitch() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [mod, setMod] = useState(false);
  const [hits, setHits] = useState(0);
  const audio = useRef<AudioContext | null>(null);

  // A short crunch: filtered noise that falls away, played only on a click.
  const crunch = () => {
    try {
      const context = audio.current ?? (audio.current = new AudioContext());
      const length = Math.floor(context.sampleRate * 0.35);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.value = 0.18;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
    } catch {
      /* no audio, no problem */
    }
  };

  const flip = () => {
    if (!mod) crunch();
    setMod((value) => !value);
    setHits((value) => value + 1);
  };
  const shot = mod ? SHOTS.mod : SHOTS.stock;

  return (
    <section className="pp-play crash" aria-labelledby="crash-title">
      <h2 id="crash-title" className="label">Switch it on · the same hit, with and without the mod</h2>
      <div className={`crash__stage${mod && !reduced ? " is-hit" : ""}`} key={reduced ? "still" : hits}>
        <img src={SHOTS.mod.src} alt="" aria-hidden="true" className="crash__preload" width={1920} height={1080} />
        <img src={shot.src} alt={shot.alt} width={1920} height={1080} />
        <span className={`crash__chip crash__chip--${mod ? "mod" : "stock"}`}>{shot.label}</span>
      </div>
      <div className="crash__bar">
        <button type="button" className="btn btn--primary crash__button" onClick={flip} aria-pressed={mod}>
          {mod ? "Back to the stock game" : "Switch Dynamic Damage on"}
        </button>
        <p className="crash__note">
          Need for Speed ProStreet, two separate takes of one hit. The camera is not identical, so this switches the whole picture rather than sliding between them.
        </p>
      </div>
      <p className="visually-hidden" aria-live="polite">{hits ? `Showing the ${mod ? "modded" : "stock"} game` : ""}</p>
    </section>
  );
}
