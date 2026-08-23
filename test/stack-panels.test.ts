import { describe, expect, it } from 'vite-plus/test';
import {
  nextPanelKeys,
  receiptBindKey,
  shouldReuseSource,
  stackHeading,
} from '../scripts/stack-panels.mjs';

describe('stackHeading', () => {
  it('keeps HTML and Receipt titles stable for scramble prefixes', () => {
    expect(stackHeading('html', 'grok-4.6 A')).toBe('HTML · grok-4.6 A');
    expect(stackHeading('receipt', 'grok-4.6 A')).toBe('Receipt · grok-4.6 A');
  });
});

describe('nextPanelKeys', () => {
  it('reuses the same key instead of treating a reorder as a remount', () => {
    expect(nextPanelKeys(['a::A', 'b::A'], ['b::A', 'a::A'])).toEqual({
      remove: [],
      add: [],
      order: ['b::A', 'a::A'],
    });
  });

  it('adds and drops only the keys that changed', () => {
    expect(nextPanelKeys(['a::A'], ['a::A', 'b::A'])).toEqual({
      remove: [],
      add: ['b::A'],
      order: ['a::A', 'b::A'],
    });
    expect(nextPanelKeys(['a::A', 'b::A'], ['b::A'])).toEqual({
      remove: ['a::A'],
      add: [],
      order: ['b::A'],
    });
  });
});

describe('shouldReuseSource', () => {
  it('skips a second highlight when the same src is already ready', () => {
    expect(shouldReuseSource('take/index.html', '1', 'take/index.html')).toBe(true);
    expect(shouldReuseSource('take/index.html', '0', 'take/index.html')).toBe(false);
    expect(shouldReuseSource('take/index.html', '1', 'other/index.html')).toBe(false);
  });
});

describe('receiptBindKey', () => {
  it('changes when the cell receipt changes', () => {
    const a = receiptBindKey(
      { receipt: { status: 'complete', completedAt: 't1', durationMs: 10, effectiveModel: 'g', requestedModel: 'g' } },
      'grok-4.6 A',
    );
    const b = receiptBindKey(
      { receipt: { status: 'complete', completedAt: 't2', durationMs: 10, effectiveModel: 'g', requestedModel: 'g' } },
      'grok-4.6 A',
    );
    expect(a).not.toBe(b);
    expect(receiptBindKey(null, 'grok-4.6 A')).toBe('');
  });
});
