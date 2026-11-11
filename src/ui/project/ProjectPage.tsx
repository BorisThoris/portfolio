import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Download, ExternalLink, Github } from "lucide-react";
import { getProject, visibleProjects, type Project, type ProjectImage } from "../../projects";
import { getProjectAccess } from "../../projectAccess";
import { getProjectDetails } from "../../projectDetails";
import { formatAsOf, getProjectTraction } from "../../projectTraction";
import { projectStatus } from "../../projectStatus";
import { formatBytes, formatDate, humanize } from "../../lib/format";
import { ProjectMedia } from "../../components/ProjectMedia";
import { BuildStamp, ThemeToggle } from "../../components/SiteChrome";
import { NotFoundPage } from "../NotFoundPage";
import { Stats } from "../Stats";
import { Related } from "./Related";
import { useReveal } from "../motion";
import "./project.css";

export function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);
  if (!project) return <NotFoundPage />;
  return <ProjectContent key={project.slug} project={project} />;
}

const isGame = (project: Project) => project.tags.some((tag) => /game|arcade|roguelite/i.test(tag));

function ProjectContent({ project }: { project: Project }) {
  const access = getProjectAccess(project.slug);
  const details = getProjectDetails(project.slug);
  const traction = getProjectTraction(project.slug);
  const status = projectStatus(project);
  useReveal([project.slug]);
  const artwork = details?.artwork ?? [];
  // The first native image is already the cover; don't show it twice.
  const gallery = access && access.kind !== "web"
    ? access.images.filter((image, index) => !(index === 0 && image.profile === "native-poster" && access.images.length > 1))
    : orderedGallery(details?.images ?? []);
  const repository = access ? access.sourceUrl : details?.links?.repository;
  const live = project.deploymentUrl && (!access || access.kind === "web") ? project.deploymentUrl : undefined;
  const updated = details?.git?.lastCommitDate;
  const related = visibleProjects.filter((candidate) => candidate.slug !== project.slug && getProjectAccess(candidate.slug)?.kind !== "archive").slice(0, 7);
  const facts: [string, ReactNode][] = [
    ["Status", <span className={`status status--${status.key}`} title={status.detail}>{status.label}</span>],
    ["Kind", access?.label ?? "Web application"],
    ...(details?.stack?.framework ? [["Framework", details.stack.framework] as [string, ReactNode]] : []),
    ...(details?.stack?.language ? [["Language", details.stack.language] as [string, ReactNode]] : []),
    ...(details?.stack?.runtimeTargets?.length ? [["Platforms", details.stack.runtimeTargets.join(", ")] as [string, ReactNode]] : []),
    ...(details?.stack?.testing?.length ? [["Testing", details.stack.testing.join(", ")] as [string, ReactNode]] : []),
    ...(updated ? [["Last change", formatDate(updated)] as [string, ReactNode]] : []),
  ];
  return (
    <div className="pp">
      <a className="skip-link" href="#project-content">Skip to content</a>
      <header className="pp__bar">
        <Link to="/#index" className="pp__back"><ArrowLeft size={16} />All work</Link>
        <Link to="/" className="pp__home">Boris Bostandzhiev</Link>
        <div className="pp__tools">
          <ThemeToggle />
          <a href="mailto:borisbostandzhiev@yahoo.com" className="btn pp__contact">Get in touch <ArrowUpRight size={15} /></a>
        </div>
      </header>

      <main id="project-content" tabIndex={-1}>
        <section className="pp__intro" aria-labelledby="project-title">
          <p className="label pp__crumb">
            <Link to="/#index">Index</Link> <span aria-hidden="true">/</span> {access?.label ?? project.tags[0]}
          </p>
          <h1 id="project-title">{project.title}</h1>
          <p className="pp__subtitle hand">{project.subtitle}</p>
          <div className="project-actions">
            {live ? (
              <a className="btn btn--primary" href={live} target="_blank" rel="noreferrer">
                {isGame(project) ? "Play the game" : "Open live project"}<ExternalLink size={15} />
              </a>
            ) : (
              <span className="pp__availability">
                {access?.kind === "native" ? "Native application" : access?.kind === "archive" ? "Historical archive" : "Live demo not published"}
              </span>
            )}
            {access?.downloadUrl ? (
              <a className="btn" href={access.downloadUrl} download><Download size={15} />{access.downloadLabel ?? "Download"}</a>
            ) : null}
            {repository ? (
              <a className="btn" href={repository} target="_blank" rel="noreferrer"><Github size={15} />Repository</a>
            ) : null}
            {traction?.headline ? <span className="pp__proof num">{traction.headline}</span> : null}
          </div>
        </section>

        <div className="project-cover" id="watch">
          <ProjectMedia key={project.slug} project={project} mode="cover" />
        </div>

        <div className="pp__body">
          <aside className="pp__spec note" aria-label="Project facts">
            <dl>
              {facts.map(([term, value]) => (
                <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
              ))}
            </dl>
            {project.tags.length ? (
              <ul className="tags" aria-label="Technologies">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
            ) : null}
          </aside>

          <article className="pp__article">
            <section aria-labelledby="overview-title">
              <h2 id="overview-title" className="label">Overview</h2>
              <p className="pp__lead">{project.description}</p>
            </section>

            {traction && (traction.stats?.length || traction.links?.length) ? (
              <section className="project-traction" aria-labelledby="traction-title">
                <h2 id="traction-title" className="label">{traction.stats?.length ? `How it has been received · counted ${formatAsOf()}` : "Where to find it"}</h2>
                {traction.stats?.length ? <Stats stats={traction.stats} label={`${project.title} numbers`} /> : null}
                {traction.links?.length ? (
                  <ul className="pp__links" aria-label={`${project.title} release pages and videos`}>
                    {traction.links.map((link) => (
                      <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={13} aria-hidden="true" /></a></li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}

            {access ? (
              <section className="project-access notebook" aria-labelledby="access-title">
                <p className="label">{access.label}</p>
                <h2 id="access-title">Run &amp; availability</h2>
                <p>{access.status}</p>
                <p><strong>Environment:</strong> {access.environment}</p>
                {access.instructions ? <pre><code>{access.instructions}</code></pre> : null}
                {access.downloadUrl ? (
                  <a className="btn" href={access.downloadUrl} download><Download size={15} />{access.downloadLabel ?? "Download"}</a>
                ) : access.kind === "native" ? <p className="pp__note">Packaged download not published yet.</p> : null}
                {access.transcriptUrl ? <p><a className="link" href={access.transcriptUrl}>Read the captured console transcript</a></p> : null}
                {access.sourceStatus ? <p className="pp__note">{access.sourceStatus}</p> : null}
                {access.creditsUrl ? <p><a className="link" href={access.creditsUrl}>Artwork credits and licenses</a></p> : null}
              </section>
            ) : null}

            {details?.stack?.libraries?.length || details?.runtime?.buildCommand || (details?.runtime?.runCommand && details.runtime.runCommand.trim() !== access?.instructions?.trim()) ? (
              <section className="pp__tech" aria-labelledby="tech-title">
                <h2 id="tech-title" className="label">Under the hood</h2>
                {details?.stack?.libraries?.length ? (
                  <ul className="tags" aria-label="Libraries">{details.stack.libraries.map((library) => <li key={library.name}>{library.name}</li>)}</ul>
                ) : null}
                <dl>
                  {details?.runtime?.buildCommand ? <div><dt>Build</dt><dd><code>{details.runtime.buildCommand}</code></dd></div> : null}
                  {details?.runtime?.runCommand && details.runtime.runCommand.trim() !== access?.instructions?.trim() ? <div><dt>Run locally</dt><dd><code>{details.runtime.runCommand}</code></dd></div> : null}
                </dl>
              </section>
            ) : null}
          </article>
        </div>

        {gallery.length > 0 ? (
          <section className="pp__gallery" aria-labelledby="screenshots-title">
            <header>
              <h2 id="screenshots-title">{access?.transcriptUrl ? "Console output" : "Screenshots"}</h2>
              <p>{access?.captureNote ?? (access?.kind === "native" ? "Captured in the native application." : "Desktop and mobile, captured from the live build.")}</p>
            </header>
            <div className="shot-grid">
              {gallery.map((shot) => (
                <a className={`shot shot--${shot.profile}`} href={shot.path} key={shot.path} target="_blank" rel="noreferrer" data-reveal>
                  <img src={shot.path} alt={`${project.title}: ${shot.caption ?? shot.profile}`} loading="lazy" decoding="async" width={shot.width} height={shot.height} />
                  <span>{shot.caption ?? (shot.profile === "mobile" ? "Mobile" : humanize(shot.profile))}<ArrowUpRight size={13} /></span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {artwork.length > 0 ? (
          <section id="artwork" className="pp__artwork" aria-labelledby="artwork-title">
            <header><h2 id="artwork-title">Posters and key art</h2></header>
            <div className="artwork-rail" tabIndex={0} role="region" aria-label="Project artwork, scroll horizontally">
              {artwork.map((art) => (
                <figure className={`artwork artwork--${art.orientation ?? "landscape"}`} key={art.id}>
                  <a className="artwork__image" href={art.url} target="_blank" rel="noreferrer">
                    <img src={art.url} alt={art.title ?? `${project.title} ${art.role ?? "artwork"}`} loading="lazy" decoding="async" width={art.width} height={art.height} />
                  </a>
                  <figcaption>
                    <span><strong>{art.title ?? humanize(art.role ?? "Artwork")}</strong><span className="num">{formatBytes(art.bytes)}</span></span>
                    <a className="icon-button" href={art.url} download={`${project.slug}-${art.id}.jpg`} target="_blank" rel="noreferrer" aria-label={`Open or download ${art.title ?? art.id}`}>
                      <Download size={15} />
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <Related projects={related} />
      </main>

      <footer className="project-footer">
        <Link to="/#index">Back to all work</Link>
        <BuildStamp />
        <span>© {new Date().getFullYear()} Boris Bostandzhiev</span>
      </footer>
    </div>
  );
}

function orderedGallery(images: ProjectImage[]) {
  const order = ["desktop", "mobile", "full"];
  return images.filter((image) => order.includes(image.profile)).sort((a, b) => order.indexOf(a.profile) - order.indexOf(b.profile));
}
