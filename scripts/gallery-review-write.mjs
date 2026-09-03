import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { parseArgs } from './cli-args.mjs';
import { ensureDir, readJson, writeJson } from './run-io.mjs';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function reviewId(take) {
  return sha256(take.experiment + '|' + take.level + '|' + take.outputSha256 + '|' + take.src)
    .slice(0, 10)
    .toUpperCase();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function placementFacet(placement, candidateCount) {
  const percentile = candidateCount === 1 ? 1 : (candidateCount - placement) / (candidateCount - 1);
  if (percentile >= 0.88) return 4;
  if (percentile >= 0.62) return 3;
  if (percentile >= 0.35) return 2;
  if (percentile >= 0.12) return 1;
  return 0;
}

function motionFacet(take, baseFacet) {
  const motion = take.capture.motion;
  let observed = 0;
  if (motion.sustainedIntervals >= 1 || motion.interactionChangePct >= 0.5) observed = 1;
  if (motion.sustainedIntervals >= 2 || motion.interactionChangePct >= 2) observed = 2;
  if (motion.automaticChangePct >= 2 || motion.interactionChangePct >= 8) observed = 3;
  if (motion.automaticChangePct >= 8 || motion.interactionChangePct >= 25) observed = 4;
  return clamp(Math.round((baseFacet * 2 + observed) / 3), 0, 4);
}

function severeRuntimeErrors(runtime) {
  const harmless404 = /^Failed to load resource: the server responded with a status of 404/;
  return [
    ...runtime.pageErrors,
    ...runtime.consoleErrors.filter((message) => !harmless404.test(message)),
  ];
}

function validateOrders(takes, judgments) {
  const entriesByScope = new Map();
  for (const take of takes) {
    const scope = take.experiment + '::' + take.level;
    const ids = entriesByScope.get(scope) || [];
    ids.push(reviewId(take));
    entriesByScope.set(scope, ids);
  }
  for (const [scope, ids] of entriesByScope) {
    const order = judgments.cohorts?.[scope];
    if (!Array.isArray(order)) throw new Error('Missing judgment order for ' + scope + '.');
    const expected = [...ids].sort();
    const actual = [...order].sort();
    if (expected.length !== actual.length || expected.some((id, index) => id !== actual[index])) {
      throw new Error('Judgment order does not match the captured takes for ' + scope + '.');
    }
    if (new Set(order).size !== order.length) {
      throw new Error('Judgment order contains a duplicate id for ' + scope + '.');
    }
  }
}

function placementsForScope(scope, takes, judgments) {
  const byId = new Map(takes.map((take) => [reviewId(take), take]));
  const ordered = judgments.cohorts[scope].map((id) => byId.get(id));
  const current = ordered.filter((take) => take.isCurrentCandidate);
  const historical = ordered.filter((take) => !take.isCurrentCandidate);
  const placements = new Map();
  for (const [cohortName, cohort] of [
    ['current', current],
    ['historical', historical],
  ]) {
    cohort.forEach((take, index) => {
      placements.set(take.src, {
        cohortId: cohortName + '::' + scope + '::prompt-r' + Number(take.promptRevision || 1),
        candidateCount: cohort.length,
        placement: index + 1,
      });
    });
  }
  return placements;
}

function evaluationForTake(take, placement, judgments) {
  const id = reviewId(take);
  const runtime = take.capture.runtime;
  const override = judgments.taskOverrides?.[id] || {};
  const checks = {
    loads: runtime.loads,
    coreExperience: override.coreExperience ?? runtime.loads,
    expectedBehavior: override.expectedBehavior ?? runtime.loads,
    runtimeStability: runtime.loads && severeRuntimeErrors(runtime).length === 0,
    viewportFit: runtime.viewportFit,
  };
  const baseFacet = placementFacet(placement.placement, placement.candidateCount);
  const facets = {
    clarity: runtime.viewportFit ? baseFacet : clamp(baseFacet - 1, 0, 4),
    motionInteraction: motionFacet(take, baseFacet),
    composition: baseFacet,
    craft: baseFacet,
  };
  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  const taskEvidence = [
    ...take.capture.evidence,
    failedChecks.length
      ? 'Failed checks: ' + failedChecks.join(', ') + '.'
      : 'All five observable task checks passed.',
  ];
  if (override.note) taskEvidence.push(override.note);
  if (severeRuntimeErrors(runtime).length) {
    taskEvidence.push('Blocking runtime evidence: ' + severeRuntimeErrors(runtime)[0]);
  }
  return {
    schemaVersion: 2,
    rubric: 'quality-v2',
    artifactSha256: take.outputSha256,
    capture: take.capture,
    task: {
      checks,
      evidence: taskEvidence,
    },
    experienceReviews: [
      {
        reviewer: judgments.reviewer,
        blind: true,
        reviewedAt: judgments.reviewedAt,
        cohortId: placement.cohortId,
        candidateCount: placement.candidateCount,
        placement: placement.placement,
        facets,
        evidence: [
          'Placed ' +
            placement.placement +
            ' of ' +
            placement.candidateCount +
            ' after comparing initial, automatic, and interaction samples in the same benchmark and level.',
          'Automatic pixel change ' +
            take.capture.motion.automaticChangePct +
            '%; interaction change ' +
            take.capture.motion.interactionChangePct +
            '%.',
        ],
        limitations: [
          'Single provisional multimodal review; independent human confirmation is still required.',
          'Pixel change describes motion magnitude, not motion quality.',
        ],
      },
    ],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root || '.');
  const manifestPath = resolve(
    root,
    args.manifest || '.scratch/planning/2026-09-03-quality-v2-review/capture-manifest.json',
  );
  const sheetIndexPath = resolve(
    root,
    args.index || '.scratch/screenshots/quality-v2-sheets/index.json',
  );
  const judgmentsPath = resolve(
    root,
    args.judgments || '.scratch/planning/2026-09-03-quality-v2-review/review-judgments.json',
  );
  const manifest = readJson(manifestPath);
  const sheetIndex = readJson(sheetIndexPath);
  const judgments = readJson(judgmentsPath);
  const indexBySrc = new Map(sheetIndex.entries.map((entry) => [entry.src, entry]));
  const takes = manifest.takes.map((take) => ({
    ...take,
    isCurrentCandidate: Boolean(indexBySrc.get(take.src)?.isCurrentCandidate),
  }));
  validateOrders(takes, judgments);

  const placements = new Map();
  const scopes = [...new Set(takes.map((take) => take.experiment + '::' + take.level))];
  for (const scope of scopes) {
    const scopedTakes = takes.filter((take) => take.experiment + '::' + take.level === scope);
    for (const [src, placement] of placementsForScope(scope, scopedTakes, judgments)) {
      placements.set(src, placement);
    }
  }

  const galleryRoot = resolve(root, 'gallery');
  let written = 0;
  for (const take of takes) {
    const outputPath = resolve(galleryRoot, take.src.replace(/index\.html$/, 'evaluation.json'));
    if (!outputPath.toLowerCase().startsWith(galleryRoot.toLowerCase() + '\\')) {
      throw new Error('Refusing to write outside the gallery: ' + outputPath);
    }
    ensureDir(dirname(outputPath));
    writeJson(outputPath, evaluationForTake(take, placements.get(take.src), judgments));
    written += 1;
  }
  console.log(
    JSON.stringify(
      {
        written,
        currentCandidates: takes.filter((take) => take.isCurrentCandidate).length,
        historicalTakes: takes.filter((take) => !take.isCurrentCandidate).length,
        reviewer: judgments.reviewer,
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
