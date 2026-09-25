import { capabilityGroups } from '../content/profile';
import { pad2 } from '../lib/format';

export function Capabilities() {
  return (
    <section className="section" aria-label="Technical range">
      <header className="section__head">
        <div>
          <p className="eyebrow">03 / How I build</p>
          <h2>What I work with.</h2>
        </div>
        <p className="section__lede">Mostly React, TypeScript, and Python, plus whatever the project needs.</p>
      </header>
      <div className="capability-grid">
        {capabilityGroups.map((group, index) => (
          <article className="surface capability" key={group.title}>
            <p className="eyebrow">{pad2(index + 1)}</p>
            <h3>{group.title}</h3>
            <p className="muted">{group.purpose}</p>
            <ul className="chips chips--accent" aria-label={`${group.title} core skills`}>
              {group.primary.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
            <ul className="chips chips--compact" aria-label={`${group.title} applied skills`}>
              {group.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
