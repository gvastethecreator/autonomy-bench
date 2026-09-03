import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { parseArgs } from './cli-args.mjs';
import { ensureDir, readJson, writeJson } from './run-io.mjs';

const DEFAULT_VIEWPORT = { width: 1440, height: 900 };
const SAMPLE_DELAYS_MS = [700, 1600, 1600, 1200];
const CHANGE_THRESHOLD = 30;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function numberArg(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

function imageMetrics(buffer) {
  const png = PNG.sync.read(buffer);
  const pixels = png.width * png.height;
  let chroma = 0;
  let light = 0;
  for (let index = 0; index < png.data.length; index += 16) {
    const red = png.data[index];
    const green = png.data[index + 1];
    const blue = png.data[index + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    if (max - min > 12 || max > 28) chroma += 4;
    if (max > 18) light += 4;
  }
  return {
    width: png.width,
    height: png.height,
    nonBlankPct: Math.round((Math.max(chroma, light) / pixels) * 1000) / 10,
  };
}

function changedPixelsPct(beforeBuffer, afterBuffer) {
  const before = PNG.sync.read(beforeBuffer);
  const after = PNG.sync.read(afterBuffer);
  if (before.width !== after.width || before.height !== after.height) return 100;
  let changed = 0;
  let sampled = 0;
  for (let index = 0; index < before.data.length; index += 16) {
    const delta =
      Math.abs(before.data[index] - after.data[index]) +
      Math.abs(before.data[index + 1] - after.data[index + 1]) +
      Math.abs(before.data[index + 2] - after.data[index + 2]);
    if (delta >= CHANGE_THRESHOLD) changed += 1;
    sampled += 1;
  }
  return Math.round((changed / sampled) * 1000) / 10;
}

function latestCurrentSources(cells) {
  const latest = new Map();
  for (const cell of cells) {
    const scope = cell.experiment + '::' + cell.level;
    const key = scope + '::' + cell.model;
    const current = latest.get(key);
    if (
      !current ||
      Number(cell.promptRevision || 1) > Number(current.promptRevision || 1) ||
      (Number(cell.promptRevision || 1) === Number(current.promptRevision || 1) &&
        (String(cell.date || '').localeCompare(String(current.date || '')) > 0 ||
          (cell.date === current.date && Number(cell.attempt || 1) > Number(current.attempt || 1))))
    ) {
      latest.set(key, cell);
    }
  }
  return new Set([...latest.values()].map((cell) => cell.src));
}

async function captureSample(page, outputDir, blindId, id, atMs) {
  const path = join(outputDir, blindId + '-' + id + '.png');
  const buffer = await page.screenshot({ path, type: 'png', animations: 'allow' });
  const metrics = imageMetrics(buffer);
  return {
    public: {
      id,
      atMs,
      imageSha256: sha256(buffer),
      nonBlankPct: metrics.nonBlankPct,
    },
    private: {
      id,
      path,
      buffer,
      width: metrics.width,
      height: metrics.height,
    },
  };
}

async function deterministicInteraction(page) {
  const matched = await page.evaluate(() => {
    const textPattern = /\b(start|play|launch|ignite|begin|run|enter|iniciar|comenzar)\b/i;
    const candidates = [
      ...document.querySelectorAll(
        'button, [role="button"], input[type="button"], input[type="submit"]',
      ),
    ];
    const target = candidates.find((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const text =
        element.textContent ||
        element.getAttribute('value') ||
        element.getAttribute('aria-label') ||
        '';
      return (
        textPattern.test(text) &&
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none'
      );
    });
    if (!target) return '';
    target.click();
    return String(
      target.textContent || target.getAttribute('value') || target.getAttribute('aria-label') || '',
    )
      .trim()
      .slice(0, 80);
  });
  if (matched) return 'control:' + matched;
  await page.mouse.click(DEFAULT_VIEWPORT.width / 2, DEFAULT_VIEWPORT.height / 2);
  return 'viewport-center';
}

async function inspectTake(browser, cell, options) {
  const context = await browser.newContext({
    viewport: DEFAULT_VIEWPORT,
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => pageErrors.push(String(error.message || error).slice(0, 500)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 500));
  });
  page.on('requestfailed', (request) => {
    failedRequests.push(
      (request.url() + ' :: ' + (request.failure()?.errorText || 'failed')).slice(0, 500),
    );
  });

  const blindId = sha256(cell.experiment + '|' + cell.level + '|' + cell.outputSha256).slice(0, 12);
  const startedAt = Date.now();
  const samples = [];
  let loads = false;
  let statusCode = 0;
  let interaction = 'not-attempted';
  let runtime = {
    canvasCount: 0,
    viewportFit: false,
    document: { width: 0, height: 0 },
  };

  try {
    const response = await page.goto(new URL(cell.src, options.baseUrl).href, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeoutMs,
    });
    statusCode = response?.status() || 0;
    loads = Boolean(response && response.ok());

    await page.waitForTimeout(SAMPLE_DELAYS_MS[0]);
    samples.push(
      await captureSample(page, options.outputDir, blindId, 'initial', Date.now() - startedAt),
    );
    await page.waitForTimeout(SAMPLE_DELAYS_MS[1]);
    samples.push(
      await captureSample(page, options.outputDir, blindId, 'auto-1', Date.now() - startedAt),
    );
    await page.waitForTimeout(SAMPLE_DELAYS_MS[2]);
    samples.push(
      await captureSample(page, options.outputDir, blindId, 'auto-2', Date.now() - startedAt),
    );
    interaction = await deterministicInteraction(page);
    await page.waitForTimeout(SAMPLE_DELAYS_MS[3]);
    samples.push(
      await captureSample(page, options.outputDir, blindId, 'interaction', Date.now() - startedAt),
    );

    runtime = await page.evaluate(({ width, height }) => {
      const root = document.documentElement;
      const body = document.body;
      const documentWidth = Math.max(root.scrollWidth, body?.scrollWidth || 0);
      const documentHeight = Math.max(root.scrollHeight, body?.scrollHeight || 0);
      return {
        canvasCount: document.querySelectorAll('canvas').length,
        viewportFit: documentWidth <= width + 2 && documentHeight <= height + 12,
        document: { width: documentWidth, height: documentHeight },
      };
    }, DEFAULT_VIEWPORT);
  } catch (error) {
    pageErrors.push(String(error?.message || error).slice(0, 500));
  }

  const privateSamples = samples.map((sample) => sample.private);
  const automaticChanges = [];
  for (let index = 1; index < Math.min(3, privateSamples.length); index++) {
    automaticChanges.push(
      changedPixelsPct(privateSamples[index - 1].buffer, privateSamples[index].buffer),
    );
  }
  const interactionChange =
    privateSamples.length >= 4
      ? changedPixelsPct(privateSamples[2].buffer, privateSamples[3].buffer)
      : 0;
  const automaticChange = automaticChanges.length
    ? Math.round(
        (automaticChanges.reduce((sum, value) => sum + value, 0) / automaticChanges.length) * 10,
      ) / 10
    : 0;
  const sustainedIntervals = automaticChanges.filter((value) => value >= 0.2).length;
  const capture = {
    protocol: 'browser-runtime-v2',
    capturedAt: new Date().toISOString(),
    viewport: DEFAULT_VIEWPORT,
    observationMs: Date.now() - startedAt,
    runtime: {
      loads,
      canvasCount: runtime.canvasCount,
      viewportFit: runtime.viewportFit,
      pageErrors,
      consoleErrors,
      failedRequests,
      document: runtime.document,
    },
    motion: {
      automaticChangePct: automaticChange,
      interactionChangePct: interactionChange,
      sustainedIntervals,
      sampledIntervals: automaticChanges.length,
    },
    samples: samples.map((sample) => sample.public),
    evidence: [
      'HTTP ' + statusCode + '; ' + runtime.canvasCount + ' canvas element(s).',
      'Automatic pixel change ' +
        automaticChange +
        '% across ' +
        automaticChanges.length +
        ' intervals.',
      'Interaction ' + interaction + ' changed ' + interactionChange + '% of sampled pixels.',
      'Document ' +
        runtime.document.width +
        'x' +
        runtime.document.height +
        ' at viewport 1440x900.',
    ],
  };

  await context.close();
  return {
    cellId: cell.cellId,
    model: cell.model,
    experiment: cell.experiment,
    level: cell.level,
    date: cell.date,
    attempt: cell.attempt || 1,
    promptRevision: cell.promptRevision || 1,
    src: cell.src,
    outputSha256: cell.outputSha256,
    evaluationSrc: cell.evaluationSrc || cell.src.replace(/index\.html$/, 'evaluation.json'),
    blindId,
    isCurrentCandidate: options.currentSources.has(cell.src),
    interaction,
    capture,
    screenshotPaths: privateSamples.map((sample) => sample.path),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root || '.');
  const catalogPath = resolve(root, args.catalog || 'gallery/catalog.json');
  const outputDir = ensureDir(resolve(root, args.output || '.scratch/screenshots/quality-v2'));
  const manifestPath = resolve(
    root,
    args.manifest || '.scratch/planning/2026-09-03-quality-v2-review/capture-manifest.json',
  );
  const baseUrl = String(args.url || 'http://127.0.0.1:8093/').replace(/\/?$/, '/');
  const concurrency = Math.min(8, Math.max(1, numberArg(args.concurrency, 6)));
  const timeoutMs = numberArg(args.timeout, 15000);
  const catalog = readJson(catalogPath);
  const allCells = (catalog.cells || []).filter((cell) => cell.src && cell.outputSha256);
  const limit = args.limit ? numberArg(args.limit, allCells.length) : allCells.length;
  const cells = allCells.slice(0, limit);
  const currentSources = latestCurrentSources(allCells);
  const browser = await chromium.launch({
    executablePath: findBrowser(String(args.browser || '')),
    headless: true,
    args: ['--disable-gpu-sandbox'],
  });

  const results = new Array(cells.length);
  let cursor = 0;
  async function worker() {
    while (cursor < cells.length) {
      const index = cursor++;
      results[index] = await inspectTake(browser, cells[index], {
        baseUrl,
        outputDir,
        timeoutMs,
        currentSources,
      });
      process.stdout.write(
        '[' + (index + 1) + '/' + cells.length + '] ' + results[index].blindId + '\n',
      );
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  await browser.close();

  const manifest = {
    schemaVersion: 1,
    protocol: 'browser-runtime-v2',
    generatedAt: new Date().toISOString(),
    catalogPath,
    baseUrl,
    viewport: DEFAULT_VIEWPORT,
    cellCount: results.length,
    currentCandidateCount: results.filter((result) => result.isCurrentCandidate).length,
    takes: results,
  };
  ensureDir(resolve(manifestPath, '..'));
  writeJson(manifestPath, manifest);
  console.log(
    JSON.stringify(
      {
        manifestPath,
        cellCount: manifest.cellCount,
        currentCandidateCount: manifest.currentCandidateCount,
        pageErrorCount: results.reduce(
          (sum, result) => sum + result.capture.runtime.pageErrors.length,
          0,
        ),
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
