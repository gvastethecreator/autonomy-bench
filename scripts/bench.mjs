#!/usr/bin/env node
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCommandArgs } from './cli-args.mjs';
import { runGalleryCli } from './gallery.mjs';
import { finalizeRun, planRun, statusRun } from './plan.mjs';
import { exportPrototypeLab } from './prototype-lab.mjs';
import { declaredLevels, doctorReport, getBenchmark, hasPrompt, loadSuite } from './suite.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SUITE = join(ROOT, 'suites', 'browser-autonomy', 'suite.json');

function suite(path = DEFAULT_SUITE) {
  const loaded = loadSuite(path);
  if (!loaded) throw new Error(`Suite not found: ${path}`);
  return loaded;
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
  const exported = exportPrototypeLab({ root: ROOT, runId: args.run });
  console.log(exported.relative);
  console.log(`${exported.specs.length} Prototype Lab specs exported`);
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
  const report = doctorReport(suite(DEFAULT_SUITE));
  if (!report.ok) {
    console.error(report.errors.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(report.line);
}

const { command, args } = parseCommandArgs(process.argv.slice(2));
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
