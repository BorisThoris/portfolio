import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { MonitorUp } from 'lucide-react';
import { AeroLiquidBackground } from '../AeroLiquidBackground';
import { Project, showcaseProjects } from '../projects';
import { useIsPhone, useRuntimeStatus } from '../lib/runtime';
import { ContactLinks } from '../components/ContactLinks';
import { Showcase } from '../components/Showcase';
import { SupportingProjects } from '../components/SupportingProjects';
import { ExperienceSection } from '../components/Experience';
import { Capabilities } from '../components/Capabilities';

export function HomePage() {
  const isPhone = useIsPhone();
  const runtimeStatus = useRuntimeStatus();
  const [active, setActive] = React.useState<Project>(showcaseProjects[0]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [contactsInTopbar, setContactsInTopbar] = React.useState(false);
  const introActions = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = introActions.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setContactsInTopbar(!entry.isIntersecting || entry.intersectionRatio < 0.32),
      { threshold: [0, 0.32, 0.7], rootMargin: '-68px 0px 0px 0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="shell" style={{ '--accent': active.accent } as React.CSSProperties}>
      <AeroLiquidBackground accent={active.accent} quality={isPhone ? 'mobile' : 'full'} />
      <header className="topbar" aria-label="Portfolio header">
        <Link to="/" className="topbar__mark">
          <MonitorUp size={18} />
          Boris Bostandzhiev
        </Link>
        <nav className="topbar__links" aria-label="Contact">
          <AnimatePresence mode="popLayout">{contactsInTopbar ? <ContactLinks iconSize={14} placement="topbar" /> : null}</AnimatePresence>
        </nav>
      </header>

      <section className="intro" aria-label="Introduction">
        <h1>Interactive software with real product depth.</h1>
        <p>
          I build playable tools, games, storefronts and enterprise interfaces that show the workflow, the UI craft and
          the engineering behind them.
        </p>
        <div className="intro__actions" ref={introActions} aria-label="Contact and profile">
          {contactsInTopbar ? null : <ContactLinks iconSize={16} placement="intro" />}
        </div>
      </section>

      <Showcase projects={showcaseProjects} runtimeStatus={runtimeStatus} paused={dialogOpen} onActiveChange={setActive} />
      <SupportingProjects />
      <ExperienceSection onDialogChange={setDialogOpen} />
      <Capabilities />
    </main>
  );
}
