import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { moreProjects } from '../projects';
import { CaptureImage } from './CaptureImage';

export function SupportingProjects() {
  const [open, setOpen] = React.useState(false);
  return (
    <section id="archive" className="section" aria-label="Supporting projects">
      <details className="surface disclosure" onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary className="disclosure__summary">
          <div>
            <p className="eyebrow">Supporting work</p>
            <h2>{moreProjects.length} more projects</h2>
          </div>
          <span className="icon-button" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
        </summary>
        {open ? (
          <ul className="project-list">
            {moreProjects.map((project) => (
              <li key={project.slug}>
                <Link className="project-row" to={`/projects/${project.slug}`} style={{ '--accent': project.accent } as React.CSSProperties}>
                  <CaptureImage project={project} />
                  <span className="project-row__copy">
                    <strong>{project.title}</strong>
                    <span>{project.subtitle}</span>
                  </span>
                  <span className="project-row__tags">{project.tags.slice(0, 3).join(' · ')}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </details>
    </section>
  );
}
