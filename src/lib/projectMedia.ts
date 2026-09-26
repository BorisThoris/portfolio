import { getProjectDetails } from "../projectDetails";

export type ProjectClip = {
  url: string;
  title: string;
  kind: "video" | "youtube" | "link";
  poster?: string;
  duration?: number;
  width?: number;
  height?: number;
  orientation?: "landscape" | "portrait" | "square";
};

export function mediaRatio(media?: Pick<ProjectClip, "width" | "height" | "orientation">) {
  if (media?.width && media.height && Number.isFinite(media.width) && Number.isFinite(media.height)
    && media.width > 0 && media.height > 0) return media.width / media.height;
  return media?.orientation === "portrait" ? 9 / 16 : media?.orientation === "square" ? 1 : 16 / 9;
}

export function projectClips(slug: string): ProjectClip[] {
  const details = getProjectDetails(slug);
  const clips: ProjectClip[] = [
    ...(details?.trailers ?? []).map((trailer) => ({
      ...trailer,
      title: trailer.title ?? "Trailer",
      kind: "video" as const,
    })),
    ...(details?.videos ?? []).map((video) => ({
      ...video,
      title: video.title ?? "Walkthrough",
      kind: video.kind ?? "link",
    })),
  ];
  return clips.filter((clip, index) => clips.findIndex((item) => item.url === clip.url) === index);
}

export function previewClip(clips: ProjectClip[]) {
  return clips.find((clip) => clip.kind === "video" && mediaRatio(clip) >= 1)
    ?? clips.find((clip) => clip.kind === "video")
    ?? clips[0];
}
