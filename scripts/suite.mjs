import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { readJson } from './run-io.mjs';

export function hasPrompt(benchmark, level) {
  return Boolean(String(benchmark?.prompts?.[level] || '').trim());
}

export function declaredLevels(suite) {
  const keys = Object.keys(suite.promptLevels || { A: true });
  return keys.length ? keys : ['A'];
}

export function frozenLevels(suite) {
  return declaredLevels(suite).filter((level) =>
    (suite.benchmarks || []).every((b) => hasPrompt(b, level)),
  );
}

export function getBenchmark(suite, id) {
  const benchmark = (suite.benchmarks || []).find((row) => row.id === id);
  if (!benchmark) throw new Error(`Unknown benchmark: ${id}`);
  return benchmark;
}

export function loadSuite(path) {
  const resolved = resolve(path);
  if (!existsSync(resolved)) return null;
  return readJson(resolved);
}

export function doctorSuite(suite) {
  const errors = [];
  const ids = new Set();
  for (const b of suite?.benchmarks || []) {
    if (ids.has(b.id)) errors.push(`duplicate id ${b.id}`);
    ids.add(b.id);
    if (!hasPrompt(b, 'A')) errors.push(`${b.id} missing A`);
    for (const l of frozenLevels(suite)) if (!hasPrompt(b, l)) errors.push(`${b.id} missing ${l}`);
  }
  return errors;
}

export function doctorReport(suite) {
  const errors = doctorSuite(suite);
  if (errors.length) return { ok: false, errors, line: '' };
  const frozen = frozenLevels(suite);
  const reserved = declaredLevels(suite).filter((l) => !frozen.includes(l));
  const reservedNote = reserved.length ? ` (${reserved.join(', ')} reserved)` : '';
  return {
    ok: true,
    errors: [],
    line: `OK — ${suite.id} ${suite.version}: ${suite.benchmarks.length} benchmarks × ${declaredLevels(suite).length} prompt level${reservedNote}`,
  };
}
