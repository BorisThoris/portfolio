// Curated content of the home page and the printable CV: employment history,
// the public product context behind each role, the capability map and the
// contact links. Copy lives here, not in components.

import { FileText, Github, Linkedin, Mail, Phone } from 'lucide-react';
import { Project, showcaseProjects } from '../projects';

export type Experience = {
  company: string;
  role: string;
  tenure: string;
  startYear: string;
  type: string;
  summary: string;
  bullets: string[];
  stack: string[];
  detailTitle?: string;
  detailSections?: Array<{
    title: string;
    items: string[];
  }>;
  logos?: string[];
  initials: string;
  accent: string;
  contextProjects?: ProfessionalContext[];
};

export type ProfessionalContext = {
  title: string;
  productArea: string;
  relationshipText: string;
  summary: string;
  sourceLabel: string;
  sourceUrl?: string;
  image?: string;
  tags: string[];
  confidence: 'LinkedIn/CV-backed' | 'Public context';
};

export type DisplayProfessionalContext = ProfessionalContext & {
  company: string;
  accent: string;
  logo?: string;
  initials: string;
};

export type CapabilityGroup = {
  title: string;
  purpose: string;
  primary: string[];
  skills: string[];
};

export function toPortfolioProjectContext(project: Project): ProfessionalContext {
  if (project.slug === 'saad-print-on-demand') {
    return {
      title: project.title,
      productArea: project.subtitle,
      relationshipText:
        'Owned and managed live print-on-demand storefront with catalog upkeep, storefront presentation, product positioning, and real customer-facing operations.',
      summary:
        'SAD Designs is a streetwear, racing, and graphic apparel storefront running on PrintOnDemand infrastructure. It has produced small real earnings, which makes it useful commercial proof alongside the larger engineering demos.',
      sourceLabel: 'Live storefront',
      sourceUrl: project.deploymentUrl ?? project.localUrl,
      image: project.screenshot,
      tags: project.tags,
      confidence: 'Public context'
    };
  }

  return {
    title: project.title,
    productArea: project.subtitle,
    relationshipText: 'Independent portfolio project built, maintained, demo-hardened, and wired into the local/cloud showcase system.',
    summary: project.description,
    sourceLabel: 'Open project',
    sourceUrl: project.deploymentUrl ?? project.localUrl,
    image: project.screenshot,
    tags: project.tags,
    confidence: 'Public context'
  };
}

