#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cellRelPath, slug } from './layout.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SUITE = join(ROOT, 'suites', 'browser-autonomy', 'suite.json');

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}
function fileHash(path) {
  return sha256(readFileSync(path));
}
function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
function ensure(path) {
  mkdirSync(path, { recursive: true });
  return path;
}
function isoNow() {
  return new Date().toISOString();
}
function localParts() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}
function parse(argv) {
  const [command = 'help', ...rest] = argv;
  const args = { _: [] };
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = rest[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i++;
    } else args[key] = true;
  }
  return { command, args };
}
function csv(value, fallback = []) {
  return value
    ? String(value)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    : fallback;
}
function suite(path = DEFAULT_SUITE) {
  return json(resolve(path));
}
function getBenchmark(s, id) {
  const b = s.benchmarks.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown benchmark: ${id}`);
  return b;
}
function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function findRun(id) {
  const base = join(ROOT, 'runs');
  for (const p of walk(base).filter((p) => basename(p) === 'manifest.json')) {
    const m = json(p);
    if (m.runId === id || dirname(p).endsWith(id)) return dirname(p);
  }
  throw new Error(`Run not found: ${id}`);
}
function help() {
  console.log(
    `Autonomy Bench\n\nCommands:\n  list [--suite path]\n  show <benchmark-id> [--level A|B|C]\n  plan --models a,b [--benchmarks id,id|all] [--levels A,B,C] [--attempts 1] [--adapter manual|agent|prototype-lab] [--harness name] [--label name]\n  status --run <run-id>\n  gallery --run <run-id>\n  export-prototype-lab --run <run-id>\n  finalize --run <run-id>\n  doctor\n`,
  );
}

function cmdList(args) {
  const s = suite(args.suite || DEFAULT_SUITE);
  for (const b of s.benchmarks)
    console.log(
      `${String(b.ordinal).padStart(2, '0')}  ${b.id.padEnd(22)} ${b.category.padEnd(20)} ${b.title}`,
    );
}
function cmdShow(args) {
  const id = args._[0];
  if (!id) throw new Error('show requires a benchmark id');
  const s = suite(args.suite || DEFAULT_SUITE);
  const b = getBenchmark(s, id);
  if (args.level) {
    const level = String(args.level).toUpperCase();
    if (!b.prompts[level]) throw new Error(`Unknown level: ${level}`);
    console.log(b.prompts[level]);
    return;
  }
  console.log(`${b.title} (${b.id})\n`);
  for (const level of ['A', 'B', 'C'])
    console.log(`${level} — ${s.promptLevels[level].name}\n${b.prompts[level]}\n`);
}
function receiptTemplate({ runId, cell, adapter, harness, promptSha }) {
  return {
    schemaVersion: 1,
    runId,
    cellId: cell.cellId,
    benchmarkId: cell.benchmarkId,
    promptLevel: cell.promptLevel,
    attempt: cell.attempt,
    requestedModel: cell.requestedModel,
    effectiveModel: 'not captured',
    effectiveModelSource: 'not-captured',
    reasoning: 'not captured',
    promptSha256: promptSha,
    status: 'complete',
    adapter,
    harness,
    startedAt: 'not captured',
    completedAt: 'not captured',
    durationMs: 'not captured',
    isolation: {
      capability: 'fresh-context-no-sibling-outputs',
      adapter: 'not captured',
      inheritedHistory: 'not captured',
      coordinatorContextExposed: 'not captured',
      evidence: 'not captured',
    },
    tokenUsage: 'not captured',
    toolCalls: 'not captured',
    outputPaths: [],
    outputHashes: {},
    externalReceipts: [],
    limitations: [],
    errors: [],
  };
}
function cmdPlan(args) {
  const sPath = resolve(args.suite || DEFAULT_SUITE);
  const s = suite(sPath);
  const models = csv(args.models);
  if (!models.length) throw new Error('plan requires --models model-a,model-b');
  const requestedBench = csv(args.benchmarks, ['all']);
  const benches = requestedBench.includes('all')
    ? s.benchmarks
    : requestedBench.map((id) => getBenchmark(s, id));
  const levels = csv(args.levels, ['A', 'B', 'C']).map((x) => x.toUpperCase());
  for (const l of levels) if (!['A', 'B', 'C'].includes(l)) throw new Error(`Unknown level ${l}`);
  const attempts = Math.max(1, Number(args.attempts || 1));
  const adapter = args.adapter || 'manual';
  if (!['manual', 'agent', 'prototype-lab'].includes(adapter))
    throw new Error(`Unknown adapter ${adapter}`);
  const harness = String(args.harness || '').trim() || 'not captured';
  const lp = localParts();
  const date = `${lp.year}-${lp.month}-${lp.day}`;
  const seed = JSON.stringify({
    suite: s.id,
    version: s.version,
    models,
    benches: benches.map((b) => b.id),
    levels,
    attempts,
    adapter,
    harness,
    label: args.label || '',
  });
  const runId = `${lp.year}${lp.month}${lp.day}-${lp.hour}${lp.minute}${lp.second}-${slug(args.label || 'run')}-${sha256(seed).slice(0, 8)}`;
  const runDir = ensure(join(ROOT, 'runs', lp.year, lp.month, lp.day, runId));
  const cells = [];
  for (const b of benches)
    for (const level of levels)
      for (const model of models)
        for (let attempt = 1; attempt <= attempts; attempt++) {
          const cellId = `${b.id}--${level.toLowerCase()}--${slug(model)}--a${String(attempt).padStart(2, '0')}`;
          const rel = cellRelPath({ model, benchmarkId: b.id, promptLevel: level, attempt });
          const cellDir = ensure(join(runDir, rel));
          ensure(join(cellDir, 'output'));
          const prompt = b.prompts[level];
          writeFileSync(join(cellDir, 'prompt.md'), prompt + '\n');
          const promptSha = sha256(prompt + '\n');
          const cell = {
            cellId,
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
          writeFileSync(
            join(cellDir, 'receipt.template.json'),
            JSON.stringify(receiptTemplate({ runId, cell, adapter, harness, promptSha }), null, 2) +
              '\n',
          );
        }
  const manifest = {
    schemaVersion: 1,
    runId,
    label: args.label || null,
    createdAt: isoNow(),
    date,
    adapter,
    harness,
    claimClass: attempts === 1 ? 'exploratory-n1' : 'replicated',
    suite: {
      id: s.id,
      version: s.version,
      path: relative(ROOT, sPath).replaceAll('\\', '/'),
      sha256: fileHash(sPath),
    },
    selection: { models, benchmarks: benches.map((b) => b.id), levels, attempts },
    cells,
  };
  writeFileSync(join(runDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(runId);
  console.log(relative(ROOT, runDir).replaceAll('\\', '/'));
  console.log(`${cells.length} cells planned`);
}
function cmdStatus(args) {
  if (!args.run) throw new Error('status requires --run');
  const dir = findRun(args.run);
  const m = json(join(dir, 'manifest.json'));
  const counts = {
    planned: m.cells.length,
    complete: 0,
    blocked: 0,
    unavailable: 0,
    failed: 0,
    missing: 0,
  };
  for (const c of m.cells) {
    const rp = join(dir, c.receiptPath);
    if (!existsSync(rp)) {
      counts.missing++;
      continue;
    }
    const r = json(rp);
    if (counts[r.status] === undefined) counts[r.status] = 0;
    counts[r.status]++;
  }
  console.log(
    JSON.stringify(
      { runId: m.runId, ...counts, finalized: existsSync(join(dir, 'completion-receipt.json')) },
      null,
      2,
    ),
  );
}
function cmdExportPrototypeLab(args) {
  if (!args.run) throw new Error('export-prototype-lab requires --run');
  const dir = findRun(args.run);
  const m = json(join(dir, 'manifest.json'));
  const outDir = ensure(join(ROOT, 'exports', 'prototype-lab', m.runId));
  const groups = new Map();
  for (const c of m.cells) {
    const key = `${c.benchmarkId}--${c.promptLevel}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  const index = [];
  for (const [key, cells] of groups) {
    const first = cells[0];
    const prompt = readFileSync(join(dir, first.promptPath), 'utf8').trimEnd();
    const spec = {
      schemaVersion: 1,
      id: slug(`${m.runId}-${key}`),
      title: `${first.benchmarkTitle} — ${first.promptLevel}`,
      intent: 'benchmark',
      question: `How do the selected models respond to ${first.benchmarkTitle} at prompt level ${first.promptLevel}?`,
      sharedBrief: prompt,
      fixedOutcomes: ['Produce the requested experience as a runnable single HTML file.'],
      openDecisions: [
        'implementation architecture',
        'interaction details',
        'visual direction',
        'content/detail level',
        'performance strategy',
        'optional polish',
      ],
      assetPolicy: { mode: 'worker-choice' },
      layoutPolicy: 'open',
      targetViewports: ['1200x820', '390x844'],
      variants: cells.map((c) => ({
        id: slug(c.cellId),
        model: c.requestedModel,
        condition: 'baseline',
        skills: [],
        workUnit: c.benchmarkId,
      })),
    };
    const file = `${key}.json`;
    writeFileSync(join(outDir, file), JSON.stringify(spec, null, 2) + '\n');
    index.push({
      benchmarkId: first.benchmarkId,
      promptLevel: first.promptLevel,
      spec: file,
      cells: cells.map((c) => c.cellId),
    });
  }
  writeFileSync(
    join(outDir, 'mapping.json'),
    JSON.stringify({ runId: m.runId, generatedAt: isoNow(), specs: index }, null, 2) + '\n',
  );
  console.log(relative(ROOT, outDir).replaceAll('\\', '/'));
  console.log(`${index.length} Prototype Lab specs exported`);
}
function cmdFinalize(args) {
  if (!args.run) throw new Error('finalize requires --run');
  const dir = findRun(args.run);
  const m = json(join(dir, 'manifest.json'));
  if (existsSync(join(dir, 'completion-receipt.json')))
    throw new Error('Run is already finalized; create a new run or explicit amendment instead.');
  const terminal = new Set(['complete', 'blocked', 'unavailable', 'failed']);
  const counts = { complete: 0, blocked: 0, unavailable: 0, failed: 0 };
  const missing = [];
  for (const c of m.cells) {
    const rp = join(dir, c.receiptPath);
    if (!existsSync(rp)) {
      missing.push(c.cellId);
      continue;
    }
    const r = json(rp);
    if (!terminal.has(r.status)) missing.push(c.cellId);
    else counts[r.status]++;
  }
  if (missing.length)
    throw new Error(
      `Cannot finalize: ${missing.length} cells lack terminal receipts. First: ${missing.slice(0, 5).join(', ')}`,
    );
  const files = walk(dir)
    .filter((p) => !['completion-receipt.json', 'integrity-manifest.json'].includes(basename(p)))
    .sort();
  const integrity = {
    schemaVersion: 1,
    runId: m.runId,
    generatedAt: isoNow(),
    files: Object.fromEntries(
      files.map((p) => [relative(dir, p).replaceAll('\\', '/'), fileHash(p)]),
    ),
  };
  const integrityPath = join(dir, 'integrity-manifest.json');
  writeFileSync(integrityPath, JSON.stringify(integrity, null, 2) + '\n');
  const completion = {
    schemaVersion: 1,
    runId: m.runId,
    completedAt: isoNow(),
    status: 'finalized',
    claimClass: m.claimClass,
    manifestSha256: fileHash(join(dir, 'manifest.json')),
    suiteSha256: m.suite.sha256,
    integrityManifestSha256: fileHash(integrityPath),
    counts,
    limitations: ['Finalization certifies terminal bookkeeping and integrity, not output quality.'],
  };
  writeFileSync(join(dir, 'completion-receipt.json'), JSON.stringify(completion, null, 2) + '\n');
  console.log(JSON.stringify(completion, null, 2));
}
function cmdGallery(args) {
  if (!args.run) throw new Error('gallery requires --run');
  const result = spawnSync(
    process.execPath,
    [join(ROOT, 'scripts', 'gallery.mjs'), '--run', args.run],
    { stdio: 'inherit' },
  );
  if (result.status) process.exitCode = result.status;
}
function cmdDoctor() {
  const s = suite(DEFAULT_SUITE);
  const errors = [];
  const ids = new Set();
  for (const b of s.benchmarks) {
    if (ids.has(b.id)) errors.push(`duplicate id ${b.id}`);
    ids.add(b.id);
    for (const l of ['A', 'B', 'C'])
      if (!b.prompts?.[l]?.trim()) errors.push(`${b.id} missing ${l}`);
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(`OK — ${s.id} ${s.version}: ${s.benchmarks.length} benchmarks × 3 prompt levels`);
}

const { command, args } = parse(process.argv.slice(2));
try {
  if (command === 'help') help();
  else if (command === 'list') cmdList(args);
  else if (command === 'show') cmdShow(args);
  else if (command === 'plan') cmdPlan(args);
  else if (command === 'status') cmdStatus(args);
  else if (command === 'gallery') cmdGallery(args);
  else if (command === 'export-prototype-lab') cmdExportPrototypeLab(args);
  else if (command === 'finalize') cmdFinalize(args);
  else if (command === 'doctor') cmdDoctor();
  else {
    help();
    throw new Error(`Unknown command: ${command}`);
  }
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exitCode = 1;
}
