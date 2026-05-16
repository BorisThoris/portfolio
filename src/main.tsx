import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Code2,
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
  icon: React.ComponentType<{ size?: number }>;
  description: string;
  role: string;
  tenure: string;
  tags: string[];
  screenshot: string;
  accent: string;
};

const experiences: Experience[] = [
  {
    company: 'Man Group',
    icon: BriefcaseBusiness,
    description: 'Own delivery for production risk-analytics and internal software across React/TypeScript frontends, Python services, dashboards, APIs, testing, and deployment configuration.',
    role: 'Project Owner / Full-stack Risk Software Engineer',
    tenure: 'Feb 2024 - Present',
    tags: ['React', 'TypeScript', 'Python', 'Risk Analytics', 'Playwright'],
    screenshot: '/project-shots/portfolio-placeholder.svg',
    accent: '#8bd3ff'
  },
  {
    company: 'Expert Allies / Zonal',
    icon: BriefcaseBusiness,
    description: 'Built and improved React interfaces for Zonal hospitality software used by pubs, hotels, restaurants, and venue operators across the UK.',
    role: 'Senior Software Engineer / Senior React Developer',
    tenure: 'Feb 2023 - Feb 2024',
    tags: ['React', 'TypeScript', 'Redux', 'Jest', 'Product UI'],
    screenshot: '/project-shots/cat-world/main.png',
    accent: '#90f0c0'
  },
  {
    company: 'Quickbase',
    icon: Building2,
    description: 'Modernized frontend areas of a low-code/no-code automation product while maintaining legacy Backbone surfaces and delivering visual-programming features.',
    role: 'Software Engineer II',
    tenure: 'Aug 2020 - Jan 2023',
    tags: ['React', 'Backbone', 'Storybook', 'Jest', 'Low-code'],
    screenshot: '/project-shots/cross-repo-libs/main.png',
    accent: '#f0d879'
  },
  {
    company: 'Hakomo',
    icon: Code2,
    description: 'Developed React Native mobile applications, including social and education products, plus a design-heavy React site for real-estate appraisal workflows.',
    role: 'Software Engineer',
    tenure: 'Jan 2020 - Jun 2020',
    tags: ['React Native', 'React', 'JavaScript', 'Mobile', 'UI'],
    screenshot: '/project-shots/gorilla-gainz/main.png',
    accent: '#ff9f73'
  },
  {
    company: 'A1 Bulgaria',
    icon: Building2,
    description: 'Built React, React Native, and C# applications across public-facing web work, TV-box interfaces, SQL-backed flows, and internal engineering-support tools.',
    role: 'Junior Software Engineer',
    tenure: 'Mar 2019 - Nov 2019',
    tags: ['React', 'React Native', 'C#', 'SQL', 'TV UI'],
    screenshot: '/project-shots/skyfall/main.png',
    accent: '#a7d7ff'
  },
  {
    company: 'Evolution Bulgaria',
    icon: BriefcaseBusiness,
    description: 'Completed early professional software engineering training before moving into full-time application development and product delivery roles.',
    role: 'Trainee Software Engineer',
    tenure: 'Jan 2019 - Feb 2019',
    tags: ['Training', 'Delivery', 'Team Workflows', 'Engineering Foundations'],
    screenshot: '/project-shots/portfolio-placeholder.svg',
    accent: '#d8b4ff'
  },
  {
    company: 'Independent Products',
    icon: Code2,
    description: 'Built substantial public projects including Memory Dungeon, BBeats, ThreeJS Gem Dungeon Editor, reusable cross-repo libraries, and demo deployment tooling.',
    role: 'Full-stack Product Builder',
    tenure: 'Sep 2023 - Present',
    tags: ['Electron', 'Three.js', 'Web Audio', 'Vite', 'Cloudflare'],
    screenshot: '/project-shots/bbeats/main.png',
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

        <div className="experience-grid">
          {experiences.map((experience) => {
            const Icon = experience.icon;

            return (
              <article
                className="experience-card crafted-frame"
                key={experience.company}
                style={{ '--accent': experience.accent } as React.CSSProperties}
              >
                <div className="experience-media">
                  <img
                    src={experience.screenshot}
                    alt={`${experience.company} representative screenshot`}
                    onError={(event) => {
                      event.currentTarget.src = '/project-shots/portfolio-placeholder.svg';
                    }}
                  />
                </div>
                <div className="experience-copy">
                  <div className="company-mark" aria-hidden="true">
                    <Icon size={19} />
                  </div>
                  <div>
                    <p className="experience-company">{experience.company}</p>
                    <h3>{experience.role}</h3>
                    <strong>{experience.tenure}</strong>
                    <p>{experience.description}</p>
                    <div className="tag-row compact">
                      {experience.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
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
