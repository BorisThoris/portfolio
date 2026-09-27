import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowUpRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import type { Project } from "../projects";
import { useMediaQuery } from "../lib/runtime";
import { useMotionEnabled } from "../lib/motion";
import { formatDuration, youtubeEmbedUrl } from "../lib/format";
import { mediaRatio, previewClip, projectClips, type ProjectClip } from "../lib/projectMedia";
import { getProjectAccess } from "../projectAccess";
import { CaptureImage } from "./CaptureImage";
import "../project-media.css";

const watchEvent = "portfolio:watch";

// Retry short-lived delivery failures, then offer an explicit recovery action.
// Changing projects or clips starts a fresh recovery cycle.
function useMediaRecovery(url?: string) {
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const attempts = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    setFailed(false); setVersion(0); attempts.current = 0;
    return () => { if (timer.current) clearTimeout(timer.current); timer.current = undefined; };
  }, [url]);
  const retry = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined; attempts.current = 0;
    setFailed(false); setVersion(value => value + 1);
  };
  const onError = () => {
    if (timer.current) return;
    if (attempts.current >= 2) { setFailed(true); return; }
    attempts.current += 1;
    timer.current = setTimeout(() => {
      timer.current = undefined;
      setVersion(value => value + 1);
    }, attempts.current * 750);
  };
  const src = !url || version === 0 ? url : `${url}${url.includes('?') ? '&' : '?'}media_retry=${version}`;
  return { failed, src, onError, retry };
}

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
  const motionEnabled = useMotionEnabled();
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [watching, setWatching] = useState(false);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const recovery = useMediaRecovery(clip?.url);
  const failed = recovery.failed;
  const [posterFailed, setPosterFailed] = useState(false);
  const [decodedRatios, setDecodedRatios] = useState<Record<string, number>>({});
  const access = getProjectAccess(project.slug);
  const nativeImage = access?.kind === "native" ? access.images[0] : undefined;
  const ratio = (clip && decodedRatios[clip.url]) || mediaRatio(clip ?? nativeImage);
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const canPreview = clip?.kind === "video" && !failed && !reducedMotion && !connection?.saveData;
  const shouldLoad = canPreview && motionEnabled && active && visible && pageVisible && !watching;
  const shouldPlay = shouldLoad && !paused;

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
    if (shouldLoad) setLoaded(true);
    const element = video.current;
    if (!element) return;
    if (!shouldLoad) {
      element.pause();
      element.removeAttribute("src");
      element.load(); // Cancels the request and releases its decoder, not just its clock.
      setPlaying(false);
    } else if (shouldPlay) void element.play().catch(() => setPlaying(false));
    else element.pause();
  }, [shouldLoad, shouldPlay, loaded, recovery.src]);

  useEffect(() => {
    const element = video.current;
    return () => {
      if (element) { element.pause(); element.removeAttribute("src"); element.load(); }
    };
  }, [loaded]);

  const picture = clip?.poster && !posterFailed ? (
    <img className="project-media__poster" src={clip.poster} alt={`${project.title} video preview`}
      loading={mode === "cover" ? "eager" : "lazy"} onError={() => setPosterFailed(true)} />
  ) : <CaptureImage project={project} priority={mode === "cover"} />;

  return (
    <div ref={container}
      className={`project-media project-media--${mode}${clip ? " project-media--video" : ""}${ratio < 1 ? " project-media--portrait" : ""}`}
      style={{ "--media-ratio": ratio } as CSSProperties}
    >
      <div className="project-media__stage">
      <div className="project-media__frame">
      {clip ? picture : (
        <Link className="project-media__still" to={`/projects/${project.slug}`} aria-label={`Explore ${project.title}`}>
          {picture}
          {mode !== "cover" ? <span className="project-media__explore"><ArrowUpRight size={20} /></span> : null}
        </Link>
      )}
      {loaded && canPreview && clip ? (
        <video ref={video} className="project-media__preview" src={shouldLoad ? recovery.src : undefined} muted={muted} loop playsInline
          preload="none" aria-hidden="true" tabIndex={-1}
          onLoadedMetadata={(event) => {
            const { videoWidth, videoHeight } = event.currentTarget;
            if (videoWidth && videoHeight) setDecodedRatios((previous) => ({ ...previous, [clip.url]: videoWidth / videoHeight }));
          }}
          onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={(event) => { if (event.currentTarget.getAttribute("src")) recovery.onError(); }} />
      ) : null}
      </div>
      </div>
      {clip ? (
        <div className="project-media__bar">
          <button className="project-media__watch" type="button" onClick={() => setOpen(true)}>
            <Play size={16} fill="currentColor" />
            <span>Watch video<span className="visually-hidden">: {project.title}</span></span>
            <span className="project-media__duration">{clips.length > 1 ? `${clips.length} clips` : formatDuration(clip.duration)}</span>
          </button>
          {failed ? <button type="button" className="project-media__retry" onClick={recovery.retry}>Retry preview</button> : null}
          {canPreview && motionEnabled && mode !== "card" ? (
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
  const playback = useRef<HTMLVideoElement | null>(null);
  const attachPlayback = useCallback((node: HTMLVideoElement | null) => {
    const previous = playback.current;
    if (previous && previous !== node) {
      previous.pause(); previous.removeAttribute("src"); previous.load();
    }
    playback.current = node;
  }, []);
  const titleId = useId();
  const [selected, setSelected] = useState(initial);
  const [decodedRatios, setDecodedRatios] = useState<Record<string, number>>({});
  const clip = clips[selected];
  const recovery = useMediaRecovery(clip.url);
  const failed = recovery.failed;
  const ratio = decodedRatios[clip.url] || mediaRatio(clip);

  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.dispatchEvent(new CustomEvent(watchEvent, { detail: true }));
    const currentVideo = element.querySelector("video");
    if (currentVideo && !currentVideo.getAttribute("src")) currentVideo.src = clip.url;
    element.showModal();
    return () => {
      element.querySelectorAll("video").forEach((video) => { video.pause(); video.removeAttribute("src"); video.load(); });
      element.close();
      document.body.style.overflow = overflow;
      document.dispatchEvent(new CustomEvent(watchEvent, { detail: false }));
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog ref={dialog} className={`video-dialog${ratio < 1 ? " video-dialog--portrait" : ""}`} aria-labelledby={titleId} onCancel={onClose} onClose={onClose}
      style={{ "--media-ratio": ratio } as CSSProperties}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="video-dialog__content">
        <header className="video-dialog__header">
          <div><p className="eyebrow">{project.title}</p><h2 id={titleId}>{clip.title}</h2></div>
          <button type="button" className="icon-button" aria-label="Close video" onClick={onClose} autoFocus><X size={22} /></button>
        </header>
        <div className="video-dialog__screen" key={clip.url}>
          <div className="video-dialog__frame">
          {failed ? (
            <div className="video-dialog__fallback" role="status">
              <p>This video couldn’t load.</p>
              <button type="button" onClick={recovery.retry}>Retry video</button>
              <a href={clip.url} target="_blank" rel="noreferrer">Open video directly <ArrowUpRight size={16} /></a>
            </div>
          ) : clip.kind === "video" ? (
            <video ref={attachPlayback} src={recovery.src} poster={clip.poster} controls autoPlay playsInline preload="metadata"
              onLoadedMetadata={(event) => {
                const { videoWidth, videoHeight } = event.currentTarget;
                if (videoWidth && videoHeight) setDecodedRatios((previous) => ({ ...previous, [clip.url]: videoWidth / videoHeight }));
              }}
              aria-label={`${project.title}: ${clip.title}`} onError={recovery.onError} />
          ) : clip.kind === "youtube" ? (
            <iframe src={youtubeEmbedUrl(clip.url)} title={clip.title} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
          ) : (
            <a className="video-dialog__fallback" href={clip.url} target="_blank" rel="noreferrer">Open video <ArrowUpRight /></a>
          )}
          </div>
        </div>
        {clips.length > 1 ? (
          <div className="video-dialog__clips" role="group" aria-label="Choose video">
            {clips.map((item, index) => (
              <button type="button" key={item.url} aria-pressed={selected === index}
                onClick={() => { setSelected(index); }}>
                <Play size={14} /><span>{item.title}</span><span>{formatDuration(item.duration)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </dialog>, document.body,
  );
}
