import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { readQuery, writeQuery } from '../scripts/gallery-query.mjs';

const FROZEN = [
  'experiment',
  'level',
  'model',
  'mode',
  'arrange',
  'scale',
  'prompt',
  'month',
  'date',
  'film',
  'hide',
];

describe('gallery query', () => {
  it('round-trips frozen keys', () => {
    const state = {
      experiment: 'rollercoaster',
      level: 'B',
      model: 'grok-4.6',
      mode: 'models',
      arrange: 'grid',
      scale: 'fit',
      promptRevision: 2,
      month: '2026-08',
      date: '2026-08-24-010000',
      filmCompact: true,
      hiddenModels: new Set(['composer-2.5']),
    };
    const qs = writeQuery(state, { filmDefault: false });
    const keys = [...new URLSearchParams(qs).keys()].sort();
    expect(keys).toEqual([...FROZEN].sort());
    const read = readQuery(qs, { filmDefault: false });
    expect(read.experiment).toBe('rollercoaster');
    expect(read.level).toBe('B');
    expect(read.model).toBe('grok-4.6');
    expect(read.mode).toBe('models');
    expect(read.arrange).toBe('grid');
    expect(read.scale).toBe('fit');
    expect(read.promptRevision).toBe(2);
    expect(read.month).toBe('2026-08');
    expect(read.date).toBe('2026-08-24-010000');
    expect(read.filmCompact).toBe(true);
    expect([...read.hiddenModels]).toEqual(['composer-2.5']);
  });

  it('defaults level to A and mode to single', () => {
    const read = readQuery('', { filmDefault: false });
    expect(read.level).toBe('A');
    expect(read.mode).toBe('single');
    expect(read.filmCompact).toBe(false);
  });

  it('does not leave a bare q.get in the viewer template', () => {
    const html = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'gallery-viewer.html'),
      'utf8',
    );
    expect(html.includes('q.get(')).toBe(false);
    expect(html).toContain('readQuery');
    expect(html).toContain('writeQuery');
    expect(html).toContain('href="llms.txt"');
    expect(html).toContain('href="agent.json"');
    expect(html).toContain('rel="alternate"');
    expect(html.includes('>Agent pack<')).toBe(false);
    expect(html).toContain('registerGalleryWebMcp');
  });
});
