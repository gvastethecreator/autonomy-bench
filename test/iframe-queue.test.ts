import { describe, expect, it } from 'vite-plus/test';
import {
  IFRAME_STAGGER_GAP_MS,
  iframeLoadJobs,
  loadIframesStaggered,
  loaderIdentity,
  loaderProgressLabel,
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

describe('iframeLoadJobs', () => {
  it('selects iframes that still have a data-src', () => {
    const root = {
      querySelectorAll(sel) {
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
    const order = [];
    await loadIframesStaggered([1, 2, 3], {
      loadOne: async (id) => {
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
    const gaps = [];
    await loadIframesStaggered(['a', 'b', 'c'], {
      loadOne: async () => {},
      waitGap: async (ms) => {
        gaps.push(ms);
      },
      gapMs: 50,
    });
    expect(gaps).toEqual([50, 50]);
  });

  it('uses the default gap when none is passed', async () => {
    const gaps = [];
    await loadIframesStaggered([1, 2], {
      loadOne: async () => {},
      waitGap: async (ms) => {
        gaps.push(ms);
      },
    });
    expect(gaps).toEqual([IFRAME_STAGGER_GAP_MS]);
  });

  it('stops assigning src when the stage token is stale', async () => {
    const loaded = [];
    let current = true;
    const result = await loadIframesStaggered([1, 2, 3], {
      isCurrent: () => current,
      loadOne: async (id) => {
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
