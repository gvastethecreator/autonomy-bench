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
import { buildCatalogFromCells, galleryRelPath, parsePromptVersion } from './layout.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY = join(ROOT, 'gallery');
const ANIME_BUNDLE = join(ROOT, 'node_modules', 'animejs', 'dist', 'bundles', 'anime.esm.min.js');
const SKIP = new Set([
  'fonts',
  'icons',
  'vendor',
  'index.html',
  'catalog.json',
  'serve.json',
  '.nojekyll',
  '.git',
]);

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

function loadSuite() {
  const path = join(ROOT, 'suites', 'browser-autonomy', 'suite.json');
  return existsSync(path) ? json(path) : null;
}

function indexPublishedCells(galleryDir, suite) {
  const titles = new Map((suite?.benchmarks || []).map((b) => [b.id, b.title]));
  const cells = [];
  if (!existsSync(galleryDir)) return cells;
  for (const modelName of readdirSync(galleryDir)) {
    if (SKIP.has(modelName)) continue;
    const modelDir = join(galleryDir, modelName);
    if (!statSync(modelDir).isDirectory()) continue;
    for (const promptV of readdirSync(modelDir)) {
      const parsed = parsePromptVersion(promptV);
      if (!parsed.promptLevel) continue;
      const pvDir = join(modelDir, promptV);
      if (!statSync(pvDir).isDirectory()) continue;
      for (const date of readdirSync(pvDir)) {
        const cellDir = join(pvDir, date);
        if (!statSync(cellDir).isDirectory()) continue;
        const htmlPath = join(cellDir, 'index.html');
        const recPath = join(cellDir, 'receipt.json');
        const promptPath = join(cellDir, 'prompt.md');
        const receipt = existsSync(recPath) ? json(recPath) : null;
        const hasHtml = existsSync(htmlPath);
        if (!hasHtml && !receipt) continue;
        let status = 'missing';
        if (receipt) status = receipt.status || 'missing';
        else if (hasHtml) status = 'pending';
        const rel = `${modelName}/${promptV}/${date}`;
        const experiment = receipt?.benchmarkId || parsed.benchmarkId;
        const attemptMatch = String(date).match(/-a(\d+)$/);
        cells.push({
          cellId:
            receipt?.cellId ||
            `${parsed.benchmarkId}--${parsed.promptLevel.toLowerCase()}--${modelName}--a01`,
          model: receipt?.requestedModel || modelName,
          experiment,
          title: titles.get(experiment) || experiment,
          level: String(receipt?.promptLevel || parsed.promptLevel).toUpperCase(),
          attempt: receipt?.attempt || (attemptMatch ? Number(attemptMatch[1]) : 1),
          status,
          date,
          runId: receipt?.runId || '',
          promptSha256: receipt?.promptSha256 || '',
          src:
            hasHtml && (status === 'complete' || status === 'pending') ? `${rel}/index.html` : null,
          receiptSrc: receipt ? `${rel}/receipt.json` : null,
          promptSrc: existsSync(promptPath) ? `${rel}/prompt.md` : null,
          prompt: existsSync(promptPath) ? readFileSync(promptPath, 'utf8') : '',
          receipt,
        });
      }
    }
  }
  return cells;
}

function injectSnippet(template, marker, sourcePath) {
  const body = readFileSync(sourcePath, 'utf8').replace(/^export /gm, '');
  if (!template.includes(marker)) {
    throw new Error(`gallery-viewer.html is missing ${marker}`);
  }
  return template.replace(marker, body);
}

function writeGalleryViewer() {
  const here = dirname(fileURLToPath(import.meta.url));
  if (!existsSync(ANIME_BUNDLE)) {
    throw new Error('animejs bundle missing; run pnpm install');
  }
  copyFileSync(ANIME_BUNDLE, join(ensure(join(GALLERY, 'vendor')), 'anime.esm.min.js'));
  let template = readFileSync(join(here, 'gallery-viewer.html'), 'utf8');
  template = injectSnippet(template, '/* __HIGHLIGHT_HTML__ */', join(here, 'highlight-html.mjs'));
  template = injectSnippet(template, '/* __SCRAMBLE_SPAN__ */', join(here, 'scramble-span.mjs'));
  template = injectSnippet(template, '/* __IFRAME_QUEUE__ */', join(here, 'iframe-queue.mjs'));
  template = injectSnippet(template, '/* __RUN_MONTH__ */', join(here, 'run-month.mjs'));
  writeFileSync(join(GALLERY, 'index.html'), template);
  return createHash('sha256').update(template).digest('hex').slice(0, 12);
}

function cmdGallery(args) {
  if (!args.run) throw new Error('gallery requires --run <run-id>');
  const runDir = findRun(args.run);
  const m = json(join(runDir, 'manifest.json'));
  const experimentOrder = [];
  const seenExp = new Set();
  const modelOrder = [];
  const seenModel = new Set();
  let copiedHtml = 0;
  let copiedReceipts = 0;
  let copiedPrompts = 0;

  for (const cell of m.cells) {
    if (!seenExp.has(cell.benchmarkId)) {
      seenExp.add(cell.benchmarkId);
      experimentOrder.push(cell.benchmarkId);
    }
    if (!seenModel.has(cell.requestedModel)) {
      seenModel.add(cell.requestedModel);
      modelOrder.push(cell.requestedModel);
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
    const playable = hasHtml && (status === 'complete' || status === 'pending');
    if (!playable && !receipt) continue;
    const destDir = ensure(join(GALLERY, destRel));
    if (playable) {
      copyFileSync(htmlPath, join(destDir, 'index.html'));
      copiedHtml++;
    }
    if (receipt) {
      copyFileSync(recPath, join(destDir, 'receipt.json'));
      copiedReceipts++;
    }
    if (existsSync(promptPath)) {
      copyFileSync(promptPath, join(destDir, 'prompt.md'));
      copiedPrompts++;
    }
  }

  const suite = loadSuite();
  if (suite?.benchmarks) {
    for (const benchmark of suite.benchmarks) {
      if (!seenExp.has(benchmark.id)) experimentOrder.push(benchmark.id);
    }
  }
  const catalog = buildCatalogFromCells(indexPublishedCells(GALLERY, suite), {
    generatedAt: new Date().toISOString(),
    runId: m.runId,
    label: m.label,
    harness: m.harness,
    adapter: m.adapter,
    experimentOrder,
    modelOrder,
  });

  writeFileSync(join(GALLERY, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  const hash = writeGalleryViewer();
  writeFileSync(join(GALLERY, '.nojekyll'), '');
  writeFileSync(join(GALLERY, 'serve.json'), JSON.stringify({ cleanUrls: false }, null, 2) + '\n');
  console.log(relative(ROOT, GALLERY).replaceAll('\\', '/'));
  console.log(
    `${copiedHtml} HTML · ${copiedReceipts} receipts · ${copiedPrompts} prompts · ${catalog.models.length} models · ${catalog.experiments.length} experiments · ${catalog.dates.length} dates · ${catalog.promptRevisions.length} prompt revisions`,
  );
  console.log(`viewer sha256 ${hash}`);
}

try {
  const args = parse(process.argv.slice(2));
  if (args.viewer) {
    const hash = writeGalleryViewer();
    console.log(relative(ROOT, GALLERY).replaceAll('\\', '/'));
    console.log(`viewer sha256 ${hash}`);
  } else {
    cmdGallery(args);
  }
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exitCode = 1;
}
