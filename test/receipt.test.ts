import { describe, expect, it } from 'vite-plus/test';
import { assertReceipt, isPlayable, publishStatus, receiptTemplate } from '../scripts/receipt.mjs';

const base = receiptTemplate({
  runId: 'run-1',
  cell: {
    cellId: 'rollercoaster--a--grok-4.6--a01',
    benchmarkId: 'rollercoaster',
    promptLevel: 'A',
    attempt: 1,
    requestedModel: 'grok-4.6',
  },
  adapter: 'agent',
  harness: 'cursor',
  promptSha: 'abc',
  contributor: { github: 'gvastethecreator', avatarUrl: 'https://github.com/gvastethecreator.png' },
});

describe('receiptTemplate', () => {
  it('uses not captured for time and token fields', () => {
    expect(base.tokenUsage).toBe('not captured');
    expect(base.startedAt).toBe('not captured');
    expect(base.isolation.capability).toBe('fresh-context-no-sibling-outputs');
  });
});

describe('assertReceipt', () => {
  it('accepts a complete template', () => {
    expect(assertReceipt(base).runId).toBe('run-1');
  });

  it('throws on missing runId', () => {
    expect(() => assertReceipt({ ...base, runId: '' })).toThrow('Receipt is missing runId');
  });

  it('throws on status pending', () => {
    expect(() => assertReceipt({ ...base, status: 'pending' })).toThrow(
      'Receipt status is not terminal: pending',
    );
  });
});

describe('publishStatus', () => {
  it('marks html without a receipt as pending', () => {
    expect(publishStatus(null, true)).toBe('pending');
  });

  it('marks a missing pair as missing', () => {
    expect(publishStatus(null, false)).toBe('missing');
  });
});

describe('isPlayable', () => {
  it('allows complete and pending html', () => {
    expect(isPlayable(true, 'complete')).toBe(true);
    expect(isPlayable(true, 'pending')).toBe(true);
    expect(isPlayable(false, 'complete')).toBe(false);
    expect(isPlayable(true, 'failed')).toBe(false);
  });
});
