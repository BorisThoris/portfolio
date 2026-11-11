import { visibleProjects } from "../projects";
import { formatAsOf, tractionNote, tractionSummary } from "../projectTraction";
import { ProjectTile } from "./ProjectShelf";
import { TractionStats } from "./TractionStats";

/** Released game mods, with the download and view counts they have earned. */
export function ModTraction() {
  const mods = tractionSummary.projects.flatMap((slug) => visibleProjects.filter((project) => project.slug === slug));
  return (
    <section id="mods" className="section mod-traction" aria-labelledby="mods-title">
      <header className="section__head">
        <div>
          <p className="eyebrow">Released mods</p>
          <h2 id="mods-title">{tractionSummary.title}</h2>
        </div>
        <p className="section__lede">{tractionSummary.lede}</p>
      </header>
      <TractionStats stats={tractionSummary.stats} label="Mod release numbers" />
      <ul className="mod-traction__grid" aria-label="Released mods">
        {mods.map((project) => (
          <li key={project.slug}><ProjectTile project={project} /></li>
        ))}
      </ul>
      <p className="traction-note">As of {formatAsOf()}. {tractionNote}</p>
    </section>
  );
}
