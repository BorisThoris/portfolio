import { ArrowUpRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { capabilityGroups, experiences, type Experience as Job } from "../../content/profile";
import { home } from "../../content/home";
import { Disclosure } from "../../components/Disclosure";

/** A dated timeline: what, where, when at a glance; the detail opens per role. */
export function Experience() {
  return (
    <section id="experience" className="sec" aria-labelledby="experience-title">
      <header className="sec__head">
        <p className="label">06 / Experience</p>
        <h2 id="experience-title"><span className="sweep">Where I’ve worked.</span></h2>
        <p>{home.experienceIntro}</p>
      </header>
      <ol className="timeline notebook">
        {experiences.map((job) => (
          <li key={job.company}>
            <Disclosure className="experience-item" summary={<JobSummary job={job} />}>
              <JobDetail job={job} />
            </Disclosure>
          </li>
        ))}
      </ol>
      <Link className="link" to="/cv-print">View the full résumé <ArrowUpRight size={14} /></Link>

      <div className="skills" aria-labelledby="skills-title">
        <h3 id="skills-title" className="label">What I work with</h3>
        <dl>
          {capabilityGroups.map((group) => (
            <div key={group.title}>
              <dt>{group.title}</dt>
              <dd>
                <p>{group.purpose}</p>
                <ul className="tags" aria-label={`${group.title} skills`}>
                  {[...group.primary, ...group.skills].map((skill) => <li key={skill}>{skill}</li>)}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function JobSummary({ job }: { job: Job }) {
  return (
    <>
      <span className="job__when num">{job.tenure}</span>
      <span className="job__logo" aria-hidden="true">
        <span>{job.initials}</span>
        {job.logos?.slice(0, 1).map((logo) => (
          <img key={logo} src={logo} width={64} height={64} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        ))}
      </span>
      <span className="job__what">
        <strong>{job.company}</strong>
        <span>{job.role}</span>
      </span>
      <Plus className="job__toggle" size={18} aria-hidden="true" />
    </>
  );
}

function JobDetail({ job }: { job: Job }) {
  return (
    <div className="job__detail">
      <p className="job__summary">{job.summary}</p>
      <ul className="job__bullets">
        {job.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
      </ul>
      {job.detailSections?.map((section) => (
        <div key={section.title}>
          <h4 className="label">{section.title}</h4>
          <ul className="job__bullets">
            {section.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
      <ul className="tags" aria-label={`${job.company} stack`}>
        {job.stack.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
      {job.contextProjects?.length ? (
        <div className="job__context">
          {job.contextProjects.map((context) => (
            <details key={context.title}>
              <summary>{context.title}<Plus size={15} aria-hidden="true" /></summary>
              <div>
                {context.image ? <img src={context.image} alt={`${context.title} public product screenshot`} width={1440} height={900} loading="lazy" /> : null}
                <p>{context.relationshipText}</p>
                <p>{context.summary}</p>
                {context.sourceUrl ? (
                  <a className="link" href={context.sourceUrl} target="_blank" rel="noreferrer">{context.sourceLabel}<ArrowUpRight size={14} /></a>
                ) : <span className="label">{context.sourceLabel}</span>}
              </div>
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}
