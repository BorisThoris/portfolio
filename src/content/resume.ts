// Detailed résumé content. Loaded with the résumé route, not the homepage.
export const cvExperience = [
  {
    company: 'Man Group',
    role: 'Project Owner / Full-stack Risk Software Engineer',
    tenure: 'Feb 2024 - Present',
    accent: '#8bd3ff',
    summary:
      'Lead delivery of internal risk and reporting software used by analysts, portfolio managers, and senior stakeholders.',
    bullets: [
      'Work across React and TypeScript applications, Python dashboards, C# services, APIs, data pipelines, and deployment configuration.',
      'Modernize older applications through framework upgrades, state-management changes, design-system work, dependency cleanup, and build fixes.',
      'Add AI-assisted report comparison, chart commentary, anomaly summaries, and support tools with reviewable source data and output.',
      'Build market and liquidity risk views with historical comparisons, configurable tables, charts, and clear handling when part of a request fails.',
      'Maintain Playwright, Vitest, pytest, type checks, smoke tests, and release checks across frontend and backend systems.',
      'Led the move from a legacy market-data feed to a compliant real-time subscription feed, including validation, documentation, and rollout.'
    ],
    details: [
      'Frontend: React applications, report drilldowns, tables, charts, state migrations, accessibility, loading states, and error handling.',
      'Backend and data: Python dashboard services, Flask and FastAPI, asynchronous validation, SQL, ClickHouse, S3, and cached data loaders.',
      'Infrastructure: Docker, Kubernetes, deployment workflows, reverse proxies, role-based access, secrets, and release checks.',
      'AI work: report comparison, chart context, anomaly summaries, system checks, streamed status updates, and reviewable fallbacks.'
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
      'Built web, mobile, and tablet interfaces for venue operations, ordering, and EPoS products.',
      'Improved component structure, tests, and the repeated tasks staff perform throughout a shift.',
      'Worked with product managers and designers on software that needs to stay quick and reliable during service.'
    ],
    stack: ['React', 'React Native', 'TypeScript', 'Redux', 'Styled Components', 'Jest', 'React Testing Library']
  },
  {
    company: 'Quickbase',
    role: 'Software Engineer II',
    tenure: 'Aug 2020 - Jan 2023',
    accent: '#f0d879',
    summary: 'Built new parts of Quickbase’s low-code automation product while gradually replacing older frontend code.',
    bullets: [
      'Led visual-programming features for loops, conditions, nested steps, and complex component states.',
      'Expanded unit, end-to-end, functional, and user-flow test coverage in a team without dedicated QA.',
      'Owned library upgrades, reusable components, escalated bugs, deployment monitoring, and several product epics.',
      'Mentored junior colleagues and received a company award for my work.'
    ],
    stack: ['React', 'Backbone', 'jQuery', 'Python', 'C#', 'Storybook', 'Jest', 'Webpack']
  },
  {
    company: 'Hakomo',
    role: 'Software Engineer',
    tenure: 'Jan 2020 - Jun 2020',
    accent: '#ff9f73',
    summary: 'Built React Native apps and React websites, working closely with product managers and designers.',
    bullets: [
      'Developed React Native apps for social networking and education.',
      'Built a responsive React website for a real-estate appraisal business.',
      'Worked with product managers and designers from mock-up through delivery.'
    ],
    stack: ['React Native', 'React', 'JavaScript', 'CSS', 'HTML', 'C#']
  },
  {
    company: 'A1 Bulgaria',
    role: 'Junior Software Engineer',
    tenure: 'Mar 2019 - Nov 2019',
    accent: '#a7d7ff',
    summary: 'Built React, React Native, and C# software for customer-facing products and internal support teams.',
    bullets: [
      'Worked on TV-box software and internal support tools, including interfaces designed for a remote control.',
      'Built SQL-backed features and contributed to A1 Bulgaria’s public website.',
      'Worked with product managers, designers, engineers, and support staff.'
    ],
    stack: ['React', 'React Native', 'C#', 'SQL', 'JavaScript', 'Responsive UI']
  }
];

export const cvEducation = [
  'SoftUni - Software Engineering, Sep 2017 - May 2019. C#, JavaScript, React/Angular, databases, advanced programming, and practical team projects.',
  '127 Ivan N. Denkoglu High School - Higher mathematics, English, IT / introductory C++.',
  'React Native seminar - practical beginner session on building interactive mobile/game-style experiences with React Native.'
];
