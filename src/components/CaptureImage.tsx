import { Project } from "../projects";

// A project's card picture: the project's own latest self-portrait, then the
// portfolio's stable capture, then the curated screenshot, then a placeholder.
export function captureSources(
  project: Pick<Project, "slug" | "screenshot">,
  preferredState: "latest" | "stable",
) {
  const alternateState = preferredState === "latest" ? "stable" : "latest";
  return [
    ...new Set([
      `/project-shots/${project.slug}/${preferredState}/card.jpg`,
      `/project-shots/${project.slug}/${alternateState}/card.jpg`,
      ...(project.screenshot ? [project.screenshot] : []),
      "/project-shots/portfolio-placeholder.svg",
    ]),
  ];
}

export function CaptureImage({
  project,
  state = "latest",
  priority = false,
  className,
  sizes = "(max-width: 480px) 100vw, (max-width: 760px) 70vw, 50vw",
}: {
  project: Pick<Project, "slug" | "title" | "screenshot">;
  state?: "latest" | "stable";
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const sources = captureSources(project, state);
  return (
    <img
      className={className}
      src={sources[0]}
      srcSet={
        state === "latest"
          ? `/project-previews/${project.slug}-480.webp 480w, /project-previews/${project.slug}-960.webp 960w, /project-previews/${project.slug}-1600.webp 1600w`
          : undefined
      }
      sizes={sizes}
      alt={`${project.title} screenshot`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      width={1600}
      height={900}
      fetchPriority={priority ? "high" : "low"}
      draggable={false}
      data-capture-fallback="1"
      onDragStart={(event) => event.preventDefault()}
      onError={(event) => {
        if (event.currentTarget.srcset) {
          event.currentTarget.removeAttribute("srcset");
          event.currentTarget.src = sources[0];
          return;
        }
        const nextIndex = Number(
          event.currentTarget.dataset.captureFallback || "1",
        );
        if (nextIndex >= sources.length) return;
        event.currentTarget.src = sources[nextIndex];
        event.currentTarget.dataset.captureFallback = String(nextIndex + 1);
      }}
    />
  );
}
