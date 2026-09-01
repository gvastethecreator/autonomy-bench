import { describe, expect, it } from 'vite-plus/test';
import {
  assignPromptRevisions,
  buildCatalogFromCells,
  findCell,
  glanceFromReceipt,
  latestDateFor,
  maxPromptRevision,
} from '../scripts/catalog.mjs';

describe('catalog', () => {
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
      })?.src,
    ).toBe('new.html');
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

  it('keeps each run entry on its own provenance instead of the latest publish extras', () => {
    const cell = (runId: string, harness: string | undefined) => ({
      model: `m-${runId}`,
      experiment: 'rollercoaster',
      title: 'Rollercoaster',
      level: 'A',
      date: '2026-08-21-021413',
      runId,
      promptSha256: 'aaa',
      status: 'complete',
      src: 'a.html',
      receipt: harness ? { runId, harness, adapter: 'agent' } : undefined,
    });
    const catalog = buildCatalogFromCells(
      [cell('run-old', undefined), cell('run-old', 'cursor'), cell('run-new', 'claude-code')],
      { runId: 'run-new', label: 'new-label', harness: 'claude-code', adapter: 'agent' },
    );
    const byId = new Map(catalog.runs.map((run) => [run.runId, run]));
    expect(byId.get('run-old')).toMatchObject({ harness: 'cursor', label: '' });
    expect(byId.get('run-new')).toMatchObject({ harness: 'claude-code', label: 'new-label' });
  });

  it('adds thinking and modelKey without renaming models[].id', () => {
    const catalog = buildCatalogFromCells([
      {
        model: 'grok-4.6',
        experiment: 'rollercoaster',
        title: 'Rollercoaster',
        level: 'A',
        date: '2026-08-21-021413',
        runId: 'run-1',
        promptSha256: 'aaa',
        status: 'complete',
        src: 'a.html',
        receipt: {
          runId: 'run-1',
          requestedModel: 'grok-4.6',
          effectiveModel: 'cursor-grok-4.6-high',
        },
      },
    ]);
    expect(catalog.models.map((row) => row.id)).toEqual(['grok-4.6']);
    expect(catalog.cells[0].thinking).toBe('high');
    expect(catalog.cells[0].modelKey).toBe('grok-4.6-high');
    expect(catalog.cells[0].model).toBe('grok-4.6');
  });

  it('lists preferred experiments that have no published cells', () => {
    const catalog = buildCatalogFromCells(
      [
        {
          model: 'grok-4.6',
          experiment: 'rollercoaster',
          title: 'Rollercoaster',
          level: 'A',
          date: '2026-08-21-021413',
          promptSha256: 'aaa',
          status: 'complete',
          src: 'a.html',
        },
      ],
      {
        experimentOrder: ['rollercoaster', 'ant-colony', 'fireworks'],
        experimentTitles: {
          rollercoaster: 'Rollercoaster',
          'ant-colony': 'Ant Colony',
          fireworks: 'Fireworks',
        },
      },
    );
    expect(catalog.experiments).toEqual([
      { id: 'rollercoaster', title: 'Rollercoaster' },
      { id: 'ant-colony', title: 'Ant Colony' },
      { id: 'fireworks', title: 'Fireworks' },
    ]);
    expect(catalog.cells).toHaveLength(1);
  });

  it('surfaces showcaseFixed on glance', () => {
    expect(
      glanceFromReceipt({
        durationMs: 10,
        harness: 'cursor',
        showcaseFixed: { at: '2026-08-24T00:00:00.000Z', note: 'x' },
      })?.showcaseFixed,
    ).toBe(true);
    expect(glanceFromReceipt({ durationMs: 10 })?.showcaseFixed).toBe(false);
  });
});
