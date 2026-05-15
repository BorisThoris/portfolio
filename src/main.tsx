import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Github,
  MonitorUp,
  Play,
  Sparkles
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
  const activeProject = showcaseProjects[activeIndex] ?? visibleProjects[0];
  const runtimeStatus = useRuntimeStatus();
  const activeRuntime = runtimeStatus?.projects.find((item) => item.slug === activeProject.slug);
  const navigate = useNavigate();

  const setByDirection = (direction: -1 | 1) => {
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
          <p className="eyebrow">
            <Sparkles size={15} />
            Boris Bostandzhiev
          </p>
          <h1>Interactive web apps, games, and tools.</h1>
        </div>
        <p>
          Selected browser projects across music creation, 3D editors, games,
          dashboards, and ecommerce demos.
        </p>
      </section>

      <section
        id="showcase"
        className="premium-hero"
        aria-label="Portfolio showcase"
        style={{ '--accent': activeProject.accent } as React.CSSProperties}
      >
        <div className="hero-copy project-copy">
          <p className="eyebrow">
            <span>{String(activeIndex + 1).padStart(2, '0')} / {String(showcaseProjects.length).padStart(2, '0')}</span>
            Featured project
          </p>
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

        <div className="showcase-dock" aria-label="Top projects">
          {showcaseProjects.map((project, index) => (
            <button
              className={`dock-item ${index === activeIndex ? 'active' : ''}`}
              key={project.slug}
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
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
    </main>
  );
}

function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);
  const runtimeStatus = useRuntimeStatus();
  const projectRuntime = runtimeStatus?.projects.find((item) => item.slug === project.slug);
  const embedUrl = projectRuntime?.effectiveUrl || project.deploymentUrl || project.localUrl;
  const embedMode = projectRuntime?.mode || (project.deploymentUrl ? 'deployed' : 'local');
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
      <nav className="top-nav">
        <Link to="/" className="site-mark">
          <MonitorUp size={18} />
          Boris Bostandzhiev
        </Link>
        <div className="nav-links">
          {visibleProjects.map((item) => (
            <Link className={item.slug === project.slug ? 'current' : ''} to={`/projects/${item.slug}`} key={item.slug}>
              {item.title}
            </Link>
          ))}
        </div>
      </nav>

      <section className="detail-panel" style={{ '--accent': project.accent } as React.CSSProperties}>
        <div className="detail-header">
          <div>
            <p className="eyebrow">
              <Sparkles size={15} />
              Project Preview
            </p>
            <h1>{project.title}</h1>
            <p>{project.description}</p>
          </div>
          <a className="primary-action" href={embedUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={17} />
            Open app
          </a>
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
                <h2>Start this local app to use the live embed</h2>
                <p>{project.runCommand}</p>
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

        <div className="detail-meta">
          <div>
            <strong>Repository</strong>
            <span>{project.repoPath}</span>
          </div>
          <div>
            <strong>Run command</strong>
            <span>{project.runCommand}</span>
          </div>
          <div>
            <strong>Build command</strong>
            <span>{project.buildCommand}</span>
          </div>
        </div>

        <div className="analysis-panel">
          <div className="priority-orb">
            <strong>{project.priorityScore}</strong>
            <span>Priority</span>
          </div>
          <ScoreLine label="Demo" value={project.demoabilityScore} />
          <ScoreLine label="Depth" value={project.depthScore} />
          <ScoreLine label="Polish" value={project.polishScore} />
          <ScoreLine label="Unique" value={project.uniquenessScore} />
          <ScoreLine label="Maintain" value={project.maintenanceScore} />
          <p>{project.analysisNotes}</p>
        </div>
      </section>
    </main>
  );
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-line">
      <span>{label}</span>
      <meter min="0" max="100" value={value} />
      <strong>{value}</strong>
    </div>
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
