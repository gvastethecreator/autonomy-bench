const MODES = ['single', 'models', 'ladder', 'table', 'compare', 'landing', 'ranking', 'charts'];
// The gallery boots on the landing view; a query without `mode` means landing.
const DEFAULT_MODE = 'landing';
// Modes that never carry layout chrome in a shareable query.
const CHROME_LESS = new Set(['single', 'landing', 'ranking', 'charts']);

function asSearch(search) {
  if (search instanceof URLSearchParams) return search;
  return new URLSearchParams(search == null ? '' : String(search));
}

function parseCompareSlots(raw) {
  return String(raw || '')
    .split(',')
    .map((part) => {
      const [model, experiment, level] = part.split('~').map((s) => s.trim());
      if (!model) return null;
      return { model, experiment: experiment || '', level: (level || 'A').toUpperCase() };
    })
    .filter(Boolean)
    .slice(0, 3);
}

export function readQuery(search, { filmDefault = false } = {}) {
  const q = asSearch(search);
  const modeRaw = q.get('mode') || '';
  const filmQ = (q.get('film') || '').toLowerCase();
  let filmCompact = filmDefault;
  if (filmQ === 'compact') filmCompact = true;
  else if (filmQ === 'open') filmCompact = false;
  return {
    experiment: q.get('experiment') || '',
    model: q.get('model') || '',
    level: (q.get('level') || 'A').toUpperCase(),
    mode: MODES.includes(modeRaw) ? modeRaw : DEFAULT_MODE,
    arrange: q.get('arrange') || '',
    scale: q.get('scale') || '',
    promptRevision: Number(q.get('prompt') || 0) || 0,
    date: q.get('date') || '',
    month: q.get('month') || '',
    filmCompact,
    hiddenModels: new Set(
      String(q.get('hide') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
    compareSlots: parseCompareSlots(q.get('slots')),
  };
}

export function writeQuery(state, { filmDefault = false } = {}) {
  const params = new URLSearchParams();
  if (state.experiment) params.set('experiment', state.experiment);
  if (state.level) params.set('level', state.level);
  if (state.model) params.set('model', state.model);
  if (state.mode && state.mode !== DEFAULT_MODE) params.set('mode', state.mode);
  if (!CHROME_LESS.has(state.mode)) params.set('arrange', state.arrange || '');
  if (state.scale) params.set('scale', state.scale);
  if (state.promptRevision) params.set('prompt', String(state.promptRevision));
  if (state.month) params.set('month', state.month);
  if (state.date) params.set('date', state.date);
  if (state.mode === 'models' && state.hiddenModels && state.hiddenModels.size) {
    params.set('hide', [...state.hiddenModels].join(','));
  }
  if (state.mode === 'compare' && Array.isArray(state.compareSlots) && state.compareSlots.length) {
    params.set(
      'slots',
      state.compareSlots
        .map((slot) => [slot.model, slot.experiment || '', slot.level || 'A'].join('~'))
        .join(','),
    );
  }
  if (state.filmCompact !== filmDefault) {
    params.set('film', state.filmCompact ? 'compact' : 'open');
  }
  return params.toString();
}
