export const captureProfiles = {
  card: {
    label: 'Portfolio card',
    width: 1600,
    height: 900,
    fullPage: false,
    quality: 90
  },
  desktop: {
    label: 'Desktop viewport',
    width: 1440,
    height: 900,
    fullPage: false,
    quality: 90
  },
  mobile: {
    label: 'Mobile viewport',
    width: 430,
    height: 932,
    fullPage: false,
    quality: 88,
    isMobile: true,
    hasTouch: true
  },
  full: {
    label: 'Full page',
    width: 1440,
    height: 900,
    fullPage: true,
    quality: 86
  }
};

export const defaultCaptureOptions = {
  readySelector: 'body',
  readyState: 'attached',
  waitAfterReadyMs: 1200,
  navigationTimeoutMs: 30000,
  readyTimeoutMs: 15000,
  colorScheme: 'dark'
};

// Every portfolio project must have one explicit capture target. Routes are
// resolved against that project's stable deployment or isolated latest build.
// stableRoute/latestRoute can override route when the two versions diverge.
export const projectCaptureTargets = {
  'vyb-chess': {
    route: '/',
    readySelector: '.launch-screen',
    readyState: 'visible',
    waitAfterReadyMs: 1800
  },
  bbeats: {
    route: '/',
    waitAfterReadyMs: 2400
  },
  'memory-dungeon': {
    route: '/',
    waitAfterReadyMs: 2200
  },
  'gem-dungeon': {
    route: '/',
    waitAfterReadyMs: 2800
  },
  skyfall: {
    route: '/',
    waitAfterReadyMs: 2200
  },
  'saad-print-on-demand': {
    route: '/'
  },
  'cross-repo-libs': {
    route: '/'
  },
  'roam-rental-dashboard': {
    route: '/dashboard'
  },
  'runner-score-arcade': {
    route: '/'
  },
  'cat-world': {
    route: '/'
  },
  'user-hub-admin': {
    route: '/'
  },
  'pedal-rush': {
    route: '/'
  },
  'flowforge-configurator': {
    route: '/'
  },
  'gorilla-gainz': {
    route: '/'
  },
  'memory-card-quest': {
    route: '/'
  },
  'org-atlas-directory': {
    route: '/'
  },
  'threejs-gem-dungeon-editor': {
    route: '/',
    waitAfterReadyMs: 2800
  }
};

export function captureOptionsFor(project, state) {
  const target = projectCaptureTargets[project.slug];
  if (!target) throw new Error(`No capture target configured for ${project.slug}`);
  const { route, stableRoute, latestRoute, ...overrides } = target;
  return {
    ...defaultCaptureOptions,
    ...overrides,
    route: state === 'stable' ? (stableRoute || route) : (latestRoute || route)
  };
}

export function validateCaptureTargets(projects) {
  const projectSlugs = new Set(projects.map((project) => project.slug));
  const missing = projects
    .filter((project) => !projectCaptureTargets[project.slug])
    .map((project) => project.slug);
  const stale = Object.keys(projectCaptureTargets).filter((slug) => !projectSlugs.has(slug));
  const invalidRoutes = Object.entries(projectCaptureTargets).flatMap(([slug, target]) =>
    ['route', 'stableRoute', 'latestRoute']
      .filter((key) => target[key] !== undefined && !isRoute(target[key]))
      .map((key) => `${slug}.${key}`)
  );

  const failures = [];
  if (missing.length > 0) failures.push(`missing targets: ${missing.join(', ')}`);
  if (stale.length > 0) failures.push(`unknown target slugs: ${stale.join(', ')}`);
  if (invalidRoutes.length > 0) failures.push(`routes must start with /: ${invalidRoutes.join(', ')}`);
  if (failures.length > 0) throw new Error(`Invalid project capture configuration (${failures.join('; ')})`);
}

function isRoute(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}
