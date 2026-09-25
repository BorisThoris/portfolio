import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowUpRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import type { Project } from "../projects";
import { useMediaQuery } from "../lib/runtime";
import { formatDuration, youtubeEmbedUrl } from "../lib/format";
import { previewClip, projectClips, type ProjectClip } from "../lib/projectMedia";
import { CaptureImage } from "./CaptureImage";
import "../project-media.css";

const watchEvent = "portfolio:watch";

/** Shared motion cover. Only visible, active previews may play; full playback is explicit. */
export function ProjectMedia({ project, active = true, mode = "feature" }: {
  project: Project;
  active?: boolean;
  mode?: "feature" | "cover" | "card";
}) {
  const clips = projectClips(project.slug);
  const clip = previewClip(clips);
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [watching, setWatching] = useState(false);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const canPreview = clip?.kind === "video" && !failed && !reducedMotion && !connection?.saveData;
  const shouldPlay = canPreview && active && visible && pageVisible && !watching && !paused;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    if (container.current) observer.observe(container.current);
    const visibility = () => setPageVisible(!document.hidden);
    const watch = (event: Event) => setWatching((event as CustomEvent<boolean>).detail);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener(watchEvent, watch);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener(watchEvent, watch);
    };
  }, []);

  useEffect(() => {
    if (shouldPlay) setLoaded(true);
    if (!video.current) return;
    if (shouldPlay) void video.current.play().catch(() => setPlaying(false));
    else video.current.pause();
  }, [shouldPlay, loaded]);

  const picture = clip?.poster && !posterFailed ? (
    <img className="project-media__poster" src={clip.poster} alt={`${project.title} video preview`}
      loading={mode === "cover" ? "eager" : "lazy"} onError={() => setPosterFailed(true)} />
  ) : <CaptureImage project={project} priority={mode === "cover"} />;

  return (
    <div ref={container}
      className={`project-media project-media--${mode}${clip ? " project-media--video" : ""}${clip?.orientation === "portrait" ? " project-media--portrait" : ""}`}
    >
      {clip ? picture : (
        <Link className="project-media__still" to={`/projects/${project.slug}`} aria-label={`Explore ${project.title}`}>
          {picture}
          {mode !== "cover" ? <span className="project-media__explore"><ArrowUpRight size={20} /></span> : null}
        </Link>
      )}
      {loaded && canPreview && clip ? (
        <video ref={video} className="project-media__preview" src={clip.url} muted={muted} loop playsInline
          preload="none" aria-hidden="true" tabIndex={-1}
          onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />
      ) : null}
      {clip ? (
        <div className="project-media__bar">
          <button className="project-media__watch" type="button" onClick={() => setOpen(true)}>
            <Play size={16} fill="currentColor" />
            <span>Watch video<span className="visually-hidden">: {project.title}</span></span>
            <span className="project-media__duration">{clips.length > 1 ? `${clips.length} clips` : formatDuration(clip.duration)}</span>
          </button>
          {canPreview && mode !== "card" ? (
            <div className="project-media__controls">
              <button type="button" aria-label={playing ? "Pause preview" : "Play preview"}
                onClick={() => {
                  setPaused(playing);
                  if (!playing) void video.current?.play().catch(() => setPlaying(false));
                }}><span className="visually-hidden">{playing ? "Pause preview" : "Play preview"}</span>{playing ? <Pause size={17} /> : <Play size={17} />}</button>
              <button type="button" aria-label={muted ? "Unmute preview" : "Mute preview"} onClick={() => setMuted(!muted)}>
                {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      {open ? <VideoDialog project={project} clips={clips} initial={clips.indexOf(clip!)} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function VideoDialog({ project, clips, initial, onClose }: {
  project: Project; clips: ProjectClip[]; initial: number; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [selected, setSelected] = useState(initial);
  const [failed, setFailed] = useState(false);
  const clip = clips[selected];

  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.dispatchEvent(new CustomEvent(watchEvent, { detail: true }));
    element.showModal();
    return () => {
      element.querySelectorAll("video").forEach((video) => video.pause());
      element.close();
      document.body.style.overflow = overflow;
      document.dispatchEvent(new CustomEvent(watchEvent, { detail: false }));
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog ref={dialog} className="video-dialog" aria-labelledby={titleId} onCancel={onClose} onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="video-dialog__content">
        <header className="video-dialog__header">
          <div><p className="eyebrow">{project.title}</p><h2 id={titleId}>{clip.title}</h2></div>
          <button type="button" className="icon-button" aria-label="Close video" onClick={onClose} autoFocus><X size={22} /></button>
        </header>
        <div className="video-dialog__screen" key={clip.url}>
          {failed ? (
            <div className="video-dialog__fallback" role="status">
              <p>This video couldn’t load.</p>
              <a href={clip.url} target="_blank" rel="noreferrer">Open video directly <ArrowUpRight size={16} /></a>
            </div>
          ) : clip.kind === "video" ? (
            <video src={clip.url} poster={clip.poster} controls autoPlay playsInline preload="metadata"
              aria-label={`${project.title}: ${clip.title}`} onError={() => setFailed(true)} />
          ) : clip.kind === "youtube" ? (
            <iframe src={youtubeEmbedUrl(clip.url)} title={clip.title} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
          ) : (
            <a className="video-dialog__fallback" href={clip.url} target="_blank" rel="noreferrer">Open video <ArrowUpRight /></a>
          )}
        </div>
        {clips.length > 1 ? (
          <div className="video-dialog__clips" role="group" aria-label="Choose video">
            {clips.map((item, index) => (
              <button type="button" key={item.url} aria-pressed={selected === index}
                onClick={() => { setSelected(index); setFailed(false); }}>
                <Play size={14} /><span>{item.title}</span><span>{formatDuration(item.duration)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </dialog>, document.body,
  );
}
