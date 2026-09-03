export const TASK_CHECKS = [
  { id: 'loads', label: 'Loads', weight: 20, gate: true },
  { id: 'coreExperience', label: 'Core experience', weight: 25, gate: true },
  { id: 'expectedBehavior', label: 'Expected behavior', weight: 30, gate: true },
  { id: 'runtimeStability', label: 'Runtime stability', weight: 15, gate: true },
  { id: 'viewportFit', label: 'Viewport fit', weight: 10, gate: false },
];

export const EXPERIENCE_FACETS = [
  { id: 'clarity', label: 'Clarity' },
  { id: 'motionInteraction', label: 'Motion & interaction' },
  { id: 'composition', label: 'Composition' },
  { id: 'craft', label: 'Craft' },
];

export const CELL_EVALUATION_RUBRIC = {
  schemaVersion: 2,
  id: 'quality-v2',
};

export const GALLERY_EVALUATION_METHOD = {
  id: 'tiered-evidence-v3',
  label: 'Tiered evidence ranking',
  summary:
    'Preserves ties between non-dominated quality profiles instead of turning one reviewer placement into a precise score.',
  inputRubric: CELL_EVALUATION_RUBRIC,
  minimumIndependentReviews: 2,
  minimumHumanReviews: 1,
  taskChecks: TASK_CHECKS,
  experienceFacets: EXPERIENCE_FACETS,
  rankingOrder: [
    'All required task gates pass',
    'Pareto tier across task success and the four quality facets',
    'Stable model id',
  ],
  preferenceRule: 'Blind within-cohort preference is stored for audit and never changes a tier.',
  winnerRule: 'A winner needs a unique Tier 1 and confirmed reviews for the whole cohort.',
  keptSeparate: [
    'Task success',
    'Quality facets',
    'Blind reviewer preference',
    'Delivery coverage',
    'Generation time',
    'Output size',
    'Community votes',
  ],
};

const LEVELS = ['A', 'B', 'C'];
const REQUIRED_TASK_CHECKS = TASK_CHECKS.filter((check) => check.gate).map((check) => check.id);
const CONFIRMED_REVIEW_COUNT = GALLERY_EVALUATION_METHOD.minimumIndependentReviews;

function roundOne(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function average(values) {
  const numbers = values.filter(Number.isFinite);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
}

function median(values) {
  const numbers = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!numbers.length) return null;
  const middle = Math.floor(numbers.length / 2);
  if (numbers.length % 2) return numbers[middle];
  return (numbers[middle - 1] + numbers[middle]) / 2;
}

function latestPromptRevision(cells, experiment, level) {
  return Math.max(
    1,
    ...cells
      .filter((cell) => cell.experiment === experiment && cell.level === level)
      .map((cell) => Number(cell.promptRevision) || 1),
  );
}

function latestCell(cells, model, experiment, level, promptRevision) {
  return (
    cells
      .filter(
        (cell) =>
          cell.model === model &&
          cell.experiment === experiment &&
          cell.level === level &&
          (Number(cell.promptRevision) || 1) === promptRevision,
      )
      .sort((a, b) => {
        const byDate = String(b.date || '').localeCompare(String(a.date || ''));
        if (byDate) return byDate;
        const byAttempt = (Number(b.attempt) || 1) - (Number(a.attempt) || 1);
        if (byAttempt) return byAttempt;
        return String(a.cellId || '').localeCompare(String(b.cellId || ''));
      })[0] || null
  );
}

function isVerified(cell) {
  return Boolean(cell && cell.src && cell.status === 'complete');
}

function isReviewable(cell) {
  return Boolean(cell && cell.src);
}

function isShowcaseFixed(cell) {
  return Boolean(cell && cell.glance && cell.glance.showcaseFixed);
}

function capturedDuration(cell) {
  const value = cell && cell.glance && cell.glance.durationMs;
  return Number.isFinite(value) ? value : null;
}

function scopeKey(experiment, level) {
  return (experiment || 'all') + '::' + (level || 'all');
}

