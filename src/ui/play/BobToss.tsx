import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { requestPlay } from "../../content/sandboxes";
import { useMediaQuery } from "../../lib/runtime";

// Bob, cut out of BOBBALL's own runtime model (rendered once, offline, from the
// game's avatar and its Idle and GetUp clips). The points are the game's own.
const STAND = "/play/bob-stand.webp";
const DOWN = "/play/bob-down.webp";
const ZONES = { head: { points: 30, label: "Head" }, body: { points: 10, label: "Body" }, limb: { points: 5, label: "Limb" } } as const;
type Zone = keyof typeof ZONES;
const KNOCKDOWN = 50;
const HOLD_MS = 350;

type Pop = { id: number; x: number; y: number; text: string; big: boolean };

/** A paper Bob you can throw at, right in the page — and a way into the real game. */
export function BobToss() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const stage = useRef<HTMLDivElement>(null);
  const bob = useRef<HTMLDivElement>(null);
  const standImg = useRef<HTMLImageElement>(null);
  const mask = useRef<{ data: Uint8ClampedArray; w: number; h: number } | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const pressAt = useRef(0);
  const lastHit = useRef(0);
  const nextId = useRef(0);
  // Balls land after their flight, so the hit logic reads these live rather than
  // from the render that threw them.
  const comboRef = useRef(0);
  const downRef = useRef(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest());
  const [hits, setHits] = useState(0);
  const [throws, setThrows] = useState(0);
  const [combo, setCombo] = useState(0);
  const [down, setDown] = useState(false);
  const [charging, setCharging] = useState<{ x: number; y: number } | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [said, setSaid] = useState("");
  const [sound, setSound] = useState(true);

  // Read Bob's silhouette once, so a throw that lands between his arm and his
  // shirt misses, the way it would in the game.
  useEffect(() => {
    const image = new Image();
    image.src = STAND;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0);
      mask.current = { data: context.getImageData(0, 0, canvas.width, canvas.height).data, w: canvas.width, h: canvas.height };
    };
  }, []);

  const zoneAt = (clientX: number, clientY: number): Zone | null => {
    const img = standImg.current;
    if (!img || downRef.current) return null;
    const box = img.getBoundingClientRect();
    const u = (clientX - box.left) / box.width;
    const v = (clientY - box.top) / box.height;
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    const m = mask.current;
    if (m) {
      // A little forgiveness: a ball has a radius.
      let solid = false;
      for (const [dx, dy] of [[0, 0], [6, 0], [-6, 0], [0, 6], [0, -6]]) {
        const px = Math.min(m.w - 1, Math.max(0, Math.round(u * m.w) + dx));
        const py = Math.min(m.h - 1, Math.max(0, Math.round(v * m.h) + dy));
        if (m.data[(py * m.w + px) * 4 + 3] > 40) { solid = true; break; }
      }
      if (!solid) return null;
    }
    if (v < 0.17) return "head";
    if (v < 0.62 && u > 0.22 && u < 0.78) return "body";
    return "limb";
  };

  const thump = (strength: number) => {
    if (!sound) return;
    try {
      audio.current ??= new AudioContext();
      const ctx = audio.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150 + 40 * strength, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.14);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22 * strength, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch { /* no audio is fine */ }
  };

  const pop = (x: number, y: number, text: string, big = false) => {
    const id = nextId.current++;
    setPops((list) => [...list.slice(-5), { id, x, y, text, big }]);
    window.setTimeout(() => setPops((list) => list.filter((item) => item.id !== id)), 1100);
  };

  const throwAt = (clientX: number, clientY: number, power: boolean) => {
    const area = stage.current;
    if (!area) return;
    const box = area.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    setThrows((value) => value + 1);
    const ball = document.createElement("span");
    ball.className = "toss__ball";
    area.appendChild(ball);
    const startX = box.width * 0.92;
    const startY = box.height * 1.02;
    const peak = Math.min(startY, y) - box.height * (power ? 0.12 : 0.28);
    const flight = reduced ? 0 : power ? 240 : 380;
    const land = () => resolve(clientX, clientY, x, y, power, ball);
    if (!flight) { land(); return; }
    ball.animate(
      [
        { transform: `translate(${startX}px, ${startY}px) scale(1.25)` },
        { transform: `translate(${(startX + x) / 2}px, ${peak}px) scale(0.95)`, offset: 0.5 },
        { transform: `translate(${x}px, ${y}px) scale(0.7)` },
      ],
      { duration: flight, easing: "cubic-bezier(.3,.1,.5,1)", fill: "forwards" },
    ).finished.then(land, land);
  };

  const resolve = (clientX: number, clientY: number, x: number, y: number, power: boolean, ball: HTMLSpanElement) => {
    const zone = zoneAt(clientX, clientY);
    const now = performance.now();
    if (!zone) {
      comboRef.current = 0;
      setCombo(0);
      pop(x, y, "Miss");
      setSaid("Missed.");
      if (!reduced) ball.animate([{ transform: `translate(${x}px, ${y}px) scale(0.7)`, opacity: 1 }, { transform: `translate(${x + 30}px, ${y + 140}px) scale(0.5)`, opacity: 0 }], { duration: 420, easing: "ease-in", fill: "forwards" });
      window.setTimeout(() => ball.remove(), reduced ? 0 : 430);
      return;
    }
    const chain = now - lastHit.current < 2200 ? comboRef.current + 1 : 1;
    comboRef.current = chain;
    lastHit.current = now;
    const multiplier = chain >= 6 ? 3 : chain >= 3 ? 2 : 1;
    const knocked = (power && zone !== "limb") || chain % 5 === 0;
    const gained = ZONES[zone].points * multiplier + (knocked ? KNOCKDOWN : 0);
    setCombo(chain);
    setHits((value) => value + 1);
    setScore((value) => {
      const next = value + gained;
      setBest((old) => { if (next > old) { writeBest(next); return next; } return old; });
      return next;
    });
    pop(x, y, `+${ZONES[zone].points * multiplier} ${ZONES[zone].label}${multiplier > 1 ? ` ×${multiplier}` : ""}`);
    if (knocked) pop(x, y - 40, `Knockdown +${KNOCKDOWN}`, true);
    setSaid(`${ZONES[zone].label} hit, ${gained} points${knocked ? ", knocked down" : ""}.`);
    thump(power ? 1.4 : zone === "head" ? 1.1 : 0.8);
    // He reels away from the side he was hit on.
    const img = standImg.current?.getBoundingClientRect();
    const side = img && clientX < img.left + img.width / 2 ? 1 : -1;
    const tilt = (zone === "head" ? 13 : zone === "body" ? 8 : 5) * (power ? 1.6 : 1) * side;
    if (!reduced && bob.current && !knocked) {
      bob.current.animate(
        [
          { transform: "rotate(0deg) translateX(0)" },
          { transform: `rotate(${tilt}deg) translateX(${side * 16}px)`, offset: 0.18 },
          { transform: `rotate(${-tilt * 0.35}deg) translateX(${-side * 4}px)`, offset: 0.55 },
          { transform: `rotate(${tilt * 0.12}deg)`, offset: 0.8 },
          { transform: "rotate(0deg) translateX(0)" },
        ],
        { duration: 760, easing: "ease-out" },
      );
    }
    if (!reduced) ball.animate([{ transform: `translate(${x}px, ${y}px) scale(0.7)`, opacity: 1 }, { transform: `translate(${x - side * 90}px, ${y - 60}px) scale(0.55)`, opacity: 0.9, offset: 0.4 }, { transform: `translate(${x - side * 150}px, ${y + 160}px) scale(0.5)`, opacity: 0 }], { duration: 650, easing: "ease-out", fill: "forwards" });
    window.setTimeout(() => ball.remove(), reduced ? 0 : 660);
    if (knocked) {
      downRef.current = true;
      setDown(true);
      window.setTimeout(() => { downRef.current = false; setDown(false); }, 1500);
    }
  };

  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) return;
    pressAt.current = performance.now();
    const box = stage.current!.getBoundingClientRect();
    setCharging({ x: event.clientX - box.left, y: event.clientY - box.top });
  };
  const onUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!charging) return;
    setCharging(null);
    throwAt(event.clientX, event.clientY, performance.now() - pressAt.current >= HOLD_MS);
  };
  const keyboardThrow = () => {
    const img = standImg.current?.getBoundingClientRect();
    if (!img) return;
    const v = [0.08, 0.35, 0.45, 0.75][Math.floor(Math.random() * 4)];
    throwAt(img.left + img.width * (0.42 + Math.random() * 0.16), img.top + img.height * v, false);
  };

  const hooked = hits >= 3 || throws >= 6;

  return (
    <div className="toss">
      <div className="toss__head">
        <p className="label">Warm-up · the paper version</p>
        <p className="toss__score num" aria-label={`Score ${score}`}>{score}<span className="label"> pts{combo >= 3 ? ` · combo ×${combo >= 6 ? 3 : 2}` : ""}</span></p>
        <button type="button" className="toss__mute" onClick={() => setSound(!sound)} aria-label={sound ? "Mute hits" : "Unmute hits"} aria-pressed={!sound}>
          {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>
      <div
        className="toss__stage"
        ref={stage}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={() => setCharging(null)}
        data-down={down || undefined}
      >
        <ul className="toss__zones" aria-hidden="true">
          <li>Head 30</li><li>Body 10</li><li>Limb 5</li><li>Knockdown 50</li>
        </ul>
        <div className="toss__bob" ref={bob}>
          <img ref={standImg} src={STAND} alt="Bob, from BOBBALL, standing and waiting" width={437} height={1104} draggable={false} />
        </div>
        <img className="toss__down" src={DOWN} alt="" width={825} height={272} draggable={false} />
        {charging ? <span className="toss__charge" style={{ left: charging.x, top: charging.y }} aria-hidden="true" /> : null}
        {pops.map((item) => (
          <span key={item.id} className={`toss__pop${item.big ? " toss__pop--big" : ""}`} style={{ left: item.x, top: item.y }} aria-hidden="true">{item.text}</span>
        ))}
        <p className="toss__help hand" aria-hidden="true">{throws ? (hooked ? "" : "hold for a power shot") : "click Bob. go on."}</p>
      </div>
      <p className="visually-hidden" aria-live="polite">{said}</p>
      <div className="toss__foot">
        <button type="button" className="btn" onClick={keyboardThrow}>Throw at Bob</button>
        <span className="label">Best {best} · {hits}/{throws} hits</span>
      </div>
      <div className={`toss__cta note note--pink${hooked ? " is-on" : ""}`} aria-hidden={!hooked}>
        <p className="hand">That was the paper Bob.</p>
        <p>The real one has ragdoll physics, sixty seconds on the clock and a global top five.</p>
        <button type="button" className="btn btn--primary" tabIndex={hooked ? 0 : -1} onClick={() => requestPlay("bobball")}>Play the real BOBBALL here</button>
      </div>
    </div>
  );
}

function readBest() {
  try { return Number(localStorage.getItem("portfolio:bob-best")) || 0; } catch { return 0; }
}
function writeBest(value: number) {
  try { localStorage.setItem("portfolio:bob-best", String(value)); } catch { /* private mode */ }
}
