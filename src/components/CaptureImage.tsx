import { Project } from '../projects';

// A project's card picture: the project's own latest self-portrait, then the
// portfolio's stable capture, then the curated screenshot, then a placeholder.
export function captureSources(project: Pick<Project, 'slug' | 'screenshot'>, preferredState: 'latest' | 'stable') {
  const alternateState = preferredState === 'latest' ? 'stable' : 'latest';
  return [
    ...new Set([
      `/project-shots/${project.slug}/${preferredState}/card.jpg`,
      `/project-shots/${project.slug}/${alternateState}/card.jpg`,
      project.screenshot,
      '/project-shots/portfolio-placeholder.svg'
    ])
  ];
}

export function CaptureImage({
  project,
  state = 'latest',
  priority = false,
  className
}: {
  project: Pick<Project, 'slug' | 'title' | 'screenshot'>;
  state?: 'latest' | 'stable';
  priority?: boolean;
  className?: string;
}) {
  const sources = captureSources(project, state);
  return (
    <img
      className={className}
      src={sources[0]}
      alt={`${project.title} screenshot`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'low'}
      draggable={false}
      data-capture-fallback="1"
      onDragStart={(event) => event.preventDefault()}
      onError={(event) => {
        const nextIndex = Number(event.currentTarget.dataset.captureFallback || '1');
        if (nextIndex >= sources.length) return;
        event.currentTarget.src = sources[nextIndex];
        event.currentTarget.dataset.captureFallback = String(nextIndex + 1);
      }}
    />
  );
}
