import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import {
  finishGallery,
  galleryCommand,
  indexPublishedCells,
  parseGalleryArgs,
  publishRun,
  stripNoHtmlGalleryTakes,
  stripRetiredGalleryBenchmarks,
  writeCatalogFile,
} from '../scripts/gallery-publish.mjs';
import { writeJson } from '../scripts/run-io.mjs';

const suite = {
  promptLevels: { A: { name: 'Raw' } },
  benchmarks: [{ id: 'rollercoaster', title: 'Rollercoaster' }],
};

function tempDir() {
  return mkdtempSync(join(tmpdir(), 'ab-gal-'));
}

describe('parseGalleryArgs', () => {
  it('selects all-runs when no flags are passed', () => {
    expect(galleryCommand(parseGalleryArgs([]))).toBe('all');
  });

  it('selects one run', () => {
    expect(galleryCommand(parseGalleryArgs(['--run', 'abc']))).toBe('run');
    expect(galleryCommand(parseGalleryArgs(['--', '--run', 'abc']))).toBe('run');
  });

  it('selects viewer rebuild', () => {
    expect(galleryCommand(parseGalleryArgs(['--viewer']))).toBe('viewer');
  });
});

describe('publishRun', () => {
  it('copies html, receipt, and prompt for a complete take', () => {
    const root = tempDir();
    const runDir = join(root, 'run');
    const galleryDir = join(root, 'gallery');
    mkdirSync(join(runDir, 'cells', 'grok-4.6', 'rollercoaster-A', 'output'), { recursive: true });
    writeJson(join(runDir, 'manifest.json'), {
      runId: '20260824-010000-mini-aaaaaaaa',
      date: '2026-08-24',
      cells: [
        {
          cellId: 'rollercoaster--a--grok-4.6--a01',
          benchmarkId: 'rollercoaster',
          promptLevel: 'A',
          requestedModel: 'grok-4.6',
          attempt: 1,
          outputPath: 'cells/grok-4.6/rollercoaster-A/output',
          receiptPath: 'cells/grok-4.6/rollercoaster-A/receipt.json',
          promptPath: 'cells/grok-4.6/rollercoaster-A/prompt.md',
        },
      ],
    });
    writeFileSync(
      join(runDir, 'cells/grok-4.6/rollercoaster-A/output/index.html'),
      '<html></html>',
    );
    writeFileSync(join(runDir, 'cells/grok-4.6/rollercoaster-A/prompt.md'), 'Create a ride.\n');
    writeJson(join(runDir, 'cells/grok-4.6/rollercoaster-A/receipt.json'), {
      schemaVersion: 1,
      runId: '20260824-010000-mini-aaaaaaaa',
      cellId: 'rollercoaster--a--grok-4.6--a01',
      benchmarkId: 'rollercoaster',
      promptLevel: 'A',
      attempt: 1,
      requestedModel: 'grok-4.6',
      promptSha256: 'aaa',
      status: 'complete',
      adapter: 'agent',
      harness: 'cursor',
      startedAt: 'not captured',
      completedAt: 'not captured',
      durationMs: 1200,
      tokenUsage: 'not captured',
      contributor: {
        github: 'gvastethecreator',
        avatarUrl: 'https://github.com/gvastethecreator.png',
      },
    });
    const published = publishRun({ runDir, galleryDir, suite });
    expect(published.copiedHtml).toBe(1);
    expect(published.copiedReceipts).toBe(1);
    expect(published.copiedPrompts).toBe(1);
    const cells = indexPublishedCells(galleryDir, suite);
    expect(cells).toHaveLength(1);
    expect(cells[0].src).toContain('index.html');
    expect(cells[0].glance.durationMs).toBe(1200);
    expect(cells[0].glance.harness).toBe('cursor');
    expect(cells[0].glance.showcaseFixed).toBe(false);
    const catalog = writeCatalogFile(galleryDir, suite);
    expect(catalog.cells[0].prompt).toBeUndefined();
    expect(catalog.cells[0].receipt).toBeUndefined();
    expect(catalog.promptRevisions[0].prompt).toContain('Create a ride');
  });

  it('does not inherit a previous catalog label when publishing a specific run', () => {
    const galleryDir = tempDir();
    mkdirSync(join(galleryDir, 'grok-4.6', 'rollercoaster-A', '2026-08-21-021413'), {
      recursive: true,
    });
    writeFileSync(
      join(galleryDir, 'grok-4.6', 'rollercoaster-A', '2026-08-21-021413', 'index.html'),
      '<html></html>',
    );
    writeJson(
      join(galleryDir, 'grok-4.6', 'rollercoaster-A', '2026-08-21-021413', 'receipt.json'),
      {
        schemaVersion: 1,
        runId: 'run-old',
        cellId: 'rollercoaster--a--grok-4.6--a01',
        benchmarkId: 'rollercoaster',
        promptLevel: 'A',
        attempt: 1,
        requestedModel: 'grok-4.6',
        promptSha256: 'aaa',
        status: 'complete',
        adapter: 'agent',
        harness: 'cursor',
        startedAt: 'not captured',
        completedAt: 'not captured',
        durationMs: 1200,
        tokenUsage: 'not captured',
        contributor: {
          github: 'gvastethecreator',
          avatarUrl: 'https://github.com/gvastethecreator.png',
        },
      },
    );
    writeJson(join(galleryDir, 'catalog.json'), {
      runId: 'run-old',
      label: 'ox-alpha-free-rollercoaster-bc',
      harness: 'opencode',
      adapter: 'agent',
    });
    const catalog = writeCatalogFile(galleryDir, suite, {
      runId: 'run-new',
      label: '',
      harness: 'claude-code',
      adapter: 'agent',
    });
    expect(catalog.label).toBe('');
    expect(catalog.harness).toBe('claude-code');
    expect(catalog.runs.find((run) => run.runId === 'run-old')).toMatchObject({
      harness: 'cursor',
      label: '',
    });
  });

  it('publishes html-only takes as pending and playable', () => {
    const root = tempDir();
    const runDir = join(root, 'run');
    const galleryDir = join(root, 'gallery');
    mkdirSync(join(runDir, 'cells', 'grok-4.6', 'rollercoaster-A', 'output'), { recursive: true });
    writeJson(join(runDir, 'manifest.json'), {
      runId: '20260824-010000-mini-bbbbbbbb',
      date: '2026-08-24',
      cells: [
        {
          benchmarkId: 'rollercoaster',
          promptLevel: 'A',
          requestedModel: 'grok-4.6',
          attempt: 1,
          outputPath: 'cells/grok-4.6/rollercoaster-A/output',
          receiptPath: 'cells/grok-4.6/rollercoaster-A/receipt.json',
          promptPath: 'cells/grok-4.6/rollercoaster-A/prompt.md',
        },
      ],
    });
    writeFileSync(
      join(runDir, 'cells/grok-4.6/rollercoaster-A/output/index.html'),
      '<html></html>',
    );
    const published = publishRun({ runDir, galleryDir, suite });
    expect(published.copiedHtml).toBe(1);
    const cells = indexPublishedCells(galleryDir, suite);
    expect(cells[0].status).toBe('pending');
    expect(cells[0].src).toBeTruthy();
  });

  it('skips a receipt that has no html', () => {
    const root = tempDir();
    const runDir = join(root, 'run');
    const galleryDir = join(root, 'gallery');
    mkdirSync(join(runDir, 'cells', 'grok-4.6', 'rollercoaster-A'), { recursive: true });
    writeJson(join(runDir, 'manifest.json'), {
      runId: '20260824-010000-mini-cccccccc',
      date: '2026-08-24',
      cells: [
        {
          benchmarkId: 'rollercoaster',
          promptLevel: 'A',
          requestedModel: 'grok-4.6',
          attempt: 1,
          outputPath: 'cells/grok-4.6/rollercoaster-A/output',
          receiptPath: 'cells/grok-4.6/rollercoaster-A/receipt.json',
          promptPath: 'cells/grok-4.6/rollercoaster-A/prompt.md',
        },
      ],
    });
    writeJson(join(runDir, 'cells/grok-4.6/rollercoaster-A/receipt.json'), {
      schemaVersion: 1,
      runId: 'r',
      cellId: 'c',
      benchmarkId: 'rollercoaster',
      promptLevel: 'A',
      attempt: 1,
      requestedModel: 'grok-4.6',
      promptSha256: 'x',
      status: 'unavailable',
      adapter: 'agent',
      harness: 'cursor',
      startedAt: 'not captured',
      completedAt: 'not captured',
      durationMs: 'not captured',
      tokenUsage: 'not captured',
    });
    publishRun({ runDir, galleryDir, suite });
    expect(indexPublishedCells(galleryDir, suite)).toEqual([]);
  });

  it('removes published folders that have no HTML', () => {
    const galleryDir = tempDir();
    mkdirSync(join(galleryDir, 'grok-4.6', 'rollercoaster-A', '2026-08-24-010000'), {
      recursive: true,
    });
    writeFileSync(
      join(galleryDir, 'grok-4.6', 'rollercoaster-A', '2026-08-24-010000', 'receipt.json'),
      '{}',
    );
    expect(stripNoHtmlGalleryTakes(galleryDir)).toBe(1);
    expect(indexPublishedCells(galleryDir, suite)).toEqual([]);
  });

  it('removes retired benchmark folders', () => {
    const galleryDir = tempDir();
    mkdirSync(join(galleryDir, 'grok-4.6', 'terrain-explorer-A', '2026-08-21-000000'), {
      recursive: true,
    });
    writeFileSync(
      join(galleryDir, 'grok-4.6', 'terrain-explorer-A', '2026-08-21-000000', 'index.html'),
      '<html></html>',
    );
    expect(stripRetiredGalleryBenchmarks(galleryDir, suite)).toBe(1);
  });

  it('moves retired benchmark folders into an archive instead of deleting them', () => {
    const galleryDir = tempDir();
    const archiveDir = tempDir();
    mkdirSync(join(galleryDir, 'grok-4.6', 'terrain-explorer-A', '2026-08-21-000000'), {
      recursive: true,
    });
    writeFileSync(
      join(galleryDir, 'grok-4.6', 'terrain-explorer-A', '2026-08-21-000000', 'index.html'),
      '<html></html>',
    );
    expect(stripRetiredGalleryBenchmarks(galleryDir, suite, archiveDir)).toBe(1);
    expect(
      existsSync(
        join(archiveDir, 'grok-4.6', 'terrain-explorer-A', '2026-08-21-000000', 'index.html'),
      ),
    ).toBe(true);
    expect(existsSync(join(galleryDir, 'grok-4.6', 'terrain-explorer-A'))).toBe(false);
  });

  it('writes .nojekyll and serve.json when finishing a gallery', () => {
    const galleryDir = tempDir();
    const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts');
    const animeBundle = join(galleryDir, 'anime.esm.min.js');
    writeFileSync(animeBundle, 'export const animate = {};\n');
    mkdirSync(join(galleryDir, 'grok-4.6', 'rollercoaster-A', '2026-08-24-010000'), {
      recursive: true,
    });
    writeFileSync(
      join(galleryDir, 'grok-4.6', 'rollercoaster-A', '2026-08-24-010000', 'index.html'),
      '<html></html>',
    );
    const result = finishGallery({
      galleryDir,
      scriptsDir,
      animeBundle,
      suite,
    });
    expect(existsSync(join(galleryDir, '.nojekyll'))).toBe(true);
    expect(JSON.parse(readFileSync(join(galleryDir, 'serve.json'), 'utf8'))).toEqual({
      cleanUrls: false,
    });
    expect(result.catalog.experiments.map((row: { id: string }) => row.id)).toContain(
      'rollercoaster',
    );
    expect(existsSync(join(galleryDir, 'vendor', 'gallery-query.mjs'))).toBe(true);
    expect(existsSync(join(galleryDir, 'agent.json'))).toBe(true);
    expect(existsSync(join(galleryDir, 'llms.txt'))).toBe(true);
  });
});
