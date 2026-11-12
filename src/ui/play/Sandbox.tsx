import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ExternalLink, Maximize2, Play, RotateCcw, X } from "lucide-react";
import type { Sandbox as SandboxData } from "../../content/sandboxes";
import type { Project } from "../../projects";
import { projectStatus } from "../../projectStatus";
import { CaptureImage } from "../../components/CaptureImage";
import "./play.css";

type Phase = "idle" | "booting" | "live";

/**
 * A live project running inside the page. Nothing is loaded until the visitor asks:
 * the poster is the whole cost of an unplayed sandbox. Its controls sit outside the
 * frame, because once a game has focus it keeps the keyboard and the wheel.
 */
export function Sandbox({
  sandbox,
  project,
  autoStart = false,
  storyHref,
  onPhase,
}: {
  sandbox: SandboxData;
  project: Project;
  autoStart?: boolean;
  /** Where "how it was built" points; the homepage passes an anchor on the same page. */
  storyHref?: string;
  onPhase?: (phase: Phase) => void;
}) {
  const [phase, setPhase] = useState<Phase>(autoStart ? "booting" : "idle");
  const [run, setRun] = useState(0);
  const [playedFor, setPlayedFor] = useState(0);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const resting = projectStatus(project).key !== "live";
  const title = `${sandbox.name}, the live build, running in this page`;

  useEffect(() => onPhase?.(phase), [phase, onPhase]);

  // A frame on a phone gets the whole screen: a desktop app in a 320px card is unusable.
  useEffect(() => {
    if (phase === "idle") return;
    document.documentElement.classList.add("sandbox-open");
    return () => document.documentElement.classList.remove("sandbox-open");
  }, [phase]);

  // Seconds since the frame loaded, for the boot hint and the story note.
  useEffect(() => {
    if (loadedAt === null) return;
    const timer = window.setInterval(() => setPlayedFor(Math.round((Date.now() - loadedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [loadedAt]);

  const start = () => {
    setLoadedAt(null);
    setPlayedFor(0);
    setPhase("booting");
  };
  const restart = () => { setRun((value) => value + 1); start(); };
  const stop = () => { setPhase("idle"); setLoadedAt(null); };
  const fullscreen = () => {
    const element = shell.current;
    if (element?.requestFullscreen) element.requestFullscreen().catch(() => window.open(sandbox.url, "_blank", "noopener"));
    else window.open(sandbox.url, "_blank", "noopener");
  };

  const warming = phase !== "idle" && (loadedAt === null || playedFor < sandbox.bootSeconds);
  const showStory = phase === "live" && sandbox.story && storyHref && playedFor >= sandbox.bootSeconds + 25;
  const showEscape = phase !== "idle" && playedFor >= sandbox.bootSeconds + 8;

  return (
    <div className="sandbox" data-phase={phase} ref={shell}>
      <div className="sandbox__screen">
        {phase === "idle" ? (
          <div className="sandbox__poster">
            <CaptureImage project={project} className="sandbox__img" sizes="(max-width: 760px) 100vw, 60vw" />
            <div className="sandbox__invite">
              <p className="label">{sandbox.kind} · the real build</p>
              <p className="sandbox__dare hand">{sandbox.dare}</p>
              {resting ? (
                <p className="sandbox__resting">The live demo did not answer its last daily check, so it is not loaded here. <a className="link" href={sandbox.url} target="_blank" rel="noreferrer">Try it directly <ArrowUpRight size={13} /></a></p>
              ) : (
                <>
                  <button type="button" className="btn sandbox__play" onClick={start}>
                    <Play size={16} fill="currentColor" />Play {sandbox.name} here
                  </button>
                  <ul className="sandbox__controls" aria-label="Controls">
                    {sandbox.controls.map((control) => <li key={control}>{control}</li>)}
                  </ul>
                  <p className="sandbox__fine">
                    {sandbox.bootSeconds > 5 ? `Takes about ${sandbox.bootSeconds} s to load. ` : "Loads in a moment. "}
                    <a href={sandbox.url} target="_blank" rel="noreferrer">Or open it full size <ArrowUpRight size={12} /></a>
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <iframe
              key={run}
              ref={frame}
              className="sandbox__frame"
              src={sandbox.frameUrl ?? sandbox.url}
              title={title}
              allow="autoplay; fullscreen; gamepad; clipboard-write"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => {
                setLoadedAt(Date.now());
                setPhase("live");
                frame.current?.focus();
              }}
            />
            {warming ? (
              <p className="sandbox__boot" role="status">
                <span className="sandbox__spinner" aria-hidden="true" />
                {loadedAt === null ? `Loading ${sandbox.name}…` : sandbox.bootSeconds > 5 ? `Warming up — about ${Math.max(1, sandbox.bootSeconds - playedFor)} s` : "Ready"}
              </p>
            ) : null}
            {showStory ? (
              <a className="sandbox__story note note--yellow" href={storyHref}>
                <span className="label">Behind this build</span>
                <span className="hand">{sandbox.story!.teaser}</span>
                <ArrowUpRight size={15} />
              </a>
            ) : null}
          </>
        )}
      </div>
      {phase !== "idle" ? (
        <div className="sandbox__bar" role="toolbar" aria-label={`${sandbox.name} controls`}>
          <span className="sandbox__live"><span className="sandbox__dot" aria-hidden="true" />Live · {sandbox.name}</span>
          {showEscape ? <a className="sandbox__hint" href={sandbox.url} target="_blank" rel="noreferrer">Blank? Open it full size</a> : null}
          <span className="sandbox__tools">
            <button type="button" onClick={restart} aria-label="Restart"><RotateCcw size={15} /><span>Restart</span></button>
            <button type="button" onClick={fullscreen} aria-label="Full screen"><Maximize2 size={15} /><span>Full screen</span></button>
            <a href={sandbox.url} target="_blank" rel="noreferrer" aria-label="Open in a new tab"><ExternalLink size={15} /><span>New tab</span></a>
            <button type="button" onClick={stop} aria-label={`Stop ${sandbox.name}`} className="sandbox__stop"><X size={15} /><span>Stop</span></button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
