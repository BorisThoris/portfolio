import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, X } from 'lucide-react';
import {
  DisplayProfessionalContext,
  Experience,
  experiences,
  toDisplayContext
} from '../content/profile';
import { useIsPhone } from '../lib/runtime';

export function ExperienceSection({ onDialogChange }: { onDialogChange: (open: boolean) => void }) {
  const isPhone = useIsPhone();
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [selectedContext, setSelectedContext] = React.useState<DisplayProfessionalContext | null>(null);
  const selected = selectedIndex === null ? null : experiences[selectedIndex];

  React.useEffect(() => {
    const open = Boolean(selected || selectedContext);
    onDialogChange(open);
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectedContext) setSelectedContext(null);
      else setSelectedIndex(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onDialogChange, selected, selectedContext]);

  return (
    <section id="experience" className="section" aria-label="Employment and experience">
      <header className="section__head">
        <div>
          <p className="eyebrow">Experience</p>
          <h2>Employment &amp; product work</h2>
        </div>
        <p className="section__lede">CV-backed employment history, kept public-safe where company work is not shareable as screenshots.</p>
      </header>

      <ol className="timeline">
        {experiences.map((experience, index) => (
          <li className="timeline__item" key={experience.company} style={{ '--accent': experience.accent } as React.CSSProperties}>
            <div className="timeline__rail">
              <span className="timeline__year">{experience.startYear}</span>
              <CompanyLogo experience={experience} layoutId={isPhone ? undefined : `experience-logo-${index}`} />
            </div>

            <motion.article
              className="surface timeline__card"
              layoutId={isPhone ? undefined : `experience-card-${index}`}
              role="button"
              tabIndex={0}
              aria-haspopup="dialog"
              aria-label={`Open details for ${experience.company}`}
              onClick={() => setSelectedIndex(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedIndex(index);
                }
              }}
              whileHover={isPhone ? undefined : { y: -2 }}
              initial={false}
            >
              <div className="timeline__topline">
                <div>
                  <p className="eyebrow">{experience.company}</p>
                  <h3>{experience.role}</h3>
                </div>
                <span className="chip chip--meta">
                  <CalendarDays size={14} />
                  {experience.tenure}
                </span>
              </div>
              <p className="timeline__type">{experience.type}</p>
              <p className="timeline__summary">{experience.summary}</p>
              <ul className="bullets">
                {experience.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              {experience.contextProjects?.length ? (
                <ContextStrip
                  contexts={experience.contextProjects.map((project) => toDisplayContext(experience, project))}
                  onSelect={setSelectedContext}
                />
              ) : null}
              <ul className="chips chips--compact" aria-label="Stack">
                {experience.stack.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </motion.article>
          </li>
        ))}
      </ol>

      <AnimatePresence>
        {selected && selectedIndex !== null ? (
          <ExperienceDialog
            experience={selected}
            index={selectedIndex}
            onSelectContext={setSelectedContext}
            onClose={() => setSelectedIndex(null)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {selectedContext ? <ContextDialog context={selectedContext} onClose={() => setSelectedContext(null)} /> : null}
      </AnimatePresence>
    </section>
  );
}

export function CompanyLogo({
  experience,
  layoutId
}: {
  experience: Pick<Experience, 'company' | 'logos' | 'initials'>;
  layoutId?: string;
}) {
  const logos = experience.logos ?? [];
  return (
    <motion.div className={`company-logo${logos.length > 1 ? ' company-logo--stack' : ''}`} layoutId={layoutId}>
      <span>{experience.initials}</span>
      {logos.map((logo, index) => (
        <img
          src={logo}
          alt={`${experience.company} logo ${index + 1}`}
          loading="lazy"
          key={logo}
          onError={(event) => {
            event.currentTarget.remove();
          }}
        />
      ))}
    </motion.div>
  );
}

function ContextStrip({
  contexts,
  onSelect
}: {
  contexts: DisplayProfessionalContext[];
  onSelect: (context: DisplayProfessionalContext) => void;
}) {
  return (
    <div className="context-strip">
      {contexts.map((context) => (
        <button
          className="context-pill"
          key={`${context.company}-${context.title}`}
          type="button"
          style={{ '--accent': context.accent } as React.CSSProperties}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(context);
          }}
        >
          {context.image ? (
            <img src={context.image} alt="" loading="lazy" />
          ) : (
            <span className="context-pill__fallback">{context.initials}</span>
          )}
          <span className="context-pill__copy">
            <strong>{context.title}</strong>
            <span>{context.sourceLabel}</span>
          </span>
          <ArrowUpRight size={14} />
        </button>
      ))}
    </div>
  );
}

function Dialog({
  label,
  onClose,
  children,
  layoutId,
  accent,
  wide
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  layoutId?: string;
  accent: string;
  wide?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      className="dialog-layer"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
      onMouseDown={onClose}
    >
      <motion.div
        className={`dialog surface${wide ? ' dialog--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={label}
        style={{ '--accent': accent } as React.CSSProperties}
        layoutId={layoutId}
        initial={shouldReduceMotion || layoutId ? false : { y: 20, scale: 0.98 }}
        animate={shouldReduceMotion || layoutId ? {} : { y: 0, scale: 1 }}
        exit={shouldReduceMotion || layoutId ? {} : { y: 14, scale: 0.98 }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog__close icon-button" onClick={onClose} type="button" aria-label="Close">
          <X size={18} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ExperienceDialog({
  experience,
  index,
  onSelectContext,
  onClose
}: {
  experience: Experience;
  index: number;
  onSelectContext: (context: DisplayProfessionalContext) => void;
  onClose: () => void;
}) {
  const sections = experience.detailSections ?? [
    { title: 'Highlights', items: experience.bullets },
    { title: 'Tools and scope', items: [experience.stack.join(', ')] }
  ];

  return (
    <Dialog label="experience-dialog-title" onClose={onClose} layoutId={`experience-card-${index}`} accent={experience.accent} wide>
      <div className="dialog__head">
        <CompanyLogo experience={experience} layoutId={`experience-logo-${index}`} />
        <div>
          <p className="eyebrow">{experience.company}</p>
          <h3 id="experience-dialog-title">{experience.detailTitle ?? experience.role}</h3>
          <ul className="chips chips--compact">
            <li>{experience.tenure}</li>
            <li>{experience.type}</li>
          </ul>
        </div>
      </div>
      <p className="timeline__summary">{experience.summary}</p>
      <div className="dialog__grid">
        {sections.map((section) => (
          <section className="dialog__section" key={section.title}>
            <h4>{section.title}</h4>
            <ul className="bullets">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {experience.contextProjects?.length ? (
        <ContextStrip
          contexts={experience.contextProjects.map((project) => toDisplayContext(experience, project))}
          onSelect={onSelectContext}
        />
      ) : null}
      <ul className="chips chips--compact" aria-label="Stack">
        {experience.stack.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </Dialog>
  );
}

function ContextDialog({ context, onClose }: { context: DisplayProfessionalContext; onClose: () => void }) {
  return (
    <Dialog label="context-dialog-title" onClose={onClose} accent={context.accent}>
      <div className="dialog__head">
        <div>
          <p className="eyebrow">{context.company}</p>
          <h3 id="context-dialog-title">{context.title}</h3>
        </div>
      </div>
      {context.image ? (
        <img className="dialog__shot" src={context.image} alt={`${context.title} public product screenshot`} />
      ) : (
        <div className="dialog__no-shot">
          <CompanyLogo experience={context} />
          <span>Private/internal work context</span>
        </div>
      )}
      <p className="timeline__type">{context.productArea}</p>
      <p>{context.relationshipText}</p>
      <p>{context.summary}</p>
      <ul className="chips chips--compact">
        {context.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      {context.sourceUrl ? (
        <a className="text-link" href={context.sourceUrl} target="_blank" rel="noreferrer">
          {context.sourceLabel}
          <ArrowUpRight size={14} />
        </a>
      ) : (
        <span className="muted">{context.sourceLabel}</span>
      )}
    </Dialog>
  );
}
