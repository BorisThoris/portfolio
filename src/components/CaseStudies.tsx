import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { caseStudies } from "../content/caseStudies";
import { home } from "../content/home";
import { getProject } from "../projects";
import { pad2 } from "../lib/format";
import { Disclosure } from "./Disclosure";
import "../case-studies.css";

export function CaseStudies() {
  return (
    <section
      id="problems"
      className="section case-studies"
      aria-labelledby="problems-title"
    >
      <header className="section__head">
        <div>
          <p className="eyebrow">02 / Problems solved</p>
          <h2 id="problems-title">The parts that were actually hard.</h2>
        </div>
        <p className="section__lede">{home.problemsIntro}</p>
      </header>
      <ol className="case-study-list">
        {caseStudies.map((study, index) => {
          const project = study.projectSlug ? getProject(study.projectSlug) : undefined;
          return (
            <li className="surface case-study" key={study.slug}>
              <div className="case-study__head">
                <p className="eyebrow">{pad2(index + 1)}</p>
                <div>
                  <h3>{study.title}</h3>
                  <p className="case-study__kicker muted">{study.kicker}</p>
                </div>
              </div>
              <div className="case-study__body">
                <div className="case-study__block">
                  <h4>The problem</h4>
                  <p>{study.problem}</p>
                </div>
                <div className="case-study__block">
                  <h4>What I built</h4>
                  <p>{study.approach}</p>
                </div>
              </div>
              <Disclosure
                className="case-study__detail"
                summary={<span>The hard part, and how it is verified</span>}
              >
                <div className="case-study__block">
                  <h4>Hardest part</h4>
                  <p>{study.hardPart}</p>
                </div>
                <div className="case-study__block">
                  <h4>How I know it works</h4>
                  <p>{study.outcome}</p>
                </div>
              </Disclosure>
              <footer className="case-study__foot">
                <ul className="chips chips--compact" aria-label={`${study.title} technologies`}>
                  {study.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                {project ? (
                  <Link className="case-study__link" to={`/projects/${project.slug}`}>
                    See {project.title} <ArrowUpRight size={15} />
                  </Link>
                ) : null}
              </footer>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
