import { compareDateStamp } from './layout.mjs';
import { applyModelThinking } from './model-meta.mjs';
import { isShowcaseFixed } from './receipt.mjs';
import { pickCellForMonth } from './run-month.mjs';
import { staffPicksFromCells } from './staff-picks.mjs';

export function glanceFromReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object') return null;
  return {
    durationMs: receipt.durationMs,
    harness: receipt.harness || '',
    contributor: receipt.contributor || null,
    limitations: Array.isArray(receipt.limitations) ? receipt.limitations : [],
    showcaseFixed: isShowcaseFixed(receipt),
  };
}

export function assignPromptRevisions(cells) {
  const next = cells.map((cell) => ({
    ...cell,
    promptSha256: cell.promptSha256 || cell.receipt?.promptSha256 || '',
  }));
  const groups = new Map();
  for (const cell of next) {
    const key = `${cell.experiment}\0${cell.level}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cell);
  }
  const promptRevisions = [];
  for (const [key, group] of groups) {
    const [experiment, level] = key.split('\0');
    const shaFirst = new Map();
    for (const cell of group) {
      const sha = cell.promptSha256 || '';
      if (!sha) continue;
      const date = cell.date || '';
      const prev = shaFirst.get(sha);
      if (prev == null || date < prev) shaFirst.set(sha, date);
    }
    const ordered = [...shaFirst.entries()].sort((a, b) => {
      const byDate = String(a[1]).localeCompare(String(b[1]));
      return byDate || String(a[0]).localeCompare(String(b[0]));
    });
    const shaToRev = new Map();
    ordered.forEach(([sha], index) => {
      const revision = index + 1;
      shaToRev.set(sha, revision);
      const sample = group.find((cell) => cell.promptSha256 === sha);
      const firstSeen = shaFirst.get(sha) || '';
      promptRevisions.push({
        experiment,
        level,
        revision,
        sha256: sha,
        prompt: sample?.prompt || '',
        firstSeen,
      });
    });
    for (const cell of group) {
      cell.promptRevision = shaToRev.get(cell.promptSha256) || 1;
    }
  }
  promptRevisions.sort((a, b) => {
    const byExp = a.experiment.localeCompare(b.experiment);
    if (byExp) return byExp;
    const byLevel = a.level.localeCompare(b.level);
    if (byLevel) return byLevel;
    return a.revision - b.revision;
  });
  return { cells: next, promptRevisions };
}

export function findCell(cells, { model, experiment, level, promptRevision, date, month } = {}) {
  const lvl = level == null ? null : String(level).toUpperCase();
  const rev = promptRevision == null ? null : Number(promptRevision);
  const pin = date == null || date === '' ? null : date;
  const matches = (cells || []).filter((cell) => {
    if (model != null && cell.model !== model && cell.modelKey !== model) return false;
    if (experiment != null && cell.experiment !== experiment) return false;
    if (lvl != null && cell.level !== lvl) return false;
    if (rev != null && Number(cell.promptRevision) !== rev) return false;
    if (pin != null && cell.date !== pin) return false;
    return true;
  });
  if (pin != null) return matches[0] || null;
  if (month) return pickCellForMonth(matches, month);
  return matches[0] || null;
}

export function maxPromptRevision(revisions, experiment, level) {
  let max = 0;
  for (const row of revisions || []) {
    if (row.experiment === experiment && row.level === level && row.revision > max) {
      max = row.revision;
    }
  }
  return max || 1;
}

export function latestDateFor(cells, { experiment, level, promptRevision } = {}) {
  const dates = cells
    .filter((cell) => {
      if (experiment != null && cell.experiment !== experiment) return false;
      if (level != null && cell.level !== String(level).toUpperCase()) return false;
      if (promptRevision != null && Number(cell.promptRevision) !== Number(promptRevision)) {
        return false;
      }
      return Boolean(cell.date);
    })
    .map((cell) => cell.date)
    .sort(compareDateStamp);
  return dates[0] || '';
}

function countBy(cells, statusList) {
  return cells.filter((cell) => statusList.includes(cell.status)).length;
}

export function buildCatalogFromCells(cells, extras = {}) {
  const { cells: revised, promptRevisions } = assignPromptRevisions(cells);
  const keyed = applyModelThinking(revised);
  const dates = [...new Set(keyed.map((cell) => cell.date).filter(Boolean))].sort(compareDateStamp);
  const runMap = new Map();
  for (const cell of keyed) {
    const runId = cell.runId || cell.receipt?.runId;
    if (!runId) continue;
    const entry = runMap.get(runId) || {
      runId,
      date: '',
      harness: '',
      adapter: '',
      // extras describe the run being published; other runs keep their own provenance.
      label: runId === extras.runId ? extras.label || '' : '',
    };
    if (!entry.date && cell.date) entry.date = cell.date;
    if (!entry.harness && cell.receipt?.harness) entry.harness = cell.receipt.harness;
    if (!entry.adapter && cell.receipt?.adapter) entry.adapter = cell.receipt.adapter;
    runMap.set(runId, entry);
  }
  const experimentIds = [];
  const seenExp = new Set();
  for (const cell of keyed) {
    if (seenExp.has(cell.experiment)) continue;
    seenExp.add(cell.experiment);
    experimentIds.push(cell.experiment);
  }
  const preferredExp = extras.experimentOrder || [];
  experimentIds.sort((a, b) => {
    const ia = preferredExp.indexOf(a);
    const ib = preferredExp.indexOf(b);
    const sa = ia === -1 ? 1000 : ia;
    const sb = ib === -1 ? 1000 : ib;
    return sa - sb || a.localeCompare(b);
  });
  const titles = new Map(keyed.map((cell) => [cell.experiment, cell.title || cell.experiment]));
  const experiments = experimentIds.map((id) => ({ id, title: titles.get(id) || id }));

  const modelIds = [];
  const seenModel = new Set();
  for (const cell of keyed) {
    if (seenModel.has(cell.model)) continue;
    seenModel.add(cell.model);
    modelIds.push(cell.model);
  }
  modelIds.sort((a, b) => a.localeCompare(b));
  const models = modelIds.map((id) => {
    const mine = keyed.filter((cell) => cell.model === id);
    return {
      id,
      complete: countBy(mine, ['complete']),
      unavailable: countBy(mine, ['unavailable']),
      pending: countBy(mine, ['pending', 'missing']),
      failed: countBy(mine, ['failed', 'blocked']),
      playable: mine.filter((cell) => cell.src).length,
    };
  });

  return {
    generatedAt: extras.generatedAt || new Date().toISOString(),
    runId: extras.runId || keyed[0]?.runId || '',
    label: extras.label || '',
    harness: extras.harness || '',
    adapter: extras.adapter || '',
    models,
    experiments,
    promptRevisions,
    dates,
    runs: [...runMap.values()],
    cells: keyed.map((cell) => {
      const next = { ...cell };
      delete next.prompt;
      delete next.receipt;
      return next;
    }),
    staffPicks: staffPicksFromCells(keyed),
  };
}
