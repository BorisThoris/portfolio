import { Link } from "react-router-dom";
import { capabilityGroups } from "../content/profile";
import { cvEducation, cvExperience } from "../content/resume";
import { getProject } from "../projects";
import "../cv.css";

const selectedProjects = ["bbeats", "memory-dungeon", "vyb-chess"].flatMap(
  (slug) => {
    const project = getProject(slug);
    return project ? [project] : [];
  },
);
export function CvPrintPage() {
  return (
    <main className="resume-shell" tabIndex={-1}>
      <nav className="cv-toolbar" aria-label="Résumé actions">
        <Link className="btn" to="/">
          Back to portfolio
        </Link>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => window.print()}
        >
          Print / Save PDF
        </button>
      </nav>
      <article className="resume-document">
        <header className="resume-header">
          <div>
            <p className="resume-kicker">
              Software engineering · Sofia, Bulgaria
            </p>
            <h1>Boris Bostandzhiev</h1>
            <p className="resume-role">
              Full-stack engineer &amp; product builder
            </p>
          </div>
          <address>
            <a href="mailto:borisbostandzhiev@yahoo.com">
              borisbostandzhiev@yahoo.com
            </a>
            <a href="tel:+359897023731">+359 89 702 3731</a>
            <a href="https://github.com/BorisThoris">github.com/BorisThoris</a>
            <a href="https://www.linkedin.com/in/boris-b-22566b171/">
              LinkedIn profile
            </a>
            <a href="https://boris-portfolio-git.pages.dev/">
              Portfolio &amp; live projects
            </a>
          </address>
        </header>
        <p className="resume-summary">
          Full-stack engineer working across React, TypeScript, Python, and C#.
          Experience in investment technology, visual programming, hospitality,
          and mobile products, alongside independent music tools, games, and
          interactive applications.
        </p>
        <section className="resume-section" aria-labelledby="resume-experience">
          <h2 id="resume-experience">Experience</h2>
          {cvExperience.map((experience, index) => (
            <section className="resume-job" key={experience.company}>
              <div className="resume-job__heading">
                <h3>{experience.company}</h3>
                <span>{experience.tenure}</span>
              </div>
              <p className="resume-job__role">{experience.role}</p>
              <p>{experience.summary}</p>
              <ul>
                {(index === 0
                  ? experience.bullets.slice(1, 4)
                  : experience.bullets.slice(0, 3)
                ).map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <p className="resume-stack">{experience.stack.join(" · ")}</p>
            </section>
          ))}
        </section>
        <section className="resume-section" aria-labelledby="resume-projects">
          <h2 id="resume-projects">Selected independent work</h2>
          <div className="resume-projects">
            {selectedProjects.map((project) => (
              <section className="resume-project" key={project.slug}>
                <h3>
                  <Link to={`/projects/${project.slug}`}>{project.title}</Link>
                </h3>
                <p>{project.description}</p>
                <p className="resume-stack">{project.tags.join(" · ")}</p>
              </section>
            ))}
          </div>
        </section>
        <section className="resume-section" aria-labelledby="resume-skills">
          <h2 id="resume-skills">Technical range</h2>
          <dl className="resume-skills">
            {capabilityGroups.map((group) => (
              <div key={group.title}>
                <dt>{group.title}</dt>
                <dd>{group.primary.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="resume-section" aria-labelledby="resume-education">
          <h2 id="resume-education">Education &amp; speaking</h2>
          <ul className="resume-education">
            {cvEducation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