function validEvidence(value) {
  return (
    Array.isArray(value) && value.length > 0 && value.every((item) => String(item || '').trim())
  );
}

function invalidEvaluation(state, reason) {
  return {
    state,
    reason,
    preferencePercentile: null,
    taskScore: null,
    taskPassRate: null,
    reviewCount: 0,
    humanReviewCount: 0,
    experienceFacets: {},
    taskChecks: {},
    taskGatesPassed: false,
  };
}

function validCapture(capture) {
  if (!capture || capture.protocol !== 'browser-runtime-v2') return false;
  if (!capture.capturedAt || Number.isNaN(Date.parse(capture.capturedAt))) return false;
  if (
    !Number.isInteger(capture?.viewport?.width) ||
    capture.viewport.width < 320 ||
    !Number.isInteger(capture?.viewport?.height) ||
    capture.viewport.height < 320
  ) {
    return false;
  }
  if (!Number.isFinite(capture.observationMs) || capture.observationMs <= 0) return false;
  if (!capture.runtime || typeof capture.runtime.loads !== 'boolean') return false;
  if (
    !Array.isArray(capture.runtime.pageErrors) ||
    !Array.isArray(capture.runtime.consoleErrors) ||
    !Array.isArray(capture.runtime.failedRequests)
  ) {
    return false;
  }
  if (
    !capture.motion ||
    !Number.isFinite(capture.motion.automaticChangePct) ||
    !Number.isFinite(capture.motion.interactionChangePct)
  ) {
    return false;
  }
  if (!Array.isArray(capture.samples) || capture.samples.length < 2) return false;
  return capture.samples.every(
    (sample) =>
      String(sample?.id || '').trim() &&
      Number.isFinite(sample?.atMs) &&
      /^[0-9a-f]{64}$/i.test(String(sample?.imageSha256 || '')) &&
      Number.isFinite(sample?.nonBlankPct),
  );
}

function preferencePercentile(review) {
  const count = review.candidateCount;
  if (count === 1) return 100;
  return roundOne((100 * (count - review.placement)) / (count - 1));
}

