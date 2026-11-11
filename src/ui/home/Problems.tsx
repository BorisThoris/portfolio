import type { CSSProperties } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { caseStudies } from "../../content/caseStudies";
import { home } from "../../content/home";
import { getProject } from "../../projects";
import { Disclosure } from "../../components/Disclosure";

/** Engineering write-ups as a numbered list: the headline is skimmable, the depth opens on demand. */
export function Problems() {
  return (
    <section id="problems" className="sec" aria-labelledby="problems-title">
      <header className="sec__head">
        <p className="label">03 / Problems solved</p>
        <h2 id="problems-title"><span className="sweep">The parts that were actually hard.</span></h2>
        <p>{home.problemsIntro}</p>
        <p className="hand sec__aside" aria-hidden="true">open a card for the hard part</p>
      </header>
      <ol className="problems">
        {caseStudies.map((study, index) => {
          const project = study.projectSlug ? getProject(study.projectSlug) : undefined;
          return (
            <li key={study.slug} data-reveal style={{ "--tilt": index % 2 ? "0.6deg" : "-0.6deg", "--i": index % 3 } as CSSProperties}>
              <Disclosure
                className="problem"
                summary={
                  <>
                    <span className="num problem__index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="problem__title">
                      <strong>{study.title}</strong>
                      <span className="label">{study.kicker}</span>
                    </span>
                    <Plus className="problem__toggle" size={18} aria-hidden="true" />
                  </>
                }
              >
                <div className="problem__body">
                  <section>
                    <h3 className="label">The problem</h3>
                    <p>{study.problem}</p>
                  </section>
                  <section>
                    <h3 className="label">What I built</h3>
                    <p>{study.approach}</p>
                  </section>
                  <section>
                    <h3 className="label">Hardest part</h3>
                    <p>{study.hardPart}</p>
                  </section>
                  <section>
                    <h3 className="label">How I know it works</h3>
                    <p>{study.outcome}</p>
                  </section>
                  <footer>
                    <ul className="tags" aria-label={`${study.title} technologies`}>
                      {study.tags.map((tag) => <li key={tag}>{tag}</li>)}
                    </ul>
                    {project ? (
                      <Link className="link" to={`/projects/${project.slug}`}>
                        See {project.title} <ArrowUpRight size={14} />
                      </Link>
                    ) : null}
                  </footer>
                </div>
              </Disclosure>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
