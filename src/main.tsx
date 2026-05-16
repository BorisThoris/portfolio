import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  Github,
  MonitorUp,
  Play
} from 'lucide-react';
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

type Experience = {
  company: string;
  role: string;
  tenure: string;
  type: string;
  summary: string;
  bullets: string[];
  stack: string[];
  logos?: string[];
  initials: string;
  accent: string;
};

const experiences: Experience[] = [
  {
    company: 'Man Group',
    role: 'Project Owner / Full-stack Risk Software Engineer',
    tenure: 'Feb 2024 - Present',
    type: 'Full-time · Investment technology',
    summary: 'Own delivery for production risk-analytics and internal software used by professional users.',
    bullets: [
      'Build React/TypeScript frontends, Python services, dashboards, APIs, tests, and deployment configuration.',
      'Lead modernization across React upgrades, state management, grids/tables, design-system adoption, dependency cleanup, performance, and CI/build stability.',
      'Ship data-heavy interfaces with resilient loading, historical comparisons, interactive visualizations, and graceful partial-failure handling.',
      'Integrate structured AI-assisted workflow features where appropriate and expand coverage with Playwright, Vitest, and pytest.'
    ],
    stack: ['React', 'TypeScript', 'Python', 'Flask', 'AG Grid', 'Zustand', 'Playwright', 'pytest'],
    logos: ['/company-logos/man-group.jpg'],
    initials: 'MG',
    accent: '#8bd3ff'
  },
  {
    company: 'Expert Allies / Zonal',
    role: 'Senior Software Engineer / Senior React Developer',
    tenure: 'Feb 2023 - Feb 2024',
    type: 'Contract/employment engagement · Hospitality software',
    summary: 'Worked as a senior React engineer on Zonal product interfaces for hospitality operators.',
    bullets: [
      'Built and improved React/TypeScript interfaces for software used by pubs, hotels, restaurants, and venues across the UK.',
      'Focused on maintainable UI architecture, component quality, testing, and repeated workflow usability.',
      'Worked in a product domain where reliability, clear user flows, and fast day-to-day operations mattered.'
    ],
    stack: ['React', 'TypeScript', 'Redux', 'Styled Components', 'Jest', 'React Testing Library'],
    logos: ['/company-logos/expert-allies.jpg', '/company-logos/zonal.jpg'],
    initials: 'Z',
    accent: '#90f0c0'
  },
  {
    company: 'Quickbase',
    role: 'Software Engineer II',
    tenure: 'Aug 2020 - Jan 2023',
    type: 'Full-time · Low-code automation',
    summary: 'Modernized frontend areas of a low-code/no-code automation product while maintaining legacy surfaces.',
    bullets: [
      'Led visual-programming features with loops, conditionals, nesting, and rich component rendering behavior.',
      'Expanded unit, end-to-end, functional, and user-flow test coverage in a team without dedicated QA.',
      'Owned library upgrade research, reusable components, escalations, deployment monitoring, and delivery across multiple epics.',
      'Mentored junior colleagues and received company recognition for delivery impact.'
    ],
    stack: ['React', 'Backbone', 'jQuery', 'Storybook', 'Jest', 'React Testing Library', 'Webpack'],
    logos: ['/company-logos/quickbase.jpg'],
    initials: 'QB',
    accent: '#f0d879'
  },
  {
    company: 'Hakomo',
    role: 'Software Engineer',
    tenure: 'Jan 2020 - Jun 2020',
    type: 'Full-time · Mobile and web products',
    summary: 'Built React Native mobile applications and design-heavy React web interfaces for product stakeholders.',
    bullets: [
      'Developed React Native mobile apps including social networking and education product experiences.',
      'Built a React website for a real-estate appraisal business with strong visual and responsive requirements.',
      'Worked closely with product and design stakeholders on practical UI implementation and delivery.'
    ],
    stack: ['React Native', 'React', 'JavaScript', 'CSS', 'HTML', 'C#'],
    logos: ['/company-logos/hakomo.jpg'],
    initials: 'H',
    accent: '#ff9f73'
  },
  {
    company: 'A1 Bulgaria',
    role: 'Junior Software Engineer',
    tenure: 'Mar 2019 - Nov 2019',
    type: 'Full-time · Telecom software',
    summary: 'Built React, React Native, and C# applications across public-facing and internal engineering tools.',
    bullets: [
      'Worked on TV-box and internal engineering-support software with responsive and remote-control interaction flows.',
      'Built SQL-backed functionality and coordinated with stakeholders around operational support needs.',
      'Contributed to public-facing A1 Bulgaria web work and internal tools used by engineering/support teams.'
    ],
    stack: ['React', 'React Native', 'C#', 'SQL', 'JavaScript', 'Responsive UI'],
    logos: ['/company-logos/a1-bulgaria.jpg'],
    initials: 'A1',
    accent: '#a7d7ff'
  },
  {
    company: 'Evolution Bulgaria',
    role: 'Trainee Software Engineer',
    tenure: 'Jan 2019 - Feb 2019',
    type: 'Professional training',
    summary: 'Completed early professional software engineering training before moving into full-time application development.',
    bullets: [
      'Built foundations across practical software delivery, production-oriented habits, and team workflows.',
      'Used the training period as the bridge into full-time application engineering roles.'
    ],
    stack: ['Engineering Foundations', 'Team Workflows', 'Delivery'],
    logos: ['/company-logos/evolution.jpg'],
    initials: 'EV',
    accent: '#d8b4ff'
  },
  {
    company: 'Independent Products',
    role: 'Full-stack Product Builder',
    tenure: 'Sep 2023 - Present',
    type: 'Public portfolio and product systems',
    summary: 'Built substantial public projects that demonstrate product ownership across games, audio tools, 3D editors, and repo automation.',
    bullets: [
      'Created Memory Dungeon, BBeats, ThreeJS Gem Dungeon Editor, cross-repo libraries, and local/cloud demo tooling.',
      'Covered full product loops: UI systems, runtime logic, content pipelines, testing, screenshots, builds, and deployment paths.',
      'Used the projects as proof of independent execution depth across React, desktop, creative tech, and automation.'
    ],
    stack: ['Electron', 'React', 'TypeScript', 'Three.js', 'Web Audio', 'PixiJS', 'Vite', 'Cloudflare'],
    initials: 'BB',
    accent: '#ff8fd2'
  }
];

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

