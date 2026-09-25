import { getProjectDetails } from "../projectDetails";

export type ProjectClip = {
  url: string;
  title: string;
  kind: "video" | "youtube" | "link";
  poster?: string;
  duration?: number;
  orientation?: "landscape" | "portrait" | "square";
};

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
  return clips.find((clip) => clip.kind === "video" && clip.orientation !== "portrait")
    ?? clips.find((clip) => clip.kind === "video")
    ?? clips[0];
}
