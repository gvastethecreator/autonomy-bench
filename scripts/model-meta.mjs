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

// Public release dates, not benchmark run dates. Reasoning variants share the base release.
const MODEL_RELEASE_DATES = {
  // https://www.anthropic.com/news/models
  'claude-haiku-5-5': '2026-10-07',
  'claude-sonnet-5-5': '2026-09-28',
  'claude-opus-5-5': '2026-09-22',
  'claude-fable-5-1': '2026-09-15',
  'claude-opus-5': '2026-07-24',
  'claude-fable-5': '2026-06-09',
  'sonnet-4.6': '2026-02-17',
  'opus-4.6': '2026-02-05',
  // https://developers.openai.com/api/docs/changelog
  'gpt-6.1-sol': '2026-09-29',
  'gpt-6-sol': '2026-09-22',
  'gpt-6-luna': '2026-09-22',
  'gpt-6-astra': '2026-09-03',
  'gpt-5.6-sol': '2026-07-09',
  'gpt-5.6-terra': '2026-07-09',
  'gpt-5.6-luna': '2026-07-09',
  // https://openai.com/index/introducing-gpt-5-3-codex-spark/
  'gpt-5.3-codex-spark': '2026-02-12',
  // https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/
  'gemini-3.8-flash': '2026-09-02',
  // https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/
  'gemini-3.7-flash': '2026-08-13',
  // https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/
  'gemini-3.6-flash': '2026-07-21',
  // https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/
  'gemini-3.1-pro': '2026-02-19',
  // https://docs.x.ai/developers/release-notes
  'grok-4.7': '2026-09-21',
  // https://x.ai/news/grok-4-6
  'grok-4.6': '2026-08-12',
  // https://x.ai/news/grok-4-5
  'grok-4.5': '2026-07-16',
  // https://cursor.com/composer
  'composer-2.5': '2026-05-18',
  // https://api-docs.deepseek.com/news/news260424/
  'deepseek-v4-flash': '2026-04-24',
  // https://z.ai/blog/glm-5.3
  'glm-5.3': '2026-08-14',
  // https://forum.moonshot.ai/t/kimi-k3-is-here-our-most-capable-model/480
  'kimi-k3': '2026-07-22',
  // https://huggingface.co/Qwen/Qwen3.8-27B/blob/69b8fb76efeb85fb50c5109cfcea2f83d1e767ef/README.md
  'qwen-3.8-27b': '2026-08-14',
  // https://ai.meta.com/research/
  'muse-spark-1.3': '2026-09-02',
  'muse-spark-1.2-free': '2026-08-05',
};

export function modelReleaseDate(id) {
  return MODEL_RELEASE_DATES[parseModelThinking(id).base] || '';
}

export function compareModelReleases(a, b) {
  return modelReleaseDate(b).localeCompare(modelReleaseDate(a)) || a.localeCompare(b);
}

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
