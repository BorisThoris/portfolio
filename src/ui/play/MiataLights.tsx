import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Volume2, VolumeX } from "lucide-react";
import { useMediaQuery } from "../../lib/runtime";

// The teal Miata from Miata Lights, a native Android app: five frames of its own
// screen recording, lights down to lights up, from one fixed front camera. Each
// headlight is drawn from its own half of the frame, so the two move on their own,
// the way the app drives the model's real headlight joints.
const FRAMES = [0, 1, 2, 3, 4].map((i) => `/play/miata/miata-${i}.webp`);
const UP = FRAMES.length - 1;
const HALF = 2;
const STEP_MS = 55;
type Side = "left" | "right";

export function MiataLights() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [pos, setPos] = useState<Record<Side, number>>({ left: 0, right: 0 });
  const target = useRef<Record<Side, number>>({ left: 0, right: 0 });
  const live = useRef<Record<Side, number>>({ left: 0, right: 0 });
  const timer = useRef<number | null>(null);
  const queue = useRef<number[]>([]);
  const audio = useRef<AudioContext | null>(null);
  const [moves, setMoves] = useState(0);
  const [said, setSaid] = useState("");
  const [sound, setSound] = useState(true);

  useEffect(() => { FRAMES.forEach((src) => { const image = new Image(); image.src = src; }); }, []);
  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
    queue.current.forEach((id) => window.clearTimeout(id));
  }, []);

  // A pop-up headlight motor: a short low whirr, only after a click.
  const whirr = () => {
    if (!sound) return;
    try {
      const context = audio.current ?? (audio.current = new AudioContext());
      const now = context.currentTime;
      const osc = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(70, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.22);
      filter.type = "lowpass";
      filter.frequency.value = 520;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      osc.connect(filter).connect(gain).connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      /* no audio, no problem */
    }
  };

  const animate = () => {
    if (reduced) { live.current = { ...target.current }; setPos({ ...live.current }); return; }
    if (timer.current) return;
    timer.current = window.setInterval(() => {
      const next = { ...live.current };
      let moving = false;
      for (const side of ["left", "right"] as Side[]) {
        const delta = Math.sign(target.current[side] - next[side]);
        if (delta) { next[side] += delta; moving = true; }
      }
      live.current = next;
      setPos(next);
      if (!moving && timer.current) { window.clearInterval(timer.current); timer.current = null; }
    }, STEP_MS);
  };

  const set = (left: number, right: number) => {
    const moved = left !== target.current.left || right !== target.current.right;
    target.current = { left, right };
    if (moved) whirr();
    animate();
  };
  const later = (ms: number, fn: () => void) => { queue.current.push(window.setTimeout(fn, ms)); };
  const clearQueue = () => { queue.current.forEach((id) => window.clearTimeout(id)); queue.current = []; };
  const did = (text: string) => { setMoves((value) => value + 1); setSaid(text); };

  const toggle = (side: Side) => {
    clearQueue();
    const up = target.current[side] < UP;
    set(side === "left" ? (up ? UP : 0) : target.current.left, side === "right" ? (up ? UP : 0) : target.current.right);
    did(`${side === "left" ? "Left" : "Right"} light ${up ? "up" : "down"}`);
  };
  const open = () => {
    clearQueue();
    const allUp = target.current.left === UP && target.current.right === UP;
    set(allUp ? 0 : UP, allUp ? 0 : UP);
    did(allUp ? "Lights down" : "Lights up");
  };
  const wink = () => {
    clearQueue();
    const base = target.current.right === UP ? UP : 0;
    const flip = base === UP ? 0 : UP;
    set(base, base);
    later(reduced ? 0 : 140, () => set(flip, base));
    later(reduced ? 600 : 520, () => set(base, base));
    did("Wink");
  };
  const sleepy = () => { clearQueue(); set(HALF, HALF); did("Sleepy"); };
  const blink = () => {
    clearQueue();
    const base = target.current.left === UP && target.current.right === UP ? UP : 0;
    const flip = base === UP ? 0 : UP;
    set(flip, flip);
    later(420, () => set(base, base));
    later(840, () => set(flip, flip));
    later(1260, () => set(base, base));
    did("Blink");
  };

  const handed = moves >= 3;

  return (
    <div className="miata">
      <div className="toss__head">
        <p className="label">Miata Lights · pop them up</p>
        <button type="button" className="toss__mute" onClick={() => setSound((value) => !value)} aria-pressed={!sound} aria-label={sound ? "Mute the motor" : "Unmute the motor"}>
          {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>
      <div className="miata__stage">
        <img className="miata__frame" src={FRAMES[pos.right]} alt="The teal Miata from Miata Lights, front view, with pop-up headlights" width={400} height={380} draggable={false} />
        <img className="miata__frame miata__frame--left" src={FRAMES[pos.left]} alt="" width={400} height={380} draggable={false} />
        <button type="button" className="miata__light miata__light--left" onClick={() => toggle("left")} aria-label="Pop the left headlight" />
        <button type="button" className="miata__light miata__light--right" onClick={() => toggle("right")} aria-label="Pop the right headlight" />
        <p className="hand miata__help" aria-hidden="true">{moves ? "" : "click a light ↓"}</p>
      </div>
      <div className="miata__controls" role="group" aria-label="Headlight moves">
        <button type="button" onClick={open}>{pos.left === UP && pos.right === UP ? "Lower" : "Open"}</button>
        <button type="button" onClick={wink}>Wink</button>
        <button type="button" onClick={sleepy}>Sleepy</button>
        <button type="button" onClick={blink}>Blink</button>
      </div>
      <p className="visually-hidden" aria-live="polite">{said}</p>
      <div className={handed ? "note note--blue toss__cta miata__cta is-on" : "note note--blue toss__cta miata__cta"} aria-hidden={!handed}>
        <p className="hand">That was a screen recording.</p>
        <p>The real thing is a native Android app: Kotlin, Jetpack Compose and Filament, moving the 3D model’s actual headlight joints. Phones only, so here is how it was built.</p>
        <Link className="link" to="/projects/miata-lights" tabIndex={handed ? 0 : -1}>See Miata Lights <ArrowUpRight size={13} /></Link>
      </div>
    </div>
  );
}
