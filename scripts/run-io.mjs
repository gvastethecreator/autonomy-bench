import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

/** @param {string} path */
export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** @param {string} path */
export function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

/** @param {string} path */
export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
  return path;
}

/** @param {string} dir */
export function walkFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

/** @param {string} root */
export function listRuns(root) {
  const seen = new Set();
  const runs = [];
  for (const p of walkFiles(join(root, 'runs')).filter(
    (file) => basename(file) === 'manifest.json',
  )) {
    const manifest = readJson(p);
    if (!manifest.runId || seen.has(manifest.runId)) continue;
    seen.add(manifest.runId);
    runs.push({ dir: dirname(p), manifest });
  }
  runs.sort((a, b) => String(a.manifest.runId).localeCompare(String(b.manifest.runId)));
  return runs;
}

/** @param {string} root @param {string} id */
export function findRun(root, id) {
  const wanted = String(id || '');
  for (const run of listRuns(root)) {
    if (run.manifest.runId === wanted || run.dir.endsWith(wanted)) return run.dir;
  }
  throw new Error(`Run not found: ${id}`);
}
