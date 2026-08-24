import { copyFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { finalizeRun, planRun, statusRun } from '../scripts/plan.mjs';
import { writeJson } from '../scripts/run-io.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const suiteSrc = join(here, 'fixtures', 'architecture', 'suite-mini.json');

const clock = {
  isoNow: () => '2026-08-24T01:00:00.000Z',
  localParts: () => ({
    year: '2026',
    month: '08',
    day: '24',
    hour: '01',
    minute: '00',
    second: '00',
  }),
};

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ab-plan-'));
  const suitePath = join(root, 'suite.json');
  copyFileSync(suiteSrc, suitePath);
  return { root, suitePath };
}

describe('planRun', () => {
  it('writes a prompt and manifest into a temp root', () => {
    const { root, suitePath } = tempRoot();
    const planned = planRun({
      root,
      suitePath,
      args: { models: 'grok-4.6', benchmarks: 'rollercoaster', levels: 'A', adapter: 'agent' },
      clock,
    });
    expect(planned.cells).toHaveLength(1);
    expect(planned.runDir.startsWith(root)).toBe(true);
    expect(readFileSync(join(planned.runDir, planned.cells[0].promptPath), 'utf8')).toContain(
      'rollercoaster',
    );
    expect(statusRun({ root, runId: planned.runId }).missing).toBe(1);
  });
});

describe('finalizeRun', () => {
  it('throws when a receipt is missing', () => {
    const { root, suitePath } = tempRoot();
    const planned = planRun({
      root,
      suitePath,
      args: { models: 'grok-4.6', benchmarks: 'rollercoaster', levels: 'A' },
      clock,
    });
    expect(() => finalizeRun({ root, runId: planned.runId, clock })).toThrow('Cannot finalize:');
  });

  it('throws when the run is already finalized', () => {
    const { root, suitePath } = tempRoot();
    const planned = planRun({
      root,
      suitePath,
      args: { models: 'grok-4.6', benchmarks: 'rollercoaster', levels: 'A', adapter: 'manual' },
      clock,
    });
    const cell = planned.cells[0];
    const template = JSON.parse(
      readFileSync(
        join(planned.runDir, 'cells', 'grok-4.6', 'rollercoaster-A', 'receipt.template.json'),
        'utf8',
      ),
    );
    writeJson(join(planned.runDir, cell.receiptPath), template);
    finalizeRun({ root, runId: planned.runId, clock });
    expect(() => finalizeRun({ root, runId: planned.runId, clock })).toThrow(
      'Run is already finalized; create a new run or explicit amendment instead.',
    );
  });
});
