import { ArrowDown, ArrowUpRight, Code2 } from "lucide-react";
import { Link } from "react-router-dom";
import { visibleProjects } from "../projects";
import { home, featuredSlugs } from "../content/home";
import { Showcase } from "../components/Showcase";
import { SupportingProjects } from "../components/SupportingProjects";
import { ExperienceSection } from "../components/Experience";
import { Capabilities } from "../components/Capabilities";
import { ContactSection } from "../components/ContactSection";
import { CaptureImage } from "../components/CaptureImage";
import "../home.css";

const featured = featuredSlugs.flatMap((slug) =>
  visibleProjects.filter((project) => project.slug === slug),
);

export function HomePage() {
  return (
    <div className="shell home-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <Link to="/" className="wordmark">
          <span className="monogram">
            bb<span>.</span>
          </span>
          <span>
            Boris
            <br />
            Bostandzhiev
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#work">Work</a>
          <a href="#experience">Experience</a>
          <Link to="/cv-print">
            Résumé <ArrowUpRight size={13} />
          </Link>
        </nav>
        <a className="header-contact" href="#contact">
          Let’s talk <ArrowUpRight size={16} />
        </a>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="hero" aria-labelledby="intro-title">
          <div className="hero__copy">
            <p className="eyebrow">
              <span className="status-dot" />
              {home.role}
            </p>
            <h1 id="intro-title">
              {home.headline[0]}
              <br />
              <span>{home.headline[1]}</span>
            </h1>
            <p className="hero__description">{home.introduction}</p>
            <div className="hero__actions">
              <a className="btn btn--primary btn--large" href="#work">
                Explore my work <ArrowDown size={17} />
              </a>
              <a className="hero__text-link" href="#experience">
                Work history <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__visual-label">
              <Code2 size={15} />
              <span>A few things I’ve made</span>
            </div>
            <Link
              className="hero-project hero-project--main"
              to="/projects/bbeats"
            >
              <div className="mini-window" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>bbeats / creative tools</span>
              </div>
              <CaptureImage project={featured[0]} priority />
              <span className="hero-project__caption">
                Make a beat in the browser.
                <ArrowUpRight size={17} />
              </span>
            </Link>
            <Link
              className="hero-project hero-project--small"
              to="/projects/memory-dungeon"
            >
              <CaptureImage
                project={featured[1]}
                sizes="(max-width: 760px) 50vw, 25vw"
              />
              <span className="hero-project__caption">
                A memory game with teeth.
                <ArrowUpRight size={15} />
              </span>
            </Link>
            <span className="hero__annotation">
              Built after hours <span aria-hidden="true">↗</span>
            </span>
          </div>
        </section>
        <div className="credentials" aria-label="Professional background">
          <span>I’ve worked at</span>
          <strong>Man Group</strong>
          <strong>Quickbase</strong>
          <strong>Zonal</strong>
          <strong>A1 Bulgaria</strong>
          <span className="credentials__note">
            Since 2019.
            <br />
            Based in Sofia.
          </span>
        </div>
        <section
          id="work"
          className="section work-section"
          aria-labelledby="work-title"
        >
          <header className="section__head">
            <div>
              <p className="eyebrow">01 / Selected work</p>
              <h2 id="work-title">Projects I’d show first.</h2>
            </div>
            <p className="section__lede">{home.workIntro}</p>
          </header>
          <Showcase projects={featured} />
        </section>
        <SupportingProjects />
        <ExperienceSection />
        <Capabilities />
        <ContactSection />
      </main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Boris Bostandzhiev</span>
        <span>Based in Sofia. Usually building something.</span>
        <a href="#main-content">Back to top ↑</a>
      </footer>
    </div>
  );
}
