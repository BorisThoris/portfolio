import type { CSSProperties } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { home, shipped } from "../../content/home";
import type { Project } from "../../projects";
import { ProjectMedia } from "../../components/ProjectMedia";
import { CountUp } from "../motion";

export type ProofNote = { value: string; text: string; href: string; color: "yellow" | "pink" | "blue" | "green" };

function shortDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

/**
 * Above the fold: who, what, one call to action, and proof pinned right beside
 * the claim (post-its with counted figures, employers, a playing trailer and a
 * dated release log).
 */
export function Hero({ reel, proof, employers, email, motion }: {
  reel?: Project;
  proof: ProofNote[];
  employers: string[];
  email: string;
  motion: "running" | "paused";
}) {
  return (
    <section className="hero" aria-labelledby="intro-title" data-motion={motion}>
      <div className="hero__intro">
        <p className="hero__chip">
          <span className="hero__dot" aria-hidden="true" />
          {home.role}
        </p>
        <h1 id="intro-title">
          {home.headline[0]}
          <span className="hero__hand hand">
            {home.headline[1]}
            <svg className="hero__scribble" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
              <path d="M3 14 C 60 4, 120 18, 180 9 S 270 6, 297 12" />
            </svg>
          </span>
        </h1>
        <p className="hero__value">{home.introduction}</p>
        <div className="hero__cta">
          <a className="btn btn--primary" href={`mailto:${email}`}>Email me <ArrowUpRight size={16} /></a>
          <a className="btn" href="#work">See the work <ArrowDown size={16} /></a>
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
            <a className={`note note--${note.color}`} href={note.href} data-reveal style={{ "--i": index } as CSSProperties}>
              <CountUp className="note__big" value={note.value} />
              <span className="note__text">{note.text}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="hero__desk">
        {reel ? (
          <figure className="polaroid reel" data-reveal>
            <ProjectMedia project={reel} mode="feature" />
            <figcaption>
              <span className="reel__rec" aria-hidden="true"><span className="hero__signal"><i /><i /><i /></span>REC</span>
              <Link to={`/projects/${reel.slug}`} className="reel__title hand">
                {reel.title}, {reel.subtitle.charAt(0).toLowerCase() + reel.subtitle.slice(1)}
              </Link>
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
