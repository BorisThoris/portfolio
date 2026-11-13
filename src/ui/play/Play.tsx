import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { PLAY_EVENT, sandboxes, type Sandbox as SandboxData } from "../../content/sandboxes";
import { getProject, type Project } from "../../projects";
import { projectStatus } from "../../projectStatus";
import { BobToss } from "./BobToss";
import { MiataLights } from "./MiataLights";
import { Sandbox } from "./Sandbox";

type Item = { sandbox: SandboxData; project: Project };
const playable: Item[] = sandboxes.flatMap((sandbox) => {
  const project = getProject(sandbox.slug);
  return project ? [{ sandbox, project }] : [];
});
const games = playable.filter((item) => item.sandbox.shelf === "games");
const apps = playable.filter((item) => item.sandbox.shelf === "apps");

const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const count = (n: number) => words[n] ?? String(n);

/**
 * The homepage arcade: show, don't tell. The real builds run here, one at a
 * time, behind a poster until asked for. Bob and the Miata are the warm-up, and
 * the way in: toys made from the projects' own assets that hand over to the real thing.
 */
export function Play() {
  return (
    <section id="play" className="sec play" aria-labelledby="play-title">
      <header className="sec__head">
        <p className="label">01 / Play</p>
        <h2 id="play-title"><span className="sweep">Don’t take my word for it. Play it.</span></h2>
        <p>
          {count(games.length)} games and {count(apps.length).toLowerCase()} apps from the live projects, running right here in the page:
          the real builds, not videos. Nothing loads until you press play.
        </p>
        <p className="hand sec__aside" aria-hidden="true">start with Bob ↓</p>
      </header>
      <div className="play__grid">
        <BobToss />
        <Arcade items={games} label="Live games" id="arcade" />
      </div>
      <div className="play__grid play__grid--apps">
        <MiataLights />
        <Arcade
          items={apps}
          label="Live apps"
          id="apps"
          variant="browser"
          intro="And the work you would use rather than play: my own label’s 3D store, the component library behind the games, and five business apps, back to an Angular site from 2018."
        />
      </div>
    </section>
  );
}

function Arcade({ items, label, id, variant, intro }: { items: Item[]; label: string; id: string; variant?: "browser"; intro?: string }) {
  const [current, setCurrent] = useState(items[0]?.sandbox.slug ?? "");
  const [autoStart, setAutoStart] = useState(false);
  const [running, setRunning] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const onPlay = (event: Event) => {
      const slug = (event as CustomEvent<string>).detail;
      if (!items.some((item) => item.sandbox.slug === slug)) return;
      setCurrent(slug);
      setAutoStart(true);
      shell.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    };
    window.addEventListener(PLAY_EVENT, onPlay);
    return () => window.removeEventListener(PLAY_EVENT, onPlay);
  }, [items]);

  const choose = (slug: string) => { setCurrent(slug); setAutoStart(false); };
  const onTabKey = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + items.length) % items.length;
    choose(items[next].sandbox.slug);
    tabs.current[next]?.focus();
  };
  const onPhase = useCallback((phase: string) => setRunning(phase !== "idle"), []);

  const active = items.find((item) => item.sandbox.slug === current) ?? items[0];
  if (!active) return null;
  const host = new URL(active.sandbox.url).host;

  return (
    <div className={variant ? `arcade arcade--${variant}` : "arcade"} ref={shell} id={id} data-running={running || undefined}>
      {intro ? <p className="arcade__intro">{intro}</p> : null}
      <div className="arcade__tabs" role="tablist" aria-label={label}>
        {items.map(({ sandbox, project }, index) => {
          const selected = sandbox.slug === active.sandbox.slug;
          return (
            <button
              key={sandbox.slug}
              ref={(element) => { tabs.current[index] = element; }}
              type="button"
              role="tab"
              id={`cart-${sandbox.slug}`}
              aria-selected={selected}
              aria-controls={`${id}-screen`}
              tabIndex={selected ? 0 : -1}
              className="cart"
              onClick={() => choose(sandbox.slug)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              <span className="cart__name">{sandbox.name}</span>
              <span className="cart__kind">{sandbox.kind}</span>
              {projectStatus(project).key !== "live" ? <span className="cart__off">resting</span> : null}
            </button>
          );
        })}
      </div>
      <div id={`${id}-screen`} role="tabpanel" aria-labelledby={`cart-${active.sandbox.slug}`} className="arcade__screen">
        {variant === "browser" ? (
          <div className="arcade__chrome" aria-hidden="true">
            <span className="arcade__lights"><i /><i /><i /></span>
            <span className="arcade__address">{host}</span>
          </div>
        ) : null}
        <Sandbox
          key={`${active.sandbox.slug}-${autoStart ? "go" : "wait"}`}
          sandbox={active.sandbox}
          project={active.project}
          autoStart={autoStart}
          storyHref={active.sandbox.story ? `#${active.sandbox.story.problem}` : undefined}
          onPhase={onPhase}
        />
      </div>
      <p className="arcade__foot label">
        One runs at a time · <Link className="link" to={`/projects/${active.sandbox.slug}`}>How {active.sandbox.name} was built</Link>
      </p>
    </div>
  );
}