export function summarizeCellEvaluation(cell) {
  const evaluation = cell && cell.evaluation;
  if (cell?.evaluationError) return invalidEvaluation('invalid', cell.evaluationError);
  if (!evaluation) return invalidEvaluation('unreviewed', 'No evaluation.json file.');
  if (
    evaluation.schemaVersion !== CELL_EVALUATION_RUBRIC.schemaVersion ||
    evaluation.rubric !== CELL_EVALUATION_RUBRIC.id
  ) {
    return invalidEvaluation('invalid', 'Unsupported evaluation schema or rubric.');
  }

  const expectedHash = String(cell.outputSha256 || '').toLowerCase();
  const reviewedHash = String(evaluation.artifactSha256 || '').toLowerCase();
  if (!expectedHash || !reviewedHash || expectedHash !== reviewedHash) {
    return invalidEvaluation('stale', 'The evaluation does not match the published HTML hash.');
  }
  if (!validCapture(evaluation.capture)) {
    return invalidEvaluation('invalid', 'The fixed browser capture is incomplete.');
  }

  const task = evaluation.task || {};
  const taskChecks = task.checks || {};
  if (
    TASK_CHECKS.some((check) => typeof taskChecks[check.id] !== 'boolean') ||
    !validEvidence(task.evidence)
  ) {
    return invalidEvaluation('invalid', 'The observable task checks are incomplete.');
  }
  const taskScore = TASK_CHECKS.reduce(
    (sum, check) => sum + (taskChecks[check.id] ? check.weight : 0),
    0,
  );
  const passedChecks = TASK_CHECKS.filter((check) => taskChecks[check.id]).length;
  const taskPassRate = roundOne((passedChecks / TASK_CHECKS.length) * 100);
  const taskGatesPassed = REQUIRED_TASK_CHECKS.every((id) => taskChecks[id]);

  const reviews = Array.isArray(evaluation.experienceReviews) ? evaluation.experienceReviews : [];
  if (!reviews.length) {
    return {
      ...invalidEvaluation('unreviewed', 'No blind comparative experience review is recorded.'),
      taskScore,
      taskPassRate,
      taskChecks: { ...taskChecks },
      taskGatesPassed,
    };
  }

  const reviewerIds = new Set();
  for (const review of reviews) {
    const reviewerId = String(review?.reviewer?.id || '').trim();
    if (!reviewerId || reviewerIds.has(reviewerId)) {
      return invalidEvaluation('invalid', 'Reviewer ids must be present and unique.');
    }
    reviewerIds.add(reviewerId);
    if (!['human', 'multimodal-model'].includes(review?.reviewer?.type)) {
      return invalidEvaluation('invalid', 'The reviewer type is not supported.');
    }
    if (review.blind !== true) {
      return invalidEvaluation('invalid', 'Only blind comparative reviews can affect the rank.');
    }
    if (!review.reviewedAt || Number.isNaN(Date.parse(review.reviewedAt))) {
      return invalidEvaluation('invalid', 'Each review needs a review time.');
    }
    if (!String(review.cohortId || '').trim()) {
      return invalidEvaluation('invalid', 'Each review needs a benchmark and level cohort.');
    }
    if (
      !Number.isInteger(review.candidateCount) ||
      review.candidateCount < 1 ||
      !Number.isInteger(review.placement) ||
      review.placement < 1 ||
      review.placement > review.candidateCount
    ) {
      return invalidEvaluation('invalid', 'Each review needs a valid within-cohort placement.');
    }
    if (!validEvidence(review.evidence)) {
      return invalidEvaluation('invalid', 'Each review needs concise comparative evidence.');
    }
    if (
      !review.facets ||
      EXPERIENCE_FACETS.some(
        (facet) =>
          !Number.isInteger(review.facets[facet.id]) ||
          review.facets[facet.id] < 0 ||
          review.facets[facet.id] > 4,
      )
    ) {
      return invalidEvaluation('invalid', 'Every review must rate all four diagnostic facets.');
    }
  }

  const reviewPreference = roundOne(median(reviews.map((review) => preferencePercentile(review))));
  const experienceFacets = Object.fromEntries(
    EXPERIENCE_FACETS.map((facet) => [
      facet.id,
      roundOne(median(reviews.map((review) => review.facets[facet.id]))),
    ]),
  );
  const humanReviewCount = reviews.filter((review) => review.reviewer.type === 'human').length;

  return {
    state:
      reviews.length >= CONFIRMED_REVIEW_COUNT &&
      humanReviewCount >= GALLERY_EVALUATION_METHOD.minimumHumanReviews
        ? 'confirmed'
        : 'provisional',
    reason: '',
    preferencePercentile: reviewPreference,
    taskScore,
    taskPassRate,
    reviewCount: reviews.length,
    humanReviewCount,
    experienceFacets,
    taskChecks: { ...taskChecks },
    taskGatesPassed,
  };
}

function qualityMetrics(row) {
  return [row.taskScore, ...EXPERIENCE_FACETS.map((facet) => row.experienceFacets[facet.id])];
}

function dominates(a, b) {
  const aMetrics = qualityMetrics(a);
  const bMetrics = qualityMetrics(b);
  return (
    aMetrics.every((value, index) => value >= bMetrics[index]) &&
    aMetrics.some((value, index) => value > bMetrics[index])
  );
}

function assignQualityTiers(rows) {
  let remaining = rows.filter((row) => row.winnerEligible);
  let qualityTier = 1;
  while (remaining.length) {
    const front = remaining.filter(
      (candidate) => !remaining.some((other) => other !== candidate && dominates(other, candidate)),
    );
    for (const row of front) row.qualityTier = qualityTier;
    const frontSet = new Set(front);
    remaining = remaining.filter((row) => !frontSet.has(row));
    qualityTier += 1;
  }
}

