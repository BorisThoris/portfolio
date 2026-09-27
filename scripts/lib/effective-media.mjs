// Match getProjectDetails: portfolio curation wins over regenerated repository metadata;
// native captures are exclusively owned by project-access.json.
export function effectiveMedia(details, overrides, access) {
  const result = {};
  for (const slug of new Set([...Object.keys(details), ...Object.keys(overrides), ...Object.keys(access)])) {
    const merged = { ...details[slug], ...overrides[slug] };
    const native = access[slug] && access[slug].kind !== 'web';
    result[slug] = native
      ? { ...merged, trailers: [], videos: access[slug].videos ?? [] }
      : merged;
  }
  return result;
}
