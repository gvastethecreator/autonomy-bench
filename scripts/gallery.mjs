#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fallbackGithubForReceipt, stampContributor } from './contributor.mjs';
import { buildCatalogFromCells, galleryRelPath, parsePromptVersion } from './layout.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY = join(ROOT, 'gallery');
const ANIME_BUNDLE = join(ROOT, 'node_modules', 'animejs', 'dist', 'bundles', 'anime.esm.min.js');
const DEFAULT_EXPERIMENT_ORDER = [
  'rollercoaster',
  'endless-driving',
  'medieval-city',
  'procedural-biped',
  'infinite-maze',
];

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

function supportedPromptLevels(suite = loadSuite()) {
  return new Set(Object.keys(suite?.promptLevels || { A: true }));
}

function cellField(cell, ...keys) {
  for (const key of keys) {
    if (cell[key] != null && cell[key] !== '') return cell[key];
  }
  return '';
}

function publishStatus(status) {
  if (status === 'complete') return 'complete';
  return status || 'missing';
}

function isPlayable(hasHtml, status) {
  const st = publishStatus(status);
  return hasHtml && (st === 'complete' || st === 'pending');
}

function liveBenchmarkIds() {
  return new Set((loadSuite()?.benchmarks || []).map((b) => b.id));
}

function stripRetiredGalleryBenchmarks() {
  if (!existsSync(GALLERY)) return 0;
  const known = liveBenchmarkIds();
  if (!known.size) return 0;
  let removed = 0;
  for (const modelName of readdirSync(GALLERY)) {
    if (SKIP.has(modelName)) continue;
    const modelDir = join(GALLERY, modelName);
    if (!statSync(modelDir).isDirectory()) continue;
    for (const promptV of readdirSync(modelDir)) {
      const parsed = parsePromptVersion(promptV);
      const id = parsed.benchmarkId;
      if (!id || known.has(id)) continue;
      rmSync(join(modelDir, promptV), { recursive: true, force: true });
      removed++;
    }
    if (existsSync(modelDir) && readdirSync(modelDir).length === 0) {
      rmSync(modelDir, { recursive: true, force: true });
    }
  }
  return removed;
}