function compareRankRows(a, b) {
  if (a.winnerEligible !== b.winnerEligible) return a.winnerEligible ? -1 : 1;
  const aTier = Number.isFinite(a.qualityTier) ? a.qualityTier : Infinity;
  const bTier = Number.isFinite(b.qualityTier) ? b.qualityTier : Infinity;
  if (aTier !== bTier) return aTier - bTier;
  return a.model.localeCompare(b.model);
}

function buildScope(cells, modelIds, experimentIds, experiment, level) {
  const scopedExperiments = experiment === 'all' ? experimentIds : [experiment];
  const scopedLevels = level === 'all' ? LEVELS : [level];
  const slots = scopedExperiments.flatMap((experimentId) =>
    scopedLevels.map((levelId) => ({
      experiment: experimentId,
      level: levelId,
      promptRevision: latestPromptRevision(cells, experimentId, levelId),
    })),
  );

  const rows = modelIds.map((model) => {
    const selected = slots.map((slot) => ({
      ...slot,
      cell: latestCell(cells, model, slot.experiment, slot.level, slot.promptRevision),
    }));
    const reviewable = selected.filter((slot) => isReviewable(slot.cell));
    const verified = selected.filter((slot) => isVerified(slot.cell));
    const clean = verified.filter((slot) => !isShowcaseFixed(slot.cell));
    const durations = verified.map((slot) => capturedDuration(slot.cell)).filter(Number.isFinite);
    const outputTokens = verified
      .map((slot) => slot.cell.outputTokensApprox)
      .filter(Number.isFinite);
    const evaluations = reviewable.map((slot) => ({
      slot,
      summary: summarizeCellEvaluation(slot.cell),
    }));
    const reviewed = evaluations.filter(({ summary }) =>
      Number.isFinite(summary.preferencePercentile),
    );
    const completeScope = verified.length === slots.length;
    const reviewedScope = reviewed.length === slots.length;
    const preferencePercentile = reviewedScope
      ? roundOne(average(reviewed.map(({ summary }) => summary.preferencePercentile)))
      : null;
    const taskScore = reviewedScope
      ? roundOne(average(reviewed.map(({ summary }) => summary.taskScore)))
      : null;
    const taskPassRate = reviewedScope
      ? roundOne(average(reviewed.map(({ summary }) => summary.taskPassRate)))
      : null;
    const experienceFacets = Object.fromEntries(
      EXPERIENCE_FACETS.map((facet) => [
        facet.id,
        reviewed.length
          ? roundOne(average(reviewed.map(({ summary }) => summary.experienceFacets[facet.id])))
          : null,
      ]),
    );
    const taskChecks = Object.fromEntries(
      TASK_CHECKS.map((check) => [
        check.id,
        reviewed.length
          ? roundOne(
              (reviewed.filter(({ summary }) => summary.taskChecks[check.id]).length /
                reviewed.length) *
                100,
            )
          : null,
      ]),
    );
    const reviewCount = reviewed.reduce((sum, { summary }) => sum + summary.reviewCount, 0);
    const humanReviewCount = reviewed.reduce(
      (sum, { summary }) => sum + summary.humanReviewCount,
      0,
    );
    const minimumReviewCount = reviewed.length
      ? Math.min(...reviewed.map(({ summary }) => summary.reviewCount))
      : 0;
    const confirmedScope =
      reviewedScope && reviewed.every(({ summary }) => summary.state === 'confirmed');
    const invalidReviewCount = evaluations.filter(
      ({ summary }) => summary.state === 'invalid' || summary.state === 'stale',
    ).length;
    let reviewState = 'unreviewed';
    if (invalidReviewCount) reviewState = 'invalid';
    else if (reviewed.length && !reviewedScope) reviewState = 'partial';
    else if (confirmedScope) reviewState = 'confirmed';
    else if (reviewedScope) reviewState = 'provisional';
    else if (!completeScope) reviewState = 'incomplete';

    const taskGatesPassed =
      reviewedScope && reviewed.every(({ summary }) => summary.taskGatesPassed);

    return {
      model,
      completed: verified.length,
      possible: slots.length,
      completionPct: slots.length ? roundOne((verified.length / slots.length) * 100) : 0,
      clean: clean.length,
      integrityPct: verified.length ? roundOne((clean.length / verified.length) * 100) : 0,
      durationCaptured: durations.length,
      averageDurationMs: durations.length ? Math.round(average(durations)) : null,
      averageOutputTokens: outputTokens.length ? Math.round(average(outputTokens)) : null,
      reviewed: reviewed.length,
      reviewCoveragePct: slots.length ? roundOne((reviewed.length / slots.length) * 100) : 0,
      reviewCount,
      humanReviewCount,
      minimumReviewCount,
      reviewState,
      invalidReviewCount,
      taskGatesPassed,
      winnerEligible: reviewedScope && taskGatesPassed,
      experienceFacets,
      taskChecks,
      preferencePercentile,
      taskScore,
      taskPassRate,
      qualityTier: null,
      cellId: slots.length === 1 && reviewable.length === 1 ? reviewable[0].cell.cellId || '' : '',
      evaluationSrc:
        slots.length === 1 && reviewable.length === 1
          ? reviewable[0].cell.evaluationSrc || null
          : null,
      promptRevision: slots.length === 1 ? slots[0].promptRevision : null,
    };
  });

  assignQualityTiers(rows);
  const rankings = rows
    .filter((row) => row.completed > 0 || row.reviewed > 0)
    .sort(compareRankRows);

  const candidateCount = rankings.length;
  const reviewedCandidates = rankings.filter((row) => row.reviewed > 0).length;
  const tieredCandidates = rankings.filter((row) => Number.isFinite(row.qualityTier)).length;
  const confirmedCandidates = rankings.filter((row) => row.reviewState === 'confirmed').length;
  const topTierCount = rankings.filter((row) => row.qualityTier === 1).length;
  return {
    id: scopeKey(experiment, level),
    experiment,
    level,
    possible: slots.length,
    candidateCount,
    reviewedCandidates,
    tieredCandidates,
    confirmedCandidates,
    topTierCount,
    reviewComplete: candidateCount > 0 && confirmedCandidates === candidateCount,
    rankings,
  };
}

