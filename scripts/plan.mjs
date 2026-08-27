import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { resolveContributor } from './contributor.mjs';
import { cellId } from './cell-id.mjs';
import { cellRelPath, slug } from './layout.mjs';
import { LEDGER_STATUSES, assertReceipt, receiptTemplate } from './receipt.mjs';
import { ensureDir, findRun, readJson, walkFiles, writeJson } from './run-io.mjs';
import { declaredLevels, frozenLevels, getBenchmark, hasPrompt } from './suite.mjs';

export { declaredLevels, frozenLevels, getBenchmark, hasPrompt };

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}
function fileHash(path) {
  return sha256(readFileSync(path));
}

export function csv(value, fallback = []) {
  return value
    ? String(value)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    : fallback;
}

export function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

const defaultClock = {
  isoNow: () => new Date().toISOString(),
  localParts: () => localParts(),
};

export function planRun({ root, suitePath, args, clock = defaultClock }) {
  const sPath = resolve(suitePath);
  const suite = readJson(sPath);
  const models = csv(args.models);
  if (!models.length) throw new Error('plan requires --models model-a,model-b');
  const requestedBench = csv(args.benchmarks, ['all']);
  const benches = requestedBench.includes('all')
    ? suite.benchmarks
    : requestedBench.map((id) => getBenchmark(suite, id));
  const allowed = declaredLevels(suite);
  const levels = csv(args.levels, frozenLevels(suite)).map((x) => x.toUpperCase());
  for (const level of levels)
    if (!allowed.includes(level)) throw new Error(`Unknown level ${level}`);
  const attempts = Math.max(1, Number(args.attempts || 1));
  const adapter = args.adapter || 'manual';
  if (!['manual', 'agent', 'prototype-lab'].includes(adapter)) {
    throw new Error(`Unknown adapter ${adapter}`);
  }
  const harness = String(args.harness || '').trim() || 'not captured';
  const contributor = resolveContributor({ github: args.contributor });
  const lp = clock.localParts();
  const date = `${lp.year}-${lp.month}-${lp.day}`;
  const seed = JSON.stringify({
    suite: suite.id,
    version: suite.version,
    models,
    benches: benches.map((b) => b.id),
    levels,
    attempts,
    adapter,
    harness,
    label: args.label || '',
  });
  const runId = `${lp.year}${lp.month}${lp.day}-${lp.hour}${lp.minute}${lp.second}-${slug(args.label || 'run')}-${sha256(seed).slice(0, 8)}`;
  const runDir = ensureDir(join(root, 'runs', lp.year, lp.month, lp.day, runId));
  const cells = [];
  for (const b of benches)
    for (const level of levels)
      for (const model of models)
        for (let attempt = 1; attempt <= attempts; attempt++) {
          const id = cellId({ benchmarkId: b.id, promptLevel: level, model, attempt });
          const rel = cellRelPath({ model, benchmarkId: b.id, promptLevel: level, attempt });
          const cellDir = ensureDir(join(runDir, rel));
          ensureDir(join(cellDir, 'output'));
          if (!hasPrompt(b, level)) throw new Error(`${b.id} has no ${level} prompt yet`);
          const prompt = b.prompts[level];
          writeFileSync(join(cellDir, 'prompt.md'), prompt + '\n');
          const promptSha = sha256(prompt + '\n');
          const cell = {
            cellId: id,
            benchmarkId: b.id,
            benchmarkTitle: b.title,
            promptLevel: level,
            attempt,
            requestedModel: model,
            promptPath: `${rel}/prompt.md`,
            promptSha256: promptSha,
            receiptPath: `${rel}/receipt.json`,
            outputPath: `${rel}/output`,
          };
          cells.push(cell);
          writeJson(
            join(cellDir, 'receipt.template.json'),
            receiptTemplate({ runId, cell, adapter, harness, promptSha, contributor }),
          );
        }
  const manifest = {
    schemaVersion: 1,
    runId,
    label: args.label || null,
    createdAt: clock.isoNow(),
    date,
    adapter,
    harness,
    claimClass: attempts === 1 ? 'exploratory-n1' : 'replicated',
    suite: {
      id: suite.id,
      version: suite.version,
      path: relative(root, sPath).replaceAll('\\', '/'),
      sha256: fileHash(sPath),
    },
    selection: { models, benchmarks: benches.map((b) => b.id), levels, attempts },
    cells,
  };
  writeJson(join(runDir, 'manifest.json'), manifest);
  return { runId, runDir, cells, manifest };
}

export function statusRun({ root, runId }) {
  if (!runId) throw new Error('status requires --run');
  const dir = findRun(root, runId);
  const manifest = readJson(join(dir, 'manifest.json'));
  const counts = {
    planned: manifest.cells.length,
    complete: 0,
    blocked: 0,
    unavailable: 0,
    failed: 0,
    missing: 0,
  };
  for (const cell of manifest.cells) {
    const receiptPath = join(dir, cell.receiptPath);
    if (!existsSync(receiptPath)) {
      counts.missing++;
      continue;
    }
    const receipt = readJson(receiptPath);
    if (counts[receipt.status] === undefined) counts[receipt.status] = 0;
    counts[receipt.status]++;
  }
  return {
    runId: manifest.runId,
    ...counts,
    finalized: existsSync(join(dir, 'completion-receipt.json')),
  };
}

export function finalizeRun({ root, runId, clock = defaultClock }) {
  if (!runId) throw new Error('finalize requires --run');
  const dir = findRun(root, runId);
  const manifest = readJson(join(dir, 'manifest.json'));
  if (existsSync(join(dir, 'completion-receipt.json'))) {
    throw new Error('Run is already finalized; create a new run or explicit amendment instead.');
  }
  const terminal = new Set(LEDGER_STATUSES);
  const counts = { complete: 0, blocked: 0, unavailable: 0, failed: 0 };
  const missing = [];
  for (const cell of manifest.cells) {
    const receiptPath = join(dir, cell.receiptPath);
    if (!existsSync(receiptPath)) {
      missing.push(cell.cellId);
      continue;
    }
    const receipt = readJson(receiptPath);
    if (!terminal.has(receipt.status)) {
      missing.push(cell.cellId);
      continue;
    }
    assertReceipt(receipt);
    counts[receipt.status]++;
  }
  if (missing.length) {
    throw new Error(
      `Cannot finalize: ${missing.length} cells lack terminal receipts. First: ${missing.slice(0, 5).join(', ')}`,
    );
  }
  const files = walkFiles(dir)
    .filter((p) => !['completion-receipt.json', 'integrity-manifest.json'].includes(basename(p)))
    .sort();
  const integrity = {
    schemaVersion: 1,
    runId: manifest.runId,
    generatedAt: clock.isoNow(),
    files: Object.fromEntries(
      files.map((p) => [relative(dir, p).replaceAll('\\', '/'), fileHash(p)]),
    ),
  };
  const integrityPath = join(dir, 'integrity-manifest.json');
  writeJson(integrityPath, integrity);
  const completion = {
    schemaVersion: 1,
    runId: manifest.runId,
    completedAt: clock.isoNow(),
    status: 'finalized',
    claimClass: manifest.claimClass,
    manifestSha256: fileHash(join(dir, 'manifest.json')),
    suiteSha256: manifest.suite.sha256,
    integrityManifestSha256: fileHash(integrityPath),
    counts,
    limitations: ['Finalization certifies terminal bookkeeping and integrity, not output quality.'],
  };
  writeJson(join(dir, 'completion-receipt.json'), completion);
  return completion;
}
