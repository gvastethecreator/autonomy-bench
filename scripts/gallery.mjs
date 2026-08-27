#!/usr/bin/env node
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { finishGallery, galleryCommand, parseGalleryArgs, publishRun } from './gallery-publish.mjs';
import { findRun, listRuns, readJson } from './run-io.mjs';
import { loadSuite } from './suite.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY = join(ROOT, 'gallery');
const GALLERY_ARCHIVE = join(ROOT, '.scratch', 'archive', 'gallery');
const ANIME_BUNDLE = join(ROOT, 'node_modules', 'animejs', 'dist', 'bundles', 'anime.esm.min.js');
const SCRIPTS = dirname(fileURLToPath(import.meta.url));

export function gallerySuitePath(root = ROOT) {
  return join(root, 'suites', 'browser-autonomy', 'suite.json');
}

function loadLiveSuite() {
  return loadSuite(gallerySuitePath());
}

function logFinished(result, counts = null) {
  const catalog = result.catalog;
  console.log(relative(ROOT, GALLERY).replaceAll('\\', '/'));
  if (counts) {
    console.log(
      `${counts.copiedHtml} HTML · ${counts.copiedReceipts} receipts · ${counts.copiedPrompts} prompts · ${catalog.models.length} models · ${catalog.experiments.length} experiments · ${catalog.dates.length} dates · ${catalog.promptRevisions.length} prompt revisions`,
    );
  } else {
    console.log(
      `${catalog.models.length} models · ${catalog.experiments.length} experiments · ${catalog.dates.length} dates · ${catalog.promptRevisions.length} prompt revisions`,
    );
  }
  if (result.droppedRetired)
    console.log(`archived ${result.droppedRetired} retired gallery folders`);
  if (result.droppedEmpty)
    console.log(`removed ${result.droppedEmpty} gallery folders with no HTML`);
  console.log(`viewer sha256 ${result.hash}`);
}

function rebuildGallery(extras = {}, counts = null) {
  const result = finishGallery({
    galleryDir: GALLERY,
    scriptsDir: SCRIPTS,
    animeBundle: ANIME_BUNDLE,
    suite: loadLiveSuite(),
    archiveDir: GALLERY_ARCHIVE,
    extras,
  });
  logFinished(result, counts);
  return result;
}

function publishRuns(args) {
  const suite = loadLiveSuite();
  const totals = { copiedHtml: 0, copiedReceipts: 0, copiedPrompts: 0 };
  const experimentOrder = [];
  const seenExp = new Set();
  let last = null;
  const runs =
    args.all || (!args.run && !args.viewer)
      ? listRuns(ROOT)
      : [
          (() => {
            const dir = findRun(ROOT, args.run);
            return { dir, manifest: readJson(join(dir, 'manifest.json')) };
          })(),
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
  rebuildGallery(
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

export function runGalleryCli(args) {
  if (galleryCommand(args) === 'viewer') rebuildGallery();
  else publishRuns(args);
}

function isMainModule() {
  const entry = process.argv[1];
  if (!entry) return false;
  return pathToFileURL(resolve(entry)).href === import.meta.url;
}

if (isMainModule()) {
  try {
    runGalleryCli(parseGalleryArgs(process.argv.slice(2)));
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exitCode = 1;
  }
}
