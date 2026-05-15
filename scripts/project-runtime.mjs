import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const portfolioRoot = path.resolve(scriptDir, '..');
export const statusPath = path.join(portfolioRoot, 'public', 'runtime-project-status.json');
export const projectDataPath = path.join(portfolioRoot, 'src', 'project-data.json');

export function readProjects() {
  return JSON.parse(fs.readFileSync(projectDataPath, 'utf8'));
}

export function parseUrl(value) {
  const url = new URL(value);
  return {
    href: url.href,
    origin: url.origin,
    host: url.hostname,
    port: Number(url.port || (url.protocol === 'https:' ? 443 : 80)),
    pathname: url.pathname
  };
}

export function getBuildCwd(project) {
  return path.resolve(project.repoPath, project.buildCwd || '.');
}

export function getFallbackCwd(project) {
  return path.resolve(project.repoPath, project.fallbackCwd || '.');
}

export function getDeclaredOutput(project) {
  if (!project.buildOutput) return null;
  return path.resolve(project.repoPath, project.buildOutput);
}

export function findBuildOutput(project) {
  const declared = getDeclaredOutput(project);
  if (!declared || !fs.existsSync(declared)) return null;
  if (fs.existsSync(path.join(declared, 'index.html'))) return declared;

  const entries = fs.readdirSync(declared, { withFileTypes: true });
  const childWithIndex = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(declared, entry.name))
    .find((entryPath) => fs.existsSync(path.join(entryPath, 'index.html')));

  return childWithIndex || declared;
}

export function hasUsableBuild(project) {
  const output = findBuildOutput(project);
  if (!output) return false;
  if (project.fallbackCommand) return true;
  return fs.existsSync(path.join(output, 'index.html'));
}

export async function probeUrl(url, timeoutMs = 1600) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal
    });
    return {
      ok: response.status >= 200 && response.status < 500,
      status: response.status
    };
  } catch (error) {
    return {
      ok: false,
      status: error.name === 'AbortError' ? 'timeout' : 'offline'
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function runCommand(command, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env || {}) },
      shell: true,
      stdio: options.stdio || 'inherit'
    });

    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

export async function buildProject(project) {
  if (!project.buildCommand) {
    return { slug: project.slug, ok: false, skipped: true, reason: 'No buildCommand configured' };
  }

  const code = await runCommand(project.buildCommand, { cwd: getBuildCwd(project) });
  const output = findBuildOutput(project);
  const ok = code === 0 && hasUsableBuild(project);
  return {
    slug: project.slug,
    ok,
    code,
    command: project.buildCommand,
    output
  };
}

export function startCommandServer(project) {
  const url = parseUrl(project.localUrl);
  const child = spawn(project.fallbackCommand, {
    cwd: getFallbackCwd(project),
    env: {
      ...process.env,
      PORT: String(url.port),
      ...(project.fallbackEnv || {})
    },
    shell: true,
    stdio: 'inherit'
  });
  return {
    close: () => child.kill(),
    label: project.fallbackCommand
  };
}

export function startStaticServer(project, outputDir) {
  const url = parseUrl(project.localUrl);
  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || '/', project.localUrl);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const normalizedPath = decodedPath === '/' ? '/index.html' : decodedPath;
    const candidate = path.normalize(path.join(outputDir, normalizedPath));
    const insideOutput = candidate === outputDir || candidate.startsWith(`${outputDir}${path.sep}`);
    const filePath = insideOutput && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
      ? candidate
      : path.join(outputDir, 'index.html');

    try {
      const data = await fsp.readFile(filePath);
      response.writeHead(200, { 'Content-Type': getContentType(filePath) });
      response.end(data);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });

  server.listen(url.port, url.host);
  return {
    close: () => server.close(),
    label: outputDir
  };
}

export async function waitForUrl(url, timeoutMs = 12000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await probeUrl(url, 1000);
    if (result.ok) return result;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return probeUrl(url, 1000);
}

export async function writeRuntimeStatus(statuses) {
  await fsp.mkdir(path.dirname(statusPath), { recursive: true });
  await fsp.writeFile(statusPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    projects: statuses
  }, null, 2)}\n`);
}

export function removeRuntimeStatus() {
  if (fs.existsSync(statusPath)) fs.unlinkSync(statusPath);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };
  return map[ext] || 'application/octet-stream';
}