export function buildGalleryEvaluation(cells, experiments, models) {
  const list = Array.isArray(cells) ? cells : [];
  const experimentIds = unique(
    (experiments || []).map((experiment) =>
      typeof experiment === 'string' ? experiment : experiment && experiment.id,
    ),
  );
  const modelIds = unique(
    (models || []).map((model) => (typeof model === 'string' ? model : model && model.id)),
  ).sort((a, b) => a.localeCompare(b));
  const scopeSpecs = [
    ['all', 'all'],
    ...experimentIds.map((experiment) => [experiment, 'all']),
    ...LEVELS.map((level) => ['all', level]),
    ...experimentIds.flatMap((experiment) => LEVELS.map((level) => [experiment, level])),
  ];
  const scopes = scopeSpecs.map(([experiment, level]) =>
    buildScope(list, modelIds, experimentIds, experiment, level),
  );
  const winners = scopes
    .filter((scope) => scope.experiment !== 'all' && scope.level !== 'all')
    .map((scope) => {
      const topTier = scope.rankings.filter((row) => row.qualityTier === 1 && row.winnerEligible);
      if (!scope.reviewComplete || topTier.length !== 1) return null;
      const winner = topTier[0];
      return {
        experiment: scope.experiment,
        level: scope.level,
        model: winner.model,
        qualityTier: winner.qualityTier,
        preferencePercentile: winner.preferencePercentile,
        taskScore: winner.taskScore,
        status: 'confirmed',
        reviewedCandidates: scope.reviewedCandidates,
        candidateCount: scope.candidateCount,
        reviewCount: winner.reviewCount,
        cellId: winner.cellId,
        evaluationSrc: winner.evaluationSrc,
        promptRevision: winner.promptRevision,
      };
    })
    .filter(Boolean);

  return {
    method: GALLERY_EVALUATION_METHOD,
    scopes,
    winners,
  };
}
