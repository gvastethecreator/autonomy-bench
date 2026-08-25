#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGalleryCli } from './gallery.mjs';
import {
  declaredLevels,
  finalizeRun,
  frozenLevels,
  getBenchmark,
  hasPrompt,
  planRun,
  statusRun,
} from './plan.mjs';
import { slug } from './layout.mjs';
import { ensureDir, findRun, readJson, writeJson } from './run-io.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SUITE = join(ROOT, 'suites', 'browser-autonomy', 'suite.json');

function isoNow() {
  return new Date().toISOString();
}
function parse(argv) {
  const [command = 'help', ...rest] = argv.filter((token) => token !== '--');
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
function suite(path = DEFAULT_SUITE) {
  return readJson(resolve(path));
}
function help() {
  console.log(
    `Autonomy Bench\n\nCommands:\n  list [--suite path]\n  show <benchmark-id> [--level A]\n  plan --models a,b [--benchmarks id,id|all] [--levels A] [--attempts 1] [--adapter manual|agent|prototype-lab] [--harness name] [--contributor github-login] [--label name]\n  status --run <run-id>\n  gallery --run <run-id>\n  export-prototype-lab --run <run-id>\n  finalize --run <run-id>\n  doctor\n`,
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
    if (!declaredLevels(s).includes(level)) throw new Error(`Unknown level: ${level}`);
    if (!hasPrompt(b, level)) throw new Error(`${b.id} has no ${level} prompt yet`);
    console.log(b.prompts[level]);
    return;
  }
  console.log(`${b.title} (${b.id})\n`);
  for (const level of declaredLevels(s)) {
    const name = s.promptLevels?.[level]?.name || level;
    const text = b.prompts?.[level];
    if (!hasPrompt(b, level)) {
      console.log(`${level} — ${name}\n(reserved — no prompt yet)\n`);
      continue;
    }
    console.log(`${level} — ${name}\n${text}\n`);
  }
}
function cmdPlan(args) {
  const planned = planRun({
    root: ROOT,
    suitePath: resolve(args.suite || DEFAULT_SUITE),
    args,
  });
  console.log(planned.runId);
  console.log(relative(ROOT, planned.runDir).replaceAll('\\', '/'));
  console.log(`${planned.cells.length} cells planned`);
}
function cmdStatus(args) {
  console.log(JSON.stringify(statusRun({ root: ROOT, runId: args.run }), null, 2));
}
function cmdExportPrototypeLab(args) {
  if (!args.run) throw new Error('export-prototype-lab requires --run');
  const dir = findRun(ROOT, args.run);
  const m = readJson(join(dir, 'manifest.json'));
  const outDir = ensureDir(join(ROOT, 'exports', 'prototype-lab', m.runId));
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
  writeJson(join(outDir, 'mapping.json'), {
    runId: m.runId,
    generatedAt: isoNow(),
    specs: index,
  });
  console.log(relative(ROOT, outDir).replaceAll('\\', '/'));
  console.log(`${index.length} Prototype Lab specs exported`);
}
function cmdFinalize(args) {
  const completion = finalizeRun({ root: ROOT, runId: args.run });
  console.log(JSON.stringify(completion, null, 2));
}
function cmdGallery(args) {
  if (!args.run) throw new Error('gallery requires --run');
  runGalleryCli(args);
}
function cmdDoctor() {
  const s = suite(DEFAULT_SUITE);
  const errors = [];
  const ids = new Set();
  for (const b of s.benchmarks) {
    if (ids.has(b.id)) errors.push(`duplicate id ${b.id}`);
    ids.add(b.id);
    if (!hasPrompt(b, 'A')) errors.push(`${b.id} missing A`);
    for (const l of frozenLevels(s)) if (!hasPrompt(b, l)) errors.push(`${b.id} missing ${l}`);
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    const frozen = frozenLevels(s);
    const reserved = declaredLevels(s).filter((l) => !frozen.includes(l));
    const reservedNote = reserved.length ? ` (${reserved.join(', ')} reserved)` : '';
    console.log(
      `OK — ${s.id} ${s.version}: ${s.benchmarks.length} benchmarks × ${declaredLevels(s).length} prompt level${reservedNote}`,
    );
  }
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
