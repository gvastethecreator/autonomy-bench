import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import {
  applyModelThinking,
  catalogModelKey,
  formatTokenCount,
  formatTokenUsage,
  parseModelThinking,
  thinkingFromNames,
} from '../scripts/model-meta.mjs';

describe('parseModelThinking', () => {
  it('reads thinking from Cursor effective ids', () => {
    expect(parseModelThinking('cursor-grok-4.6-high')).toEqual({
      base: 'grok-4.6',
      thinking: 'high',
    });
    expect(parseModelThinking('cursor-grok-4.5-high-fast')).toEqual({
      base: 'grok-4.5',
      thinking: 'high-fast',
    });
    expect(parseModelThinking('composer-2.5-fast')).toEqual({
      base: 'composer-2.5',
      thinking: 'fast',
    });
  });

  it('reads thinking already in the requested id', () => {
    expect(parseModelThinking('gpt-5.6-luna-max')).toEqual({
      base: 'gpt-5.6-luna',
      thinking: 'max',
    });
    expect(parseModelThinking('gpt-5.6-sol-high')).toEqual({
      base: 'gpt-5.6-sol',
      thinking: 'high',
    });
    expect(parseModelThinking('kimi-k3-max')).toEqual({
      base: 'kimi-k3',
      thinking: 'max',
    });
  });

  it('does not treat gemini flash as a thinking level', () => {
    expect(parseModelThinking('gemini-3.7-flash')).toEqual({
      base: 'gemini-3.7-flash',
      thinking: '',
    });
  });
});

describe('catalogModelKey', () => {
  it('keeps ids that already encode thinking', () => {
    expect(catalogModelKey('gpt-5.6-luna-max', 'max')).toBe('gpt-5.6-luna-max');
  });

  it('appends thinking when the requested id does not include it', () => {
    expect(catalogModelKey('grok-4.6', 'high')).toBe('grok-4.6-high');
    expect(catalogModelKey('composer-2.5', 'fast')).toBe('composer-2.5-fast');
  });
});

describe('applyModelThinking', () => {
  it('splits one requested model with two thinking levels into two keys', () => {
    const cells = applyModelThinking([
      {
        model: 'grok-4.6',
        receipt: { requestedModel: 'grok-4.6', effectiveModel: 'cursor-grok-4.6-high' },
      },
      {
        model: 'grok-4.6',
        receipt: { requestedModel: 'grok-4.6', effectiveModel: 'cursor-grok-4.6-low' },
      },
    ]);
    expect(
      cells.map((cell: { thinking: string; modelKey: string }) => [cell.thinking, cell.modelKey]),
    ).toEqual([
      ['high', 'grok-4.6-high'],
      ['low', 'grok-4.6-low'],
    ]);
  });

  it('fills uncaptured cells when the rest of the model used one thinking level', () => {
    const cells = applyModelThinking([
      {
        model: 'grok-4.6',
        receipt: { requestedModel: 'grok-4.6', effectiveModel: 'cursor-grok-4.6-high' },
      },
      {
        model: 'grok-4.6',
        receipt: { requestedModel: 'grok-4.6', effectiveModel: 'not captured' },
      },
    ]);
    expect(cells[1].thinking).toBe('high');
    expect(cells[1].modelKey).toBe('grok-4.6-high');
  });
});

describe('thinkingFromNames', () => {
  it('prefers the effective model over the requested id', () => {
    expect(thinkingFromNames('grok-4.6', 'cursor-grok-4.6-high', 'not captured')).toBe('high');
  });
});

describe('formatTokenCount', () => {
  it('formats 10500 as 11k', () => {
    expect(formatTokenCount(10500)).toBe('11k');
  });

  it('is the only compact count formatter in the viewer template', () => {
    const html = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'gallery-viewer.html'),
      'utf8',
    );
    expect(html).toContain('formatTokenCount');
    expect(html.includes('function fmtCount')).toBe(false);
  });
});

describe('formatTokenUsage', () => {
  it('returns empty when usage was not captured', () => {
    expect(formatTokenUsage('not captured')).toBe('');
    expect(formatTokenUsage(null)).toBe('');
  });

  it('formats input, output, and total', () => {
    expect(
      formatTokenUsage({
        input: 1200,
        output: 800,
        total: 2000,
      }),
    ).toBe('2k (1.2k in · 800 out)');
  });
});
