import { Fragment, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { home, shipped } from "../../content/home";
import type { Project } from "../../projects";
import { ProjectMedia } from "../../components/ProjectMedia";
import { CountUp } from "../motion";
import { tractionAsOf } from "../../projectTraction";
import { getSandbox, requestPlay } from "../../content/sandboxes";

export type ProofNote = { value: string; text: string; href: string; color: "yellow" | "pink" | "blue" | "green" };

function shortDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

/**
 * Above the fold: who, what, one call to action, and proof pinned right beside
 * the claim (post-its with counted figures, employers, a playing trailer and a
 * dated release log).
 */
function stampDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();
}

/** Splits a line into letters that drop in one after another (CSS: .ch). */
function Letters({ text, offset = 0 }: { text: string; offset?: number }) {
  let index = offset;
  return (
    <>
      {text.split(" ").map((word, w, words) => (
        <Fragment key={`${word}-${w}`}>
          <span className="word">
            {[...word].map((char) => <span className="ch" key={index} style={{ "--c": index++ } as CSSProperties}>{char}</span>)}
          </span>
          {/* The space sits between the word boxes; inside one it would collapse. */}
          {w < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

/**
 * A post-it you can drag around the desk with a mouse or pen. A drag never turns
 * into a click; a plain click (or Enter) still follows the link.
 */
function DragNote({ className, href, index, children }: { className: string; href: string; index: number; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const drag = useRef<{ x: number; y: number; dx: number; dy: number; moved: boolean } | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const onPointerDown = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, dx: offset.current.x, dy: offset.current.y, moved: false };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const state = drag.current;
    if (!state) return;
    const x = state.dx + event.clientX - state.x;
    const y = state.dy + event.clientY - state.y;
    if (!state.moved && Math.hypot(x - state.dx, y - state.dy) > 5) {
      state.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add("is-dragging");
    }
    if (state.moved) {
      offset.current = { x, y };
      event.currentTarget.style.translate = `${x}px ${y}px`;
    }
  };
  const end = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    event.currentTarget.classList.remove("is-dragging");
    if (!drag.current?.moved) { drag.current = null; return; }
    // Let the click that may follow this release see the drag, then forget it.
    window.setTimeout(() => { drag.current = null; }, 0);
  };
  return (
    <a
      ref={ref}
      className={className}
      href={href}
      data-reveal
      draggable={false}
      style={{ "--i": index } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onClickCapture={(event) => {
        if (drag.current?.moved) event.preventDefault();
        drag.current = null;
      }}
    >
      {children}
    </a>
  );
}

/** A soft light that follows the pointer across the hero's grid paper. */
function spotlight(event: ReactPointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

export function Hero({ reel, proof, employers, email, motion }: {
  reel?: Project;
  proof: ProofNote[];
  employers: string[];
  email: string;
  motion: "running" | "paused";
}) {
  return (
    <section className="hero" aria-labelledby="intro-title" data-motion={motion} onPointerMove={spotlight}>
      <span className="hero__spot" aria-hidden="true" />
      <div className="hero__intro">
        <p className="hero__chip">
          <span className="hero__dot" aria-hidden="true" />
          {home.role}
        </p>
        <h1 id="intro-title">
          <Letters text={home.headline[0]} />
          <span className="hero__hand hand">
            <Letters text={home.headline[1]} offset={home.headline[0].length} />
            <svg className="hero__scribble" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
              <path d="M3 14 C 60 4, 120 18, 180 9 S 270 6, 297 12" />
            </svg>
          </span>
        </h1>
        <p className="hero__value">{home.introduction}</p>
        <div className="hero__cta">
          <a className="btn btn--primary" href={`mailto:${email}`}>Email me <ArrowUpRight size={16} /></a>
          <a className="btn" href="#play">Play something <ArrowDown size={16} /></a>
          <span className="hero__aside hand" aria-hidden="true">← or just say hi</span>
        </div>
        <div className="hero__trust">
          <span className="label">Shipped at</span>
          <ul>{employers.map((name) => <li key={name}>{name}</li>)}</ul>
        </div>
      </div>

      <ul className="hero__notes" aria-label="Proof, counted from the platforms">
        {proof.map((note, index) => (
          <li key={note.text} className={`hero__note hero__note--${index + 1}`}>
            <DragNote className={`note note--${note.color}`} href={note.href} index={index}>
              <CountUp className="note__big" value={note.value} />
              <span className="note__text">{note.text}</span>
            </DragNote>
          </li>
        ))}
      </ul>

      {/* Hand-drawn arrows from the notes to the claim, and the counter's stamp. */}
      <svg className="hero__arrows" viewBox="0 0 1240 560" preserveAspectRatio="none" aria-hidden="true">
        <path d="M200 175 C 235 158, 252 178, 262 196" />
        <path d="M235 398 C 262 392, 278 374, 288 352" />
        <path d="M1040 190 C 1006 168, 992 186, 984 204" />
        <path d="M1008 420 C 984 412, 972 394, 966 372" />
      </svg>
      <p className="hero__stamp" aria-hidden="true">
        <span>Counted</span>
        <strong>{stampDate(tractionAsOf)}</strong>
        <span>from the platforms</span>
      </p>

      <div className="hero__desk">
        {reel ? (
          <figure className="polaroid reel" data-reveal>
            <ProjectMedia project={reel} mode="feature" />
            <figcaption>
              <span className="reel__rec" aria-hidden="true"><span className="hero__signal"><i /><i /><i /></span>REC</span>
              <Link to={`/projects/${reel.slug}`} className="reel__title hand">
                {reel.title}, {reel.subtitle.charAt(0).toLowerCase() + reel.subtitle.slice(1)}
              </Link>
              {getSandbox(reel.slug) ? (
                <a className="reel__play" href="#play" onClick={(event) => { event.preventDefault(); requestPlay(reel.slug); }}>
                  ▶ This is the real game. Play it here
                </a>
              ) : null}
            </figcaption>
          </figure>
        ) : null}
        <div className="shipped notebook" data-reveal style={{ "--tilt": "1.2deg" } as CSSProperties}>
          <h2 className="hand">Shipped lately</h2>
          <ol>
            {shipped.map((entry) => (
              <li key={entry.title}>
                <time className="num" dateTime={entry.date}>{shortDate(entry.date)}</time>
                <Link to={`/projects/${entry.slug}`}>{entry.title}</Link>
                <span className="label">{entry.kind}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
