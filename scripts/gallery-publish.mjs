import {
  copyFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { attemptFromDateFolder, cellId } from './cell-id.mjs';
import { buildCatalogFromCells, glanceFromReceipt } from './catalog.mjs';
import { fallbackGithubForReceipt, stampContributor } from './contributor.mjs';
import { galleryRelPath, parsePromptVersion } from './layout.mjs';
import { outputSizeFromHtml } from './output-tokens.mjs';
import { isPlayable, publishStatus } from './receipt.mjs';
import { ensureDir, readJson, writeJson } from './run-io.mjs';

export const DEFAULT_EXPERIMENT_ORDER = ['rollercoaster'];

export const GALLERY_SKIP = new Set([
  'fonts',
  'icons',
  'vendor',
  'index.html',
  'catalog.json',
  'serve.json',
  '.nojekyll',
  '.git',
]);

export function parseGalleryArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--') continue;
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

export function galleryCommand(args) {
  if (args.viewer) return 'viewer';
  if (args.run) return 'run';
  return 'all';
}

export function supportedPromptLevels(suite) {
  return new Set(Object.keys(suite?.promptLevels || { A: true }));
}

function cellField(cell, ...keys) {
  for (const key of keys) {
    if (cell[key] != null && cell[key] !== '') return cell[key];
  }
  return '';
}

export function liveBenchmarkIds(suite) {
  return new Set((suite?.benchmarks || []).map((b) => b.id));
}

export function stripNoHtmlGalleryTakes(galleryDir) {
  if (!existsSync(galleryDir)) return 0;
  let removed = 0;
  for (const modelName of readdirSync(galleryDir)) {
    if (GALLERY_SKIP.has(modelName)) continue;
    const modelDir = join(galleryDir, modelName);
    if (!statSync(modelDir).isDirectory()) continue;
    for (const promptV of readdirSync(modelDir)) {
      const pvDir = join(modelDir, promptV);
      if (!statSync(pvDir).isDirectory()) continue;
      for (const date of readdirSync(pvDir)) {
        const cellDir = join(pvDir, date);
        if (!statSync(cellDir).isDirectory()) continue;
        if (existsSync(join(cellDir, 'index.html'))) continue;
        rmSync(cellDir, { recursive: true, force: true });
        removed++;
      }
      if (existsSync(pvDir) && readdirSync(pvDir).length === 0) {
        rmSync(pvDir, { recursive: true, force: true });
      }
    }
    if (existsSync(modelDir) && readdirSync(modelDir).length === 0) {
      rmSync(modelDir, { recursive: true, force: true });
    }
  }
  return removed;
}

export function stripRetiredGalleryBenchmarks(galleryDir, suite, archiveDir = '') {
  if (!existsSync(galleryDir)) return 0;
  const known = liveBenchmarkIds(suite);
  if (!known.size) return 0;
  let removed = 0;
  for (const modelName of readdirSync(galleryDir)) {
    if (GALLERY_SKIP.has(modelName)) continue;
    const modelDir = join(galleryDir, modelName);
    if (!statSync(modelDir).isDirectory()) continue;
    for (const promptV of readdirSync(modelDir)) {
      const parsed = parsePromptVersion(promptV);
      const id = parsed.benchmarkId;
      if (!id || known.has(id)) continue;
      const src = join(modelDir, promptV);
      if (archiveDir) {
        const dest = join(archiveDir, modelName, promptV);
        if (existsSync(dest)) rmSync(src, { recursive: true, force: true });
        else {
          ensureDir(join(archiveDir, modelName));
          renameSync(src, dest);
        }
      } else {
        rmSync(src, { recursive: true, force: true });
      }
      removed++;
    }
    if (existsSync(modelDir) && readdirSync(modelDir).length === 0) {
      rmSync(modelDir, { recursive: true, force: true });
    }
  }
  return removed;
}

export function indexPublishedCells(galleryDir, suite) {
  const titles = new Map((suite?.benchmarks || []).map((b) => [b.id, b.title]));
  const levels = supportedPromptLevels(suite);
  const cells = [];
  if (!existsSync(galleryDir)) return cells;
  for (const modelName of readdirSync(galleryDir)) {
    if (GALLERY_SKIP.has(modelName)) continue;
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
        let receipt = existsSync(recPath) ? readJson(recPath) : null;
        if (receipt) {
          const stamped = stampContributor(receipt, fallbackGithubForReceipt(receipt));
          if (stamped.changed) writeJson(recPath, stamped.receipt);
          receipt = stamped.receipt;
        }
        const hasHtml = existsSync(htmlPath);
        if (!hasHtml) continue;
        const status = publishStatus(receipt, hasHtml);
        const rel = `${modelName}/${promptV}/${date}`;
        const experiment = receipt?.benchmarkId || parsed.benchmarkId;
        if (titles.size && experiment && !titles.has(experiment)) continue;
        const attempt = receipt?.attempt || attemptFromDateFolder(date);
        const promptSha = receipt?.promptSha256 || '';
        const size = hasHtml
          ? outputSizeFromHtml(readFileSync(htmlPath, 'utf8'))
          : outputSizeFromHtml('');
        cells.push({
          cellId:
            receipt?.cellId ||
            cellId({
              benchmarkId: parsed.benchmarkId,
              promptLevel: parsed.promptLevel,
              model: modelName,
              attempt,
            }),
          model: receipt?.requestedModel || modelName,
          experiment,
          title: titles.get(experiment) || experiment,
          level: String(receipt?.promptLevel || parsed.promptLevel).toUpperCase(),
          attempt,
          status,
          date,
          runId: receipt?.runId || '',
          receipt,
          promptSha256: promptSha,
          src: isPlayable(hasHtml, status) ? `${rel}/index.html` : null,
          receiptSrc: receipt ? `${rel}/receipt.json` : null,
          promptSrc: existsSync(promptPath) ? `${rel}/prompt.md` : null,
          glance: glanceFromReceipt(receipt),
          prompt: existsSync(promptPath) ? readFileSync(promptPath, 'utf8') : '',
          outputChars: size.outputChars,
          outputTokensApprox: size.outputTokensApprox,
          outputTokensMethod: size.outputTokensMethod,
        });
      }
    }
  }
  return cells;
}

