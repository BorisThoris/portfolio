// Where a project runs right now: its public deployment, or the local server
// the portfolio's launcher started (runtime-project-status.json), or its
// configured local URL.

import React from 'react';
import { Project } from '../projects';

export type RuntimeProjectStatus = {
  slug: string;
  mode: 'live' | 'build' | 'failed';
  effectiveUrl: string;
  origin: string;
  status: number | string;
};

export type RuntimeStatus = {
  generatedAt: string;
  projects: RuntimeProjectStatus[];
};

const LOCAL_URL_PATTERN = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//;

function isLocalUrl(url: string | undefined): boolean {
  return url ? LOCAL_URL_PATTERN.test(url) : false;
}

function isPortfolioRunningLocally(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

export function resolveProjectUrl(project: Pick<Project, 'deploymentUrl' | 'localUrl'>, runtime?: RuntimeProjectStatus) {
  const runtimeUrl = runtime?.effectiveUrl;

  if (project.deploymentUrl) {
    return { mode: 'deployed' as const, url: project.deploymentUrl };
  }

  if (runtimeUrl && !isLocalUrl(runtimeUrl)) {
    return { mode: runtime?.mode ?? 'live', url: runtimeUrl };
  }

  if (isPortfolioRunningLocally()) {
    return { mode: runtime?.mode ?? 'local', url: runtimeUrl || project.localUrl };
  }

  return { mode: 'local' as const, url: project.localUrl };
}

export function useRuntimeStatus(): RuntimeStatus | null {
  const [status, setStatus] = React.useState<RuntimeStatus | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/runtime-project-status.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);

    updateMatches();
    mediaQuery.addEventListener('change', updateMatches);
    return () => mediaQuery.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}

// One breakpoint for "this is a phone": layout and motion both key off it.
export function useIsPhone() {
  return useMediaQuery('(max-width: 700px)');
}
