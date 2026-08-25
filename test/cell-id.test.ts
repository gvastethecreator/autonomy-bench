import { describe, expect, it } from 'vite-plus/test';
import { attemptFromDateFolder, cellId } from '../scripts/cell-id.mjs';

describe('cell identity', () => {
  it('builds cellId with slugged model and padded attempt', () => {
    expect(
      cellId({
        benchmarkId: 'endless-driving',
        promptLevel: 'A',
        model: 'Grok 4.6',
        attempt: 1,
      }),
    ).toBe('endless-driving--a--grok-4.6--a01');
  });

  it('reads attempt from a date folder suffix', () => {
    expect(attemptFromDateFolder('2026-08-21-021413-a02')).toBe(2);
    expect(attemptFromDateFolder('2026-08-21-021413')).toBe(1);
  });
});
