// Small formatting helpers shared by the pages.

export function humanize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function formatDate(iso: string | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function latestOf(dates: (string | undefined)[]) {
  const sorted = dates.filter((value): value is string => Boolean(value)).sort();
  return sorted[sorted.length - 1];
}

export function formatNumber(value: number | undefined) {
  if (value === undefined || value === null) return undefined;
  return value.toLocaleString('en-GB');
}

export function formatDuration(seconds: number | undefined) {
  if (!seconds) return '';
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function formatBytes(bytes: number | undefined) {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function youtubeEmbedUrl(url: string) {
  const match = /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/.exec(url);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : url;
}

export function pad2(value: number) {
  return String(value).padStart(2, '0');
}
