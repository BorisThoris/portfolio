import projectData from './project-data.json';
import repoAnalysis from './repo-analysis.json';
import projectDetails from './project-details.json';

// What each repo's project.meta.json says about itself, synced by
// scripts/meta/sync-project-meta.mjs into src/project-details.json.
export type ProjectTrailer = {
  id: string;
  title?: string;
  url: string;
  poster?: string;
  width?: number;
  height?: number;
  duration?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  builtAt?: string;
};

export type ProjectVideo = {
  title?: string;
  url: string;
  kind?: 'youtube' | 'video' | 'link';
  poster?: string;
  description?: string;
};

export type ProjectImage = {
  profile: string;
  path: string;
  width?: number;
  height?: number;
  bytes?: number;
};

export type ProjectDetails = {
  slug: string;
  generatedAt?: string;
  version?: string;
  classification?: string;
  links?: Record<string, string>;
  runtime?: { packageManager?: string; nodeEngine?: string; buildCommand?: string; runCommand?: string };
  stack?: {
    framework?: string;
    language?: string;
    runtimeTargets?: string[];
    libraries?: { name: string; version?: string }[];
    testing?: string[];
    dependencyCount?: number;
    devDependencyCount?: number;
  };
  metrics?: {
    sourceFiles?: number;
    testFiles?: number;
    sourceLines?: number;
    largestDirectories?: { directory: string; files: number }[];
    hasTests?: boolean;
    hasCi?: boolean;
    hasDocs?: boolean;
  };
  git?: {
    branch?: string;
    head?: string;
    lastCommitDate?: string;
    lastCommitSubject?: string;
    commitCount?: number;
    firstCommitDate?: string;
  };
  scores?: Record<string, number>;
  analysisNotes?: string;
  images?: ProjectImage[];
  trailers?: ProjectTrailer[];
  videos?: ProjectVideo[];
  source?: string;
};

const detailsBySlug = projectDetails as Record<string, ProjectDetails>;

export function getProjectDetails(slug: string): ProjectDetails | undefined {
  return detailsBySlug[slug];
}

type ProjectRecord = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  repoPath: string;
  localUrl: string;
  deploymentUrl?: string;
  buildCommand: string;
  buildOutput: string;
  serveBasePath?: string;
  buildCwd?: string;
  fallbackCommand?: string;
  fallbackCwd?: string;
  fallbackEnv?: Record<string, string>;
  runCommand: string;
  screenshot: string;
  tags: string[];
  accent: string;
};

export type RepoAnalysis = {
  slug: string;
  repoName: string;
  showcaseTier: 'showcase' | 'more' | 'excluded';
  showcaseOrder?: number;
  priorityScore: number;
  demoabilityScore: number;
  depthScore: number;
  polishScore: number;
  uniquenessScore: number;
  maintenanceScore: number;
  analysisNotes: string;
  duplicateOf?: string;
  excludedReason?: string;
};

export type Project = ProjectRecord & RepoAnalysis;

const typedRepoAnalysis = repoAnalysis as RepoAnalysis[];
const analysisBySlug = new Map(typedRepoAnalysis.map((entry) => [entry.slug, entry]));
const fallbackAnalysis = {
  showcaseTier: 'more',
  priorityScore: 50,
  demoabilityScore: 50,
  depthScore: 50,
  polishScore: 50,
  uniquenessScore: 50,
  maintenanceScore: 50,
  analysisNotes: 'Project is listed but has not been fully scored yet.'
} satisfies Omit<RepoAnalysis, 'slug' | 'repoName'>;

export const repoAnalyses: RepoAnalysis[] = typedRepoAnalysis;
export const projects: Project[] = (projectData as ProjectRecord[])
  .map((project) => ({
    ...project,
    ...(analysisBySlug.get(project.slug) ?? {
      slug: project.slug,
      repoName: project.repoPath.split('\\').pop() || project.slug,
      ...fallbackAnalysis
    })
  }))
  .sort(byPriority);
export const visibleProjects = projects.filter((project) => project.showcaseTier !== 'excluded');
export const showcaseProjects = visibleProjects.filter((project) => project.showcaseTier === 'showcase');
export const moreProjects = visibleProjects.filter((project) => project.showcaseTier === 'more');

export function getProject(slug: string | undefined): Project {
  return visibleProjects.find((project) => project.slug === slug) ?? visibleProjects[0];
}

function byPriority(left: Project, right: Project) {
  const leftOrder = left.showcaseOrder ?? Number.POSITIVE_INFINITY;
  const rightOrder = right.showcaseOrder ?? Number.POSITIVE_INFINITY;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return right.priorityScore - left.priorityScore || left.title.localeCompare(right.title);
}
