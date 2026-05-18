import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileText,
  Github,
  Linkedin,
  Mail,
  MonitorUp,
  Play,
  X
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AeroLiquidBackground } from './AeroLiquidBackground';
import { getProject, moreProjects, Project, showcaseProjects, visibleProjects } from './projects';
import './styles.css';

type RuntimeProjectStatus = {
  slug: string;
  mode: 'live' | 'build' | 'failed';
  effectiveUrl: string;
  origin: string;
  status: number | string;
};

type RuntimeStatus = {
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

function resolveProjectUrl(project: Pick<Project, 'deploymentUrl' | 'localUrl'>, runtime?: RuntimeProjectStatus) {
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

type Experience = {
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

type ProfessionalContext = {
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

type DisplayProfessionalContext = ProfessionalContext & {
  company: string;
  accent: string;
  logo?: string;
  initials: string;
};

type CapabilityGroup = {
  title: string;
  purpose: string;
  primary: string[];
  skills: string[];
};

function toPortfolioProjectContext(project: Project): ProfessionalContext {
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

const experiences: Experience[] = [
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
    summary: 'Worked as a senior React engineer on Zonal product interfaces for hospitality operators.',
    bullets: [
      'Built and improved React/TypeScript interfaces for software used by pubs, hotels, restaurants, and venues across the UK.',
      'Focused on maintainable UI architecture, component quality, testing, and repeated workflow usability.',
      'Worked closely with PMs, designers, and product stakeholders in a domain where reliability and fast day-to-day operations mattered.'
    ],
    stack: ['React', 'TypeScript', 'Redux', 'Styled Components', 'Figma', 'Jest', 'React Testing Library'],
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
          "Worked around mobile/tablet-facing hospitality workflows integrated with Zonal's Aztec EPoS ecosystem; public iServe material shows the staff handheld ordering surface.",
        summary:
          'Zonal positions iServe Plus as an all-in-one handheld order and payment solution for tableside service in hospitality venues.',
        sourceLabel: 'Zonal iServe',
        sourceUrl: 'https://www.zonal.co.uk/products/epos/handheld-ordering/',
        image: '/company-project-shots/zonal/iserve.png',
        tags: ['iServe', 'Handheld ordering', 'Table service', 'Payments'],
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

function toDisplayContext(experience: Experience, project: ProfessionalContext): DisplayProfessionalContext {
  return {
    ...project,
    company: experience.company,
    accent: experience.accent,
    logo: experience.logos?.[0],
    initials: experience.initials
  };
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects/:slug" element={<ProjectPage />} />
      </Routes>
    </BrowserRouter>
  );
}

const showcaseSlideVariants = {
  center: {
    opacity: 1,
    scale: 1,
    transition: {
      staggerChildren: 0.018,
      delayChildren: 0.04
    }
  }
};

const showcaseCopyVariants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const showcaseStageVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

function showcaseSlideTransition(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { duration: 0.12 };
  }

  return {
    duration: 2.25,
    ease: [0.2, 0.72, 0.18, 1] as const
  };
}

const SHOWCASE_SLIDE_GAP = 18;
const SHOWCASE_AUTOPLAY_MS = 8500;

const capabilityGroups: CapabilityGroup[] = [
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

const contactLinks = [
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
    href: '#experience',
    icon: FileText
  },
  {
    label: 'Email',
    href: 'mailto:borisbostandzhiev@yahoo.com',
    icon: Mail
  }
];

function ContactLinks({ iconSize, placement }: { iconSize: number; placement: 'intro' | 'topbar' }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {contactLinks.map((link, index) => {
        const Icon = link.icon;
        const motionProps = shouldReduceMotion
          ? {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              transition: { duration: 0.12 }
            }
          : {
              initial: { opacity: 0, y: placement === 'topbar' ? -8 : 8, filter: 'blur(6px)' },
              animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
              exit: { opacity: 0, y: placement === 'topbar' ? -8 : 8, filter: 'blur(6px)' },
              transition: { duration: 0.28, delay: index * 0.035, ease: [0.2, 0.72, 0.18, 1] as const }
            };

        return (
          <motion.a
            href={link.href}
            key={`${placement}-${link.label}`}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noreferrer' : undefined}
            {...motionProps}
          >
            <Icon size={iconSize} />
            {link.label}
          </motion.a>
        );
      })}
    </>
  );
}

function CapabilitySwitchboard({ activeIndex, onToggle }: { activeIndex: number; onToggle: (index: number) => void }) {
  return (
    <section className="technical-range-section" aria-label="Technical range">
      <div className="section-heading technical-range-heading">
        <div>
          <p className="eyebrow">Technical range</p>
          <h2>Capability Summary</h2>
        </div>
        <span>A grouped summary of the tools, platforms, and delivery habits represented above.</span>
      </div>

      <div className="capability-switchboard">
        {capabilityGroups.map((group, index) => {
          const isActive = activeIndex === index;
          const hiddenCount = group.skills.length;

          return (
            <motion.article
              className={`capability-card ${isActive ? 'active' : ''}`}
              key={group.title}
              layout
              transition={{ duration: 0.32, ease: [0.2, 0.72, 0.18, 1] }}
            >
              <button
                className="capability-trigger"
                type="button"
                aria-expanded={isActive}
                onClick={() => onToggle(index)}
              >
                <span className="capability-kicker">{String(index + 1).padStart(2, '0')}</span>
                <strong>{group.title}</strong>
                <span>{group.purpose}</span>
              </button>

              <div className="capability-primary" aria-label={`${group.title} primary skills`}>
                {group.primary.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
                {!isActive ? <span className="more-skill">+{hiddenCount} more</span> : null}
              </div>

              <AnimatePresence initial={false}>
                {isActive ? (
                  <motion.div
                    className="capability-extra"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24, ease: [0.2, 0.72, 0.18, 1] }}
                  >
                    {group.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function HomePage() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [trackIndex, setTrackIndex] = React.useState(1);
  const [trackAnimationEnabled, setTrackAnimationEnabled] = React.useState(true);
  const [slideWidth, setSlideWidth] = React.useState(0);
  const [isShowcaseInteracting, setIsShowcaseInteracting] = React.useState(false);
  const [showTopbarContacts, setShowTopbarContacts] = React.useState(false);
  const [activeCapabilityIndex, setActiveCapabilityIndex] = React.useState(0);
  const [supportingProjectsOpen, setSupportingProjectsOpen] = React.useState(false);
  const introActionsRef = React.useRef<HTMLDivElement | null>(null);
  const firstShowcaseSlideRef = React.useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const activeProject = showcaseProjects[activeIndex] ?? visibleProjects[0];
  const runtimeStatus = useRuntimeStatus();
  const [selectedExperienceIndex, setSelectedExperienceIndex] = React.useState<number | null>(null);
  const [selectedContext, setSelectedContext] = React.useState<DisplayProfessionalContext | null>(null);
  const selectedExperience = selectedExperienceIndex === null ? null : experiences[selectedExperienceIndex];
  const navigate = useNavigate();
  const showcaseCount = showcaseProjects.length;
  const trackProjects = React.useMemo(() => {
    if (!showcaseCount) return [];
    return [showcaseProjects[showcaseCount - 1], ...showcaseProjects, showcaseProjects[0]];
  }, [showcaseCount]);

  const settleLoopPosition = () => {
    if (!showcaseCount) return;

    if (trackIndex === 0) {
      setTrackAnimationEnabled(false);
      setTrackIndex(showcaseCount);
      window.requestAnimationFrame(() => setTrackAnimationEnabled(true));
    }

    if (trackIndex === showcaseCount + 1) {
      setTrackAnimationEnabled(false);
      setTrackIndex(1);
      window.requestAnimationFrame(() => setTrackAnimationEnabled(true));
    }
  };

  const selectProject = (nextIndex: number) => {
    if (nextIndex === activeIndex) return;
    setTrackAnimationEnabled(true);
    setActiveIndex(nextIndex);
    setTrackIndex(nextIndex + 1);
  };

  const setByDirection = (direction: -1 | 1) => {
    if (!showcaseCount) return;
    setTrackAnimationEnabled(true);
    setActiveIndex((current) => (current + direction + showcaseCount) % showcaseCount);
    setTrackIndex((current) => {
      const normalized = current === 0 ? showcaseCount : current === showcaseCount + 1 ? 1 : current;
      return normalized + direction;
    });
  };

  React.useEffect(() => {
    const slideElement = firstShowcaseSlideRef.current;
    if (!slideElement) return;

    const updateSlideWidth = () => {
      setSlideWidth(slideElement.getBoundingClientRect().width);
    };

    updateSlideWidth();
    const observer = new ResizeObserver(updateSlideWidth);
    observer.observe(slideElement);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (isShowcaseInteracting || selectedExperience || selectedContext || shouldReduceMotion) return;

    const autoplay = window.setInterval(() => {
      if (document.hidden) return;
      setByDirection(1);
    }, SHOWCASE_AUTOPLAY_MS);

    return () => window.clearInterval(autoplay);
  }, [isShowcaseInteracting, selectedContext, selectedExperience, setByDirection, shouldReduceMotion]);

  React.useEffect(() => {
    const introActionsElement = introActionsRef.current;
    if (!introActionsElement) return;
    const browserWindow = window;
    const supportsIntersectionObserver = typeof IntersectionObserver !== 'undefined';

    if (!supportsIntersectionObserver) {
      const updateVisibility = () => {
        const bounds = introActionsElement.getBoundingClientRect();
        setShowTopbarContacts(bounds.bottom < 72 || bounds.top > browserWindow.innerHeight);
      };

      updateVisibility();
      browserWindow.addEventListener('scroll', updateVisibility, { passive: true });
      browserWindow.addEventListener('resize', updateVisibility);
      return () => {
        browserWindow.removeEventListener('scroll', updateVisibility);
        browserWindow.removeEventListener('resize', updateVisibility);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowTopbarContacts(!entry.isIntersecting || entry.intersectionRatio < 0.32);
      },
      {
        threshold: [0, 0.32, 0.7],
        rootMargin: '-68px 0px 0px 0px'
      }
    );

    observer.observe(introActionsElement);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!selectedExperience && !selectedContext) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedContext) {
          setSelectedContext(null);
        } else {
          setSelectedExperienceIndex(null);
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedContext, selectedExperience]);

  return (
    <main className="page-shell home-shell">
      <AeroLiquidBackground accent={activeProject.accent} />
      <header className="site-topbar" aria-label="Portfolio header">
        <Link to="/" className="site-mark">
          <MonitorUp size={18} />
          Boris Bostandzhiev
        </Link>
        <nav className="site-pills topbar-contact-links" aria-label="Portfolio navigation">
          <AnimatePresence mode="popLayout">
            {showTopbarContacts ? <ContactLinks iconSize={14} placement="topbar" /> : null}
          </AnimatePresence>
        </nav>
      </header>

      <section className="portfolio-intro" aria-label="Portfolio introduction">
        <div className="intro-copy">
          <h1>Interactive software with real product depth.</h1>
          <p>
            I build playable tools, games, storefronts, and enterprise interfaces that demonstrate the workflow, UI
            craft, and engineering behind them.
          </p>
          <div className="intro-actions" ref={introActionsRef} aria-label="Contact and profile actions">
            {showTopbarContacts ? null : <ContactLinks iconSize={16} placement="intro" />}
          </div>
        </div>
      </section>

      <section
        id="showcase"
        className="premium-hero"
        aria-label="Portfolio showcase"
        style={{ '--accent': activeProject.accent } as React.CSSProperties}
        onPointerEnter={() => setIsShowcaseInteracting(true)}
        onPointerLeave={() => setIsShowcaseInteracting(false)}
        onFocusCapture={() => setIsShowcaseInteracting(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsShowcaseInteracting(false);
          }
        }}
      >
        <div
          className="showcase-dock"
          aria-label="Top projects"
          style={{ '--showcase-count': showcaseProjects.length } as React.CSSProperties}
        >
          {showcaseProjects.map((project, index) => (
            <button
              className={`dock-item ${index === activeIndex ? 'active' : ''}`}
              key={project.slug}
              onClick={() => selectProject(index)}
              style={{ '--accent': project.accent } as React.CSSProperties}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{project.title}</strong>
            </button>
          ))}
          <div className="dock-controls">
            <button className="icon-button" onClick={() => setByDirection(-1)} aria-label="Previous project">
              <ArrowLeft size={18} />
            </button>
            <button className="icon-button" onClick={() => setByDirection(1)} aria-label="Next project">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="showcase-viewport">
          <motion.div
            className="showcase-track"
            animate={{ x: slideWidth ? -trackIndex * (slideWidth + SHOWCASE_SLIDE_GAP) : 0 }}
            transition={trackAnimationEnabled ? showcaseSlideTransition(shouldReduceMotion) : { duration: 0 }}
            onAnimationComplete={settleLoopPosition}
          >
            {trackProjects.map((project, trackPosition) => {
              const index =
                trackPosition === 0 ? showcaseCount - 1 : trackPosition === showcaseCount + 1 ? 0 : trackPosition - 1;
              const projectRuntime = runtimeStatus?.projects.find((item) => item.slug === project.slug);
              const isActive = trackPosition === trackIndex;
              const projectHref = resolveProjectUrl(project, projectRuntime).url;

              return (
                <motion.div
                  className="showcase-slide"
                  key={`${project.slug}-${trackPosition}`}
                  ref={trackPosition === 1 ? firstShowcaseSlideRef : undefined}
                  aria-hidden={!isActive}
                  variants={showcaseSlideVariants}
                  animate={isActive ? 'center' : undefined}
                >
                  <motion.div className="hero-copy project-copy" variants={showcaseCopyVariants}>
                    <h2>{project.title}</h2>
                    <strong>{project.subtitle}</strong>
                    <p>{project.description}</p>
                    <div className="tag-row hero-tags">
                      {project.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <div className="hero-actions">
                      <a
                        className="primary-action"
                        href={projectHref}
                        target="_blank"
                        rel="noreferrer"
                        tabIndex={isActive ? 0 : -1}
                      >
                        <Play size={17} />
                        Open {project.title}
                      </a>
                      <Link className="quiet-action" to={`/projects/${project.slug}`} tabIndex={isActive ? 0 : -1}>
                        Case view
                        <ArrowUpRight size={17} />
                      </Link>
                    </div>
                  </motion.div>

                  <motion.button
                    className="hero-stage crafted-frame"
                    onClick={() => navigate(`/projects/${project.slug}`)}
                    aria-label={`Open details for ${project.title}`}
                    tabIndex={isActive ? 0 : -1}
                    variants={showcaseStageVariants}
                    whileHover={isActive && !shouldReduceMotion ? { y: -3, scale: 1.006 } : undefined}
                    transition={{ duration: 0.22, ease: [0.22, 0.8, 0.26, 1] }}
                  >
                    <ProjectScreenshot project={project} />
                    <div className="stage-caption">
                      <span className="rank-kicker">
                        {String(index + 1).padStart(2, '0')} / {String(showcaseProjects.length).padStart(2, '0')}
                      </span>
                    </div>
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section id="archive" className="archive-section" aria-label="Supporting projects">
        <details
          className="supporting-projects"
          onToggle={(event) => setSupportingProjectsOpen(event.currentTarget.open)}
        >
          <summary className="supporting-projects__summary">
            <div className="section-heading archive-heading">
              <div>
                <p className="eyebrow">Supporting Work</p>
                <h2>Supporting Projects</h2>
              </div>
              <span>Additional demos, experiments, and earlier builds.</span>
            </div>
            <span className="supporting-projects__toggle" aria-label={supportingProjectsOpen ? 'Hide projects' : `Show ${moreProjects.length} projects`}>
              <ChevronDown size={22} strokeWidth={2.4} />
            </span>
          </summary>

          <div className="archive-grid">
            {moreProjects.map((project) => (
              <Link
                className="archive-card"
                to={`/projects/${project.slug}`}
                key={project.slug}
                style={{ '--accent': project.accent } as React.CSSProperties}
              >
                <ProjectScreenshot project={project} />
                <div className="archive-card__body">
                  <h3>{project.title}</h3>
                  <p>{project.subtitle}</p>
                  <div className="tag-row compact">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span className="archive-card__arrow" aria-hidden="true">
                  <ArrowRight size={18} strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        </details>
      </section>

      <section id="experience" className="experience-section" aria-label="Employment and experience">
        <div className="section-heading experience-heading">
          <div>
            <p className="eyebrow">Experience</p>
            <h2>Employment & Product Work</h2>
          </div>
          <span>CV-backed employment history, kept public-safe where company work is not shareable as screenshots.</span>
        </div>

        <div className="experience-timeline">
          {experiences.map((experience, index) => (
            <motion.article
              className="experience-item"
              key={experience.company}
              style={{ '--accent': experience.accent } as React.CSSProperties}
              initial={false}
            >
              <div className="experience-rail">
                <span className="experience-year">{experience.startYear}</span>
                <CompanyLogo experience={experience} layoutId={`experience-logo-${index}`} />
                <span className="timeline-dot" aria-hidden="true" />
              </div>

              <motion.article
                className="experience-panel crafted-frame"
                layoutId={`experience-card-${index}`}
                onClick={() => setSelectedExperienceIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedExperienceIndex(index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-haspopup="dialog"
                aria-label={`Open details for ${experience.company}`}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.992 }}
              >
                <div className="experience-topline">
                  <div>
                    <p className="experience-company">{experience.company}</p>
                    <h3>{experience.role}</h3>
                  </div>
                  <div className="experience-tenure">
                    <CalendarDays size={16} />
                    <span>{experience.tenure}</span>
                  </div>
                </div>

                <p className="experience-type">{experience.type}</p>
                <p className="experience-summary">{experience.summary}</p>

                <ul className="experience-bullets">
                  {experience.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>

                {experience.contextProjects?.length ? (
                  <ProductContextStrip
                    contexts={experience.contextProjects.map((project) => toDisplayContext(experience, project))}
                    onSelect={setSelectedContext}
                  />
                ) : null}

                <div className="tag-row compact experience-stack">
                  {experience.stack.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </motion.article>
            </motion.article>
          ))}
        </div>
      </section>

      <CapabilitySwitchboard
        activeIndex={activeCapabilityIndex}
        onToggle={(index) => setActiveCapabilityIndex((current) => (current === index ? -1 : index))}
      />

      <AnimatePresence>
        {selectedExperience && selectedExperienceIndex !== null ? (
          <ExperienceModal
            experience={selectedExperience}
            index={selectedExperienceIndex}
            onSelectContext={setSelectedContext}
            onClose={() => setSelectedExperienceIndex(null)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {selectedContext ? (
          <ProductContextModal context={selectedContext} onClose={() => setSelectedContext(null)} />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function CompanyLogo({
  experience,
  layoutId
}: {
  experience: Pick<Experience, 'company' | 'logos' | 'initials'>;
  layoutId?: string;
}) {
  const logos = experience.logos ?? [];

  return (
    <motion.div className={`company-logo ${logos.length > 1 ? 'logo-stack' : ''}`} layoutId={layoutId}>
      <span>{experience.initials}</span>
      {logos.map((logo, index) => (
        <img
          src={logo}
          alt={`${experience.company} logo ${index + 1}`}
          loading="lazy"
          key={logo}
          onError={(event) => {
            event.currentTarget.remove();
          }}
        />
      ))}
    </motion.div>
  );
}

function ExperienceModal({
  experience,
  index,
  onSelectContext,
  onClose
}: {
  experience: Experience;
  index: number;
  onSelectContext: (context: DisplayProfessionalContext) => void;
  onClose: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const detailSections = experience.detailSections ?? [
    { title: 'Highlights', items: experience.bullets },
    { title: 'Tools and scope', items: [experience.stack.join(', ')] }
  ];

  return (
    <motion.div
      className="experience-modal-layer"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="experience-modal crafted-frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby="experience-modal-title"
        style={{ '--accent': experience.accent } as React.CSSProperties}
        layoutId={`experience-card-${index}`}
        onMouseDown={(event) => event.stopPropagation()}
        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }}
      >
        <div className="experience-modal-header">
          <CompanyLogo experience={experience} layoutId={`experience-logo-${index}`} />
          <button className="modal-close-button" onClick={onClose} type="button" aria-label="Close experience detail">
            <X size={18} />
          </button>
        </div>

        <div className="experience-modal-titlebar">
          <p className="experience-company">{experience.company}</p>
          <h3 id="experience-modal-title">{experience.detailTitle ?? experience.role}</h3>
          <div className="experience-modal-meta">
            <span>{experience.startYear}</span>
            <span>{experience.tenure}</span>
            <span>{experience.type}</span>
          </div>
        </div>

        <p className="experience-summary modal-summary">{experience.summary}</p>

        <div className="experience-modal-grid">
          {detailSections.map((section) => (
            <section className="experience-modal-section" key={section.title}>
              <h4>{section.title}</h4>
              <ul className="experience-bullets">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {experience.contextProjects?.length ? (
          <div className="modal-context-strip" aria-label={`${experience.company} product context`}>
            <ProductContextStrip
              contexts={experience.contextProjects.map((project) => toDisplayContext(experience, project))}
              onSelect={onSelectContext}
              dense
            />
          </div>
        ) : null}

        <div className="tag-row compact experience-stack modal-stack">
          {experience.stack.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProductContextStrip({
  contexts,
  onSelect,
  dense = false
}: {
  contexts: DisplayProfessionalContext[];
  onSelect: (context: DisplayProfessionalContext) => void;
  dense?: boolean;
}) {
  return (
    <div className={`product-context-strip ${dense ? 'dense-context-strip' : ''}`}>
      {contexts.map((context) => (
        <button
          className="product-context-pill"
          key={`${context.company}-${context.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(context);
          }}
          type="button"
          style={{ '--accent': context.accent } as React.CSSProperties}
        >
          {context.image ? (
            <img src={context.image} alt={`${context.title} public product screenshot`} loading="lazy" />
          ) : (
            <span className="context-logo-fallback">{context.initials}</span>
          )}
          <span className="context-pill-copy">
            <strong>{context.title}</strong>
            <span>{context.sourceLabel}</span>
          </span>
          <ArrowUpRight size={15} />
        </button>
      ))}
    </div>
  );
}

function ProductContextModal({
  context,
  onClose
}: {
  context: DisplayProfessionalContext;
  onClose: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="product-modal-layer"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
      onMouseDown={onClose}
    >
      <motion.article
        className="product-context-modal crafted-frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-context-title"
        style={{ '--accent': context.accent } as React.CSSProperties}
        initial={shouldReduceMotion ? false : { y: 26, scale: 0.98 }}
        animate={shouldReduceMotion ? {} : { y: 0, scale: 1 }}
        exit={shouldReduceMotion ? {} : { y: 18, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 270, damping: 30 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="product-modal-header">
          <div>
            <p className="experience-company">{context.company}</p>
            <h3 id="product-context-title">{context.title}</h3>
          </div>
          <button className="modal-close-button" onClick={onClose} type="button" aria-label="Close product context">
            <X size={18} />
          </button>
        </div>

        {context.image ? (
          <img className="product-modal-shot" src={context.image} alt={`${context.title} public product screenshot`} />
        ) : (
          <div className="product-modal-no-shot">
            <CompanyLogo experience={context} />
            <span>Private/internal work context</span>
          </div>
        )}

        <div className="product-modal-copy">
          <strong>{context.productArea}</strong>
          <p>{context.relationshipText}</p>
          <p>{context.summary}</p>
          <div className="tag-row compact">
            {context.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          {context.sourceUrl ? (
            <a href={context.sourceUrl} target="_blank" rel="noreferrer">
              {context.sourceLabel}
              <ArrowUpRight size={15} />
            </a>
          ) : (
            <span className="source-note">{context.sourceLabel}</span>
          )}
        </div>
      </motion.article>
    </motion.div>
  );
}

function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);
  const runtimeStatus = useRuntimeStatus();
  const projectRuntime = runtimeStatus?.projects.find((item) => item.slug === project.slug);
  const resolvedProjectUrl = resolveProjectUrl(project, projectRuntime);
  const embedUrl = resolvedProjectUrl.url;
  const embedMode = resolvedProjectUrl.mode;
  const [embedFailed, setEmbedFailed] = React.useState(false);

  React.useEffect(() => {
    setEmbedFailed(false);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2200);

    fetch(embedUrl, { mode: 'no-cors', signal: controller.signal })
      .catch(() => {
        setEmbedFailed(true);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [embedUrl]);

  return (
    <main className="page-shell detail-shell">
      <AeroLiquidBackground accent={project.accent} />
      <nav className="top-nav detail-topbar">
        <Link to="/" className="back-action">
          <ArrowLeft size={18} />
          Back to portfolio
        </Link>
        <div className="detail-topbar-title">
          <MonitorUp size={18} />
          <span>{project.title}</span>
        </div>
        <a className="quiet-action" href={embedUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open app
        </a>
      </nav>

      <section className="detail-panel" style={{ '--accent': project.accent } as React.CSSProperties}>
        <div className="detail-header">
          <div>
            <h1>{project.title}</h1>
            <p>{project.subtitle}</p>
            <div className="tag-row detail-tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
          <p>{project.description}</p>
        </div>

        <div className="browser-frame crafted-frame">
          <div className="browser-toolbar">
            <span />
            <span />
            <span />
            <code>{embedUrl}</code>
            <RuntimeBadge mode={embedMode} />
          </div>
          {embedFailed ? (
            <div className="fallback-frame">
              <img src={project.screenshot} alt={`${project.title} screenshot fallback`} />
              <div>
                <h2>Live preview unavailable</h2>
                <p>Open the app in a new tab or use the screenshot preview here.</p>
              </div>
            </div>
          ) : (
            <iframe
              title={`${project.title} live preview`}
              src={embedUrl}
              onError={() => setEmbedFailed(true)}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function RuntimeBadge({ mode }: { mode: string }) {
  return <strong className={`runtime-badge mode-${mode}`}>{mode}</strong>;
}

function useRuntimeStatus(): RuntimeStatus | null {
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

function ProjectScreenshot({ project }: { project: Pick<Project, 'title' | 'screenshot'> }) {
  return (
    <img
      src={project.screenshot}
      alt={`${project.title} screenshot`}
      onError={(event) => {
        event.currentTarget.src = '/project-shots/portfolio-placeholder.svg';
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
