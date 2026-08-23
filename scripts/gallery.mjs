#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { galleryRelPath } from './layout.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY = join(ROOT, 'gallery');

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
function ensure(path) {
  mkdirSync(path, { recursive: true });
  return path;
}
function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function findRun(id) {
  const base = join(ROOT, 'runs');
  for (const p of walk(base).filter((x) => basename(x) === 'manifest.json')) {
    const m = json(p);
    if (m.runId === id || dirname(p).endsWith(id)) return dirname(p);
  }
  throw new Error(`Run not found: ${id}`);
}
function parse(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i++;
    } else args[key] = true;
  }
  return args;
}

function cmdGallery(args) {
  if (!args.run) throw new Error('gallery requires --run <run-id>');
  const runDir = findRun(args.run);
  const m = json(join(runDir, 'manifest.json'));
  const experiments = [];
  const seenExp = new Set();
  const models = [];
  const seenModel = new Set();
  const cells = [];
  let copiedHtml = 0;
  let copiedReceipts = 0;
  let copiedPrompts = 0;

  for (const cell of m.cells) {
    if (!seenExp.has(cell.benchmarkId)) {
      seenExp.add(cell.benchmarkId);
      experiments.push({ id: cell.benchmarkId, title: cell.benchmarkTitle });
    }
    if (!seenModel.has(cell.requestedModel)) {
      seenModel.add(cell.requestedModel);
      models.push({ id: cell.requestedModel });
    }
    const htmlPath = join(runDir, cell.outputPath, 'index.html');
    const recPath = join(runDir, cell.receiptPath);
    const promptPath = join(runDir, cell.promptPath);
    const hasHtml = existsSync(htmlPath);
    const receipt = existsSync(recPath) ? json(recPath) : null;
    let status = 'missing';
    if (receipt) status = receipt.status || 'missing';
    else if (hasHtml) status = 'pending';
    const level = String(cell.promptLevel).toUpperCase();
    const destRel = galleryRelPath({
      model: cell.requestedModel,
      benchmarkId: cell.benchmarkId,
      promptLevel: level,
      date: m.date,
      runId: m.runId,
      attempt: cell.attempt,
    });
    const destDir = ensure(join(GALLERY, destRel));
    let src = null;
    let receiptSrc = null;
    let promptSrc = null;
    if (hasHtml && (status === 'complete' || status === 'pending')) {
      copyFileSync(htmlPath, join(destDir, 'index.html'));
      src = `${destRel}/index.html`;
      copiedHtml++;
    }
    if (receipt) {
      copyFileSync(recPath, join(destDir, 'receipt.json'));
      receiptSrc = `${destRel}/receipt.json`;
      copiedReceipts++;
    }
    if (existsSync(promptPath)) {
      copyFileSync(promptPath, join(destDir, 'prompt.md'));
      promptSrc = `${destRel}/prompt.md`;
      copiedPrompts++;
    }
    cells.push({
      cellId: cell.cellId,
      model: cell.requestedModel,
      experiment: cell.benchmarkId,
      title: cell.benchmarkTitle,
      level,
      attempt: cell.attempt,
      status,
      src,
      receiptSrc,
      promptSrc,
      prompt: existsSync(promptPath) ? readFileSync(promptPath, 'utf8') : '',
      receipt,
    });
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    runId: m.runId,
    label: m.label,
    harness: m.harness,
    adapter: m.adapter,
    models: models.map((model) => {
      const mine = cells.filter((c) => c.model === model.id);
      return {
        id: model.id,
        complete: mine.filter((c) => c.status === 'complete').length,
        unavailable: mine.filter((c) => c.status === 'unavailable').length,
        pending: mine.filter((c) => c.status === 'pending' || c.status === 'missing').length,
        failed: mine.filter((c) => c.status === 'failed' || c.status === 'blocked').length,
        playable: mine.filter((c) => c.src).length,
      };
    }),
    experiments,
    cells,
  };

  writeFileSync(join(GALLERY, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  const template = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'gallery-viewer.html'),
    'utf8',
  );
  const html = template
    .replaceAll('__RUN_ID__', escapeHtml(catalog.runId))
    .replace('__CATALOG__', JSON.stringify(catalog).replace(/</g, '\\u003c'));
  writeFileSync(join(GALLERY, 'index.html'), html);
  writeFileSync(join(GALLERY, '.nojekyll'), '');
  writeFileSync(join(GALLERY, 'serve.json'), JSON.stringify({ cleanUrls: false }, null, 2) + '\n');
  const hash = createHash('sha256')
    .update(readFileSync(join(GALLERY, 'index.html')))
    .digest('hex')
    .slice(0, 12);
  console.log(relative(ROOT, GALLERY).replaceAll('\\', '/'));
  console.log(
    `${copiedHtml} HTML · ${copiedReceipts} receipts · ${copiedPrompts} prompts · ${catalog.models.length} models · ${catalog.experiments.length} experiments`,
  );
  console.log(`viewer sha256 ${hash}`);
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );
}

try {
  cmdGallery(parse(process.argv.slice(2)));
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exitCode = 1;
}
