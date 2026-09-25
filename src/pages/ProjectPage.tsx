import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Github,
  Download,
} from "lucide-react";
import {
  getProject,
  visibleProjects,
  Project,
  ProjectImage,
} from "../projects";
import { getProjectDetails } from "../projectDetails";
import {
  formatBytes,
  humanize,
} from "../lib/format";
import { ProjectMedia } from "../components/ProjectMedia";
import { ProjectShelf } from "../components/ProjectShelf";
import { categoryFor } from "../content/home";
import { NotFoundPage } from "./NotFoundPage";
import "../project-page.css";

export function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);
  if (!project) return <NotFoundPage />;
  return <ProjectContent key={project.slug} project={project} />;
}

function ProjectContent({ project }: { project: Project }) {
  const details = getProjectDetails(project.slug);
  const artwork = details?.artwork ?? [];
  const gallery = orderedGallery(details?.images ?? []);
  const related = relatedProjects(project);
  const repository = details?.links?.repository;
  return (
    <div className="shell shell--project">
      <a className="skip-link" href="#project-content">
        Skip to content
      </a>
      <header className="project-header">
        <Link to="/#work" className="project-back">
          <ArrowLeft size={16} />
          All work
        </Link>
        <Link to="/" className="project-wordmark">
          Boris Bostandzhiev<span>.</span>
        </Link>
        <a href="mailto:borisbostandzhiev@yahoo.com" className="project-back">
          Get in touch <ArrowUpRight size={16} />
        </a>
      </header>
      <main id="project-content" tabIndex={-1}>
        <section className="project-intro" aria-labelledby="project-title">
          <p className="eyebrow">Independent work / {project.tags[0]}</p>
          <h1 id="project-title">{project.title}</h1>
          <p className="project-intro__subtitle">{project.subtitle}</p>
          <div className="project-intro__bottom">
            <ul className="chips">
              {project.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <div className="project-actions">
              {project.deploymentUrl ? (
                <a
                  className="btn btn--primary"
                  href={project.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {project.tags.some((tag) =>
                    /game|arcade|roguelite/i.test(tag),
                  )
                    ? "Play the game"
                    : "Open live project"}
                  <ExternalLink size={16} />
                </a>
              ) : (
                <span className="project-availability">
                  Live demo not published
                </span>
              )}
              {repository ? (
                <a
                  className="btn btn--quiet"
                  href={repository}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={16} />
                  Repository
                </a>
              ) : null}
            </div>
          </div>
        </section>
        <div className="project-cover" id="watch">
          <ProjectMedia project={project} mode="cover" />
        </div>
        <section
          className="project-overview section"
          aria-labelledby="overview-title"
        >
          <div>
            <p className="eyebrow">Overview</p>
            <h2 id="overview-title">What it is.</h2>
          </div>
          <div className="project-overview__copy">
            <p>{project.description}</p>
            <dl className="project-facts">
              {details?.stack?.framework ? (
                <div>
                  <dt>Framework</dt>
                  <dd>{details.stack.framework}</dd>
                </div>
              ) : null}
              {details?.stack?.language ? (
                <div>
                  <dt>Language</dt>
                  <dd>{details.stack.language}</dd>
                </div>
              ) : null}
              {details?.stack?.runtimeTargets?.length ? (
                <div>
                  <dt>Platforms</dt>
                  <dd>{details.stack.runtimeTargets.join(", ")}</dd>
                </div>
              ) : null}
              {details?.stack?.testing?.length ? (
                <div>
                  <dt>Testing</dt>
                  <dd>{details.stack.testing.join(", ")}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>
        {artwork.length > 0 ? (
          <section
            id="artwork"
            className="section"
            aria-labelledby="artwork-title"
          >
            <header className="section__head">
              <div>
                <p className="eyebrow">Artwork</p>
                <h2 id="artwork-title">Posters and key art.</h2>
              </div>
            </header>
            <div
              className="artwork-rail"
              tabIndex={0}
              role="region"
              aria-label="Project artwork, scroll horizontally"
            >
              {artwork.map((art) => (
                <figure
                  className={`artwork artwork--${art.orientation ?? "landscape"}`}
                  key={art.id}
                >
                  <a
                    className="artwork__image"
                    href={art.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={art.url}
                      alt={
                        art.title ?? `${project.title} ${art.role ?? "artwork"}`
                      }
                      loading="lazy"
                      decoding="async"
                      width={art.width}
                      height={art.height}
                    />
                  </a>
                  <figcaption>
                    <div>
                      <strong>
                        {art.title ?? humanize(art.role ?? "Artwork")}
                      </strong>
                      <span>{formatBytes(art.bytes)}</span>
                    </div>
                    <a
                      className="icon-button"
                      href={art.url}
                      download={`${project.slug}-${art.id}.jpg`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open or download ${art.title ?? art.id}`}
                    >
                      <Download size={16} />
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
        {gallery.length > 0 ? (
          <section className="section" aria-labelledby="screenshots-title">
            <header className="section__head">
              <div>
                <p className="eyebrow">Screenshots</p>
                <h2 id="screenshots-title">Desktop and mobile.</h2>
              </div>
              <p className="section__lede">
                Open any screenshot to view it at full size.
              </p>
            </header>
            <div className="shot-grid">
              {gallery.map((shot) => (
                <a
                  className={`shot shot--${shot.profile}`}
                  href={shot.path}
                  key={shot.profile}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={shot.path}
                    alt={`${project.title} ${shot.profile} screenshot`}
                    loading="lazy"
                    decoding="async"
                    width={shot.width}
                    height={shot.height}
                  />
                  <span>
                    {shot.profile === "mobile"
                      ? "Mobile"
                      : humanize(shot.profile)}
                    <ArrowUpRight size={15} />
                  </span>
                </a>
              ))}
            </div>
          </section>
        ) : null}
        {details?.stack || details?.runtime ? (
          <details className="technical-details section">
            <summary>
              <span>Under the hood</span>
              <span>Stack &amp; local setup +</span>
            </summary>
            <div className="technical-details__body">
              {details.stack?.libraries?.length ? (
                <div>
                  <h3>Libraries</h3>
                  <ul className="chips">
                    {details.stack.libraries.map((library) => (
                      <li key={library.name}>{library.name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {details.runtime?.buildCommand ? (
                <div>
                  <h3>Build</h3>
                  <code>{details.runtime.buildCommand}</code>
                </div>
              ) : null}
              {details.runtime?.runCommand ? (
                <div>
                  <h3>Run locally</h3>
                  <code>{details.runtime.runCommand}</code>
                </div>
              ) : null}
            </div>
          </details>
        ) : null}
        <ProjectShelf
          className="project-recommendations section"
          eyebrow="Keep browsing"
          title="More projects"
          projects={related}
          headingLevel={2}
        />
      </main>
      <footer className="project-footer">
        <Link to="/#work">Back to all work</Link>
        <span>© {new Date().getFullYear()} Boris Bostandzhiev</span>
      </footer>
    </div>
  );
}

function relatedProjects(project: Project) {
  const category = categoryFor(project.tags);
  const candidates = visibleProjects.filter(
    (candidate) => candidate.slug !== project.slug,
  );
  return [
    ...candidates.filter(
      (candidate) => categoryFor(candidate.tags) === category,
    ),
    ...candidates.filter(
      (candidate) => categoryFor(candidate.tags) !== category,
    ),
  ].slice(0, 7);
}

function orderedGallery(images: ProjectImage[]) {
  const order = ["desktop", "mobile", "full"];
  return images
    .filter((image) => order.includes(image.profile))
    .sort((a, b) => order.indexOf(a.profile) - order.indexOf(b.profile));
}
