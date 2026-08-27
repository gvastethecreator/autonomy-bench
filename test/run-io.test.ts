import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import {
  ensureDir,
  findRun,
  listRuns,
  readJson,
  walkFiles,
  writeJson,
} from '../scripts/run-io.mjs';

function tempRoot() {
  return mkdtempSync(join(tmpdir(), 'ab-run-io-'));
}

describe('run-io', () => {
  it('finds a run by runId and by directory suffix', () => {
    const root = tempRoot();
    const dir = join(root, 'runs', '2026', '08', '24', '20260824-010000-mini-aaaaaaaa');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'manifest.json'),
      JSON.stringify({ runId: '20260824-010000-mini-aaaaaaaa' }, null, 2) + '\n',
    );
    expect(findRun(root, '20260824-010000-mini-aaaaaaaa')).toBe(dir);
    expect(
      findRun(root, '20260824-010000-mini-aaaaaaaa').endsWith('20260824-010000-mini-aaaaaaaa'),
    ).toBe(true);
  });

  it('throws Run not found for an unknown id', () => {
    const root = tempRoot();
    mkdirSync(join(root, 'runs'), { recursive: true });
    writeFileSync(
      join(root, 'runs', 'manifest.json'),
      JSON.stringify({ runId: 'other' }, null, 2) + '\n',
    );
    expect(() => findRun(root, 'missing-run')).toThrow('Run not found: missing-run');
  });

  it('lists two manifests in runId order and findRun still finds by id', () => {
    const root = tempRoot();
    const first = join(root, 'runs', '2026', '08', '24', '20260824-010000-mini-aaaaaaaa');
    const second = join(root, 'runs', '2026', '08', '24', '20260824-020000-mini-bbbbbbbb');
    mkdirSync(first, { recursive: true });
    mkdirSync(second, { recursive: true });
    writeFileSync(
      join(first, 'manifest.json'),
      JSON.stringify({ runId: '20260824-010000-mini-aaaaaaaa' }, null, 2) + '\n',
    );
    writeFileSync(
      join(second, 'manifest.json'),
      JSON.stringify({ runId: '20260824-020000-mini-bbbbbbbb' }, null, 2) + '\n',
    );
    const listed = listRuns(root);
    expect(listed.map((run: { manifest: { runId: string } }) => run.manifest.runId)).toEqual([
      '20260824-010000-mini-aaaaaaaa',
      '20260824-020000-mini-bbbbbbbb',
    ]);
    expect(findRun(root, '20260824-020000-mini-bbbbbbbb')).toBe(second);
  });

  it('writes and reads json and walks nested files', () => {
    const root = tempRoot();
    const nested = ensureDir(join(root, 'a', 'b'));
    writeJson(join(nested, 'cell.json'), { ok: true });
    expect(readJson(join(nested, 'cell.json'))).toEqual({ ok: true });
    expect(walkFiles(root).some((path: string) => path.endsWith('cell.json'))).toBe(true);
  });
});
