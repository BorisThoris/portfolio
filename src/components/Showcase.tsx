// The showcase carousel: one project per slide, the neighbours peeking in at
// the edges so the strip reads as one, a tab per project above it, arrows and
// dots. It follows the carousel rules the rest of the site keeps to:
//
// - one slide in view, always the same shape (a 16:9 picture and the copy);
// - the tabs, the dots, the arrows and a drag all move the same index;
// - autoplay only when nothing else is happening: it pauses on hover, focus,
//   a drag, an open dialog, a hidden tab, and never runs with reduced motion;
// - arrow keys move it when it has focus; the active slide is announced;
// - the picture opens the project page, the buttons open the app.

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Film, Play } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useReducedMotion } from 'framer-motion';
import { getProjectDetails, Project } from '../projects';
import { resolveProjectUrl, RuntimeStatus, useIsPhone } from '../lib/runtime';
import { pad2 } from '../lib/format';
import { CaptureImage } from './CaptureImage';

const AUTOPLAY_MS = 8000;

export function Showcase({
  projects,
  runtimeStatus,
  paused,
  onActiveChange
}: {
  projects: Project[];
  runtimeStatus: RuntimeStatus | null;
  paused: boolean;
  onActiveChange: (project: Project) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const isPhone = useIsPhone();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [engaged, setEngaged] = React.useState(false);
  const [viewportRef, embla] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    loop: projects.length > 2,
    duration: shouldReduceMotion ? 12 : 26,
    skipSnaps: true
  });
  const tabsRef = React.useRef<HTMLDivElement | null>(null);
  const pointer = React.useRef({ x: 0, y: 0, moved: false });
  const swallowClick = React.useRef(false);

  React.useEffect(() => {
    if (!embla) return;
    const update = () => setActiveIndex(embla.selectedScrollSnap());
    update();
    embla.on('select', update);
    embla.on('reInit', update);
    return () => {
      embla.off('select', update);
      embla.off('reInit', update);
    };
  }, [embla]);

  React.useEffect(() => {
    const project = projects[activeIndex];
    if (project) onActiveChange(project);
  }, [activeIndex, onActiveChange, projects]);

  // keep the active tab in view on a phone, where the tab strip scrolls
  React.useEffect(() => {
    const strip = tabsRef.current;
    const tab = strip?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    if (!strip || !tab) return;
    const target = tab.offsetLeft - strip.clientWidth / 2 + tab.offsetWidth / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  }, [activeIndex, shouldReduceMotion]);

  React.useEffect(() => {
    if (!embla || paused || engaged || shouldReduceMotion || isPhone) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) embla.scrollNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [embla, engaged, isPhone, paused, shouldReduceMotion]);

  const go = (index: number) => embla?.scrollTo(index);
  const step = (direction: -1 | 1) => (direction < 0 ? embla?.scrollPrev() : embla?.scrollNext());

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    }
  };

  const active = projects[activeIndex];

  return (
    <section
      id="showcase"
      className="showcase"
      aria-roledescription="carousel"
      aria-label="Selected projects"
      style={{ '--accent': active?.accent } as React.CSSProperties}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setEngaged(false);
      }}
      onKeyDown={onKeyDown}
    >
      <div className="showcase__head">
        <div className="showcase__tabs" role="tablist" aria-label="Projects" ref={tabsRef}>
          {projects.map((project, index) => (
            <button
              type="button"
              role="tab"
              className="showcase__tab"
              key={project.slug}
              aria-selected={index === activeIndex}
              aria-controls={`showcase-slide-${project.slug}`}
              tabIndex={index === activeIndex ? 0 : -1}
              style={{ '--accent': project.accent } as React.CSSProperties}
              onClick={() => go(index)}
            >
              <span className="showcase__tab-index">{pad2(index + 1)}</span>
              <span className="showcase__tab-title">{project.title}</span>
            </button>
          ))}
        </div>
        <div className="showcase__arrows">
          <button type="button" className="icon-button" onClick={() => step(-1)} aria-label="Previous project">
            <ArrowLeft size={18} />
          </button>
          <button type="button" className="icon-button" onClick={() => step(1)} aria-label="Next project">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div
        className="showcase__viewport"
        ref={viewportRef}
        onPointerDown={(event) => {
          pointer.current = { x: event.clientX, y: event.clientY, moved: false };
        }}
        onPointerMove={(event) => {
          if (Math.abs(event.clientX - pointer.current.x) > 8 || Math.abs(event.clientY - pointer.current.y) > 8) {
            pointer.current.moved = true;
          }
        }}
        onPointerUp={() => {
          if (!pointer.current.moved) return;
          swallowClick.current = true;
          window.setTimeout(() => {
            swallowClick.current = false;
          }, 250);
        }}
        onClickCapture={(event) => {
          if (!swallowClick.current) return;
          swallowClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div className="showcase__track">
          {projects.map((project, index) => {
            const isActive = index === activeIndex;
            const runtime = runtimeStatus?.projects.find((item) => item.slug === project.slug);
            const href = resolveProjectUrl(project, runtime).url;
            const details = getProjectDetails(project.slug);
            const hasTrailer = Boolean(details?.trailers?.length);
            const isGame = project.tags.some((tag) => /game|arcade|roguelite/i.test(tag));
            return (
              <article
                className="showcase__slide"
                id={`showcase-slide-${project.slug}`}
                key={project.slug}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${projects.length}: ${project.title}`}
                aria-hidden={!isActive}
                style={{ '--accent': project.accent } as React.CSSProperties}
              >
                <div
                  className="showcase__stage"
                  role="link"
                  tabIndex={isActive ? 0 : -1}
                  aria-label={`${project.title}: trailer and details`}
                  onClick={() => navigate(`/projects/${project.slug}`)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    navigate(`/projects/${project.slug}`);
                  }}
                >
                  <CaptureImage project={project} priority={isActive} />
                  <span className="showcase__count">
                    {pad2(index + 1)} / {pad2(projects.length)}
                  </span>
                  {hasTrailer ? (
                    <span className="showcase__badge">
                      <Film size={13} />
                      Trailer
                    </span>
                  ) : null}
                </div>

                <div className="showcase__copy">
                  <h2>{project.title}</h2>
                  <p className="showcase__subtitle">{project.subtitle}</p>
                  <p className="showcase__description">{project.description}</p>
                  <ul className="chips" aria-label="Tags">
                    {project.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <div className="showcase__actions">
                    <a className="btn btn--primary" href={href} target="_blank" rel="noreferrer" tabIndex={isActive ? 0 : -1}>
                      <Play size={16} />
                      {isGame ? 'Play' : 'Open'}
                    </a>
                    <Link className="btn btn--quiet" to={`/projects/${project.slug}`} tabIndex={isActive ? 0 : -1}>
                      {hasTrailer ? 'Trailer & details' : 'Details'}
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="showcase__dots" aria-hidden="true">
        {projects.map((project, index) => (
          <button
            type="button"
            className={index === activeIndex ? 'is-active' : undefined}
            key={project.slug}
            tabIndex={-1}
            onClick={() => go(index)}
          />
        ))}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {active ? `Showing ${active.title}, ${activeIndex + 1} of ${projects.length}` : ''}
      </p>
    </section>
  );
}