export const experiences: Experience[] = [
  {
    company: 'Man Group',
    role: 'Project Owner / Full-stack Risk Software Engineer',
    tenure: 'Feb 2024 - Present',
    startYear: '2024',
    type: 'Full-time - Investment technology',
    summary:
      'Oversee delivery for a global platform supporting Man Group funds, risk workflows, and investment operations across a business reporting $228.7bn AUM as of 31 March 2026, working directly with directors, risk managers, PMs, and senior stakeholders on needs, priorities, and delivery.',
    bullets: [
      'Build React/TypeScript frontends, Streamlit/Python dashboards, C# services, APIs, tests, report tooling, and deployment configuration.',
      'Lead modernization across Python upgrades, React upgrades, state management, grids/tables, design-system adoption, dependency cleanup, performance, and CI/build stability.',
      'Ship data-heavy interfaces and reporting flows with resilient loading, historical comparisons, interactive visualizations, and graceful partial-failure handling.',
      'Support production rotations, AI-assisted financial-report analysis, mass-release testing, and hardened dev-to-test-to-prod deployment paths.'
    ],
    stack: [
      'React',
      'TypeScript',
      'Python',
      'C#',
      'SQL',
      'Kubernetes',
      'ClickHouse',
      'S3',
      'Streamlit',
      'Flask',
      'AG Grid',
      'Zustand',
      'Playwright',
      'pytest'
    ],
    detailSections: [
      {
        title: 'Delivery ownership',
        items: [
          'Oversee delivery for a global platform supporting Man Group funds and connected risk workflows.',
          'Communicate project needs directly with directors, risk managers, PMs, and senior stakeholders, including Chief Risk Officer-level users.',
          'Translate portfolio, risk, and operations requirements into working product behavior and delivery plans.'
        ]
      },
      {
        title: 'Technical scope',
        items: [
          'React/TypeScript web apps integrated with Streamlit/Python dashboards, plus Python and C# service work across APIs and data-heavy product flows.',
          'Upgrade Python versions in systems that generate thousands of important financial PDF reports and support dynamic real-time reporting workflows.',
          'Integrate AI-assisted analysis around financial reporting so users can inspect and reason about report outputs in real time.',
          'Touch the data loading and calculation layers that drive the platform, including SQL-heavy flows, ClickHouse analytics, S3-backed storage patterns, and Kubernetes deployment concerns.',
          'Support rotations, mass-release testing, 100% release-check coverage goals, Playwright/Vitest/pytest reliability, CI/build stability, and hardened dev-to-test-to-prod deployment paths.'
        ]
      }
    ],
    logos: ['/company-logos/man-group.jpg'],
    initials: 'MG',
    accent: '#8bd3ff',
    contextProjects: [
      {
        title: 'Fund platform, risk analytics, and investment technology',
        productArea: 'Internal fund, risk, data, and investment-operations tooling',
        relationshipText:
          'LinkedIn/CV-backed work overseeing delivery for a global platform supporting Man Group funds, risk analytics, and internal investment workflows; public source is used as company technology context, not a screenshot of private tools.',
        summary:
          'Man describes technology and data as central to alpha generation, portfolio management, trade execution, operations, compliance, risk management, accounting, and end-user collaboration tooling. Public Q1 2026 reporting listed $228.7bn AUM, giving public context for the fund side of the platform work.',
        sourceLabel: 'Man Technology',
        sourceUrl: 'https://www.man.com/technology',
        tags: ['Fund platform', 'Risk analytics', 'Streamlit', 'React', 'Python', 'C#', 'Reports'],
        confidence: 'LinkedIn/CV-backed'
      }
    ]
  },
  {
    company: 'Expert Allies / Zonal',
    role: 'Senior Software Engineer / Senior React Developer',
    tenure: 'Feb 2023 - Feb 2024',
    startYear: '2023',
    type: 'Contract/employment engagement - Hospitality software',
    summary: 'Worked as a senior React and React Native engineer on Zonal product interfaces for hospitality operators.',
    bullets: [
      'Built and improved React, React Native, and TypeScript interfaces for software used by pubs, hotels, restaurants, and venues across the UK.',
      'Worked around mobile and tablet hospitality workflows, including handheld ordering surfaces connected to Zonal product ecosystems.',
      'Focused on maintainable UI architecture, component quality, testing, and repeated workflow usability.',
      'Worked closely with PMs, designers, and product stakeholders in a domain where reliability and fast day-to-day operations mattered.'
    ],
    stack: ['React', 'React Native', 'TypeScript', 'Redux', 'Styled Components', 'Figma', 'Jest', 'React Testing Library'],
    logos: ['/company-logos/expert-allies.jpg', '/company-logos/zonal.jpg'],
    initials: 'Z',
    accent: '#90f0c0',
    contextProjects: [
      {
        title: 'Aztec EPoS ecosystem',
        productArea: 'Core hospitality EPoS and venue operations',
        relationshipText:
          "LinkedIn/CV-backed senior React work on Zonal product interfaces; Aztec EPoS is the public product ecosystem those hospitality workflows connect around.",
        summary:
          'Zonal describes its EPoS platform as purpose-built for hospitality, spanning operational control, reporting, stock, integrations, and venue service workflows.',
        sourceLabel: 'Zonal EPoS',
        sourceUrl: 'https://www.zonal.co.uk/products/epos/',
        image: '/company-project-shots/zonal/epos.png',
        tags: ['Aztec', 'EPoS', 'Hospitality SaaS', 'Workflow UI'],
        confidence: 'LinkedIn/CV-backed'
      },
      {
        title: 'iServe / iServe Plus handheld ordering',
        productArea: 'Server tablets, phones, and handheld POS workflows',
        relationshipText:
          "Worked around React Native and mobile/tablet-facing hospitality workflows integrated with Zonal's Aztec EPoS ecosystem; public iServe material shows the staff handheld ordering surface.",
        summary:
          'Zonal positions iServe Plus as an all-in-one handheld order and payment solution for tableside service in hospitality venues.',
        sourceLabel: 'Zonal iServe',
        sourceUrl: 'https://www.zonal.co.uk/products/epos/handheld-ordering/',
        image: '/company-project-shots/zonal/iserve.png',
        tags: ['iServe', 'React Native', 'Handheld ordering', 'Table service', 'Payments'],
        confidence: 'LinkedIn/CV-backed'
      },
      {
        title: 'Order & Pay / iOrder journeys',
        productArea: 'Guest ordering and payment flows',
        relationshipText:
          "Public product context for guest-facing Zonal ordering flows connected to the same EPoS ecosystem; not stated as sole ownership.",
        summary:
          'Zonal describes Order & Pay as a branded app and web platform for guest ordering and payment journeys integrated with EPoS.',
        sourceLabel: 'Zonal Order & Pay',
        sourceUrl: 'https://www.zonal.co.uk/products/online-ordering-systems/order-and-pay/',
        image: '/company-project-shots/zonal/kiosk.png',
        tags: ['Order & Pay', 'iOrder', 'Guest ordering', 'Web app'],
        confidence: 'Public context'
      },
      {
        title: 'Kiosk ordering',
        productArea: 'Self-service ordering devices and kiosk flows',
        relationshipText:
          'Representative public product context for kiosk-facing hospitality ordering scenarios in the Zonal product suite.',
        summary:
          'Zonal presents online ordering systems including kiosks, Order & Pay, click and collect, and digital-first guest ordering experiences.',
        sourceLabel: 'Zonal online ordering',
        sourceUrl: 'https://www.zonal.co.uk/products/online-ordering-systems/',
        image: '/company-project-shots/zonal/kiosk.png',
        tags: ['Kiosks', 'Self-service', 'Ordering', 'Hospitality'],
        confidence: 'Public context'
      }
    ]
  },
  {
    company: 'Quickbase',
    role: 'Software Engineer II',
    tenure: 'Aug 2020 - Jan 2023',
    startYear: '2020',
    type: 'Full-time - Low-code automation',
    summary: 'Modernized frontend areas of a low-code/no-code automation product while maintaining legacy surfaces.',
    bullets: [
      'Led visual-programming features with loops, conditionals, nesting, and rich component rendering behavior.',
      'Expanded unit, end-to-end, functional, and user-flow test coverage in a team without dedicated QA.',
      'Owned library upgrade research, reusable components, escalations, deployment monitoring, and delivery across multiple epics with PM/product alignment.',
      'Mentored junior colleagues and received company recognition for delivery impact.'
    ],
    stack: [
      'React',
      'Backbone',
      'jQuery',
      'C#',
      'Python',
      'Figma',
      'Storybook',
      'Jest',
      'React Testing Library',
      'Webpack'
    ],
    logos: ['/company-logos/quickbase.jpg'],
    initials: 'QB',
    accent: '#f0d879',
    contextProjects: [
      {
        title: 'Quickbase low-code platform',
        productArea: 'Main low-code application platform',
        relationshipText:
          'Software Engineer II in the broader Quickbase low-code platform ecosystem, contributing to modernization while working alongside legacy product surfaces.',
        summary:
          'Quickbase presents its platform as an application platform for dynamic work, bringing data, teams, applications, automation, and reporting into one place.',
        sourceLabel: 'Quickbase product',
        sourceUrl: 'https://www.quickbase.com/product',
        image: '/company-project-shots/quickbase/platform.png',
        tags: ['Low-code platform', 'App builder', 'Dashboards', 'Reporting'],
        confidence: 'LinkedIn/CV-backed'
      },
      {
        title: 'Quickbase Pipelines Designer',
        productArea: 'Low-code workflow automation and visual programming',
        relationshipText:
          'LinkedIn/CV-backed work on visual-programming features including loops, conditionals, nesting, and rich component rendering behavior.',
        summary:
          'Quickbase describes Pipelines Designer as a drag-and-drop visual builder for orchestrating automated workflows across apps and third-party tools.',
        sourceLabel: 'Quickbase Pipelines Designer',
        sourceUrl: 'https://www.quickbase.com/product/pipelines-designer',
        image: '/company-project-shots/quickbase/pipelines-designer.png',
        tags: ['Low-code', 'Pipelines', 'Visual builder', 'Automation'],
        confidence: 'LinkedIn/CV-backed'
      },
      {
        title: 'Legacy platform and API surfaces',
        productArea: 'Mixed legacy and modern engineering environment',
        relationshipText:
          'Local CV history includes C# alongside Backbone, jQuery, Handlebars, React, and Python; public company profiles list ASP.NET/C# among Quickbase engineering technologies.',
        summary:
          'This is framed as product-context around a mixed legacy/modern platform, not as a claim of owning the legacy backend. Quickbase also documents older API surfaces alongside modern REST APIs.',
        sourceLabel: 'Built In / API guide',
        sourceUrl: 'https://builtin.com/company/quickbase',
        image: '/company-project-shots/quickbase/platform.png',
        tags: ['C# context', 'Backbone', 'Legacy APIs', 'Modernization'],
        confidence: 'LinkedIn/CV-backed'
      }
    ]
  },
  {
    company: 'Hakomo',
    role: 'Software Engineer',
    tenure: 'Jan 2020 - Jun 2020',
    startYear: '2020',
    type: 'Full-time - Mobile and web products',
    summary: 'Built React Native mobile applications and design-heavy React web interfaces for product stakeholders.',
    bullets: [
      'Developed React Native mobile apps including social networking and education product experiences.',
      'Built a React website for a real-estate appraisal business with strong visual and responsive requirements.',
      'Worked closely with PM, product, and design stakeholders on practical UI implementation and delivery.'
    ],
    stack: ['React Native', 'React', 'JavaScript', 'CSS', 'HTML', 'C#'],
    logos: ['/company-logos/hakomo.jpg'],
    initials: 'H',
    accent: '#ff9f73',
    contextProjects: [
      {
        title: 'Asko',
        productArea: 'React Native social Q&A app',
        relationshipText:
          'Local CV sources name Asko as a React Native social networking app worked on at Hakomo; public Hakomo portfolio pages describe the product concept.',
        summary:
          'Hakomo describes Asko as a product taken from idea through sketches, design, and development of a complete app experience.',
        sourceLabel: 'Hakomo Asko',
        sourceUrl: 'https://www.hakomo.com/portfolio/asko/',
        tags: ['React Native', 'Social app', 'Mobile UX', 'Hakomo'],
        confidence: 'LinkedIn/CV-backed'
      },
      {
        title: 'Amrita Appraisal System',
        productArea: 'React web appraisal-management product',
        relationshipText:
          'Local CV sources name Amrita Appraisal System as a design-heavy React website for a real estate appraisal business.',
        summary:
          'Hakomo describes Amrita as an internal appraisal system that combined documents and Excel calculations into one appraisal-management workflow.',
        sourceLabel: 'Hakomo Amrita',
        sourceUrl: 'https://www.hakomo.com/portfolio/amrita-appraisal-system/',
        tags: ['React', 'Real estate', 'Dashboard UI', 'Workflow'],
        confidence: 'LinkedIn/CV-backed'
      },
      {
        title: 'Educational mobile platform',
        productArea: 'Undisclosed React Native education app',
        relationshipText:
          'Local CV/profile sources mention an educational mobile platform, but the public product name is undisclosed.',
        summary:
          'Kept intentionally conservative: this item records the product category and mobile delivery work without inventing a public product name or screenshot.',
        sourceLabel: 'Local CV-backed',
        tags: ['React Native', 'Education', 'Mobile learning', 'Private'],
        confidence: 'LinkedIn/CV-backed'
      }
    ]
  },
  {
    company: 'A1 Bulgaria',
    role: 'Junior Software Engineer',
    tenure: 'Mar 2019 - Nov 2019',
    startYear: '2019',
    type: 'Full-time - Telecom software',
    summary: 'Built React, React Native, and C# applications across public-facing and internal engineering tools.',
    bullets: [
      'Worked on TV-box and internal engineering-support software with responsive and remote-control interaction flows.',
      'Built SQL-backed functionality and coordinated with stakeholders around operational support needs.',
      'Contributed to public-facing A1 Bulgaria web work and internal tools while coordinating with PMs and engineering/support stakeholders.'
    ],
    stack: ['React', 'React Native', 'C#', 'SQL', 'JavaScript', 'Responsive UI'],
    logos: ['/company-logos/a1-bulgaria.jpg'],
    initials: 'A1',
    accent: '#a7d7ff',
    contextProjects: [
      {
        title: 'A1 Xplore TV and TV-box workflows',
        productArea: 'Interactive TV, remote-control, and mobile TV product context',
        relationshipText:
          'CV-backed TV-box and support-tooling work; public A1 Xplore TV pages provide representative context for the TV product ecosystem.',
        summary:
          'A1 presents Xplore TV around 4K channels, video library, personalized recommendations, universal search, mobile viewing, and TV-box setup/help flows.',
        sourceLabel: 'A1 Xplore TV',
        sourceUrl: 'https://www.a1.bg/a1-xplore-tv',
        image: '/company-project-shots/a1/xplore-tv.png',
        tags: ['TV UX', 'React Native', 'Remote control', 'Support tools'],
        confidence: 'LinkedIn/CV-backed'
      },
      {
        title: 'A1 Xplore TV GO app',
        productArea: 'Mobile TV companion app',
        relationshipText:
          'Public product context for the broader A1 television app ecosystem; not stated as sole ownership.',
        summary:
          "The public app listing identifies A1 Xplore TV GO as A1 Bulgaria's mobile/cable/Wi-Fi TV viewing app.",
        sourceLabel: 'Google Play listing',
        sourceUrl: 'https://play.google.com/store/apps/details?id=bg.a1.android.xploretv',
        image: '/company-project-shots/a1/xplore-tv.png',
        tags: ['Mobile TV', 'A1 Bulgaria', 'App ecosystem'],
        confidence: 'Public context'
      },
      {
        title: 'A1 Bulgaria main website',
        productArea: 'Public telecom website and customer-facing web flows',
        relationshipText:
          'CV-backed A1 tenure included a chance to contribute to the main public website alongside TV-box and internal tooling work.',
        summary:
          'The A1 Bulgaria website is the primary public surface for telecom plans, devices, TV, internet, support, and customer account journeys.',
        sourceLabel: 'A1 Bulgaria website',
        sourceUrl: 'https://www.a1.bg/',
        image: '/company-project-shots/a1/xplore-tv.png',
        tags: ['Public website', 'Responsive UI', 'Telecom', 'Customer flows'],
        confidence: 'LinkedIn/CV-backed'
      }
    ]
  },
  {
    company: 'Evolution Bulgaria',
    role: 'Trainee Software Engineer',
    tenure: 'Jan 2019 - Feb 2019',
    startYear: '2019',
    type: 'Professional training',
    summary: 'Completed early professional software engineering training before moving into full-time application development.',
    bullets: [
      'Built foundations across React, practical software delivery, production-oriented habits, and team workflows.',
      'Used the training period as the bridge into full-time application engineering roles.'
    ],
    stack: ['React', 'Engineering Foundations', 'Team Workflows', 'Delivery'],
    logos: ['/company-logos/evolution.jpg'],
    initials: 'EV',
    accent: '#d8b4ff'
  },
  {
    company: 'Independent Products',
    role: 'Full-stack Product Builder',
    tenure: 'Jul 2018 - Present',
    startYear: '2018',
    type: 'Public GitHub project lineage and product systems',
    summary: 'Built public and local projects from early React/Angular demos into games, audio tools, 3D editors, and repo automation.',
    bullets: [
      'First public project commit found: Cat World on Jul 31, 2018, followed by Gorilla Gainz on Aug 2, 2018.',
      'Created games, music tools, 3D editors, ecommerce/admin demos, reusable libraries, and local/cloud demo tooling.',
      'Covered full product loops: UI systems, runtime logic, content pipelines, testing, screenshots, builds, and deployment paths.',
      'Used the projects as proof of independent execution depth across React, desktop, creative tech, and automation.'
    ],
    stack: ['Electron', 'React', 'TypeScript', 'Three.js', 'Web Audio', 'PixiJS', 'Vite', 'Cloudflare'],
    initials: 'BB',
    accent: '#ff8fd2',
    contextProjects: showcaseProjects.map(toPortfolioProjectContext)
  },
  {
    company: 'Soap Factory',
    role: 'Family Business / E-commerce & Operations Support',
    tenure: '2017 - 2019 + Ongoing support',
    startYear: '2017',
    type: 'Family business - Natural cosmetics and e-commerce',
    summary: 'Supported the family natural-cosmetics business across hands-on operations, customer-facing sales, and web shop maintenance.',
    bullets: [
      'Helped with the full practical business loop: making cosmetics, packing orders, deliveries, trade-show sales, and day-to-day support.',
      'Maintained the WordPress customer-facing website with product/catalog updates and small content or storefront fixes when needed.',
      'Still provide occasional support across web, operations, and practical business needs.'
    ],
    stack: ['Family Business', 'WordPress', 'E-commerce', 'Website Maintenance', 'Product Catalog', 'Operations'],
    logos: ['/company-logos/soap-factory.webp'],
    initials: 'SF',
    accent: '#b9df8a',
    contextProjects: [
      {
        title: 'Soap Factory storefront and operations',
        productArea: 'Family e-commerce, catalog, and day-to-day operations',
        relationshipText:
          'Family-business work across web maintenance, catalog/content updates, production, packing, delivery, and event sales.',
        summary:
          'The portfolio treats this as practical business and web-maintenance experience rather than a software-company product role.',
        sourceLabel: 'Soap Factory',
        sourceUrl: 'https://soapfactory.bg/',
        image: '/company-project-shots/soap-factory/storefront.png',
        tags: ['E-commerce', 'Catalog', 'Operations', 'Family business'],
        confidence: 'LinkedIn/CV-backed'
      }
    ]
  }
];

