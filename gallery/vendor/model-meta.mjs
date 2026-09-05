const THINKING_SUFFIXES = [
  'extra-high',
  'high-fast',
  'xhigh',
  'high',
  'medium',
  'light',
  'low',
  'max',
  'fast',
];

function normalizeModelId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^cursor-/, '');
}

export function parseModelThinking(id) {
  const raw = normalizeModelId(id);
  if (!raw || raw === 'not captured' || raw === 'not-captured') {
    return { base: '', thinking: '' };
  }
  for (const suffix of THINKING_SUFFIXES) {
    const thinking = suffix === 'light' ? 'low' : suffix;
    if (raw === suffix) return { base: '', thinking };
    if (raw.endsWith('-' + suffix)) {
      return { base: raw.slice(0, -(suffix.length + 1)), thinking };
    }
  }
  return { base: raw, thinking: '' };
}

export function thinkingFromNames(requested, effective, reasoning) {
  const fromEffective = parseModelThinking(effective).thinking;
  const fromRequested = parseModelThinking(requested).thinking;
  const reason = normalizeModelId(reasoning);
  const fromReason = parseModelThinking(reason).thinking;
  return fromEffective || fromRequested || fromReason || '';
}

export function catalogModelKey(requested, thinking) {
  const id = String(requested || '').trim() || 'unknown';
  const parsed = parseModelThinking(id);
  if (parsed.thinking) return id;
  const think = String(thinking || '')
    .trim()
    .toLowerCase();
  if (!think) return id;
  return id + '-' + think;
}

export function applyModelThinking(cells) {
  const next = cells.map((cell) => {
    const requested = cell.model || cell.receipt?.requestedModel || '';
    const thinking = thinkingFromNames(
      requested,
      cell.receipt?.effectiveModel,
      cell.receipt?.reasoning,
    );
    return { ...cell, thinking };
  });
  const groups = new Map();
  for (const cell of next) {
    const key = cell.model || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cell);
  }
  for (const group of groups.values()) {
    const captured = [...new Set(group.map((cell) => cell.thinking).filter(Boolean))];
    if (captured.length === 1) {
      for (const cell of group) {
        if (!cell.thinking) cell.thinking = captured[0];
      }
    }
  }
  for (const cell of next) {
    cell.modelKey = catalogModelKey(cell.model, cell.thinking);
  }
  return next;
}

function firstFinite(obj, keys) {
  for (const key of keys) {
    const n = Number(obj[key]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function formatTokenCount(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 10_000) return Math.round(value / 1000) + 'k';
  if (abs >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(Math.round(value));
}

export function formatTokenUsage(value) {
  if (value == null || value === '' || value === 'not captured' || value === 'not-captured') {
    return '';
  }
  if (typeof value === 'number') return formatTokenCount(value);
  if (typeof value === 'string') {
    const n = Number(value.replace(/,/g, ''));
    return Number.isFinite(n) ? formatTokenCount(n) : value;
  }
  if (typeof value !== 'object') return '';
  const input = firstFinite(value, [
    'input',
    'prompt',
    'promptTokens',
    'inputTokens',
    'input_tokens',
  ]);
  const output = firstFinite(value, [
    'output',
    'completion',
    'completionTokens',
    'outputTokens',
    'output_tokens',
  ]);
  const cache = firstFinite(value, [
    'cache',
    'cached',
    'cacheRead',
    'cachedTokens',
    'cacheReadTokens',
    'cached_input_tokens',
  ]);
  let total = firstFinite(value, ['total', 'totalTokens', 'total_tokens']);
  if (total == null && input != null && output != null) total = input + output;
  const parts = [];
  if (input != null) parts.push(formatTokenCount(input) + ' in');
  if (output != null) parts.push(formatTokenCount(output) + ' out');
  if (cache != null) parts.push(formatTokenCount(cache) + ' cache');
  if (total != null && parts.length)
    return formatTokenCount(total) + ' (' + parts.join(' · ') + ')';
  if (total != null) return formatTokenCount(total);
  return parts.join(' · ');
}
