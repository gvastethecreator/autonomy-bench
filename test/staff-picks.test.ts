import { describe, expect, it } from 'vite-plus/test';
import { staffPickModel, staffPicksFromCells } from '../scripts/staff-picks.mjs';

describe('staffPickModel', () => {
  it('forces rollercoaster A onto grok-4.6 when that take exists', () => {
    expect(staffPickModel('rollercoaster', 'A', ['grok-4.6-xhigh', 'grok-4.6', 'composer-2.5'])).toBe(
      'grok-4.6',
    );
  });

  it('prefers grok-4.6-high on B and C', () => {
    expect(staffPickModel('solar-system', 'B', ['composer-2.5', 'grok-4.6-high', 'grok-4.5-high'])).toBe(
      'grok-4.6-high',
    );
    expect(staffPickModel('solar-system', 'C', ['grok-4.5-high', 'glm-5.3-max'])).toBe('grok-4.5-high');
  });

  it('returns empty when nothing is playable', () => {
    expect(staffPickModel('clock', 'A', [])).toBe('');
  });
});

describe('staffPicksFromCells', () => {
  it('picks one model per experiment-level that has a playable src', () => {
    const picks = staffPicksFromCells([
      { experiment: 'rollercoaster', level: 'A', model: 'grok-4.6-xhigh', src: 'a.html' },
      { experiment: 'rollercoaster', level: 'A', model: 'grok-4.6', src: 'b.html' },
      { experiment: 'clock', level: 'B', model: 'composer-2.5', src: null },
      { experiment: 'clock', level: 'B', model: 'grok-4.6-high', src: 'c.html' },
    ]);
    expect(picks['rollercoaster-A']).toBe('grok-4.6');
    expect(picks['clock-B']).toBe('grok-4.6-high');
  });
});
