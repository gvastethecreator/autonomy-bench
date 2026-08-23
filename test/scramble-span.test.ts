import { describe, expect, it } from 'vite-plus/test';
import { canScrambleText, splitChangedText } from '../scripts/scramble-span.mjs';

describe('splitChangedText', () => {
  it('keeps a shared suffix so only the experiment name scrambles', () => {
    expect(splitChangedText('Rollercoaster Bench', 'Medieval City Bench')).toEqual({
      prefix: '',
      fromMid: 'Rollercoaster',
      toMid: 'Medieval City',
      suffix: ' Bench',
    });
  });

  it('keeps a shared prefix on short labels', () => {
    expect(splitChangedText('Copy', 'Copied')).toEqual({
      prefix: 'Cop',
      fromMid: 'y',
      toMid: 'ied',
      suffix: '',
    });
  });

  it('scrambles the whole string when nothing stable is long enough', () => {
    expect(splitChangedText('Compact', 'Expand')).toEqual({
      prefix: '',
      fromMid: 'Compact',
      toMid: 'Expand',
      suffix: '',
    });
  });

  it('returns empty mids when the text did not change', () => {
    expect(splitChangedText('Autonomy Bench', 'Autonomy Bench')).toEqual({
      prefix: 'Autonomy Bench',
      fromMid: '',
      toMid: '',
      suffix: '',
    });
  });
});

describe('canScrambleText', () => {
  it('rejects empty or HTML-significant text', () => {
    expect(canScrambleText('')).toBe(false);
    expect(canScrambleText('a < b')).toBe(false);
    expect(canScrambleText('Rollercoaster Bench')).toBe(true);
  });
});
