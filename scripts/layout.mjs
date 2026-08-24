import { pickCellForMonth } from './run-month.mjs';
import { staffPicksFromCells } from './staff-picks.mjs';

export function slug(value) {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'unknown'
  );
}

export function promptVersion(benchmarkId, promptLevel) {
  return `${slug(benchmarkId)}-${String(promptLevel).trim().toUpperCase()}`;
}

export function parsePromptVersion(folder) {
  const value = String(folder || '').trim();
  const idx = value.lastIndexOf('-');
  if (idx <= 0) return { benchmarkId: slug(value), promptLevel: '' };
  const promptLevel = value.slice(idx + 1).toUpperCase();
  if (!/^[ABC]$/.test(promptLevel)) return { benchmarkId: slug(value), promptLevel: '' };
  return { benchmarkId: value.slice(0, idx), promptLevel };
}

export function runTimeFromRunId(runId) {
  const match = String(runId || '').match(/^\d{8}-(\d{6})(?:-|$)/);
  return match ? match[1] : '';
}

/**
 * @typedef {object} DateFolderInput
 * @property {string} [date]
 * @property {string} [runId]
 * @property {number} [attempt]
 *
 * @typedef {object} CellLayoutInput
 * @property {string} [model]
 * @property {string} [benchmarkId]
 * @property {string} [promptLevel]
 * @property {string} [date]
 * @property {string} [runId]
 * @property {number} [attempt]
 */

/** @param {DateFolderInput} [opts] */
export function galleryDateFolder({ date, runId, attempt = 1 } = {}) {
  const day = String(date || '').slice(0, 10);
  const time = runTimeFromRunId(runId);
  let stamp = time ? `${day}-${time}` : day;
  if (!stamp) stamp = 'undated';
  if (Number(attempt) > 1) stamp += `-a${String(attempt).padStart(2, '0')}`;
  return stamp;
}

export function formatDateStamp(stamp) {
  const full = String(stamp || '').match(/^(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})(\d{2})(?:-a(\d+))?$/);
  if (!full) return String(stamp || '');
  let out = `${full[1]} ${full[2]}:${full[3]}`;
  if (full[5]) out += ` a${full[5]}`;
  return out;
}

/** Newest first. */
export function compareDateStamp(a, b) {
  return String(b || '').localeCompare(String(a || ''));
}

/** @param {CellLayoutInput} [opts] */
export function cellRelPath({ model, benchmarkId, promptLevel, attempt = 1 } = {}) {
  const base = `cells/${slug(model)}/${promptVersion(benchmarkId, promptLevel)}`;
  if (Number(attempt) > 1) return `${base}/a${String(attempt).padStart(2, '0')}`;
  return base;
}

/** @param {CellLayoutInput} [opts] */
export function galleryRelPath({ model, benchmarkId, promptLevel, date, runId, attempt = 1 } = {}) {
  return `${slug(model)}/${promptVersion(benchmarkId, promptLevel)}/${galleryDateFolder({ date, runId, attempt })}`;
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
  const dates = [...new Set(revised.map((cell) => cell.date).filter(Boolean))].sort(
    compareDateStamp,
  );
  const runMap = new Map();
  for (const cell of revised) {
    const runId = cell.runId || cell.receipt?.runId;
    if (!runId || runMap.has(runId)) continue;
    runMap.set(runId, {
      runId,
      date: cell.date || '',
      harness: cell.receipt?.harness || extras.harness || '',
      adapter: cell.receipt?.adapter || extras.adapter || '',
      label: extras.label || '',
    });
  }
  const experimentIds = [];
  const seenExp = new Set();
  for (const cell of revised) {
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
  const titles = new Map(revised.map((cell) => [cell.experiment, cell.title || cell.experiment]));
  const experiments = experimentIds.map((id) => ({ id, title: titles.get(id) || id }));

  const modelIds = [];
  const seenModel = new Set();
  for (const cell of revised) {
    if (seenModel.has(cell.model)) continue;
    seenModel.add(cell.model);
    modelIds.push(cell.model);
  }
  modelIds.sort((a, b) => a.localeCompare(b));
  const models = modelIds.map((id) => {
    const mine = revised.filter((cell) => cell.model === id);
    return {
      id,
      complete: countBy(mine, ['complete', 'complete']),
      unavailable: countBy(mine, ['unavailable']),
      pending: countBy(mine, ['pending', 'missing']),
      failed: countBy(mine, ['failed', 'blocked']),
      playable: mine.filter((cell) => cell.src).length,
    };
  });

  return {
    generatedAt: extras.generatedAt || new Date().toISOString(),
    runId: extras.runId || revised[0]?.runId || '',
    label: extras.label || '',
    harness: extras.harness || '',
    adapter: extras.adapter || '',
    models,
    experiments,
    promptRevisions,
    dates,
    runs: [...runMap.values()],
    cells: revised,
    staffPicks: staffPicksFromCells(revised),
  };
}
