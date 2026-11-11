import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

// The project catalogue is also the input to the local build/serve scripts, so it
// records where each repo lives on the machine that generated it. Those fields are
// of no use to a browser and should not be published: repoPath alone put the
// developer's username and folder layout into every visitor's bundle. This rewrites
// the module the client imports - repoPath becomes the bare repoName the UI actually
// wants - and leaves the file on disk untouched for the scripts that need it.
const localOnlyRecordFields = [
  'repoPath', 'buildCommand', 'buildOutput', 'buildCwd',
  'fallbackCommand', 'fallbackCwd', 'fallbackEnv', 'serveBasePath',
] as const;

// Spelled this way so the separator survives every layer that rewrites backslashes.
const BACKSLASH = String.fromCharCode(92);
const toPosix = (value: string) => value.split(BACKSLASH).join('/');

function stripLocalPathsFromCatalogue(): Plugin {
  return {
    name: 'strip-local-paths-from-catalogue',
    enforce: 'pre',
    transform(code, id) {
      if (!toPosix(id).endsWith('/src/project-data.json')) return null;
      const records = JSON.parse(code) as Record<string, unknown>[];
      const cleaned = records.map((record) => {
        const next: Record<string, unknown> = { ...record };
        const repoPath = typeof record.repoPath === 'string' ? record.repoPath : '';
        const repoName = toPosix(repoPath).split('/').filter(Boolean).pop();
        for (const field of localOnlyRecordFields) delete next[field];
        if (repoName) next.repoName = repoName;
        return next;
      });
      return { code: JSON.stringify(cleaned), map: null };
    },
  };
}

// The footer's build stamp: which commit this page was built from, and when.
// Cloudflare Pages provides the commit; a local build asks git.
function buildCommit() {
  if (process.env.CF_PAGES_COMMIT_SHA) return process.env.CF_PAGES_COMMIT_SHA;
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

export default defineConfig({
  define: {
    __BUILD_COMMIT__: JSON.stringify(buildCommit()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [stripLocalPathsFromCatalogue(), react()],
  server: {
    host: '127.0.0.1',
    port: 4110
  },
  preview: {
    host: '127.0.0.1',
    port: 4110
  }
});
