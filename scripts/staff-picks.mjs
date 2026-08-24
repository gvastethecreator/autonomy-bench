function pickKey(experiment, level) {
  return `${String(experiment || '').trim()}-${String(level || '')
    .trim()
    .toUpperCase()}`;
}

/** Preferred model when several takes exist. Rollercoaster A stays on grok-4.6. */
export const STAFF_PICK_OVERRIDE = {
  'rollercoaster-A': 'grok-4.6',
};

const PREFERRED_A = [
  'grok-4.6',
  'grok-4.6-xhigh',
  'grok-4.5-high',
  'grok-4.5',
  'gemini-3.7-flash',
  'glm-5.3-max',
  'composer-2.5',
  'hy3',
  'deepseek-v4-flash-high',
];

const PREFERRED_BC = [
  'grok-4.6-high',
  'grok-4.5-high',
  'grok-4.6-xhigh',
  'grok-4.6',
  'gemini-3.7-flash',
  'glm-5.3-max',
  'composer-2.5',
  'hy3',
  'deepseek-v4-flash-high',
];

export function preferredModels(level) {
  return String(level || '').toUpperCase() === 'A' ? PREFERRED_A : PREFERRED_BC;
}

export function staffPickModel(experiment, level, playableIds) {
  const ids = [...new Set((playableIds || []).filter(Boolean))];
  if (!ids.length) return '';
  const key = pickKey(experiment, level);
  const forced = STAFF_PICK_OVERRIDE[key];
  if (forced && ids.includes(forced)) return forced;
  for (const id of preferredModels(level)) {
    if (ids.includes(id)) return id;
  }
  return ids[0];
}

export function staffPicksFromCells(cells) {
  const groups = new Map();
  for (const cell of cells || []) {
    if (!cell || !cell.src || !cell.experiment || !cell.level) continue;
    const key = pickKey(cell.experiment, cell.level);
    if (!groups.has(key))
      groups.set(key, { experiment: cell.experiment, level: cell.level, ids: [] });
    const model = cell.modelKey || cell.model;
    if (model && !groups.get(key).ids.includes(model)) groups.get(key).ids.push(model);
  }
  const picks = {};
  for (const [key, group] of groups) {
    const model = staffPickModel(group.experiment, group.level, group.ids);
    if (model) picks[key] = model;
  }
  return picks;
}
