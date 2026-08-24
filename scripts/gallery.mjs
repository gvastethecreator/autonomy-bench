#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  galleryCommand,
  liveBenchmarkIds,
  parseGalleryArgs,
  publishRun,
  stripNoHtmlGalleryTakes,
  stripRetiredGalleryBenchmarks,
  writeCatalogFile,
  writeGalleryViewer,
} from './gallery-publish.mjs';
import { findRun, readJson, walkFiles } from './run-io.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY = join(ROOT, 'gallery');
const ANIME_BUNDLE = join(ROOT, 'node_modules', 'animejs', 'dist', 'bundles', 'anime.esm.min.js');
const SCRIPTS = dirname(fileURLToPath(import.meta.url));

function loadSuite() {
  const path = join(ROOT, 'suites', 'browser-autonomy', 'suite.json');
  return existsSync(path) ? readJson(path) : null;
}

function listRuns() {
  const seen = new Set();
  const runs = [];
  for (const p of walkFiles(join(ROOT, 'runs')).filter((x) => basename(x) === 'manifest.json')) {
    const m = readJson(p);
    if (!m.runId || seen.has(m.runId)) continue;
    seen.add(m.runId);
    runs.push({ dir: dirname(p), manifest: m });
  }
  runs.sort((a, b) => String(a.manifest.runId).localeCompare(String(b.manifest.runId)));
  return runs;
}

function logStripped(retired, empty) {
  if (retired) console.log(`removed ${retired} retired gallery folders`);
  if (empty) console.log(`removed ${empty} gallery folders with no HTML`);
}

function finishGallery(extras, counts) {
  const suite = loadSuite();
  const droppedRetired = stripRetiredGalleryBenchmarks(GALLERY, suite);
  const droppedEmpty = stripNoHtmlGalleryTakes(GALLERY);
  const known = liveBenchmarkIds(suite);
  const experimentOrder = [...(extras.experimentOrder || [])].filter(
    (id) => !known.size || known.has(id),
  );
  const seenExp = new Set(experimentOrder);
  if (suite?.benchmarks) {
    for (const benchmark of suite.benchmarks) {
      if (!seenExp.has(benchmark.id)) experimentOrder.push(benchmark.id);
    }
  }
  const catalog = writeCatalogFile(GALLERY, suite, { ...extras, experimentOrder });
  const hash = writeGalleryViewer({
    galleryDir: GALLERY,
    scriptsDir: SCRIPTS,
    animeBundle: ANIME_BUNDLE,
  });
  writeFileSync(join(GALLERY, '.nojekyll'), '');
  writeFileSync(join(GALLERY, 'serve.json'), JSON.stringify({ cleanUrls: false }, null, 2) + '\n');
  console.log(relative(ROOT, GALLERY).replaceAll('\\', '/'));
  console.log(
    `${counts.copiedHtml} HTML · ${counts.copiedReceipts} receipts · ${counts.copiedPrompts} prompts · ${catalog.models.length} models · ${catalog.experiments.length} experiments · ${catalog.dates.length} dates · ${catalog.promptRevisions.length} prompt revisions`,
  );
  logStripped(droppedRetired, droppedEmpty);
  console.log(`viewer sha256 ${hash}`);
}

function cmdGallery(args) {
  const suite = loadSuite();
  const totals = { copiedHtml: 0, copiedReceipts: 0, copiedPrompts: 0 };
  const experimentOrder = [];
  const seenExp = new Set();
  let last = null;
  stripRetiredGalleryBenchmarks(GALLERY, suite);
  stripNoHtmlGalleryTakes(GALLERY);
  const runs =
    args.all || (!args.run && !args.viewer)
      ? listRuns()
      : [
          {
            dir: findRun(ROOT, args.run),
            manifest: readJson(join(findRun(ROOT, args.run), 'manifest.json')),
          },
        ];
  if (!runs.length) throw new Error('gallery requires --run <run-id> or existing runs');
  for (const run of runs) {
    const published = publishRun({ runDir: run.dir, galleryDir: GALLERY, suite });
    last = published.manifest;
    totals.copiedHtml += published.copiedHtml;
    totals.copiedReceipts += published.copiedReceipts;
    totals.copiedPrompts += published.copiedPrompts;
    for (const id of published.experimentOrder) {
      if (seenExp.has(id)) continue;
      seenExp.add(id);
      experimentOrder.push(id);
    }
  }
  finishGallery(
    {
      runId: last?.runId || '',
      label: last?.label || '',
      harness: last?.harness || '',
      adapter: last?.adapter || '',
      experimentOrder,
    },
    totals,
  );
}

try {
  const args = parseGalleryArgs(process.argv.slice(2));
  const command = galleryCommand(args);
  const suite = loadSuite();
  if (command === 'viewer') {
    const droppedRetired = stripRetiredGalleryBenchmarks(GALLERY, suite);
    const droppedEmpty = stripNoHtmlGalleryTakes(GALLERY);
    const catalog = writeCatalogFile(GALLERY, suite);
    const hash = writeGalleryViewer({
      galleryDir: GALLERY,
      scriptsDir: SCRIPTS,
      animeBundle: ANIME_BUNDLE,
    });
    console.log(relative(ROOT, GALLERY).replaceAll('\\', '/'));
    console.log(
      `${catalog.models.length} models · ${catalog.experiments.length} experiments · ${catalog.dates.length} dates · ${catalog.promptRevisions.length} prompt revisions`,
    );
    logStripped(droppedRetired, droppedEmpty);
    console.log(`viewer sha256 ${hash}`);
  } else {
    cmdGallery(args);
  }
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exitCode = 1;
}
