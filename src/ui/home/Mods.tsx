import { visibleProjects } from "../../projects";
import { formatAsOf, tractionNote, tractionSummary } from "../../projectTraction";
import { ProjectTile } from "../Tile";
import { Stats } from "../Stats";

/** Released game mods and the numbers they have earned on public platforms. */
export function Mods() {
  const mods = tractionSummary.projects.flatMap((slug) => visibleProjects.filter((project) => project.slug === slug));
  return (
    <section id="mods" className="sec" aria-labelledby="mods-title">
      <header className="sec__head">
        <p className="label">03 / Released mods · counted {formatAsOf()}</p>
        <h2 id="mods-title"><span className="sweep">{tractionSummary.title}</span></h2>
        <p>{tractionSummary.lede}</p>
        <p className="hand sec__aside" aria-hidden="true">counted from the platforms, not guessed</p>
      </header>
      <Stats stats={tractionSummary.stats} label="Mod release numbers" />
      <ul className="tile-grid" aria-label="Released mods">
        {mods.map((project) => <li key={project.slug}><ProjectTile project={project} /></li>)}
      </ul>
      <p className="footnote">{tractionNote}</p>
    </section>
  );
}
