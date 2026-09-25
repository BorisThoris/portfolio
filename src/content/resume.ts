// Detailed résumé content. Loaded with the résumé route, not the homepage.
export const cvHighlights = [
  '7+ years full-stack engineering',
  '18+ active production repositories',
  '1,350+ attributed recent commits',
  'React, TypeScript, Python, C#',
  'AI-assisted risk and reporting workflows',
  'Games, audio tools, 3D editors'
];

export const cvExperience = [
  {
    company: 'Man Group',
    role: 'Project Owner / Full-stack Risk Software Engineer',
    tenure: 'Feb 2024 - Present',
    accent: '#8bd3ff',
    summary:
      'Own delivery of enterprise risk analytics platforms used by analysts, portfolio-management teams, and senior stakeholders across frontend, backend, data, reporting, testing, and deployment concerns.',
    bullets: [
      'Worked across 18+ active repositories and 1,350+ attributed recent commits spanning React/TypeScript apps, Python dashboards, C# services, APIs, data workflows, and deployment configuration.',
      'Led multi-codebase modernization including React 17/18/19 upgrades, AG Grid upgrades, TanStack Query and Zustand migrations, design-system adoption, dependency cleanup, Node/tooling upgrades, performance fixes, and CI/build stabilization.',
      'Integrated AI-assisted workflows into risk tooling, including chart-level commentary, dashboard error summaries, anomaly commentary, report comparison tooling, streaming support dashboards, and structured/auditable model context.',
      'Delivered data visualization and monitoring for market/liquidity risk workflows with interactive surface views, historical comparisons, configurable drilldown tables, charting workflows, and resilient partial-failure behavior.',
      'Expanded Playwright, Vitest, pytest, type checks, linting, mocked smoke tests, release checks, and large-scale Python unit-test coverage across frontend and backend systems.',
      'Led a market-data integration migration from a legacy feed to a compliant real-time subscription feed, validating results across broad UAT coverage and documenting architecture and rollout paths.'
    ],
    details: [
      'Frontend scope: production React applications, risk report drilldowns, custom table formatting, column visibility behavior, chart panels, state migration, accessibility checks, and resilient loading/error states.',
      'Backend/data scope: Python dashboard services, Flask/FastAPI APIs, asynchronous validation, SQL-heavy workflows, ClickHouse analytics, S3/parquet-style storage, document-store report output, and cached data loaders.',
      'Infrastructure scope: Dockerized dashboards, Kubernetes/Kustomize-style manifests, continuous deployment workflows, reverse-proxy routing, role-based access integration, secrets-management patterns, and release-readiness checks.',
      'AI scope: structured chart context, report comparison, anomaly summaries, system-check synthesis, streaming status updates, Slack-style briefing output, browser-assisted inspection, and reviewable fallback behavior.'
    ],
    stack: ['React', 'TypeScript', 'Python', 'FastAPI', 'Flask', 'Streamlit', 'C#', 'ClickHouse', 'S3/parquet', 'Kubernetes', 'Playwright', 'pytest']
  },
  {
    company: 'Expert Allies / Zonal',
    role: 'Senior Software Engineer / Senior React Developer',
    tenure: 'Feb 2023 - Feb 2024',
    accent: '#90f0c0',
    summary: 'Built React and React Native product interfaces for hospitality software used by pubs, hotels, restaurants, and venue operators.',
    bullets: [
      'Delivered operational web and mobile/tablet workflows around venue operations, ordering, and EPoS-adjacent product surfaces.',
      'Focused on maintainable UI architecture, component quality, test coverage, and fast repeated workflow usability.',
      'Worked in a senior delivery role with PM, design, and product stakeholders in a reliability-sensitive operational domain.'
    ],
    stack: ['React', 'React Native', 'TypeScript', 'Redux', 'Styled Components', 'Jest', 'React Testing Library']
  },
  {
    company: 'Quickbase',
    role: 'Software Engineer II',
    tenure: 'Aug 2020 - Jan 2023',
    accent: '#f0d879',
    summary: 'Modernized frontend areas of a low-code/no-code automation product while maintaining legacy surfaces.',
    bullets: [
      'Led complex visual-programming features including loops, conditionals, nesting, and rich component rendering behavior.',
      'Expanded unit, end-to-end, functional, and user-flow test coverage in a team without dedicated QA.',
      'Owned library upgrade research, reusable components, bug escalations, deployment monitoring, and delivery across multiple epics.',
      'Mentored junior colleagues and received company recognition for delivery impact.'
    ],
    stack: ['React', 'Backbone', 'jQuery', 'Python', 'C#', 'Storybook', 'Jest', 'Webpack']
  },
  {
    company: 'Hakomo',
    role: 'Software Engineer',
    tenure: 'Jan 2020 - Jun 2020',
    accent: '#ff9f73',
    summary: 'Built React Native mobile applications and design-heavy React web interfaces for product stakeholders.',
    bullets: [
      'Developed React Native mobile apps including social networking and education product experiences.',
      'Built a responsive React website for a real-estate appraisal business with strong visual requirements.',
      'Worked closely with product and design stakeholders on practical UI implementation and delivery.'
    ],
    stack: ['React Native', 'React', 'JavaScript', 'CSS', 'HTML', 'C#']
  },
  {
    company: 'A1 Bulgaria',
    role: 'Junior Software Engineer',
    tenure: 'Mar 2019 - Nov 2019',
    accent: '#a7d7ff',
    summary: 'Built React, React Native, and C# applications across public-facing and internal engineering tools.',
    bullets: [
      'Led TV-box and internal engineering-support application work with responsive UI and remote-control interaction flows.',
      'Contributed to SQL-backed operational support tooling and public-facing telecom website work.',
      'Coordinated with PMs, designers, and engineering/support stakeholders around practical user workflows.'
    ],
    stack: ['React', 'React Native', 'C#', 'SQL', 'JavaScript', 'Responsive UI']
  }
];

