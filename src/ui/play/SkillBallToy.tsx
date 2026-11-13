import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useMediaQuery } from "../../lib/runtime";

// SkillBall's classic ball (paint #e4f878, from the game's renderer), drawn flat. It
// watches the cursor, and firing kicks it back the way the game's weapons do: in
// SkillBall the recoil of a shot is movement.
const W = 400;
const H = 260;
const R = 34;
const KICK = 330; // px/s per shot
const DRAG = 1.6; // per second
const BOUNCE = 0.72;
const LIVE = "https://skillball.modaxxx009.workers.dev/";

type Shot = { id: number; x1: number; y1: number; x2: number; y2: number };

export function SkillBallToy() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const svg = useRef<SVGSVGElement>(null);
  const ball = useRef({ x: W / 2, y: H / 2, vx: 0, vy: 0 });
  const [pos, setPos] = useState({ x: W / 2, y: H / 2, spin: 0 });
  const [aim, setAim] = useState({ x: W / 2 + 120, y: H / 2 - 40 });
  const [shots, setShots] = useState<Shot[]>([]);
  const [fired, setFired] = useState(0);
  const [bonks, setBonks] = useState(0);
  const frame = useRef<number | null>(null);
  const spin = useRef(0);

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);

  const step = (last: number) => (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    const b = ball.current;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    let bonk = false;
    if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * BOUNCE; bonk = true; }
    if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) * BOUNCE; bonk = true; }
    if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy) * BOUNCE; bonk = true; }
    if (b.y > H - R) { b.y = H - R; b.vy = -Math.abs(b.vy) * BOUNCE; bonk = true; }
    if (bonk && Math.hypot(b.vx, b.vy) > 120) setBonks((value) => value + 1);
    const damp = Math.exp(-DRAG * dt);
    b.vx *= damp;
    b.vy *= damp;
    spin.current += (b.vx * dt) / R; // rolls as it slides
    setPos({ x: b.x, y: b.y, spin: spin.current });
    if (Math.hypot(b.vx, b.vy) < 6) { b.vx = 0; b.vy = 0; frame.current = null; return; }
    frame.current = requestAnimationFrame(step(now));
  };

  const toLocal = (event: PointerEvent) => {
    const box = svg.current!.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * W, y: ((event.clientY - box.top) / box.height) * H };
  };

  const fire = (target: { x: number; y: number }) => {
    const b = ball.current;
    const dx = target.x - b.x;
    const dy = target.y - b.y;
    const length = Math.hypot(dx, dy) || 1;
    const [ux, uy] = [dx / length, dy / length];
    const shot = { id: Date.now() + Math.random(), x1: b.x + ux * (R + 6), y1: b.y + uy * (R + 6), x2: b.x + ux * (R + 6 + 520), y2: b.y + uy * (R + 6 + 520) };
    setShots((value) => [...value.slice(-4), shot]);
    window.setTimeout(() => setShots((value) => value.filter((item) => item.id !== shot.id)), 260);
    setFired((value) => value + 1);
    if (reduced) {
      // No sliding: move straight to where the recoil would carry it.
      b.x = Math.min(W - R, Math.max(R, b.x - ux * 90));
      b.y = Math.min(H - R, Math.max(R, b.y - uy * 90));
      setPos({ x: b.x, y: b.y, spin: spin.current });
      return;
    }
    b.vx -= ux * KICK;
    b.vy -= uy * KICK;
    if (!frame.current) frame.current = requestAnimationFrame(step(performance.now()));
  };

  const onKey = (event: KeyboardEvent) => {
    const turn = event.key === "ArrowLeft" ? -0.3 : event.key === "ArrowRight" ? 0.3 : 0;
    if (turn) {
      event.preventDefault();
      const b = ball.current;
      const angle = Math.atan2(aim.y - b.y, aim.x - b.x) + turn;
      setAim({ x: b.x + Math.cos(angle) * 120, y: b.y + Math.sin(angle) * 120 });
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      fire(aim);
    }
  };

  // The face turns toward the cursor, like a ball rotating to look at it.
  const dx = aim.x - pos.x;
  const dy = aim.y - pos.y;
  const reach = Math.min(1, Math.hypot(dx, dy) / 160);
  const angle = Math.atan2(dy, dx);
  const fx = Math.cos(angle) * reach * R * 0.42;
  const fy = Math.sin(angle) * reach * R * 0.42;
  const squash = 1 - reach * 0.28;
  const hooked = fired >= 6;

  return (
    <div className="ballt">
      <div className="toss__head">
        <p className="label">SkillBall · aim, fire, get shoved</p>
        <p className="flip__count num">{fired}<span className="label"> shots · {bonks} wall hits</span></p>
      </div>
      <svg
        ref={svg}
        className="ballt__arena"
        viewBox={`0 0 ${W} ${H}`}
        role="application"
        aria-label="SkillBall arena. Click to fire toward the pointer; the recoil pushes the ball the other way. With the keyboard: left and right arrows aim, Space fires."
        tabIndex={0}
        onPointerMove={(event) => setAim(toLocal(event))}
        onPointerDown={(event) => { const at = toLocal(event); setAim(at); fire(at); }}
        onKeyDown={onKey}
      >
        <rect className="ballt__floor" x="1" y="1" width={W - 2} height={H - 2} rx="18" />
        <path className="ballt__lane" d={`M ${W / 2} 14 V ${H - 14} M 14 ${H / 2} H ${W - 14}`} />
        <circle className="ballt__ring" cx={W / 2} cy={H / 2} r="54" />
        {shots.map((shot) => <line key={shot.id} className="ballt__shot" x1={shot.x1} y1={shot.y1} x2={shot.x2} y2={shot.y2} />)}
        <g className="ballt__crosshair" transform={`translate(${aim.x} ${aim.y})`} aria-hidden="true">
          <circle r="9" /><path d="M -15 0 H -5 M 5 0 H 15 M 0 -15 V -5 M 0 5 V 15" />
        </g>
        <ellipse className="ballt__shadow" cx={pos.x + 5} cy={pos.y + R - 3} rx={R * 0.9} ry={R * 0.28} />
        <g className="ballt__body" transform={`translate(${pos.x} ${pos.y})`}>
          <clipPath id="ballt-clip"><circle r={R} /></clipPath>
          <circle className="ballt__ball" r={R} />
          <g clipPath="url(#ballt-clip)">
            <g transform={`rotate(${(pos.spin * 180) / Math.PI})`}>
              <ellipse className="ballt__band" cx="0" cy={-R * 0.42} rx={R * 1.2} ry={R * 0.2} />
              <ellipse className="ballt__band" cx="0" cy={R * 0.5} rx={R * 1.2} ry={R * 0.2} />
            </g>
            <g transform={`translate(${fx} ${fy}) rotate(${(angle * 180) / Math.PI}) scale(${squash} 1) rotate(${(-angle * 180) / Math.PI})`}>
              <ellipse className="ballt__eye" cx={-R * 0.3} cy={-R * 0.14} rx={R * 0.1} ry={R * 0.17} />
              <ellipse className="ballt__eye" cx={R * 0.3} cy={-R * 0.14} rx={R * 0.1} ry={R * 0.17} />
              <path className="ballt__smile" d={`M ${-R * 0.36} ${R * 0.2} Q 0 ${R * (fired && shots.length ? 0.38 : 0.55)} ${R * 0.36} ${R * 0.2}`} />
            </g>
          </g>
          <circle className="ballt__shine" cx={-R * 0.35} cy={-R * 0.45} r={R * 0.16} />
        </g>
      </svg>
      <div className="toss__foot">
        <span className="hand flip__help" aria-hidden="true">{fired ? (hooked ? "" : "fire the other way to stop") : "it’s watching you. click."}</span>
        <span className="label">Every shot kicks back</span>
      </div>
      <div className={`toss__cta note${hooked ? " is-on" : ""}`} aria-hidden={!hooked}>
        <p className="hand">That’s the whole trick.</p>
        <p>SkillBall is a browser arena shooter built on momentum: you roll, launch and slam, and every shot kicks you back, across several modes and maps. It won’t run inside another page, so it opens in its own tab.</p>
        <div className="ballt__links">
          <a className="btn btn--primary" href={LIVE} target="_blank" rel="noreferrer" tabIndex={hooked ? 0 : -1}>Play SkillBall <ArrowUpRight size={15} /></a>
          <Link className="link" to="/projects/skillball" tabIndex={hooked ? 0 : -1}>How it was built</Link>
        </div>
      </div>
    </div>
  );
}
