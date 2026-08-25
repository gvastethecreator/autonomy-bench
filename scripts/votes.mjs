import { parsePromptVersion } from './layout.mjs';

const PROMPT_LEVEL = /^[ABC]$/;
const MODEL_ID = /^[a-z0-9][a-z0-9._-]{0,79}$/i;
const EXPERIMENT_ID = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const VOTER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function votePromptId(experiment, level) {
  const bench = String(experiment || '')
    .trim()
    .toLowerCase();
  const lvl = String(level || '')
    .trim()
    .toUpperCase();
  if (!EXPERIMENT_ID.test(bench) || !PROMPT_LEVEL.test(lvl)) return '';
  return `${bench}-${lvl}`;
}

export function parseVotePromptId(promptId) {
  const parsed = parsePromptVersion(promptId);
  if (!parsed.promptLevel) return { experiment: '', level: '' };
  const experiment = String(parsed.benchmarkId || '').toLowerCase();
  if (!EXPERIMENT_ID.test(experiment) || !PROMPT_LEVEL.test(parsed.promptLevel)) {
    return { experiment: '', level: '' };
  }
  return { experiment, level: parsed.promptLevel };
}

export function isVoteModelId(modelId) {
  const value = String(modelId || '').trim();
  return MODEL_ID.test(value);
}

export function isVoterId(value) {
  return VOTER_ID.test(String(value || '').trim());
}

export function uniqueLeader(counts) {
  let leader = null;
  let max = 0;
  let tied = false;
  for (const [model, raw] of Object.entries(counts || {})) {
    const n = Number(raw) || 0;
    if (n <= 0 || !isVoteModelId(model)) continue;
    if (n > max) {
      max = n;
      leader = model;
      tied = false;
    } else if (n === max) {
      tied = true;
      leader = null;
    }
  }
  return tied ? null : leader;
}

export function countsFromRows(rows) {
  const counts = {};
  for (const row of rows || []) {
    const model = String((row && row.model_id) || '').trim();
    const n = Number(row && row.n) || 0;
    if (!isVoteModelId(model) || n <= 0) continue;
    counts[model] = n;
  }
  return counts;
}

export function voteStateFromPayload(payload) {
  const counts =
    payload &&
    payload.counts &&
    typeof payload.counts === 'object' &&
    !Array.isArray(payload.counts)
      ? countsFromRows(
          Object.entries(payload.counts).map(([model_id, n]) => ({
            model_id,
            n,
          })),
        )
      : {};
  const mineRaw = payload && typeof payload.mine === 'string' ? payload.mine.trim() : '';
  const mine = isVoteModelId(mineRaw) ? mineRaw : null;
  return {
    promptId: parseVotePromptId(payload && payload.promptId).experiment
      ? String(payload.promptId)
      : '',
    counts,
    mine,
    leader: uniqueLeader(counts),
  };
}