export function toDisplayContext(experience: Experience, project: ProfessionalContext): DisplayProfessionalContext {
  return {
    ...project,
    company: experience.company,
    accent: experience.accent,
    logo: experience.logos?.[0],
    initials: experience.initials
  };
}

export const capabilityGroups: CapabilityGroup[] = [
  {
    title: 'Frontend Product UI',
    purpose: 'Production-grade interfaces, workflow screens, and app surfaces.',
    primary: ['React', 'TypeScript', 'React Native', 'Figma'],
    skills: ['Redux', 'Zustand', 'AG Grid', 'Storybook', 'Responsive UI', 'Styled Components', 'Testing Library']
  },
  {
    title: 'Backend & Data',
    purpose: 'Service work, APIs, and data-heavy product behavior.',
    primary: ['Python', 'C#', 'SQL', 'ClickHouse'],
    skills: ['Flask', 'APIs', 'S3', 'Data modeling', 'Partial-failure handling', 'Dashboards']
  },
  {
    title: 'Platform & Delivery',
    purpose: 'Build stability, deployment paths, and automated confidence.',
    primary: ['Kubernetes', 'Cloudflare', 'Playwright', 'pytest'],
    skills: ['Vitest', 'CI/build stability', 'Vite', 'Deployment workflows', 'Monitoring', 'Repo automation']
  },
  {
    title: 'Creative / Demo Systems',
    purpose: 'Playable demos, editors, games, and media-heavy browser work.',
    primary: ['Electron', 'Three.js', 'Web Audio', 'Phaser'],
    skills: ['PixiJS', 'Canvas', 'Local demo orchestration', 'Screenshot pipelines', 'Cloud demo routing']
  }
];

export const contactLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/BorisThoris',
    icon: Github,
    external: true
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/boris-b-22566b171/',
    icon: Linkedin,
    external: true
  },
  {
    label: 'CV',
    href: '/cv-print',
    icon: FileText
  },
  {
    label: 'Email',
    href: 'mailto:borisbostandzhiev@yahoo.com',
    icon: Mail
  },
  {
    label: '+359 89 702 3731',
    href: 'tel:+359897023731',
    icon: Phone
  }
];

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
