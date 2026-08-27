import projectData from './project-data.json';
import repoAnalysis from './repo-analysis.json';

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
  return right.priorityScore - left.priorityScore || left.title.localeCompare(right.title);
}