export function publishRun({ runDir, galleryDir, suite }) {
  const m = readJson(join(runDir, 'manifest.json'));
  const levels = supportedPromptLevels(suite);
  const experimentOrder = [];
  const seenExp = new Set();
  const known = liveBenchmarkIds(suite);
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
    const htmlPath = join(runDir, cellField(cell, 'outputPath'), 'index.html');
    const recPath = join(runDir, cellField(cell, 'receiptPath'));
    const promptPath = join(runDir, cellField(cell, 'promptPath'));
    const hasHtml = existsSync(htmlPath);
    const receipt = existsSync(recPath) ? readJson(recPath) : null;
    const status = publishStatus(receipt, hasHtml);
    const destRel = galleryRelPath({
      model,
      benchmarkId,
      promptLevel: level,
      date: m.date,
      runId: m.runId,
      attempt: cell.attempt || 1,
    });
    if (!isPlayable(hasHtml, status)) continue;
    const destDir = ensureDir(join(galleryDir, destRel));
    if (isPlayable(hasHtml, status)) {
      copyFileSync(htmlPath, join(destDir, 'index.html'));
      copiedHtml++;
    }
    if (receipt) {
      writeJson(
        join(destDir, 'receipt.json'),
        stampContributor(receipt, fallbackGithubForReceipt(receipt)).receipt,
      );
      copiedReceipts++;
    }
    if (existsSync(promptPath) && (isPlayable(hasHtml, status) || receipt)) {
      copyFileSync(promptPath, join(destDir, 'prompt.md'));
      copiedPrompts++;
    }
  }

  return { manifest: m, experimentOrder, copiedHtml, copiedReceipts, copiedPrompts };
}

export function writeCatalogFile(galleryDir, suite, extras = {}) {
  const catalogPath = join(galleryDir, 'catalog.json');
  const prev = existsSync(catalogPath) ? readJson(catalogPath) : {};
  const preferred = extras.experimentOrder || DEFAULT_EXPERIMENT_ORDER;
  const catalog = buildCatalogFromCells(indexPublishedCells(galleryDir, suite), {
    generatedAt: extras.generatedAt || new Date().toISOString(),
    // prev fills in only when no run is being published (viewer rebuild);
    // a published run's own metadata must not inherit an older run's label/harness.
    runId: extras.runId || prev.runId || '',
    label: (extras.runId ? extras.label : extras.label || prev.label) || '',
    harness: (extras.runId ? extras.harness : extras.harness || prev.harness) || '',
    adapter: (extras.runId ? extras.adapter : extras.adapter || prev.adapter) || '',
    experimentOrder: DEFAULT_EXPERIMENT_ORDER.concat(
      preferred.filter((id) => !DEFAULT_EXPERIMENT_ORDER.includes(id)),
    ),
  });
  writeJson(catalogPath, catalog);
  return catalog;
}

export const VIEWER_MODULES = [
  'layout.mjs',
  'cell-id.mjs',
  'catalog.mjs',
  'model-meta.mjs',
  'run-month.mjs',
  'staff-picks.mjs',
  'votes.mjs',
  'contributor.mjs',
  'highlight-html.mjs',
  'brands.mjs',
  'scramble-span.mjs',
  'stack-panels.mjs',
  'iframe-queue.mjs',
  'receipt.mjs',
];

export function writeGalleryViewer({ galleryDir, scriptsDir, animeBundle }) {
  const vendor = ensureDir(join(galleryDir, 'vendor'));
  if (existsSync(animeBundle)) copyFileSync(animeBundle, join(vendor, 'anime.esm.min.js'));
  else if (!existsSync(join(vendor, 'anime.esm.min.js'))) {
    throw new Error('animejs bundle missing; run pnpm install');
  }
  for (const name of VIEWER_MODULES) {
    copyFileSync(join(scriptsDir, name), join(vendor, name));
  }
  const template = readFileSync(join(scriptsDir, 'gallery-viewer.html'), 'utf8');
  writeFileSync(join(galleryDir, 'index.html'), template);
  return createHash('sha256').update(template).digest('hex').slice(0, 12);
}