export const cvProjects = [
  {
    title: 'BBeats',
    label: 'Browser DAW & beat-making editor',
    image: '/project-shots/bbeats/latest/card.jpg',
    accent: '#ff8fd2',
    text: 'Large DAW-style editor with timeline, piano roll, step sequencer, mixer panels, command palette, automation, sample drag/drop, clip editing, bounce/render workflows, arrangement regions, Web Audio, plugin workflows, Electron support, and critical-flow testing.',
    tags: ['React', 'TypeScript', 'Web Audio', 'Tone.js', 'PixiJS', 'Electron']
  },
  {
    title: 'Memory Dungeon',
    label: 'Windows / Steam-targeted desktop game',
    image: '/project-shots/memory-dungeon/latest/card.jpg',
    accent: '#8bd3ff',
    text: 'Electron/React arcade game with local saves, achievements, packaged Windows builds, multiple run modes, relics, mutators, puzzle packs, profile progression, gameplay simulation scripts, Playwright visual/E2E suites, accessibility checks, and release gates.',
    tags: ['Electron', 'React 19', 'TypeScript', 'Three.js', 'PixiJS', 'steamworks.js']
  },
  {
    title: 'VYB Chess',
    label: 'Experimental interactive chess book / Early Access',
    image: '/project-shots/vyb-chess/latest/card.jpg',
    accent: '#f6d68f',
    text: 'Premium web-first Bulgarian interactive book preserving a complete seven-part manuscript across 35 reading units, with low-friction decision laboratories, exact return and resume, canonical content validation, accessible input paths, PWA support, Electron packaging, and Steam-oriented release tooling.',
    tags: ['React 19', 'TypeScript', 'Electron', 'Playwright', 'Vitest', 'Chess.js']
  },
  {
    title: 'ThreeJS Gem Dungeon Editor',
    label: '3D dungeon/editor prototype',
    image: '/project-shots/threejs-gem-dungeon-editor/latest/card.jpg',
    accent: '#90f0c0',
    text: '3D dungeon exploration prototype with room navigation, biome concepts, safe spawn handling, particles, minimap improvements, memory-game elements, embedded scene editor, texture painter, asset viewer, generated textures, and desktop packaging.',
    tags: ['React 19', 'Three.js', 'React Three Fiber', 'Vite', 'Zustand']
  },
  {
    title: 'Cross Repo Libs',
    label: 'Reusable npm workspace monorepo',
    image: '/project-shots/cross-repo-libs/latest/card.jpg',
    accent: '#f0d879',
    text: 'Reusable UI/runtime package workspace with accessible toast/confirm notification stack, store, imperative bridge, CSS-variable theming, package exports, example app, focused tests, and cross-project extraction patterns.',
    tags: ['npm workspaces', 'React', 'TypeScript', 'Zustand', 'Vite', 'Vitest']
  }
];

export const cvAdditionalProjects = [
  {
    title: 'SAAD Print-on-Demand',
    text: 'Live storefront/product loop with catalog upkeep, storefront presentation, positioning, and real customer-facing commercial proof.',
    tags: ['E-commerce', 'Storefront', 'Product Ops']
  },
  {
    title: 'Runner Score Arcade',
    text: 'Playable runner/score arcade demo replacing older portfolio work, wired into the project showcase and deployed links.',
    tags: ['Game UI', 'Arcade', 'React']
  },
  {
    title: 'Cat World',
    text: 'Early hardcoded-information project kept as historical evidence of the public project lineage from 2018.',
    tags: ['Early project', 'Angular/React lineage']
  },
  {
    title: 'Gorilla Gainz',
    text: 'Early hardcoded-information fitness/project demo kept as historical context for the long-running product-building timeline.',
    tags: ['Early project', 'Portfolio history']
  },
  {
    title: 'Soap Factory',
    text: 'Family business support across WordPress storefront upkeep, catalog/content updates, packing, deliveries, event sales, and operational help.',
    tags: ['WordPress', 'E-commerce', 'Operations']
  },
  {
    title: 'Bean Tapper',
    text: 'C#/.NET arcade game experiment referenced in the broader LinkedIn/project narrative.',
    tags: ['C#', '.NET', 's&box', 'Game systems']
  }
];

export const cvEducation = [
  'SoftUni - Software Engineering, Sep 2017 - May 2019. C#, JavaScript, React/Angular, databases, advanced programming, and practical team projects.',
  '127 Ivan N. Denkoglu High School - Higher mathematics, English, IT / introductory C++.',
  'React Native seminar - practical beginner session on building interactive mobile/game-style experiences with React Native.'
];
