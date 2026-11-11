import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Project } from "../../projects";
import { useMediaQuery } from "../../lib/runtime";
import { ProjectTile } from "../Tile";

/** "Keep browsing": a horizontal shelf of other projects with scroll buttons. */
export function Related({ projects }: { projects: Project[] }) {
  const rail = useRef<HTMLUListElement>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [back, setBack] = useState(false);
  const [forward, setForward] = useState(false);
  const update = useCallback(() => {
    const element = rail.current;
    if (!element) return;
    setBack(element.scrollLeft > 4);
    setForward(element.scrollLeft + element.clientWidth < element.scrollWidth - 4);
  }, []);
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [projects, update]);
  if (!projects.length) return null;
  const scroll = (direction: -1 | 1) => rail.current?.scrollBy({ left: direction * Math.max(280, rail.current.clientWidth * 0.8), behavior: reducedMotion ? "instant" : "smooth" });
  return (
    <section className="project-recommendations" aria-labelledby="related-title">
      <header>
        <div>
          <p className="label">Keep browsing</p>
          <h2 id="related-title">More projects</h2>
        </div>
        <div className="related__controls" role="group" aria-label="More projects controls">
          <button type="button" className="icon-button" aria-label="Scroll More projects backward" disabled={!back} onClick={() => scroll(-1)}><ChevronLeft size={17} /></button>
          <button type="button" className="icon-button" aria-label="Scroll More projects forward" disabled={!forward} onClick={() => scroll(1)}><ChevronRight size={17} /></button>
        </div>
      </header>
      <ul className="project-shelf__rail" ref={rail} onScroll={update}>
        {projects.map((project) => <li key={project.slug}><ProjectTile project={project} /></li>)}
      </ul>
    </section>
  );
}
