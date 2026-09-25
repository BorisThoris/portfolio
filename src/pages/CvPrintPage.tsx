import React from 'react';
import { AeroLiquidBackground } from '../AeroLiquidBackground';
import { capabilityGroups, cvAdditionalProjects, cvEducation, cvExperience, cvHighlights, cvProjects } from '../content/profile';
import '../cv.css';

export function CvPrintPage() {
  const cvAccent = '#8bd3ff';

  return (
    <main className="cv-print-shell" style={{ '--accent': cvAccent } as React.CSSProperties}>
      <AeroLiquidBackground accent={cvAccent} quality="mobile" />

      <section className="cv-cover cv-panel">
        <div className="cv-cover-copy">
          <p className="eyebrow">Portfolio CV</p>
          <h1>Boris Bostandzhiev</h1>
          <strong>Full-stack Technical Lead / Senior Engineer</strong>
          <p>
            React, TypeScript, Python, C#, data-heavy platforms, AI-assisted workflows, product UI, automation,
            interactive systems, and independent product delivery.
          </p>
        </div>

        <div className="cv-contact-card">
          <span>Sofia, Bulgaria</span>
          <a href="tel:+359897023731">+359 89 702 3731</a>
          <a href="mailto:borisbostandzhiev@yahoo.com">borisbostandzhiev@yahoo.com</a>
          <a href="https://www.linkedin.com/in/boris-b-22566b171/">linkedin.com/in/boris-b-22566b171</a>
          <a href="https://boris-portfolio-git.pages.dev">boris-portfolio-git.pages.dev</a>
          <a href="https://github.com/BorisThoris">github.com/BorisThoris</a>
        </div>
      </section>

      <section className="cv-proof-grid" aria-label="CV highlights">
        {cvHighlights.map((highlight) => (
          <span key={highlight}>{highlight}</span>
        ))}
      </section>

      <section className="cv-panel">
        <div className="cv-section-heading">
          <p className="eyebrow">Experience</p>
          <h2>Professional Work</h2>
        </div>

        <div className="cv-timeline">
          {cvExperience.map((item) => (
            <article className="cv-experience-card" key={item.company} style={{ '--accent': item.accent } as React.CSSProperties}>
              <div className="cv-experience-topline">
                <div>
                  <span>{item.tenure}</span>
                  <h3>{item.company}</h3>
                  <strong>{item.role}</strong>
                </div>
                <div className="cv-stack">
                  {item.stack.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
              <p>{item.summary}</p>
              <ul>
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              {'details' in item && item.details ? (
                <div className="cv-detail-grid">
                  {item.details.map((detail) => (
                    <span key={detail}>{detail}</span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="cv-panel cv-capabilities-panel">
        <div className="cv-section-heading">
          <p className="eyebrow">Range</p>
          <h2>Technical Capability</h2>
        </div>
        <div className="cv-capability-grid">
          {capabilityGroups.map((group) => (
            <article className="cv-capability-card" key={group.title}>
              <h3>{group.title}</h3>
              <p>{group.purpose}</p>
              <div className="cv-stack primary">
                {group.primary.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <div className="cv-stack">
                {group.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="cv-additional-projects">
          {cvAdditionalProjects.map((project) => (
            <article key={project.title}>
              <h3>{project.title}</h3>
              <p>{project.text}</p>
              <div className="cv-stack">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cv-panel">
        <div className="cv-section-heading">
          <p className="eyebrow">Portfolio</p>
          <h2>Selected Independent Products</h2>
        </div>
        <div className="cv-project-grid">
          {cvProjects.map((project) => (
            <article className="cv-project-card" key={project.title} style={{ '--accent': project.accent } as React.CSSProperties}>
              <img src={project.image} alt={`${project.title} screenshot`} />
              <div>
                <span>{project.label}</span>
                <h3>{project.title}</h3>
                <p>{project.text}</p>
                <div className="cv-stack">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cv-panel cv-education-panel">
        <div className="cv-section-heading">
          <p className="eyebrow">Education & Speaking</p>
          <h2>Foundations</h2>
        </div>
        <div className="cv-education-list">
          {cvEducation.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
