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

  it('defaults level to A and mode to landing', () => {
    const read = readQuery('', { filmDefault: false });
    expect(read.level).toBe('A');
    expect(read.mode).toBe('landing');
    expect(read.filmCompact).toBe(false);
    expect(read.compareSlots).toEqual([]);
  });

  it('drops the mode key for the default landing view', () => {
    const qs = writeQuery(
      {
        mode: 'landing',
        experiment: 'rollercoaster',
        level: 'A',
        arrange: 'columns',
        scale: 'fill',
      },
      { filmDefault: false },
    );
    expect(qs).not.toContain('mode=');
    expect(qs).not.toContain('arrange=');
    expect(readQuery(qs, { filmDefault: false }).mode).toBe('landing');
  });

  it('keeps an explicit single mode shareable', () => {
    const qs = writeQuery(
      { mode: 'single', experiment: 'rollercoaster', level: 'B', model: 'grok-4.6' },
      { filmDefault: false },
    );
    expect(qs).toContain('mode=single');
    expect(readQuery(qs, { filmDefault: false }).mode).toBe('single');
  });

  it('round-trips compare slots', () => {
    const state = {
      experiment: 'rollercoaster',
      level: 'A',
      model: 'grok-4.6',
      mode: 'compare',
      arrange: 'columns',
      scale: 'fit',
      filmCompact: false,
      compareSlots: [
        { model: 'grok-4.6', experiment: 'rollercoaster', level: 'A' },
        { model: 'glm-5.3-max', experiment: 'fireworks', level: 'C' },
        { model: 'opus-4.6', experiment: 'ant-colony', level: 'B' },
      ],
    };
    const qs = writeQuery(state, { filmDefault: false });
    expect(new URLSearchParams(qs).get('slots')).toBe(
      'grok-4.6~rollercoaster~A,glm-5.3-max~fireworks~C,opus-4.6~ant-colony~B',
    );
    const read = readQuery(qs, { filmDefault: false });
    expect(read.mode).toBe('compare');
    expect(read.compareSlots).toEqual(state.compareSlots);
  });

  it('caps parsed compare slots at three', () => {
    const read = readQuery(
      'mode=compare&slots=a~rollercoaster~A,b~rollercoaster~A,c~rollercoaster~A,d~rollercoaster~A',
      { filmDefault: false },
    );
    expect(read.compareSlots).toHaveLength(3);
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
    expect(html).toContain('new-badge');
    expect(html).toContain('isNewModel');
  });
});