function indexPublishedCells(galleryDir, suite) {
  const titles = new Map((suite?.benchmarks || []).map((b) => [b.id, b.title]));
  const levels = supportedPromptLevels(suite);
  const cells = [];
  if (!existsSync(galleryDir)) return cells;
  for (const modelName of readdirSync(galleryDir)) {
    if (SKIP.has(modelName)) continue;
    const modelDir = join(galleryDir, modelName);
    if (!statSync(modelDir).isDirectory()) continue;
    for (const promptV of readdirSync(modelDir)) {
      const parsed = parsePromptVersion(promptV);
      const level = String(parsed.promptLevel || '').toUpperCase();
      if (!levels.has(level)) continue;
      const pvDir = join(modelDir, promptV);
      if (!statSync(pvDir).isDirectory()) continue;
      for (const date of readdirSync(pvDir)) {
        const cellDir = join(pvDir, date);
        if (!statSync(cellDir).isDirectory()) continue;
        const htmlPath = join(cellDir, 'index.html');
        const recPath = join(cellDir, 'receipt.json');
        const promptPath = join(cellDir, 'prompt.md');
        let receipt = existsSync(recPath) ? json(recPath) : null;
        if (receipt) {
          const stamped = stampContributor(receipt, fallbackGithubForReceipt(receipt));
          if (stamped.changed) {
            writeFileSync(recPath, JSON.stringify(stamped.receipt, null, 2) + '\n');
          }
          receipt = stamped.receipt;
        }
        const hasHtml = existsSync(htmlPath);
        if (!hasHtml && !receipt) continue;
        const status = publishStatus(receipt ? receipt.status : hasHtml ? 'pending' : 'missing');
        const rel = `${modelName}/${promptV}/${date}`;
        const experiment = receipt?.benchmarkId || parsed.benchmarkId;
        if (titles.size && experiment && !titles.has(experiment)) continue;
        const attemptMatch = String(date).match(/-a(\d+)$/);
        const promptSha = receipt?.promptSha256 || '';
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
          promptSha256: promptSha,
          src: isPlayable(hasHtml, status) ? `${rel}/index.html` : null,
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
  const dest = join(ensure(join(GALLERY, 'vendor')), 'anime.esm.min.js');
  if (existsSync(ANIME_BUNDLE)) copyFileSync(ANIME_BUNDLE, dest);
  else if (!existsSync(dest)) {
    throw new Error('animejs bundle missing; run pnpm install');
  }
  let template = readFileSync(join(here, 'gallery-viewer.html'), 'utf8');
  template = injectSnippet(template, '/* __HIGHLIGHT_HTML__ */', join(here, 'highlight-html.mjs'));
  template = injectSnippet(template, '/* __SCRAMBLE_SPAN__ */', join(here, 'scramble-span.mjs'));
  template = injectSnippet(template, '/* __STACK_PANELS__ */', join(here, 'stack-panels.mjs'));
  template = injectSnippet(template, '/* __IFRAME_QUEUE__ */', join(here, 'iframe-queue.mjs'));
  template = injectSnippet(template, '/* __RUN_MONTH__ */', join(here, 'run-month.mjs'));
  template = injectSnippet(template, '/* __VOTES__ */', join(here, 'votes.mjs'));
  template = injectSnippet(template, '/* __STAFF_PICKS__ */', join(here, 'staff-picks.mjs'));
  writeFileSync(join(GALLERY, 'index.html'), template);
  return createHash('sha256').update(template).digest('hex').slice(0, 12);
}

function previousIds(rows) {
  return (rows || []).map((row) => row.id).filter(Boolean);
}

function writeCatalog(extras = {}) {
  const catalogPath = join(GALLERY, 'catalog.json');
  const prev = existsSync(catalogPath) ? json(catalogPath) : {};
  const suite = loadSuite();
  const preferred = extras.experimentOrder || DEFAULT_EXPERIMENT_ORDER;
  const catalog = buildCatalogFromCells(indexPublishedCells(GALLERY, suite), {
    generatedAt: new Date().toISOString(),
    runId: extras.runId || prev.runId || '',
    label: extras.label || prev.label || '',
    harness: extras.harness || prev.harness || '',
    adapter: extras.adapter || prev.adapter || '',
    experimentOrder: DEFAULT_EXPERIMENT_ORDER.concat(
      preferred.filter((id) => !DEFAULT_EXPERIMENT_ORDER.includes(id)),
    ),
    modelOrder: extras.modelOrder || previousIds(prev.models),
  });
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  return catalog;
}

function listRuns() {
  const seen = new Set();
  const runs = [];
  for (const p of walk(join(ROOT, 'runs')).filter((x) => basename(x) === 'manifest.json')) {
    const m = json(p);
    if (!m.runId || seen.has(m.runId)) continue;
    seen.add(m.runId);
    runs.push({ dir: dirname(p), manifest: m });
  }
  runs.sort((a, b) => String(a.manifest.runId).localeCompare(String(b.manifest.runId)));
  return runs;
}

function publishRun(runDir) {
  const m = json(join(runDir, 'manifest.json'));
  const levels = supportedPromptLevels();
  const experimentOrder = [];
  const seenExp = new Set();
  const modelOrder = [];
  const seenModel = new Set();
  const known = liveBenchmarkIds();
  let copiedHtml = 0;
  let copiedReceipts = 0;
  let copiedPrompts = 0;

  for (const cell of m.cells || []) {
    const level = String(cellField(cell, 'promptLevel')).toUpperCase();
    if (!levels.has(level)) continue;
    const benchmarkId = cellField(cell, 'benchmarkId');
    const model = cellField(cell, 'requestedModel');
    if (!benchmarkId || !model) continue;
    if (known.size && !known.has(benchmarkId)) continue;
    if (!seenExp.has(benchmarkId)) {
      seenExp.add(benchmarkId);
      experimentOrder.push(benchmarkId);
    }
    if (!seenModel.has(model)) {
      seenModel.add(model);
      modelOrder.push(model);
    }
    const htmlPath = join(runDir, cellField(cell, 'outputPath'), 'index.html');
    const recPath = join(runDir, cellField(cell, 'receiptPath'));
    const promptPath = join(runDir, cellField(cell, 'promptPath'));
    const hasHtml = existsSync(htmlPath);
    const receipt = existsSync(recPath) ? json(recPath) : null;
    const status = publishStatus(receipt ? receipt.status : hasHtml ? 'pending' : 'missing');
    const destRel = galleryRelPath({
      model,
      benchmarkId,
      promptLevel: level,
      date: m.date,
      runId: m.runId,
      attempt: cell.attempt || 1,
    });
    if (!isPlayable(hasHtml, status) && !receipt) continue;
    const destDir = ensure(join(GALLERY, destRel));
    if (isPlayable(hasHtml, status)) {
      copyFileSync(htmlPath, join(destDir, 'index.html'));
      copiedHtml++;
    }
    if (receipt) {
      const stamped = stampContributor(receipt, fallbackGithubForReceipt(receipt)).receipt;
      writeFileSync(join(destDir, 'receipt.json'), JSON.stringify(stamped, null, 2) + '\n');
      copiedReceipts++;
    }
    if (existsSync(promptPath) && (isPlayable(hasHtml, status) || receipt)) {
      copyFileSync(promptPath, join(destDir, 'prompt.md'));
      copiedPrompts++;
    }
  }

  return {
    manifest: m,
    experimentOrder,
    modelOrder,
    copiedHtml,
    copiedReceipts,
    copiedPrompts,
  };
}

function finishGallery(extras, counts) {
  const dropped = stripRetiredGalleryBenchmarks();
  const suite = loadSuite();
  const known = liveBenchmarkIds();
  const experimentOrder = [...(extras.experimentOrder || [])].filter(
    (id) => !known.size || known.has(id),
  );
  const seenExp = new Set(experimentOrder);
  if (suite?.benchmarks) {
    for (const benchmark of suite.benchmarks) {
      if (!seenExp.has(benchmark.id)) experimentOrder.push(benchmark.id);
    }
  }
  const catalog = writeCatalog({
    ...extras,
    experimentOrder,
  });
  const hash = writeGalleryViewer();
  writeFileSync(join(GALLERY, '.nojekyll'), '');
  writeFileSync(join(GALLERY, 'serve.json'), JSON.stringify({ cleanUrls: false }, null, 2) + '\n');
  console.log(relative(ROOT, GALLERY).replaceAll('\\', '/'));
  console.log(
    `${counts.copiedHtml} HTML · ${counts.copiedReceipts} receipts · ${counts.copiedPrompts} prompts · ${catalog.models.length} models · ${catalog.experiments.length} experiments · ${catalog.dates.length} dates · ${catalog.promptRevisions.length} prompt revisions`,
  );
  if (dropped) console.log(`removed ${dropped} retired gallery folders`);
  console.log(`viewer sha256 ${hash}`);
}

function cmdGallery(args) {
  const totals = { copiedHtml: 0, copiedReceipts: 0, copiedPrompts: 0 };
  const experimentOrder = [];
  const seenExp = new Set();
  const modelOrder = [];
  const seenModel = new Set();
  let last = null;

  stripRetiredGalleryBenchmarks();

  const runs =
    args.all || (!args.run && !args.viewer)
      ? listRuns()
      : [{ dir: findRun(args.run), manifest: json(join(findRun(args.run), 'manifest.json')) }];

  if (!runs.length) throw new Error('gallery requires --run <run-id> or existing runs');

  for (const run of runs) {
    const published = publishRun(run.dir);
    last = published.manifest;
    totals.copiedHtml += published.copiedHtml;
    totals.copiedReceipts += published.copiedReceipts;
    totals.copiedPrompts += published.copiedPrompts;
    for (const id of published.experimentOrder) {
      if (seenExp.has(id)) continue;
      seenExp.add(id);
      experimentOrder.push(id);
    }
    for (const id of published.modelOrder) {
      if (seenModel.has(id)) continue;
      seenModel.add(id);
      modelOrder.push(id);
    }
  }

  finishGallery(
    {
      runId: last?.runId || '',
      label: last?.label || '',
      harness: last?.harness || '',
      adapter: last?.adapter || '',
      experimentOrder,
      modelOrder,
    },
    totals,
  );
}

try {
  const args = parse(process.argv.slice(2));
  if (args.viewer) {
    const dropped = stripRetiredGalleryBenchmarks();
    const catalog = writeCatalog();
    const hash = writeGalleryViewer();
    console.log(relative(ROOT, GALLERY).replaceAll('\\', '/'));
    console.log(
      `${catalog.models.length} models · ${catalog.experiments.length} experiments · ${catalog.dates.length} dates · ${catalog.promptRevisions.length} prompt revisions`,
    );
    if (dropped) console.log(`removed ${dropped} retired gallery folders`);
    console.log(`viewer sha256 ${hash}`);
  } else {
    cmdGallery(args);
  }
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exitCode = 1;
}
