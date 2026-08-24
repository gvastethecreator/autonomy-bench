import { describe, expect, it } from 'vite-plus/test';
import {
  assignPromptRevisions,
  buildCatalogFromCells,
  cellRelPath,
  compareDateStamp,
  findCell,
  formatDateStamp,
  galleryDateFolder,
  galleryRelPath,
  latestDateFor,
  maxPromptRevision,
  parsePromptVersion,
  promptVersion,
  runTimeFromRunId,
  slug,
} from '../scripts/layout.mjs';

describe('layout', () => {
  it('slugs model ids', () => {
    expect(slug('GPT 5.6 Sol')).toBe('gpt-5.6-sol');
    expect(slug('')).toBe('unknown');
  });

  it('builds prompt-V as benchmark-level', () => {
    expect(promptVersion('endless-driving', 'b')).toBe('endless-driving-B');
  });

  it('reads the run timestamp from a run id', () => {
    expect(runTimeFromRunId('20260821-021413-cursor-8-models-07567c37')).toBe('021413');
  });

  it('keeps ledger cells under model/prompt-V', () => {
    expect(
      cellRelPath({
        model: 'grok-4.6',
        benchmarkId: 'rollercoaster',
        promptLevel: 'A',
      }),
    ).toBe('cells/grok-4.6/rollercoaster-A');
  });

  it('nests extra attempts under the prompt version', () => {
    expect(
      cellRelPath({
        model: 'grok-4.6',
        benchmarkId: 'rollercoaster',
        promptLevel: 'A',
        attempt: 2,
      }),
    ).toBe('cells/grok-4.6/rollercoaster-A/a02');
  });

  it('publishes gallery takes as model/prompt-V/date', () => {
    const rel = galleryRelPath({
      model: 'composer-2.5',
      benchmarkId: 'medieval-city',
      promptLevel: 'C',
      date: '2026-08-21',
      runId: '20260821-021413-cursor-8-models-07567c37',
    });
    expect(rel).toBe('composer-2.5/medieval-city-C/2026-08-21-021413');
    expect(rel.split('/')).toHaveLength(3);
  });

  it('suffixes the date folder when attempt is greater than 1', () => {
    expect(
      galleryDateFolder({
        date: '2026-08-21',
        runId: '20260821-021413-x',
        attempt: 3,
      }),
    ).toBe('2026-08-21-021413-a03');
  });

  it('parses prompt-V on the last hyphen so hyphenated ids stay intact', () => {
    expect(parsePromptVersion('endless-driving-A')).toEqual({
      benchmarkId: 'endless-driving',
      promptLevel: 'A',
    });
    expect(parsePromptVersion('procedural-biped-C')).toEqual({
      benchmarkId: 'procedural-biped',
      promptLevel: 'C',
    });
  });

  it('formats date stamps for the viewer dropdown', () => {
    expect(formatDateStamp('2026-08-21-021413')).toBe('2026-08-21 02:14');
    expect(formatDateStamp('2026-08-21-021413-a03')).toBe('2026-08-21 02:14 a03');
  });

  it('sorts date stamps newest first', () => {
    expect(compareDateStamp('2026-08-21-021413', '2026-08-22-010000')).toBeGreaterThan(0);
  });

  it('assigns prompt revisions from sha + first-seen date', () => {
    const { cells, promptRevisions } = assignPromptRevisions([
      {
        experiment: 'rollercoaster',
        level: 'A',
        date: '2026-08-22-010000',
        promptSha256: 'bbb',
        prompt: 'new',
      },
      {
        experiment: 'rollercoaster',
        level: 'A',
        date: '2026-08-21-021413',
        promptSha256: 'aaa',
        prompt: 'old',
      },
      {
        experiment: 'rollercoaster',
        level: 'A',
        date: '2026-08-23-000000',
        promptSha256: 'bbb',
        prompt: 'new',
      },
    ]);
    expect(promptRevisions.map((row) => [row.revision, row.sha256, row.firstSeen])).toEqual([
      [1, 'aaa', '2026-08-21-021413'],
      [2, 'bbb', '2026-08-22-010000'],
    ]);
    expect(cells.map((cell: { promptRevision: number }) => cell.promptRevision)).toEqual([2, 1, 2]);
    expect(maxPromptRevision(promptRevisions, 'rollercoaster', 'A')).toBe(2);
  });

  it('does not count an empty prompt hash as its own revision', () => {
    const { cells, promptRevisions } = assignPromptRevisions([
      {
        experiment: 'rollercoaster',
        level: 'C',
        date: '2026-08-23-050906',
        promptSha256: '',
        prompt: 'stub',
      },
      {
        experiment: 'rollercoaster',
        level: 'C',
        date: '2026-08-23-054241',
        promptSha256: 'ccc',
        prompt: 'showcase',
      },
    ]);
    expect(promptRevisions).toEqual([
      expect.objectContaining({ revision: 1, sha256: 'ccc', firstSeen: '2026-08-23-054241' }),
    ]);
    expect(cells.map((cell: { promptRevision: number }) => cell.promptRevision)).toEqual([1, 1]);
    expect(maxPromptRevision(promptRevisions, 'rollercoaster', 'C')).toBe(1);
  });

  it('finds the latest date for a revision and looks up a cell by filters', () => {
    const { cells } = assignPromptRevisions([
      {
        model: 'grok-4.6',
        experiment: 'rollercoaster',
        level: 'A',
        date: '2026-08-21-021413',
        promptSha256: 'aaa',
        src: 'old.html',
      },
      {
        model: 'grok-4.6',
        experiment: 'rollercoaster',
        level: 'A',
        date: '2026-08-22-010000',
        promptSha256: 'aaa',
        src: 'new.html',
      },
    ]);
    expect(
      latestDateFor(cells, { experiment: 'rollercoaster', level: 'A', promptRevision: 1 }),
    ).toBe('2026-08-22-010000');
    expect(
      findCell(cells, {
        model: 'grok-4.6',
        experiment: 'rollercoaster',
        level: 'A',
        promptRevision: 1,
        month: '2026-08',
      })?.src,
    ).toBe('new.html');
    expect(
      findCell(cells, {
        model: 'grok-4.6',
        experiment: 'rollercoaster',
        level: 'A',
        promptRevision: 1,
        month: '2026-08',
        date: '2026-08-21-021413',
      })?.src,
    ).toBe('old.html');
  });

  it('builds catalog indexes from mixed dates', () => {
    const catalog = buildCatalogFromCells(
      [
        {
          model: 'grok-4.6',
          experiment: 'rollercoaster',
          title: 'Rollercoaster',
          level: 'A',
          date: '2026-08-21-021413',
          runId: 'run-old',
          promptSha256: 'aaa',
          status: 'complete',
          src: 'a.html',
          receipt: { runId: 'run-old', harness: 'cursor', adapter: 'agent' },
        },
        {
          model: 'kimi-k3-max',
          experiment: 'rollercoaster',
          title: 'Rollercoaster',
          level: 'A',
          date: '2026-08-22-010000',
          runId: 'run-new',
          promptSha256: 'bbb',
          status: 'complete',
          src: 'b.html',
          receipt: { runId: 'run-new', harness: 'cursor', adapter: 'agent' },
        },
      ],
      { modelOrder: ['kimi-k3-max', 'grok-4.6'] },
    );
    expect(catalog.dates[0]).toBe('2026-08-22-010000');
    expect(catalog.promptRevisions).toHaveLength(2);
    expect(catalog.runs).toHaveLength(2);
    expect(catalog.models.map((row) => row.id)).toEqual(['grok-4.6', 'kimi-k3-max']);
  });
});
