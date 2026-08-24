import { parsePromptVersion, promptVersion, slug } from './layout.mjs';

export { parsePromptVersion, promptVersion };

export function attemptFromDateFolder(date) {
  const match = String(date || '').match(/-a(\d+)$/);
  return match ? Number(match[1]) : 1;
}

/**
 * @param {{ benchmarkId?: string, promptLevel?: string, model?: string, attempt?: number }} [opts]
 */
export function cellId({ benchmarkId, promptLevel, model, attempt = 1 } = {}) {
  const n = Math.max(1, Number(attempt) || 1);
  return `${benchmarkId}--${String(promptLevel).trim().toLowerCase()}--${slug(model)}--a${String(n).padStart(2, '0')}`;
}
