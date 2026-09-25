// The project page: a billboard with the trailer playing (or the latest
// capture), one button that opens the project, then the trailers and videos,
// the artwork and wallpapers, the screenshots, and everything project.meta.json
// knows.

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, Film, Github, Image as ImageIcon, MonitorUp, Play, Volume2, VolumeX } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { AeroLiquidBackground } from '../AeroLiquidBackground';
import { getProject, getProjectDetails, ProjectArtwork, ProjectImage } from '../projects';
import { resolveProjectUrl, useIsPhone, useRuntimeStatus } from '../lib/runtime';
import { formatBytes, formatDate, formatDuration, formatNumber, hostOf, humanize, latestOf, youtubeEmbedUrl } from '../lib/format';
import { CaptureImage } from '../components/CaptureImage';

const ARTWORK_ROLE: Record<string, string> = {
  wallpaper: 'Wallpaper',
  poster: 'Poster',
  'key-art': 'Key art',
  capsule: 'Capsule',
  social: 'Social card',
  artwork: 'Artwork'
};

export function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);
  const details = getProjectDetails(project.slug);
  const runtimeStatus = useRuntimeStatus();
  const runtime = runtimeStatus?.projects.find((item) => item.slug === project.slug);
  const launchUrl = resolveProjectUrl(project, runtime).url;
  const isPhone = useIsPhone();
  const shouldReduceMotion = useReducedMotion();

  const trailers = details?.trailers ?? [];
  const videos = details?.videos ?? [];
  const artwork = details?.artwork ?? [];
  const heroTrailer = trailers.find((trailer) => trailer.orientation !== 'portrait') ?? trailers[0];
  const isGame = project.tags.some((tag) => /game|arcade|roguelite/i.test(tag));
  const gallery = orderedGallery(details?.images ?? []);
  const heroVideo = React.useRef<HTMLVideoElement>(null);
  const [heroMuted, setHeroMuted] = React.useState(true);
  const [heroFailed, setHeroFailed] = React.useState(false);
  const showHeroVideo = Boolean(heroTrailer) && !heroFailed && !shouldReduceMotion;

  React.useEffect(() => {
    const previous = document.title;
    document.title = `${project.title} · Boris Bostandzhiev`;
    window.scrollTo({ top: 0 });
    setHeroMuted(true);
    setHeroFailed(false);
    return () => {
      document.title = previous;
    };
  }, [project.slug, project.title]);

  const toggleHeroSound = () => {
    const video = heroVideo.current;
    if (!video) return;
    const muted = !heroMuted;
    video.muted = muted;
    setHeroMuted(muted);
    if (!muted && video.paused) video.play().catch(() => undefined);
  };

  const facts = [
    details?.stack?.framework ? { label: 'Built with', value: details.stack.framework } : null,
    details?.git?.lastCommitDate ? { label: 'Last commit', value: formatDate(details.git.lastCommitDate) } : null,
    details?.metrics?.sourceLines ? { label: 'Source', value: `${formatNumber(details.metrics.sourceLines)} lines` } : null,
    details?.version && details.version !== '0.0.0' ? { label: 'Version', value: details.version } : null,
    project.deploymentUrl ? { label: 'Runs on', value: hostOf(project.deploymentUrl) } : null
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  const hasWatch = trailers.length > 0 || videos.length > 0;

  return (
    <main className="shell shell--project" style={{ '--accent': project.accent } as React.CSSProperties}>
      <AeroLiquidBackground accent={project.accent} quality={isPhone ? 'mobile' : 'full'} />
      <nav className="topbar" aria-label="Project navigation">
        <Link to="/" className="btn btn--quiet btn--small">
          <ArrowLeft size={16} />
          Portfolio
        </Link>
        <span className="topbar__mark topbar__mark--center">
          <MonitorUp size={18} />
          {project.title}
        </span>
        <a className="btn btn--quiet btn--small" href={launchUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={15} />
          Open
        </a>
      </nav>

      <section className={`billboard${showHeroVideo && heroTrailer?.orientation === 'portrait' ? ' billboard--portrait' : ''}`} aria-label={`${project.title} overview`}>
        <div className="billboard__media" aria-hidden="true">
          {showHeroVideo && heroTrailer ? (
            <video
              ref={heroVideo}
              src={heroTrailer.url}
              poster={heroTrailer.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onError={() => setHeroFailed(true)}
            />
          ) : (
            <CaptureImage project={project} priority />
          )}
          <div className="billboard__shade" />
        </div>

        <div className="billboard__copy">
          <p className="eyebrow">
            {showHeroVideo && heroTrailer ? 'Trailer' : 'Latest capture'}
            {details?.stack?.framework ? ` · ${details.stack.framework}` : ''}
          </p>
          <h1>{project.title}</h1>
          <p className="billboard__subtitle">{project.subtitle}</p>
          <p className="billboard__description">{project.description}</p>
          <ul className="chips" aria-label="Tags">
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <div className="billboard__actions">
            <a className="btn btn--primary btn--large" href={launchUrl} target="_blank" rel="noreferrer">
              <Play size={17} />
              {isGame ? 'Play now' : 'Launch app'}
            </a>
            {showHeroVideo ? (
              <button type="button" className="btn btn--quiet" onClick={toggleHeroSound}>
                {heroMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {heroMuted ? 'Sound on' : 'Mute'}
              </button>
            ) : null}
            {hasWatch ? (
              <a className="btn btn--quiet" href="#watch">
                <Film size={16} />
                {trailers.length > 0 ? 'Trailers' : 'Videos'}
              </a>
            ) : null}
            {artwork.length > 0 ? (
              <a className="btn btn--quiet" href="#artwork">
                <ImageIcon size={16} />
                Artwork
              </a>
            ) : null}
            {details?.links?.repository ? (
              <a className="btn btn--quiet" href={details.links.repository} target="_blank" rel="noreferrer">
                <Github size={16} />
                Source
              </a>
            ) : null}
          </div>
          {facts.length > 0 ? (
            <dl className="facts-row">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      {hasWatch ? (
        <section id="watch" className="section surface" aria-label={`${project.title} trailers and videos`}>
          <header className="section__head">
            <div>
              <p className="eyebrow">Trailers &amp; videos</p>
              <h2>Watch</h2>
            </div>
            <p className="section__lede">
              {trailers.length > 0
                ? `Rendered from the project's own scene and rebuilt whenever it changes. Last render ${formatDate(latestOf(trailers.map((trailer) => trailer.builtAt)))}.`
                : 'Recorded from the project.'}
            </p>
          </header>
          <div className="media-rail">
            {trailers.map((trailer) => (
              <figure key={trailer.id} className={`media-card media-card--${trailer.orientation ?? 'landscape'}`}>
                <video controls playsInline preload="metadata" poster={trailer.poster} src={trailer.url} />
                <figcaption>
                  <strong>{trailer.title ?? 'Trailer'}</strong>
                  <span>
                    {formatDuration(trailer.duration)}
                    {trailer.width && trailer.height ? ` · ${trailer.width}×${trailer.height}` : ''}
                  </span>
                </figcaption>
              </figure>
            ))}
            {videos.map((video) => (
              <figure key={video.url} className="media-card media-card--landscape">
                {video.kind === 'youtube' ? (
                  <iframe
                    src={youtubeEmbedUrl(video.url)}
                    title={video.title ?? `${project.title} video`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : video.kind === 'video' ? (
                  <video controls playsInline preload="metadata" poster={video.poster} src={video.url} />
                ) : (
                  <a className="media-card__link" href={video.url} target="_blank" rel="noreferrer">
                    <Play size={22} />
                    Open video
                  </a>
                )}
                <figcaption>
                  <strong>{video.title ?? 'Video'}</strong>
                  {video.description ? <span>{video.description}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {artwork.length > 0 ? (
        <section id="artwork" className="section surface" aria-label={`${project.title} artwork and wallpapers`}>
          <header className="section__head">
            <div>
              <p className="eyebrow">Artwork</p>
              <h2>Posters &amp; wallpapers</h2>
            </div>
            <p className="section__lede">Posters, wallpapers and key art from the project, published by the project itself. Open one and save it.</p>
          </header>
          <ul className="artwork-rail">
            {artwork.map((art) => (
              <li key={art.id} className={`artwork artwork--${art.orientation ?? 'landscape'}`}>
                <a href={art.url} target="_blank" rel="noreferrer" download={artworkFileName(project.slug, art)}>
                  <img src={art.url} alt={`${project.title}: ${art.title ?? art.id}`} loading="lazy" decoding="async" />
                </a>
                <div className="artwork__caption">
                  <strong>{art.title ?? humanize(art.id)}</strong>
                  <span>
                    {ARTWORK_ROLE[art.role ?? 'artwork'] ?? humanize(art.role ?? 'artwork')}
                    {art.width && art.height ? ` · ${art.width}×${art.height}` : ''}
                    {art.bytes ? ` · ${formatBytes(art.bytes)}` : ''}
                  </span>
                  <a className="text-link" href={art.url} download={artworkFileName(project.slug, art)}>
                    <Download size={13} />
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {gallery.length > 0 ? (
        <section className="section surface" aria-label={`${project.title} screenshots`}>
          <header className="section__head">
            <div>
              <p className="eyebrow">Screenshots</p>
              <h2>On desktop and on a phone</h2>
            </div>
            <p className="section__lede">
              {details?.source ? `Photographed by the project itself after each deployment (${details.source}).` : 'Captured by the portfolio image pipeline.'}
            </p>
          </header>
          <div className="shot-grid">
            {gallery.map((image) => (
              <a key={image.profile} className={`shot shot--${image.profile}`} href={image.path} target="_blank" rel="noreferrer">
                <img src={image.path} alt={`${project.title} ${profileLabel(image.profile)} screenshot`} loading="lazy" decoding="async" />
                <span>
                  {profileLabel(image.profile)}
                  {image.width && image.height ? ` · ${image.width}×${image.height}` : ''}
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section surface fact-sheet" aria-label={`${project.title} facts`}>
        <div className="fact-sheet__about">
          <p className="eyebrow">About</p>
          <h2>What it is</h2>
          <p>{project.description}</p>
          {details?.analysisNotes ? <p className="muted">{details.analysisNotes}</p> : null}
          {details?.generatedAt ? <small className="muted">Metadata generated by the project on {formatDate(details.generatedAt)}.</small> : null}
        </div>
        <div className="fact-sheet__grid">
          <FactGroup title="Stack">
            <Fact label="Framework" value={details?.stack?.framework} />
            <Fact label="Language" value={details?.stack?.language} />
            <Fact label="Targets" value={details?.stack?.runtimeTargets?.join(', ')} />
            <Fact label="Testing" value={details?.stack?.testing?.join(', ')} />
            {details?.stack?.libraries && details.stack.libraries.length > 0 ? (
              <div className="fact">
                <dt>Libraries</dt>
                <dd>
                  <ul className="chips chips--compact">
                    {details.stack.libraries.slice(0, 10).map((library) => (
                      <li key={library.name}>
                        {library.name}
                        {library.version ? <em>{library.version}</em> : null}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </FactGroup>
          <FactGroup title="Size">
            <Fact label="Source files" value={formatNumber(details?.metrics?.sourceFiles)} />
            <Fact label="Lines" value={formatNumber(details?.metrics?.sourceLines)} />
            <Fact label="Test files" value={formatNumber(details?.metrics?.testFiles)} />
            <Fact
              label="Dependencies"
              value={
                details?.stack && (details.stack.dependencyCount || details.stack.devDependencyCount)
                  ? `${details.stack.dependencyCount ?? 0} + ${details.stack.devDependencyCount ?? 0} dev`
                  : undefined
              }
            />
            <Fact
              label="Largest areas"
              value={details?.metrics?.largestDirectories?.slice(0, 4).map((entry) => `${entry.directory} (${entry.files})`).join(', ')}
            />
          </FactGroup>
          <FactGroup title="History">
            <Fact label="Last commit" value={details?.git?.lastCommitDate ? formatDate(details.git.lastCommitDate) : undefined} />
            <Fact label="Subject" value={details?.git?.lastCommitSubject} />
            <Fact label="Commits" value={formatNumber(details?.git?.commitCount)} />
            <Fact label="Branch" value={details?.git?.branch && details.git.head ? `${details.git.branch} @ ${details.git.head}` : details?.git?.branch} />
          </FactGroup>
          <FactGroup title="Run it">
            <Fact
              label="Deployment"
              value={
                project.deploymentUrl ? (
                  <a className="text-link" href={project.deploymentUrl} target="_blank" rel="noreferrer">
                    {hostOf(project.deploymentUrl)}
                  </a>
                ) : undefined
              }
            />
            <Fact label="Build" value={details?.runtime?.buildCommand ? <code>{details.runtime.buildCommand}</code> : undefined} />
            <Fact label="Run" value={details?.runtime?.runCommand ? <code>{details.runtime.runCommand}</code> : undefined} />
            <Fact label="Package manager" value={details?.runtime?.packageManager} />
            {details?.links
              ? Object.entries(details.links)
                  .filter(([key]) => !['deploymentUrl', 'localUrl', 'repository', 'homepage'].includes(key))
                  .map(([key, url]) => (
                    <Fact
                      key={key}
                      label={humanize(key)}
                      value={
                        <a className="text-link" href={url} target="_blank" rel="noreferrer">
                          {hostOf(url)}
                        </a>
                      }
                    />
                  ))
              : null}
          </FactGroup>
          {details?.scores ? (
            <FactGroup title="Scores">
              <div className="score-bars">
                {Object.entries(details.scores).map(([key, score]) => (
                  <div key={key} className="score-bar">
                    <span>{humanize(key.replace(/Score$/, ''))}</span>
                    <i style={{ '--score': `${Math.max(0, Math.min(100, score))}%` } as React.CSSProperties} />
                    <b>{score}</b>
                  </div>
                ))}
              </div>
            </FactGroup>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function FactGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="fact-group">
      <h3>{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// desktop first, then the phone, then the whole page; the card is the fallback
function orderedGallery(images: ProjectImage[]) {
  const order = ['desktop', 'mobile', 'full', 'card'];
  const chosen = images.filter((image) => order.includes(image.profile));
  const withoutCard = chosen.filter((image) => image.profile !== 'card');
  return (withoutCard.length > 0 ? withoutCard : chosen).sort((left, right) => order.indexOf(left.profile) - order.indexOf(right.profile));
}

function profileLabel(profile: string) {
  return { desktop: 'Desktop', mobile: 'Phone', full: 'Full page', card: 'Card', og: 'Link card' }[profile] ?? humanize(profile);
}

function artworkFileName(slug: string, art: ProjectArtwork) {
  return `${slug}-${art.id}.jpg`;
}
