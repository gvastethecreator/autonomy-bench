#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cellRelPath } from './layout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

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

let moved = 0;
for (const manifestPath of walk(join(ROOT, 'runs')).filter(
  (p) => basename(p) === 'manifest.json',
)) {
  const runDir = dirname(manifestPath);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  let changed = false;
  for (const cell of manifest.cells) {
    const nextRel = cellRelPath({
      model: cell.requestedModel,
      benchmarkId: cell.benchmarkId,
      promptLevel: cell.promptLevel,
      attempt: cell.attempt,
    });
    const prevDir = join(runDir, dirname(cell.promptPath));
    const nextDir = join(runDir, nextRel);
    if (prevDir !== nextDir && existsSync(prevDir) && !existsSync(nextDir)) {
      mkdirSync(dirname(nextDir), { recursive: true });
      renameSync(prevDir, nextDir);
      moved++;
    }
    const promptPath = `${nextRel}/prompt.md`;
    const receiptPath = `${nextRel}/receipt.json`;
    const outputPath = `${nextRel}/output`;
    if (
      cell.promptPath !== promptPath ||
      cell.receiptPath !== receiptPath ||
      cell.outputPath !== outputPath
    ) {
      cell.promptPath = promptPath;
      cell.receiptPath = receiptPath;
      cell.outputPath = outputPath;
      changed = true;
    }
  }
  if (changed) writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

const gallery = join(ROOT, 'gallery');
if (existsSync(gallery)) {
  for (const name of readdirSync(gallery)) {
    if (/^\d{8}-\d{6}-/.test(name)) rmSync(join(gallery, name), { recursive: true, force: true });
  }
}

console.log(`moved ${moved} cell directories`);
