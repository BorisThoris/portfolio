import { ArrowUpRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Experience, experiences } from "../content/profile";
import { home } from "../content/home";
import { Disclosure } from "./Disclosure";

export function ExperienceSection() {
  return (
    <section
      id="experience"
      className="section experience-section"
      aria-labelledby="experience-title"
    >
      <header className="section__head">
        <div>
          <p className="eyebrow">02 / Work history</p>
          <h2 id="experience-title">Where I’ve worked.</h2>
        </div>
        <p className="section__lede">{home.experienceIntro}</p>
      </header>
      <div className="experience-list">
        {experiences.map((experience) => (
          <Disclosure
            className="experience-item"
            key={experience.company}
            summary={
              <>
                <span className="experience-item__year">
                  {experience.startYear}
                </span>
                <CompanyLogo experience={experience} />
                <span className="experience-item__role">
                  <strong>{experience.company}</strong>
                  <span>{experience.role}</span>
                </span>
                <span className="experience-item__tenure">
                  {experience.tenure}
                </span>
                <Plus className="experience-item__toggle" size={20} />
              </>
            }
          >
            <div className="experience-item__body">
              <p>{experience.summary}</p>
              <ul className="bullets">
                {experience.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              {experience.detailSections?.map((section) => (
                <div className="experience-detail" key={section.title}>
                  <h4>{section.title}</h4>
                  <ul className="bullets">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <ul className="chips">
                {experience.stack.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              {experience.contextProjects?.length ? (
                <div className="experience-contexts">
                  {experience.contextProjects.map((context) => (
                    <details key={context.title} className="experience-context">
                      <summary>
                        {context.title}
                        <Plus size={16} />
                      </summary>
                      <div>
                        {context.image ? (
                          <img
                            src={context.image}
                            alt={`${context.title} public product screenshot`}
                            width={1440}
                            height={900}
                            loading="lazy"
                          />
                        ) : null}
                        <p>{context.relationshipText}</p>
                        <p>{context.summary}</p>
                        {context.sourceUrl ? (
                          <a
                            className="text-link"
                            href={context.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {context.sourceLabel}
                            <ArrowUpRight size={15} />
                          </a>
                        ) : (
                          <span className="muted">{context.sourceLabel}</span>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              ) : null}
            </div>
          </Disclosure>
        ))}
      </div>
      <Link className="hero__text-link experience-resume" to="/cv-print">
        View the full résumé <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}

export function CompanyLogo({
  experience,
}: {
  experience: Pick<Experience, "company" | "logos" | "initials">;
}) {
  return (
    <div className="company-logo" aria-hidden="true">
      <span>{experience.initials}</span>
      {experience.logos?.slice(0, 1).map((logo) => (
        <img
          src={logo}
          width={64}
          height={64}
          alt=""
          loading="lazy"
          key={logo}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ))}
    </div>
  );
}
