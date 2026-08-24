import { describe, expect, it } from 'vite-plus/test';
import { approxTokensFromText, outputSizeFromHtml } from '../scripts/output-tokens.mjs';

describe('approxTokensFromText', () => {
  it('rounds UTF-16 length divided by 4', () => {
    expect(approxTokensFromText('abcd')).toBe(1);
    expect(approxTokensFromText('abcde')).toBe(1);
    expect(approxTokensFromText('abcdef')).toBe(2);
  });

  it('treats empty input as zero', () => {
    expect(approxTokensFromText('')).toBe(0);
    expect(approxTokensFromText(null)).toBe(0);
  });
});

describe('outputSizeFromHtml', () => {
  it('records chars and the chars/4 method', () => {
    expect(outputSizeFromHtml('<html></html>')).toEqual({
      outputChars: 13,
      outputTokensApprox: 3,
      outputTokensMethod: 'chars/4',
    });
  });
});
