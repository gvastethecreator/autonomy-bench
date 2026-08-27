import { describe, expect, it } from 'vite-plus/test';
import {
  IFRAME_LIVE_BUDGET,
  IFRAME_STAGGER_GAP_MS,
  iframeLoadJobs,
  isHotIframeSrc,
  loadIframesStaggered,
  loaderIdentity,
  loaderProgressLabel,
  pickLiveIframes,
  waitIframeSettled,
} from '../scripts/iframe-queue.mjs';

describe('loaderProgressLabel', () => {
  it('keeps the experiment name for a single take', () => {
    expect(loaderProgressLabel(1, 1, 'Medieval City')).toBe('Medieval City');
    expect(loaderProgressLabel(1, 0, 'Loading')).toBe('Loading');
  });

  it('counts through a multi-take queue', () => {
    expect(loaderProgressLabel(1, 8, 'Medieval City')).toBe('1 / 8');
    expect(loaderProgressLabel(8, 8, 'Medieval City')).toBe('8 / 8');
  });
});

describe('loaderIdentity', () => {
  it('puts the prompt level beside the bench and the model underneath', () => {
    expect(loaderIdentity({ title: 'Rollercoaster', level: 'A', model: 'grok-4.6' })).toEqual({
      headline: 'Rollercoaster A',
      model: 'grok-4.6',
    });
  });

  it('falls back to Loading when the bench is missing', () => {
    expect(loaderIdentity({ level: 'B' })).toEqual({ headline: 'Loading B', model: '' });
    expect(loaderIdentity({})).toEqual({ headline: 'Loading', model: '' });
  });
});

describe('isHotIframeSrc', () => {
  it('treats about:blank as parked', () => {
    expect(isHotIframeSrc('about:blank')).toBe(false);
    expect(isHotIframeSrc('glm-5.3-max/rollercoaster-A/2026-08-23-191030/index.html')).toBe(true);
    expect(isHotIframeSrc('')).toBe(false);
  });
});

describe('pickLiveIframes', () => {
  it('keeps the first budget slots in DOM order before anyone is visible', () => {
    const items = Array.from({ length: 12 }, () => ({
      visible: false,
      ratio: 0,
      live: false,
      pin: 0,
    }));
    expect(pickLiveIframes(items, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(IFRAME_LIVE_BUDGET).toBe(8);
  });

  it('prefers intersecting frames over older live ones', () => {
    const items = [
      { visible: false, ratio: 0, live: true, pin: 0 },
      { visible: false, ratio: 0, live: true, pin: 0 },
      { visible: true, ratio: 0.8, live: false, pin: 0 },
      { visible: true, ratio: 0.4, live: false, pin: 0 },
    ];
    expect(pickLiveIframes(items, 2)).toEqual([2, 3]);
  });

  it('keeps already-live frames when visibility is tied', () => {
    const items = [
      { visible: true, ratio: 1, live: true, pin: 0 },
      { visible: true, ratio: 1, live: false, pin: 0 },
      { visible: true, ratio: 1, live: true, pin: 0 },
    ];
    expect(pickLiveIframes(items, 2)).toEqual([0, 2]);
  });

  it('lets a clicked take jump the queue', () => {
    const items = [
      { visible: true, ratio: 1, live: true, pin: 0 },
      { visible: true, ratio: 1, live: true, pin: 0 },
      { visible: true, ratio: 1, live: false, pin: 9 },
    ];
    expect(pickLiveIframes(items, 2)).toEqual([2, 0]);
  });
});

describe('iframeLoadJobs', () => {
  it('selects iframes that still have a data-src', () => {
    const root = {
      querySelectorAll(sel: string) {
        expect(sel).toBe('iframe[data-src]');
        return [{ id: 'a' }, { id: 'b' }];
      },
    };
    expect(iframeLoadJobs(root).map((el) => el.id)).toEqual(['a', 'b']);
  });
});

describe('loadIframesStaggered', () => {
  it('loads one iframe at a time', async () => {
    let active = 0;
    let max = 0;
    const order: number[] = [];
    await loadIframesStaggered([1, 2, 3], {
      loadOne: async (id: number) => {
        active += 1;
        max = Math.max(max, active);
        order.push(id);
        await Promise.resolve();
        active -= 1;
      },
      waitGap: async () => {},
    });
    expect(order).toEqual([1, 2, 3]);
    expect(max).toBe(1);
  });

  it('waits the stagger gap between loads, not after the last', async () => {
    const gaps: number[] = [];
    await loadIframesStaggered(['a', 'b', 'c'], {
      loadOne: async () => {},
      waitGap: async (ms: number) => {
        gaps.push(ms);
      },
      gapMs: 50,
    });
    expect(gaps).toEqual([50, 50]);
  });

  it('uses the default gap when none is passed', async () => {
    const gaps: number[] = [];
    await loadIframesStaggered([1, 2], {
      loadOne: async () => {},
      waitGap: async (ms: number) => {
        gaps.push(ms);
      },
    });
    expect(gaps).toEqual([IFRAME_STAGGER_GAP_MS]);
  });

  it('stops assigning src when the stage token is stale', async () => {
    const loaded: number[] = [];
    let current = true;
    const result = await loadIframesStaggered([1, 2, 3], {
      isCurrent: () => current,
      loadOne: async (id: number) => {
        loaded.push(id);
        if (id === 1) current = false;
      },
      waitGap: async () => {},
    });
    expect(loaded).toEqual([1]);
    expect(result).toEqual({ loaded: 1, aborted: true, total: 3 });
  });

  it('returns an empty result when there is nothing to load', async () => {
    const result = await loadIframesStaggered([], {
      loadOne: async () => {
        throw new Error('should not load');
      },
    });
    expect(result).toEqual({ loaded: 0, aborted: false, total: 0 });
  });
});

function fakeIframe(dataSrc: string | null) {
  const listeners: Record<string, () => void> = {};
  const attrs: Record<string, string> = {};
  if (dataSrc) attrs['data-src'] = dataSrc;
  return {
    src: '',
    getAttribute(name: string) {
      return attrs[name] || '';
    },
    setAttribute(name: string, value: string) {
      attrs[name] = value;
    },
    removeAttribute(name: string) {
      delete attrs[name];
    },
    addEventListener(name: string, fn: () => void) {
      listeners[name] = fn;
    },
    removeEventListener(name: string) {
      delete listeners[name];
    },
    emit(name: string) {
      if (listeners[name]) listeners[name]();
    },
  };
}

describe('waitIframeSettled', () => {
  it('skips when data-src is missing', async () => {
    expect(await waitIframeSettled(fakeIframe(null))).toBe('skip');
  });

  it('returns load when the iframe fires load', async () => {
    const iframe = fakeIframe('take/index.html');
    const pending = waitIframeSettled(iframe, { timeoutMs: 200 });
    iframe.emit('load');
    expect(await pending).toBe('load');
    expect(iframe.src).toBe('take/index.html');
    expect(iframe.getAttribute('data-src')).toBe('');
  });

  it('returns timeout when load never fires', async () => {
    const iframe = fakeIframe('take/index.html');
    expect(await waitIframeSettled(iframe, { timeoutMs: 15 })).toBe('timeout');
  });

  it('returns aborted when isCurrent is false', async () => {
    const iframe = fakeIframe('take/index.html');
    expect(await waitIframeSettled(iframe, { isCurrent: () => false, timeoutMs: 200 })).toBe(
      'aborted',
    );
  });
});
