import { useEffect, useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../../components/SiteChrome";
import { homeSections, type HomeSectionId } from "./sections";

/** Which section is under the reading line, for the navigation's active state. */
function useActiveSection() {
  const [active, setActive] = useState<HomeSectionId | undefined>();
  useEffect(() => {
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        setActive(homeSections.find((section) => visible.get(section.id))?.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const section of homeSections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);
  return active;
}

/** A floating pill: name, sections (tracks your position), switches and the one CTA. */
export function TopNav({ paused, onTogglePause, motionAvailable, email }: {
  paused: boolean;
  onTogglePause: () => void;
  motionAvailable: boolean;
  email: string;
}) {
  const active = useActiveSection();
  return (
    <header className="topnav">
      <Link to="/" className="topnav__name">
        <span className="topnav__mark" aria-hidden="true">bb</span>
        <span>Boris Bostandzhiev</span>
      </Link>
      <nav aria-label="Sections" className="topnav__links">
        {homeSections.map((section) => (
          <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? "true" : undefined}>
            {section.label}
          </a>
        ))}
      </nav>
      <div className="topnav__tools">
        {motionAvailable ? (
          <button className="motion-toggle" type="button" aria-pressed={paused} onClick={onTogglePause}>
            {paused ? <Play size={13} /> : <Pause size={13} />}
            <span>{paused ? "Resume motion" : "Pause motion"}</span>
          </button>
        ) : null}
        <ThemeToggle />
        <a className="btn btn--primary topnav__cta" href={`mailto:${email}`}>Email me <ArrowUpRight size={15} /></a>
      </div>
    </header>
  );
}
