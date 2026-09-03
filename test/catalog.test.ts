import { describe, expect, it } from 'vite-plus/test';
import {
  assignPromptRevisions,
  buildCatalogFromCells,
  findCell,
  glanceFromReceipt,
  latestDateFor,
  maxPromptRevision,
} from '../scripts/catalog.mjs';
import { summarizeCellEvaluation } from '../scripts/gallery-evaluation.mjs';

const capturedRuntime = {
  protocol: 'browser-runtime-v2',
  capturedAt: '2026-09-03T00:00:00.000Z',
  viewport: { width: 1440, height: 900 },
  observationMs: 5000,
  runtime: {
    loads: true,
    canvasCount: 1,
    viewportFit: true,
    pageErrors: [],
    consoleErrors: [],
    failedRequests: [],
    document: { width: 1440, height: 900 },
  },
  motion: {
    automaticChangePct: 12,
    interactionChangePct: 6,
    sustainedIntervals: 2,
    sampledIntervals: 2,
  },
  samples: [
    { id: 'initial', atMs: 500, imageSha256: '1'.repeat(64), nonBlankPct: 90 },
    { id: 'automatic', atMs: 2500, imageSha256: '2'.repeat(64), nonBlankPct: 90 },
  ],
  evidence: ['Rendered in Chromium with a fixed observation sequence.'],
};

