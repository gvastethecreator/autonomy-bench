const MODES = ['single', 'models', 'ladder', 'table'];

function asSearch(search) {
  if (search instanceof URLSearchParams) return search;
  return new URLSearchParams(search == null ? '' : String(search));
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
    mode: MODES.includes(modeRaw) ? modeRaw : 'single',
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
  };
}

export function writeQuery(state, { filmDefault = false } = {}) {
  const params = new URLSearchParams();
  if (state.experiment) params.set('experiment', state.experiment);
  if (state.level) params.set('level', state.level);
  if (state.model) params.set('model', state.model);
  if (state.mode && state.mode !== 'single') params.set('mode', state.mode);
  if (state.mode !== 'single') params.set('arrange', state.arrange || '');
  if (state.scale) params.set('scale', state.scale);
  if (state.promptRevision) params.set('prompt', String(state.promptRevision));
  if (state.month) params.set('month', state.month);
  if (state.date) params.set('date', state.date);
  if (state.mode === 'models' && state.hiddenModels && state.hiddenModels.size) {
    params.set('hide', [...state.hiddenModels].join(','));
  }
  if (state.filmCompact !== filmDefault) {
    params.set('film', state.filmCompact ? 'compact' : 'open');
  }
  return params.toString();
}
