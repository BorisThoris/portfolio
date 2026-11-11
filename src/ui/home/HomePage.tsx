import { useEffect, useRef, useState } from "react";
import { visibleProjects } from "../../projects";
import { featuredSlugs, home } from "../../content/home";
import { contactLinks } from "../../content/profile";
import { tractionSummary } from "../../projectTraction";
import { projectStatus } from "../../projectStatus";
import { MotionContext } from "../../lib/motion";
import { useMediaQuery } from "../../lib/runtime";
import { mediaRatio, previewClip, projectClips } from "../../lib/projectMedia";
import { BuildStamp } from "../../components/SiteChrome";
import { useReveal } from "../motion";
import { TopNav } from "./TopNav";
import { Hero, type ProofNote } from "./Hero";
import { SelectedWork } from "./SelectedWork";
import { Mods } from "./Mods";
import { Problems } from "./Problems";
import { ProjectIndex } from "./ProjectIndex";
import { Experience } from "./Experience";
import { Contact } from "./Contact";
import "./home.css";

const email = contactLinks.find((link) => link.label === "Email")!.href.slice(7);
const featured = featuredSlugs.flatMap((slug) => visibleProjects.filter((project) => project.slug === slug));
// The hero's polaroid plays the first featured project with a landscape trailer;
// the cases below start with the next one.
const reel = featured.find((project) => {
  const clip = previewClip(projectClips(project.slug));
  return clip?.kind === "video" && mediaRatio(clip) >= 1;
}) ?? featured[0];
const cases = featured.filter((project) => project !== reel);
const liveDemos = visibleProjects.filter((project) => projectStatus(project).key === "live").length;
const [downloads, views, upvotes] = tractionSummary.stats;
const proof: ProofNote[] = [
  { value: downloads.value, text: "mod downloads on Nexus", href: "#mods", color: "yellow" },
  { value: upvotes.value, text: "upvotes on the r/needforspeed launch", href: "#mods", color: "pink" },
  { value: String(liveDemos), text: "live demos, checked daily", href: "#index", color: "blue" },
  { value: views.value, text: "views on the mod trailers", href: "#mods", color: "green" },
];
const employers = ["Man Group", "Quickbase", "Zonal", "A1 Bulgaria"];
const stack = ["React", "TypeScript", "Python", "C++", "C#", "Three.js", "Web Audio", "Electron", "Playwright", "Cloudflare", "Kubernetes", "Babylon.js", "Reverse engineering", "Direct3D"];

export function HomePage() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [heroVisible, setHeroVisible] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const motionEnabled = !paused && !reducedMotion && pageVisible;
  useReveal();
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting));
    if (heroRef.current) observer.observe(heroRef.current);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  return (
    <MotionContext.Provider value={motionEnabled}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="home" data-motion={motionEnabled ? "running" : "paused"}>
        <TopNav paused={paused} onTogglePause={() => setPaused(!paused)} motionAvailable={!reducedMotion} email={email} />
        <main id="main-content" className="home__main" tabIndex={-1}>
          <div ref={heroRef}>
            <Hero reel={reel} proof={proof} employers={employers} email={email} motion={motionEnabled && heroVisible ? "running" : "paused"} />
          </div>
          {/* Decorative: the same skills are listed properly under Experience. */}
          <div className="marquee" aria-hidden="true">
            <ul>
              {[...stack, ...stack].map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ul>
          </div>
          <SelectedWork projects={cases} intro={home.workIntro} />
          <Mods />
          <Problems />
          <ProjectIndex projects={visibleProjects} />
          <Experience />
          <Contact />
          <footer className="site-footer">
            <span>© {new Date().getFullYear()} Boris Bostandzhiev</span>
            <BuildStamp />
            <a href="#main-content">Back to top ↑</a>
          </footer>
        </main>
      </div>
    </MotionContext.Provider>
  );
}
