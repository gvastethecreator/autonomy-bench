import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { slug } from './layout.mjs';
import { ensureDir, findRun, readJson, writeJson } from './run-io.mjs';

const defaultClock = {
  isoNow: () => new Date().toISOString(),
};

export function exportPrototypeLab({ root, runId, clock = defaultClock }) {
  if (!runId) throw new Error('export-prototype-lab requires --run');
  const dir = findRun(root, runId);
  const m = readJson(join(dir, 'manifest.json'));
  const outDir = ensureDir(join(root, 'exports', 'prototype-lab', m.runId));
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
    generatedAt: clock.isoNow(),
    specs: index,
  });
  return { outDir, relative: relative(root, outDir).replaceAll('\\', '/'), specs: index };
}
