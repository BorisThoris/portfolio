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
        'I run the storefront, maintain the catalogue, and handle the way the products are presented.',
      summary:
        'SAD Designs sells streetwear, racing, and graphic apparel through a print-on-demand setup. It is a small but real shop with paying customers.',
      sourceLabel: 'Live storefront',
      sourceUrl: project.deploymentUrl ?? project.localUrl,
      image: project.screenshot,
      tags: project.tags,
    };
  }

  return {
    title: project.title,
    productArea: project.subtitle,
    relationshipText: 'An independent project I designed, built, and still maintain.',
    summary: project.description,
    sourceLabel: 'Open project',
    sourceUrl: project.deploymentUrl ?? project.localUrl,
    image: project.screenshot,
    tags: project.tags,
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
      'I lead delivery for a global platform used across Man Group funds, risk, and investment operations. The work spans product decisions, hands-on engineering, and direct collaboration with risk managers, portfolio managers, directors, and other senior users.',
    bullets: [
      'Build React/TypeScript frontends, Streamlit/Python dashboards, C# services, APIs, tests, report tooling, and deployment configuration.',
      'Modernize older applications through Python and React upgrades, state-management changes, design-system work, dependency cleanup, and build fixes.',
      'Build reporting screens with large data sets, historical comparisons, interactive charts, and useful error states when only part of a request succeeds.',
      'Take part in production support, release testing, and AI-assisted analysis of financial reports.'
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
          'Turn portfolio, risk, and operations requirements into product changes the team can ship.'
        ]
      },
      {
        title: 'Technical scope',
        items: [
          'Work on React and TypeScript applications, Streamlit dashboards, Python and C# services, and the APIs that connect them.',
          'Upgrade Python systems that produce thousands of financial PDF reports and support live reporting tools.',
          'Add AI-assisted report analysis while keeping the source data and model output reviewable.',
          'Work with SQL, ClickHouse, S3, and Kubernetes where the product reaches into data loading, calculation, storage, and deployment.',
          'Cover production support, release testing, Playwright, Vitest, pytest, and CI failures.'
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
          'I work on internal fund and risk software. The tools are private, so the link below points to Man Group’s public technology overview.',
        summary:
          'My part covers risk analytics, reporting, and investment workflows across a business that reported $228.7bn in assets under management on 31 March 2026.',
        sourceLabel: 'Man Technology',
        sourceUrl: 'https://www.man.com/technology',
        tags: ['Fund platform', 'Risk analytics', 'Streamlit', 'React', 'Python', 'C#', 'Reports'],
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
      'Worked on mobile and tablet workflows, including handheld ordering connected to Zonal’s EPoS products.',
      'Improved component structure, tests, and the repeated tasks staff perform throughout a shift.',
      'Worked with product managers and designers on software that needs to stay quick and reliable during service.'
    ],
    stack: ['React', 'React Native', 'TypeScript', 'Redux', 'Styled Components', 'Figma', 'Jest', 'React Testing Library'],
    logos: ['/company-logos/expert-allies.jpg', '/company-logos/zonal.jpg'],
    initials: 'Z',
    accent: '#90f0c0',
    contextProjects: [
      {
        title: 'Aztec EPoS',
        productArea: 'Core hospitality EPoS and venue operations',
        relationshipText:
          'I worked as a senior React engineer on interfaces connected to Zonal’s hospitality products.',
        summary:
          'Aztec is Zonal’s main point-of-sale product for orders, stock, reporting, integrations, and venue operations.',
        sourceLabel: 'Zonal EPoS',
        sourceUrl: 'https://www.zonal.co.uk/products/epos/',
        image: '/company-project-shots/zonal/epos.png',
        tags: ['Aztec', 'EPoS', 'Hospitality SaaS', 'Workflow UI'],
      },
      {
        title: 'iServe / iServe Plus handheld ordering',
        productArea: 'Server tablets, phones, and handheld POS workflows',
        relationshipText:
          'My React Native work included mobile and tablet flows around the same ordering system.',
        summary:
          'iServe Plus lets staff take orders and payments from a handheld device at the table.',
        sourceLabel: 'Zonal iServe',
        sourceUrl: 'https://www.zonal.co.uk/products/epos/handheld-ordering/',
        image: '/company-project-shots/zonal/iserve.png',
        tags: ['iServe', 'React Native', 'Handheld ordering', 'Table service', 'Payments'],
      },
      {
        title: 'Order & Pay / iOrder',
        productArea: 'Guest ordering and payment flows',
        relationshipText:
          'A related guest-facing part of the Zonal product suite. I include it to show the wider system around the staff tools I worked on.',
        summary:
          'Guests can order and pay through a venue’s branded app or website, with the order sent into EPoS.',
        sourceLabel: 'Zonal Order & Pay',
        sourceUrl: 'https://www.zonal.co.uk/products/online-ordering-systems/order-and-pay/',
        image: '/company-project-shots/zonal/kiosk.png',
        tags: ['Order & Pay', 'iOrder', 'Guest ordering', 'Web app'],
      },
      {
        title: 'Kiosk ordering',
        productArea: 'Self-service ordering devices and kiosk flows',
        relationshipText:
          'Another related product in the Zonal suite, included for context rather than as a claim of sole ownership.',
        summary:
          'The kiosk product covers self-service ordering alongside Order & Pay and click and collect.',
        sourceLabel: 'Zonal online ordering',
        sourceUrl: 'https://www.zonal.co.uk/products/online-ordering-systems/',
        image: '/company-project-shots/zonal/kiosk.png',
        tags: ['Kiosks', 'Self-service', 'Ordering', 'Hospitality'],
      }
    ]
  },
  {
    company: 'Quickbase',
    role: 'Software Engineer II',
    tenure: 'Aug 2020 - Jan 2023',
    startYear: '2020',
    type: 'Full-time - Low-code automation',
    summary: 'Built new parts of Quickbase’s low-code automation product while gradually replacing older frontend code.',
    bullets: [
      'Led visual-programming features for loops, conditions, nested steps, and complex component states.',
      'Expanded unit, end-to-end, functional, and user-flow test coverage in a team without dedicated QA.',
      'Owned library upgrades, reusable components, escalated bugs, deployment monitoring, and delivery across several product epics.',
      'Mentored junior colleagues and received a company award for my work.'
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
          'I worked across the main product, adding modern React interfaces while still supporting older Backbone and jQuery code.',
        summary:
          'Quickbase lets teams build internal applications, workflows, reports, and automations around their own data.',
        sourceLabel: 'Quickbase product',
        sourceUrl: 'https://www.quickbase.com/product',
        image: '/company-project-shots/quickbase/platform.png',
        tags: ['Low-code platform', 'App builder', 'Dashboards', 'Reporting'],
      },
      {
        title: 'Quickbase Pipelines Designer',
        productArea: 'Low-code workflow automation and visual programming',
        relationshipText:
          'I built visual-programming features in Pipelines, including loops, conditions, nested steps, and their component behaviour.',
        summary:
          'Pipelines is a drag-and-drop editor for automating work across Quickbase and third-party services.',
        sourceLabel: 'Quickbase Pipelines Designer',
        sourceUrl: 'https://www.quickbase.com/product/pipelines-designer',
        image: '/company-project-shots/quickbase/pipelines-designer.png',
        tags: ['Low-code', 'Pipelines', 'Visual builder', 'Automation'],
      },
      {
        title: 'Legacy platform and API surfaces',
        productArea: 'Mixed legacy and modern engineering environment',
        relationshipText:
          'The product mixed newer React and Python work with Backbone, jQuery, Handlebars, C#, and older APIs.',
        summary:
          'A lot of the job was careful modernization: improving one area without breaking customers who still depended on the older platform.',
        sourceLabel: 'Built In / API guide',
        sourceUrl: 'https://builtin.com/company/quickbase',
        image: '/company-project-shots/quickbase/platform.png',
        tags: ['C# context', 'Backbone', 'Legacy APIs', 'Modernization'],
      }
    ]
  },
  {
    company: 'Hakomo',
    role: 'Software Engineer',
    tenure: 'Jan 2020 - Jun 2020',
    startYear: '2020',
    type: 'Full-time - Mobile and web products',
    summary: 'Built React Native apps and React websites, working closely with the people designing and managing each product.',
    bullets: [
      'Developed React Native apps for social networking and education.',
      'Built a responsive React website for a real-estate appraisal business.',
      'Worked directly with product managers and designers from mock-up through delivery.'
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
          'I worked on Asko, a social question-and-answer app built with React Native.',
        summary:
          'The team took it from early sketches through design and app development.',
        sourceLabel: 'Hakomo Asko',
        sourceUrl: 'https://www.hakomo.com/portfolio/asko/',
        tags: ['React Native', 'Social app', 'Mobile UX', 'Hakomo'],
      },
      {
        title: 'Amrita Appraisal System',
        productArea: 'React web appraisal-management product',
        relationshipText:
          'I built React interfaces for Amrita, a system used by a real-estate appraisal business.',
        summary:
          'It brought documents and spreadsheet calculations into one appraisal workflow.',
        sourceLabel: 'Hakomo Amrita',
        sourceUrl: 'https://www.hakomo.com/portfolio/amrita-appraisal-system/',
        tags: ['React', 'Real estate', 'Dashboard UI', 'Workflow'],
      },
      {
        title: 'Educational mobile platform',
        productArea: 'Undisclosed React Native education app',
        relationshipText:
          'I also worked on a React Native education app whose name is not public.',
        summary:
          'The work covered the mobile interface and the day-to-day flow for learners.',
        sourceLabel: 'Private project',
        tags: ['React Native', 'Education', 'Mobile learning', 'Private'],
      }
    ]
  },
  {
    company: 'A1 Bulgaria',
    role: 'Junior Software Engineer',
    tenure: 'Mar 2019 - Nov 2019',
    startYear: '2019',
    type: 'Full-time - Telecom software',
    summary: 'Built React, React Native, and C# software for customer-facing products and internal support teams.',
    bullets: [
      'Worked on TV-box software and internal support tools, including interfaces designed for a remote control.',
      'Built SQL-backed features for operational support teams.',
      'Contributed to A1 Bulgaria’s public website and worked with product managers, engineers, and support staff.'
    ],
    stack: ['React', 'React Native', 'C#', 'SQL', 'JavaScript', 'Responsive UI'],
    logos: ['/company-logos/a1-bulgaria.jpg'],
    initials: 'A1',
    accent: '#a7d7ff',
    contextProjects: [
      {
        title: 'A1 Xplore TV and TV-box workflows',
        productArea: 'Interactive TV, remote-control, and mobile TV products',
        relationshipText:
          'I worked on TV-box interfaces and the internal tools used to support them.',
        summary:
          'Xplore TV combines live channels, a video library, search, recommendations, mobile viewing, and TV-box setup.',
        sourceLabel: 'A1 Xplore TV',
        sourceUrl: 'https://www.a1.bg/a1-xplore-tv',
        image: '/company-project-shots/a1/xplore-tv.png',
        tags: ['TV UX', 'React Native', 'Remote control', 'Support tools'],
      },
      {
        title: 'A1 Xplore TV GO app',
        productArea: 'Mobile TV companion app',
        relationshipText:
          'The mobile companion app was part of the same television product family. I include it to show the system around the TV-box work.',
        summary:
          'A1 Xplore TV GO lets customers watch television from a phone, cable connection, or Wi-Fi.',
        sourceLabel: 'Google Play listing',
        sourceUrl: 'https://play.google.com/store/apps/details?id=bg.a1.android.xploretv',
        image: '/company-project-shots/a1/xplore-tv.png',
        tags: ['Mobile TV', 'A1 Bulgaria', 'App ecosystem'],
      },
      {
        title: 'A1 Bulgaria main website',
        productArea: 'Public telecom website and customer-facing web flows',
        relationshipText:
          'I also contributed to the main A1 Bulgaria website during my time there.',
        summary:
          'The site covers mobile plans, devices, television, internet, support, and customer accounts.',
        sourceLabel: 'A1 Bulgaria website',
        sourceUrl: 'https://www.a1.bg/',
        image: '/company-project-shots/a1/xplore-tv.png',
        tags: ['Public website', 'Responsive UI', 'Telecom', 'Customer flows'],
      }
    ]
  },
  {
    company: 'Evolution Bulgaria',
    role: 'Trainee Software Engineer',
    tenure: 'Jan 2019 - Feb 2019',
    startYear: '2019',
    type: 'Professional training',
    summary: 'Completed a short professional training programme before moving into my first full-time engineering role.',
    bullets: [
      'Learned React, team development, and the basics of shipping production software.',
      'Moved into a full-time application engineering role shortly afterwards.'
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
    type: 'Independent software projects',
    summary: 'I’ve kept building my own software alongside work, from early Angular demos to browser games, music tools, and 3D editors.',
    bullets: [
      'My first public project commit was Cat World on 31 July 2018, followed by Gorilla Gainz two days later.',
      'Since then I’ve made games, music tools, 3D editors, shops, admin tools, and reusable libraries.',
      'I handle the whole job myself: interface, application logic, tests, screenshots, builds, and deployment.',
      'Most projects are available to try from this site.'
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
          'This was hands-on small-business work: maintaining the shop, updating products, making and packing orders, handling deliveries, and selling at events.',
        sourceLabel: 'Soap Factory',
        sourceUrl: 'https://soapfactory.bg/',
        image: '/company-project-shots/soap-factory/storefront.png',
        tags: ['E-commerce', 'Catalog', 'Operations', 'Family business'],
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
    purpose: 'Interfaces for real products, from everyday forms to dense workflow screens.',
    primary: ['React', 'TypeScript', 'React Native', 'Figma'],
    skills: ['Redux', 'Zustand', 'AG Grid', 'Storybook', 'Responsive UI', 'Styled Components', 'Testing Library']
  },
  {
    title: 'Backend & Data',
    purpose: 'APIs, services, reporting, and the data work behind the interface.',
    primary: ['Python', 'C#', 'SQL', 'ClickHouse'],
    skills: ['Flask', 'APIs', 'S3', 'Data modeling', 'Partial-failure handling', 'Dashboards']
  },
  {
    title: 'Platform & Delivery',
    purpose: 'Tests, builds, deployments, and production support.',
    primary: ['Kubernetes', 'Cloudflare', 'Playwright', 'pytest'],
    skills: ['Vitest', 'CI/build stability', 'Vite', 'Deployment workflows', 'Monitoring', 'Repo automation']
  },
  {
    title: 'Creative / Demo Systems',
    purpose: 'Games, editors, audio tools, and 3D work in the browser.',
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