function HomePage() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [slideDirection, setSlideDirection] = React.useState<1 | -1>(1);
  const activeProject = showcaseProjects[activeIndex] ?? visibleProjects[0];
  const runtimeStatus = useRuntimeStatus();
  const activeRuntime = runtimeStatus?.projects.find((item) => item.slug === activeProject.slug);
  const navigate = useNavigate();

  const selectProject = (nextIndex: number) => {
    if (nextIndex === activeIndex) return;
    const forwardDistance = (nextIndex - activeIndex + showcaseProjects.length) % showcaseProjects.length;
    const backwardDistance = (activeIndex - nextIndex + showcaseProjects.length) % showcaseProjects.length;
    setSlideDirection(forwardDistance <= backwardDistance ? 1 : -1);
    setActiveIndex(nextIndex);
  };

  const setByDirection = (direction: -1 | 1) => {
    setSlideDirection(direction);
    setActiveIndex((current) => (current + direction + showcaseProjects.length) % showcaseProjects.length);
  };

  return (
    <main className="page-shell home-shell">
      <AeroLiquidBackground accent={activeProject.accent} />
      <header className="site-topbar" aria-label="Portfolio header">
        <Link to="/" className="site-mark">
          <MonitorUp size={18} />
          Boris Bostandzhiev
        </Link>
        <nav className="site-pills" aria-label="Portfolio navigation">
          <a href="https://github.com/BorisThoris" target="_blank" rel="noreferrer">
            <Github size={14} />
            GitHub
          </a>
        </nav>
      </header>

      <section className="portfolio-intro" aria-label="Portfolio introduction">
        <div>
          <h1>Interactive web apps, games, and tools.</h1>
        </div>
      </section>

      <section
        id="showcase"
        className="premium-hero"
        aria-label="Portfolio showcase"
        style={{ '--accent': activeProject.accent } as React.CSSProperties}
      >
        <div className="showcase-dock" aria-label="Top projects">
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

        <div
          className={`showcase-slide slide-${slideDirection === 1 ? 'forward' : 'backward'}`}
          key={activeProject.slug}
        >
          <div className="hero-copy project-copy">
            <h2>{activeProject.title}</h2>
            <strong>{activeProject.subtitle}</strong>
            <p>{activeProject.description}</p>
            <div className="tag-row hero-tags">
              {activeProject.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="hero-actions">
              <a
                className="primary-action"
                href={activeRuntime?.effectiveUrl || activeProject.deploymentUrl || activeProject.localUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Play size={17} />
                Open {activeProject.title}
              </a>
              <Link className="quiet-action" to={`/projects/${activeProject.slug}`}>
                Case view
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>

          <button
            className="hero-stage crafted-frame"
            onClick={() => navigate(`/projects/${activeProject.slug}`)}
            aria-label={`Open details for ${activeProject.title}`}
          >
            <ProjectScreenshot project={activeProject} />
            <div className="stage-caption">
              <span className="rank-kicker">0{activeIndex + 1} / 06</span>
            </div>
          </button>
        </div>
      </section>

      <section id="archive" className="archive-section" aria-label="Project archive">
        <div className="section-heading archive-heading">
          <div>
            <p className="eyebrow">Archive</p>
            <h2>Project Archive</h2>
          </div>
          <span>Additional builds, experiments, and supporting interface work.</span>
        </div>

        <div className="archive-grid">
          {moreProjects.map((project) => (
            <Link
              className="archive-card"
              to={`/projects/${project.slug}`}
              key={project.slug}
              style={{ '--accent': project.accent } as React.CSSProperties}
            >
              <ProjectScreenshot project={project} />
              <div>
                <h3>{project.title}</h3>
                <p>{project.subtitle}</p>
                <div className="tag-row compact">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
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
            <article
              className="experience-item"
              key={experience.company}
              style={{ '--accent': experience.accent } as React.CSSProperties}
            >
              <div className="experience-rail" aria-hidden="true">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <CompanyLogo experience={experience} />
              </div>

              <div className="experience-panel crafted-frame">
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

                <div className="tag-row compact experience-stack">
                  {experience.stack.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function CompanyLogo({ experience }: { experience: Experience }) {
  const logos = experience.logos ?? [];

  return (
    <div className={`company-logo ${logos.length > 1 ? 'logo-stack' : ''}`}>
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
    </div>
  );
}

function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);
  const runtimeStatus = useRuntimeStatus();
  const projectRuntime = runtimeStatus?.projects.find((item) => item.slug === project.slug);
  const runtimeUrl = projectRuntime?.effectiveUrl;
  const runtimeIsLocal = runtimeUrl ? /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(runtimeUrl) : false;
  const embedUrl = runtimeUrl && !runtimeIsLocal
    ? runtimeUrl
    : project.deploymentUrl || project.localUrl;
  const embedMode = runtimeUrl && !runtimeIsLocal
    ? projectRuntime?.mode || 'live'
    : project.deploymentUrl ? 'deployed' : 'local';
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