function qualityV2Evaluation(
  artifactSha256: string,
  placement = 1,
  candidateCount = 2,
  reviewCount = 1,
  facets = {
    clarity: placement === 1 ? 4 : 1,
    motionInteraction: placement === 1 ? 4 : 1,
    composition: placement === 1 ? 4 : 1,
    craft: placement === 1 ? 4 : 1,
  },
) {
  return {
    schemaVersion: 2,
    rubric: 'quality-v2',
    artifactSha256,
    capture: capturedRuntime,
    task: {
      checks: {
        loads: true,
        coreExperience: true,
        expectedBehavior: true,
        runtimeStability: true,
        viewportFit: true,
      },
      evidence: ['All observable task checks passed.'],
    },
    experienceReviews: Array.from({ length: reviewCount }, (_, index) => ({
      reviewer: {
        id: 'reviewer-' + (index + 1),
        type: index === 0 ? 'human' : 'multimodal-model',
      },
      blind: true,
      reviewedAt: '2026-09-03T0' + index + ':00:00.000Z',
      cohortId: 'current::bench::A::prompt-r1',
      candidateCount,
      placement,
      facets: { ...facets },
      evidence: ['Compared the fixed samples inside the same cohort.'],
    })),
  };
}

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

  it('builds a deterministic quality ranking from blind artifact reviews', () => {
    const evaluation = (artifactSha256: string, placement: number, reviewCount = 2) =>
      qualityV2Evaluation(artifactSha256, placement, 2, reviewCount);
    const makeCell = ({
      model,
      experiment,
      level,
      durationMs,
      placement,
      reviewCount = 2,
    }: {
      model: string;
      experiment: string;
      level: string;
      durationMs: number;
      placement: number;
      reviewCount?: number;
    }) => {
      const outputSha256 = 'a'.repeat(64);
      return {
        cellId: `${experiment}--${level.toLowerCase()}--${model}`,
        model,
        experiment,
        title: experiment,
        level,
        date: '2026-09-02-010000',
        promptSha256: `${experiment}-${level}`,
        outputSha256,
        status: 'complete',
        src: `${model}/${experiment}-${level}/index.html`,
        evaluationSrc: `${model}/${experiment}-${level}/evaluation.json`,
        evaluation: evaluation(outputSha256, placement, reviewCount),
        receipt: { durationMs },
        glance: { durationMs, showcaseFixed: false },
      };
    };
    const catalog = buildCatalogFromCells([
      makeCell({
        model: 'model-fast-but-weak',
        experiment: 'bench-one',
        level: 'A',
        durationMs: 1000,
        placement: 2,
      }),
      makeCell({
        model: 'model-slow-but-strong',
        experiment: 'bench-one',
        level: 'A',
        durationMs: 9000,
        placement: 1,
      }),
      makeCell({
        model: 'model-fast-but-weak',
        experiment: 'bench-two',
        level: 'A',
        durationMs: 1500,
        placement: 2,
      }),
      makeCell({
        model: 'model-slow-but-strong',
        experiment: 'bench-two',
        level: 'A',
        durationMs: 8000,
        placement: 1,
      }),
    ]);

    const allA = catalog.evaluation.scopes.find((scope) => scope.id === 'all::A');
    expect(
      allA?.rankings.map(
        (row: {
          qualityTier: number | null;
          model: string;
          preferencePercentile: number | null;
        }) => [row.qualityTier, row.model, row.preferencePercentile],
      ),
    ).toEqual([
      [1, 'model-slow-but-strong', 100],
      [2, 'model-fast-but-weak', 0],
    ]);
    expect(catalog.evaluation.winners).toEqual([
      expect.objectContaining({
        experiment: 'bench-one',
        level: 'A',
        model: 'model-slow-but-strong',
        status: 'confirmed',
      }),
      expect.objectContaining({
        experiment: 'bench-two',
        level: 'A',
        model: 'model-slow-but-strong',
        status: 'confirmed',
      }),
    ]);
    expect(catalog.evaluation.method.keptSeparate).toContain('Generation time');
    expect(catalog.cells[0].evaluation).toBeUndefined();
  });

  it('preserves a non-dominated quality tier instead of manufacturing precision', () => {
    const makeCell = (model: string, placement: number) => {
      const outputSha256 = model === 'model-a' ? 'a'.repeat(64) : 'b'.repeat(64);
      const facets =
        model === 'model-a'
          ? { clarity: 3, motionInteraction: 3, composition: 4, craft: 4 }
          : { clarity: 4, motionInteraction: 4, composition: 3, craft: 3 };
      return {
        cellId: `bench--a--${model}`,
        model,
        experiment: 'bench',
        title: 'Bench',
        level: 'A',
        date: '2026-09-03-010000',
        promptSha256: 'prompt',
        outputSha256,
        status: 'complete',
        src: `${model}/index.html`,
        evaluation: qualityV2Evaluation(outputSha256, placement, 2, 2, facets),
        glance: { durationMs: 1000, showcaseFixed: false },
      };
    };
    const catalog = buildCatalogFromCells([makeCell('model-z', 1), makeCell('model-a', 2)]);
    const scope = catalog.evaluation.scopes.find((row) => row.id === 'bench::A');

    expect(
      scope?.rankings.map(
        (row: {
          model: string;
          qualityTier: number | null;
          preferencePercentile: number | null;
        }) => [row.model, row.qualityTier, row.preferencePercentile],
      ),
    ).toEqual([
      ['model-a', 1, 0],
      ['model-z', 1, 100],
    ]);
    expect(scope?.topTierCount).toBe(2);
    expect(catalog.evaluation.winners).toEqual([]);
  });

  it('leaves unreviewed takes unranked instead of using delivery metadata as quality', () => {
    const catalog = buildCatalogFromCells([
      {
        cellId: 'bench--a--model-a',
        model: 'model-a',
        experiment: 'bench',
        title: 'Bench',
        level: 'A',
        date: '2026-09-02-010000',
        promptSha256: 'prompt',
        status: 'complete',
        src: 'model-a/bench-A/index.html',
        glance: { durationMs: 10, showcaseFixed: false },
      },
    ]);

    const scope = catalog.evaluation.scopes.find((row) => row.id === 'bench::A');
    expect(scope?.rankings[0]).toMatchObject({
      model: 'model-a',
      qualityTier: null,
      preferencePercentile: null,
      reviewState: 'unreviewed',
    });
    expect(catalog.evaluation.winners).toEqual([]);
  });

  it('puts required task gates ahead of a higher experience placement', () => {
    const passingHash = 'a'.repeat(64);
    const failingHash = 'b'.repeat(64);
    const failingEvaluation = qualityV2Evaluation(failingHash, 1, 2);
    failingEvaluation.task.checks.expectedBehavior = false;
    const catalog = buildCatalogFromCells([
      {
        cellId: 'passing',
        model: 'model-passing',
        experiment: 'bench',
        title: 'Bench',
        level: 'A',
        date: '2026-09-03-010000',
        promptSha256: 'prompt',
        outputSha256: passingHash,
        status: 'complete',
        src: 'passing/index.html',
        evaluation: qualityV2Evaluation(passingHash, 2, 2),
        glance: { durationMs: 2000, showcaseFixed: false },
      },
      {
        cellId: 'failing',
        model: 'model-failing',
        experiment: 'bench',
        title: 'Bench',
        level: 'A',
        date: '2026-09-03-010000',
        promptSha256: 'prompt',
        outputSha256: failingHash,
        status: 'complete',
        src: 'failing/index.html',
        evaluation: failingEvaluation,
        glance: { durationMs: 1000, showcaseFixed: false },
      },
    ]);

    const scope = catalog.evaluation.scopes.find((row) => row.id === 'bench::A');
    expect(
      scope?.rankings.map(
        (row: { qualityTier: number | null; model: string; winnerEligible: boolean }) => [
          row.qualityTier,
          row.model,
          row.winnerEligible,
        ],
      ),
    ).toEqual([
      [1, 'model-passing', true],
      [null, 'model-failing', false],
    ]);
    expect(catalog.evaluation.winners).toEqual([]);
  });

  it('ranks a reviewed playable take while keeping incomplete delivery visible', () => {
    const outputSha256 = 'a'.repeat(64);
    const catalog = buildCatalogFromCells([
      {
        cellId: 'bench--a--model-pending',
        model: 'model-pending',
        experiment: 'bench',
        title: 'Bench',
        level: 'A',
        date: '2026-09-02-010000',
        promptSha256: 'prompt',
        outputSha256,
        status: 'pending',
        src: 'model-pending/bench-A/index.html',
        evaluationSrc: 'model-pending/bench-A/evaluation.json',
        evaluation: qualityV2Evaluation(outputSha256, 1, 1),
        glance: { durationMs: 10, showcaseFixed: false },
      },
    ]);

    const scope = catalog.evaluation.scopes.find((row) => row.id === 'bench::A');
    expect(scope?.rankings[0]).toMatchObject({
      model: 'model-pending',
      qualityTier: 1,
      preferencePercentile: 100,
      taskScore: 100,
      completed: 0,
      possible: 1,
      completionPct: 0,
      reviewState: 'provisional',
      winnerEligible: true,
      cellId: 'bench--a--model-pending',
      evaluationSrc: 'model-pending/bench-A/evaluation.json',
    });
    expect(catalog.evaluation.winners).toEqual([]);
  });

  it('rejects a quality review when the published HTML hash changes', () => {
    expect(
      summarizeCellEvaluation({
        outputSha256: 'a'.repeat(64),
        evaluation: {
          schemaVersion: 2,
          rubric: 'quality-v2',
          artifactSha256: 'b'.repeat(64),
        },
      }),
    ).toMatchObject({ state: 'stale', preferencePercentile: null });
  });

  it('rejects the removed quality-v1 contract', () => {
    expect(
      summarizeCellEvaluation({
        outputSha256: 'a'.repeat(64),
        evaluation: {
          schemaVersion: 1,
          rubric: 'quality-v1',
          artifactSha256: 'a'.repeat(64),
        },
      }),
    ).toMatchObject({ state: 'invalid', preferencePercentile: null });
  });

  it('evaluates only the latest prompt revision for each slot', () => {
    const catalog = buildCatalogFromCells([
      {
        cellId: 'old',
        model: 'model-a',
        experiment: 'bench',
        title: 'Bench',
        level: 'A',
        date: '2026-09-01-010000',
        promptSha256: 'old-prompt',
        status: 'complete',
        src: 'old/index.html',
        glance: { durationMs: 1000, showcaseFixed: false },
      },
      {
        cellId: 'current',
        model: 'model-b',
        experiment: 'bench',
        title: 'Bench',
        level: 'A',
        date: '2026-09-02-010000',
        promptSha256: 'current-prompt',
        status: 'complete',
        src: 'current/index.html',
        outputSha256: 'b'.repeat(64),
        evaluation: qualityV2Evaluation('b'.repeat(64), 1, 1),
        glance: { durationMs: 2000, showcaseFixed: false },
      },
    ]);

    const scope = catalog.evaluation.scopes.find((row) => row.id === 'bench::A');
    expect(scope?.rankings.map((row: { model: string }) => row.model)).toEqual(['model-b']);
    expect(catalog.evaluation.winners).toEqual([]);
  });
});
