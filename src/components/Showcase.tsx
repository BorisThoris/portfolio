import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Project } from "../projects";
import { useMediaQuery } from "../lib/runtime";
import { pad2 } from "../lib/format";
import { CaptureImage } from "./CaptureImage";
import { categoryFor } from "../content/home";

export function Showcase({ projects }: { projects: Project[] }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [viewportRef, embla] = useEmblaCarousel({
    align: "start",
    loop: true,
    duration: reducedMotion ? 0 : 25,
  });
  const tabsRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!embla) return;
    const update = () => setActiveIndex(embla.selectedScrollSnap());
    update();
    embla.on("select", update);
    embla.on("reInit", update);
    return () => {
      embla.off("select", update);
      embla.off("reInit", update);
    };
  }, [embla]);
  React.useEffect(() => {
    const strip = tabsRef.current;
    const tab = strip?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (strip && tab)
      strip.scrollTo({
        left:
          tab.offsetLeft -
          strip.offsetLeft -
          strip.clientWidth / 2 +
          tab.offsetWidth / 2,
        behavior: reducedMotion ? "instant" : "smooth",
      });
  }, [activeIndex, reducedMotion]);
  function onTabKey(event: React.KeyboardEvent, index: number) {
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? projects.length - 1
          : event.key === "ArrowRight"
            ? (index + 1) % projects.length
            : event.key === "ArrowLeft"
              ? (index - 1 + projects.length) % projects.length
              : null;
    if (next === null) return;
    event.preventDefault();
    embla?.scrollTo(next, reducedMotion);
    tabsRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus({ preventScroll: true });
  }
  return (
    <div
      className="featured"
      role="region"
      aria-roledescription="carousel"
      aria-label="Selected projects"
    >
      <div className="featured__viewport" ref={viewportRef}>
        <div className="featured__track">
          {projects.map((project, index) => (
            <div
              className="featured__slide"
              key={project.slug}
              id={`project-panel-${project.slug}`}
              role="tabpanel"
              aria-labelledby={`project-tab-${project.slug}`}
              aria-hidden={index !== activeIndex}
              inert={index !== activeIndex}
            >
              <Link
                className="featured__image"
                to={`/projects/${project.slug}`}
                tabIndex={index === activeIndex ? 0 : -1}
                aria-label={`Explore ${project.title}`}
              >
                <CaptureImage project={project} />
                <span className="featured__image-link">
                  <ArrowUpRight size={24} />
                </span>
              </Link>
              <div className="featured__copy">
                <p className="eyebrow">
                  {pad2(index + 1)} / {categoryFor(project.tags)}
                </p>
                <h3>{project.title}</h3>
                <p className="featured__subtitle">{project.subtitle}</p>
                <p className="featured__description">{project.description}</p>
                <ul className="chips">
                  {project.tags.slice(0, 4).map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <div className="featured__actions">
                  <Link
                    className="btn btn--primary"
                    to={`/projects/${project.slug}`}
                  >
                    Explore project <ArrowUpRight size={16} />
                  </Link>
                  {project.deploymentUrl ? (
                    <a
                      className="hero__text-link"
                      href={project.deploymentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Live demo <ArrowUpRight size={14} />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="featured__controls">
        <div
          className="featured__tabs"
          role="tablist"
          aria-label="Select project"
          ref={tabsRef}
        >
          {projects.map((project, index) => (
            <button
              type="button"
              role="tab"
              key={project.slug}
              id={`project-tab-${project.slug}`}
              aria-controls={`project-panel-${project.slug}`}
              aria-selected={index === activeIndex}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => embla?.scrollTo(index, reducedMotion)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              <span>{pad2(index + 1)}</span>
              {project.title}
            </button>
          ))}
        </div>
        <div className="featured__arrows">
          <button
            className="icon-button"
            type="button"
            aria-label="Previous project"
            onClick={() => embla?.scrollPrev(reducedMotion)}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Next project"
            onClick={() => embla?.scrollNext(reducedMotion)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        Showing {projects[activeIndex]?.title}, {activeIndex + 1} of{" "}
        {projects.length}
      </p>
    </div>
  );
}
