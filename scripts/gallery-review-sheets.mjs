import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { parseArgs } from './cli-args.mjs';
import { ensureDir, readJson, writeJson } from './run-io.mjs';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function browserCandidates(explicitPath = '') {
  return [
    explicitPath,
    process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe')
      : '',
    process.env.PROGRAMFILES
      ? join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe')
      : '',
    process.env['PROGRAMFILES(X86)']
      ? join(process.env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      : '',
  ].filter(Boolean);
}

function findBrowser(explicitPath = '') {
  const executable = browserCandidates(explicitPath).find((candidate) => existsSync(candidate));
  if (!executable) {
    throw new Error('Chrome or Edge was not found. Pass --browser with an executable path.');
  }
  return executable;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function dataUrl(path) {
  return 'data:image/png;base64,' + readFileSync(path).toString('base64');
}

function latestCurrentSources(takes) {
  const latest = new Map();
  for (const take of takes) {
    const key = take.experiment + '::' + take.level + '::' + take.model;
    const current = latest.get(key);
    if (
      !current ||
      Number(take.promptRevision || 1) > Number(current.promptRevision || 1) ||
      (Number(take.promptRevision || 1) === Number(current.promptRevision || 1) &&
        (String(take.date || '').localeCompare(String(current.date || '')) > 0 ||
          (take.date === current.date && Number(take.attempt || 1) > Number(current.attempt || 1))))
    ) {
      latest.set(key, take);
    }
  }
  return new Set([...latest.values()].map((take) => take.src));
}

function cardMarkup(entry) {
  const capture = entry.take.capture;
  const runtime = capture.runtime;
  const motion = capture.motion;
  const sampleLabels = ['INITIAL', 'AUTO 1', 'AUTO 2', 'INTERACTION'];
  const images = entry.take.screenshotPaths
    .map(
      (path, index) =>
        '<figure><img src="' +
        dataUrl(path) +
        '" alt=""><figcaption>' +
        sampleLabels[index] +
        '</figcaption></figure>',
    )
    .join('');
  const errorCount =
    runtime.pageErrors.length + runtime.consoleErrors.length + runtime.failedRequests.length;
  return (
    '<article class="take">' +
    '<header><strong>' +
    escapeHtml(entry.reviewId) +
    '</strong><span>' +
    (entry.isCurrentCandidate ? 'CURRENT' : 'HISTORICAL') +
    '</span></header>' +
    '<div class="frames">' +
    images +
    '</div>' +
    '<footer>' +
    '<span>AUTO <b>' +
    motion.automaticChangePct +
    '%</b></span>' +
    '<span>INTERACTION <b>' +
    motion.interactionChangePct +
    '%</b></span>' +
    '<span>ERRORS <b class="' +
    (errorCount ? 'bad' : '') +
    '">' +
    errorCount +
    '</b></span>' +
    '<span>FIT <b class="' +
    (runtime.viewportFit ? '' : 'bad') +
    '">' +
    (runtime.viewportFit ? 'YES' : 'NO') +
    '</b></span>' +
    '<span>CANVAS <b>' +
    runtime.canvasCount +
    '</b></span>' +
    '</footer>' +
    '</article>'
  );
}

function sheetMarkup(scope, entries, pageNumber, pageCount) {
  return [
    '<!doctype html><html><head><meta charset="utf-8"><style>',
    '*{box-sizing:border-box}html,body{margin:0;background:#07090d;color:#eef2f7;font-family:Arial,sans-serif}',
    'body{width:1800px;padding:28px}h1{margin:0 0 8px;font-size:28px;letter-spacing:.02em}',
    '.meta{margin:0 0 24px;color:#8e9aab;font-size:16px}',
    '.take{margin:0 0 20px;padding:14px;border:1px solid #263040;border-radius:12px;background:#0d1118}',
    'header,footer{display:flex;align-items:center;gap:20px}',
    'header{margin-bottom:10px}header strong{font-size:20px;letter-spacing:.12em;color:#fff}',
    'header span{font-size:12px;color:#68d391;border:1px solid #285d42;border-radius:999px;padding:3px 8px}',
    '.frames{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
    'figure{margin:0;position:relative;border:1px solid #202a38;background:#000;overflow:hidden;border-radius:7px}',
    'img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}',
    'figcaption{position:absolute;left:7px;bottom:6px;padding:3px 6px;background:#05070acc;color:#d8e1ee;font-size:10px;letter-spacing:.08em}',
    'footer{margin-top:10px;color:#95a2b4;font-size:12px;letter-spacing:.04em}',
    'footer b{color:#e5edf8;font-weight:700}.bad{color:#ff7d7d!important}',
    '</style></head><body>',
    '<h1>Blind review · ' + escapeHtml(scope.replace('::', ' / ')) + '</h1>',
    '<p class="meta">Page ' +
      pageNumber +
      ' of ' +
      pageCount +
      ' · Compare the rendered experience only. Model names are hidden.</p>',
    entries.map(cardMarkup).join(''),
    '</body></html>',
  ].join('');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root || '.');
  const manifestPath = resolve(
    root,
    args.manifest || '.scratch/planning/2026-09-03-quality-v2-review/capture-manifest.json',
  );
  const outputDir = ensureDir(
    resolve(root, args.output || '.scratch/screenshots/quality-v2-sheets'),
  );
  const perPage = Math.max(1, Number(args['per-page'] || 8));
  const manifest = readJson(manifestPath);
  const currentSources = latestCurrentSources(manifest.takes);
  const entries = manifest.takes.map((take) => ({
    reviewId: sha256(take.experiment + '|' + take.level + '|' + take.outputSha256 + '|' + take.src)
      .slice(0, 10)
      .toUpperCase(),
    isCurrentCandidate: currentSources.has(take.src),
    take,
  }));
  const groups = new Map();
  for (const entry of entries) {
    const scope = entry.take.experiment + '::' + entry.take.level;
    const group = groups.get(scope) || [];
    group.push(entry);
    groups.set(scope, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => a.reviewId.localeCompare(b.reviewId));
  }

  const browser = await chromium.launch({
    executablePath: findBrowser(String(args.browser || '')),
    headless: true,
  });
  const sheets = [];
  for (const [scope, group] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const pages = Math.ceil(group.length / perPage);
    for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
      const slice = group.slice(pageIndex * perPage, (pageIndex + 1) * perPage);
      const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
      await page.setContent(sheetMarkup(scope, slice, pageIndex + 1, pages), {
        waitUntil: 'load',
      });
      const outputPath = join(
        outputDir,
        scope.replace('::', '-') + '-' + String(pageIndex + 1).padStart(2, '0') + '.png',
      );
      await page.screenshot({ path: outputPath, fullPage: true });
      await page.close();
      sheets.push({
        scope,
        page: pageIndex + 1,
        pageCount: pages,
        path: outputPath,
        reviewIds: slice.map((entry) => entry.reviewId),
      });
      console.log(basename(outputPath));
    }
  }
  await browser.close();

  const indexPath = join(outputDir, 'index.json');
  writeJson(indexPath, {
    generatedAt: new Date().toISOString(),
    manifestPath,
    entryCount: entries.length,
    currentCandidateCount: entries.filter((entry) => entry.isCurrentCandidate).length,
    entries: entries.map((entry) => ({
      reviewId: entry.reviewId,
      isCurrentCandidate: entry.isCurrentCandidate,
      cellId: entry.take.cellId,
      model: entry.take.model,
      experiment: entry.take.experiment,
      level: entry.take.level,
      date: entry.take.date,
      attempt: entry.take.attempt,
      promptRevision: entry.take.promptRevision,
      src: entry.take.src,
      outputSha256: entry.take.outputSha256,
    })),
    sheets,
  });
  console.log(
    JSON.stringify(
      {
        indexPath,
        sheetCount: sheets.length,
        entryCount: entries.length,
        currentCandidateCount: entries.filter((entry) => entry.isCurrentCandidate).length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
