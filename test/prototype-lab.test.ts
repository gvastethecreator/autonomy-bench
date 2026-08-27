import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { exportPrototypeLab } from '../scripts/prototype-lab.mjs';
import { writeJson } from '../scripts/run-io.mjs';

function tempRoot() {
  return mkdtempSync(join(tmpdir(), 'ab-plab-'));
}

describe('exportPrototypeLab', () => {
  it('writes one spec per benchmark and prompt level in a temp root', () => {
    const root = tempRoot();
    const runId = '20260824-010000-mini-aaaaaaaa';
    const runDir = join(root, 'runs', '2026', '08', '24', runId);
    const cellDir = join(runDir, 'cells', 'grok-4.6', 'rollercoaster-A');
    mkdirSync(join(cellDir, 'output'), { recursive: true });
    writeJson(join(runDir, 'manifest.json'), {
      runId,
      cells: [
        {
          cellId: 'rollercoaster--a--grok-4.6--a01',
          benchmarkId: 'rollercoaster',
          benchmarkTitle: 'Rollercoaster',
          promptLevel: 'A',
          requestedModel: 'grok-4.6',
          promptPath: 'cells/grok-4.6/rollercoaster-A/prompt.md',
        },
        {
          cellId: 'rollercoaster--b--grok-4.6--a01',
          benchmarkId: 'rollercoaster',
          benchmarkTitle: 'Rollercoaster',
          promptLevel: 'B',
          requestedModel: 'grok-4.6',
          promptPath: 'cells/grok-4.6/rollercoaster-B/prompt.md',
        },
      ],
    });
    mkdirSync(join(runDir, 'cells', 'grok-4.6', 'rollercoaster-B'), { recursive: true });
    writeFileSync(join(cellDir, 'prompt.md'), 'Create a ride.\n');
    writeFileSync(
      join(runDir, 'cells', 'grok-4.6', 'rollercoaster-B', 'prompt.md'),
      'Create a ride. You choose.\n',
    );
    const exported = exportPrototypeLab({
      root,
      runId,
      clock: { isoNow: () => '2026-08-24T01:00:00.000Z' },
    });
    expect(exported.specs).toHaveLength(2);
    expect(exported.relative.replaceAll('\\', '/')).toBe(`exports/prototype-lab/${runId}`);
    const mapping = JSON.parse(readFileSync(join(exported.outDir, 'mapping.json'), 'utf8'));
    expect(mapping.runId).toBe(runId);
    expect(mapping.specs.map((row: { spec: string }) => row.spec).sort()).toEqual([
      'rollercoaster--A.json',
      'rollercoaster--B.json',
    ]);
    const specA = JSON.parse(readFileSync(join(exported.outDir, 'rollercoaster--A.json'), 'utf8'));
    expect(specA.sharedBrief).toBe('Create a ride.');
    expect(specA.variants).toHaveLength(1);
    expect(root.startsWith(join(tmpdir(), 'ab-plab-')) || exported.outDir.startsWith(root)).toBe(
      true,
    );
  });
});
