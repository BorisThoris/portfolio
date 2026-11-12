import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { PLAY_EVENT, sandboxes } from "../../content/sandboxes";
import { getProject } from "../../projects";
import { projectStatus } from "../../projectStatus";
import { BobToss } from "./BobToss";
import { Sandbox } from "./Sandbox";

const playable = sandboxes.flatMap((sandbox) => {
  const project = getProject(sandbox.slug);
  return project ? [{ sandbox, project }] : [];
});

/**
 * The homepage arcade: show, don't tell. The real builds run here, one at a
 * time, behind a poster until asked for. Bob is the warm-up, and the way in.
 */
export function Play() {
  const [current, setCurrent] = useState(playable[0]?.sandbox.slug ?? "");
  const [autoStart, setAutoStart] = useState(false);
  const [running, setRunning] = useState(false);
  const arcade = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const onPlay = (event: Event) => {
      const slug = (event as CustomEvent<string>).detail;
      if (!playable.some((item) => item.sandbox.slug === slug)) return;
      setCurrent(slug);
      setAutoStart(true);
      arcade.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    };
    window.addEventListener(PLAY_EVENT, onPlay);
    return () => window.removeEventListener(PLAY_EVENT, onPlay);
  }, []);

  const choose = (slug: string) => { setCurrent(slug); setAutoStart(false); };
  const onTabKey = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + playable.length) % playable.length;
    choose(playable[next].sandbox.slug);
    tabs.current[next]?.focus();
  };
  const onPhase = useCallback((phase: string) => setRunning(phase !== "idle"), []);

  const active = playable.find((item) => item.sandbox.slug === current) ?? playable[0];
  if (!active) return null;

  return (
    <section id="play" className="sec play" aria-labelledby="play-title">
      <header className="sec__head">
        <p className="label">01 / Play</p>
        <h2 id="play-title"><span className="sweep">Don’t take my word for it. Play it.</span></h2>
        <p>Six of the live projects, running right here in the page: the real builds, not videos. Nothing loads until you press play.</p>
        <p className="hand sec__aside" aria-hidden="true">start with Bob ↓</p>
      </header>
      <div className="play__grid">
        <BobToss />
        <div className="arcade" ref={arcade} data-running={running || undefined}>
          <div className="arcade__tabs" role="tablist" aria-label="Live projects">
            {playable.map(({ sandbox, project }, index) => {
              const selected = sandbox.slug === active.sandbox.slug;
              return (
                <button
                  key={sandbox.slug}
                  ref={(element) => { tabs.current[index] = element; }}
                  type="button"
                  role="tab"
                  id={`cart-${sandbox.slug}`}
                  aria-selected={selected}
                  aria-controls="arcade-screen"
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
          <div id="arcade-screen" role="tabpanel" aria-labelledby={`cart-${active.sandbox.slug}`} className="arcade__screen">
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
      </div>
    </section>
  );
}
