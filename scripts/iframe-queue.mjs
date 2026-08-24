export const IFRAME_LOAD_TIMEOUT_MS = 8000;
export const IFRAME_STAGGER_GAP_MS = 120;
export const IFRAME_LIVE_BUDGET = 8;
export const IFRAME_BLANK_SRC = 'about:blank';

export function isHotIframeSrc(src) {
  const value = String(src || '').trim();
  return Boolean(value) && value !== IFRAME_BLANK_SRC;
}

export function pickLiveIframes(items, budget = IFRAME_LIVE_BUDGET) {
  const cap = Math.max(0, Number(budget) || 0);
  return items
    .map((item, index) => ({
      index,
      visible: Boolean(item && item.visible),
      ratio: Number(item && item.ratio) || 0,
      live: Boolean(item && item.live),
      pin: Number(item && item.pin) || 0,
    }))
    .sort((a, b) => {
      if (a.pin !== b.pin) return b.pin - a.pin;
      if (a.visible !== b.visible) return a.visible ? -1 : 1;
      if (a.ratio !== b.ratio) return b.ratio - a.ratio;
      if (a.live !== b.live) return a.live ? -1 : 1;
      return a.index - b.index;
    })
    .slice(0, cap)
    .map((item) => item.index);
}

export function iframeLoadJobs(root) {
  return [...root.querySelectorAll('iframe[data-src]')];
}

export function loaderProgressLabel(current, total, name = 'Loading') {
  const n = Math.max(0, Number(total) || 0);
  if (n <= 1) return String(name || 'Loading');
  const i = Math.min(n, Math.max(1, Number(current) || 1));
  return i + ' / ' + n;
}

export function loaderIdentity({ title, level, model } = {}) {
  const name = String(title || '').trim() || 'Loading';
  const ver = String(level || '')
    .trim()
    .toUpperCase();
  return {
    headline: ver ? name + ' ' + ver : name,
    model: String(model || '').trim(),
  };
}

export function yieldMain(ms = IFRAME_STAGGER_GAP_MS) {
  const gap = Math.max(0, Number(ms) || 0);
  return new Promise((resolve) => {
    const rest = () => {
      if (gap) setTimeout(resolve, gap);
      else resolve();
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(rest));
    } else rest();
  });
}

export async function loadIframesStaggered(iframes, options = {}) {
  const items = [...iframes];
  const {
    isCurrent = () => true,
    loadOne,
    afterEach,
    waitGap = yieldMain,
    gapMs = IFRAME_STAGGER_GAP_MS,
  } = options;
  for (let i = 0; i < items.length; i++) {
    if (!isCurrent()) return { loaded: i, aborted: true, total: items.length };
    await loadOne(items[i], i, items.length);
    if (!isCurrent()) return { loaded: i + 1, aborted: true, total: items.length };
    if (afterEach) await afterEach(items[i], i, items.length);
    if (!isCurrent()) return { loaded: i + 1, aborted: true, total: items.length };
    if (i < items.length - 1 && gapMs > 0) await waitGap(gapMs);
  }
  return { loaded: items.length, aborted: !isCurrent(), total: items.length };
}
