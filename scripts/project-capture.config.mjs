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
  colorScheme: 'dark',
  browserIsolation: 'shared'
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
    route: '/#/editor',
    actions: [
      {
        type: 'click',
        target: { role: 'button', name: 'Create starter pattern' },
        label: 'create the starter editor pattern'
      },
      {
        type: 'waitFor',
        target: { role: 'heading', name: 'Channel rack' },
        state: 'visible',
        label: 'wait for the channel rack editor'
      }
    ],
    hideSelectors: ['[role="region"][aria-label="Notifications"]'],
    waitAfterReadyMs: 1600
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
    route: '/?editor=true&category=rooms&subcategory=all&componentType=all-breakable&componentProps=%7B%22size%22%3A10%7D',
    actions: [
      {
        type: 'uncheck',
        target: { role: 'checkbox', name: 'Show Player State' },
        label: 'hide the player-state overlay'
      },
      {
        type: 'waitFor',
        target: { css: 'canvas' },
        state: 'visible',
        label: 'wait for the loaded 3D scene'
      }
    ],
    browserIsolation: 'profile',
    waitAfterReadyMs: 2500
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
  const invalidActions = Object.entries(projectCaptureTargets).flatMap(([slug, target]) =>
    (target.actions || []).flatMap((action, index) =>
      isCaptureAction(action) ? [] : [`${slug}.actions[${index}]`]
    )
  );
  const invalidIsolation = Object.entries(projectCaptureTargets)
    .filter(([, target]) => target.browserIsolation && !['shared', 'profile'].includes(target.browserIsolation))
    .map(([slug]) => slug);

  const failures = [];
  if (missing.length > 0) failures.push(`missing targets: ${missing.join(', ')}`);
  if (stale.length > 0) failures.push(`unknown target slugs: ${stale.join(', ')}`);
  if (invalidRoutes.length > 0) failures.push(`routes must start with /: ${invalidRoutes.join(', ')}`);
  if (invalidActions.length > 0) failures.push(`invalid actions: ${invalidActions.join(', ')}`);
  if (invalidIsolation.length > 0) failures.push(`invalid browser isolation: ${invalidIsolation.join(', ')}`);
  if (failures.length > 0) throw new Error(`Invalid project capture configuration (${failures.join('; ')})`);
}

function isRoute(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

function isCaptureAction(action) {
  if (!action || typeof action !== 'object') return false;
  if (action.type === 'wait') return Number.isFinite(action.durationMs) && action.durationMs >= 0;
  const supported = new Set(['click', 'dblclick', 'check', 'uncheck', 'fill', 'press', 'hover', 'waitFor']);
  if (!supported.has(action.type) || !isLocatorTarget(action.target)) return false;
  if (action.type === 'fill' && typeof action.value !== 'string') return false;
  if (action.type === 'press' && typeof action.key !== 'string') return false;
  return true;
}

function isLocatorTarget(target) {
  if (!target || typeof target !== 'object') return false;
  const methods = ['css', 'role', 'text', 'label', 'placeholder', 'testId'];
  return methods.filter((method) => typeof target[method] === 'string' && target[method]).length === 1;
}
