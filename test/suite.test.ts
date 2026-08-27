import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { doctorSuite, loadSuite } from '../scripts/suite.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const suite = loadSuite(join(root, 'suites', 'browser-autonomy', 'suite.json'));
if (!suite) throw new Error('missing live suite');

const SHELVED_V2_IDS = [
  'solar-system',
  'procedural-city',
  'endless-driving',
  'cloth-simulation',
  'fluid-simulation',
  'ecosystem',
  'traffic-simulation',
  'music-player',
  'node-editor',
  'image-editor',
  'music-sequencer',
  'shader-playground',
  'asteroids',
  'tower-defense',
  'dungeon-crawler',
  'physics-sandbox',
  'system-dashboard',
  'network-visualization',
  'warehouse',
  'elevator',
  'airport',
  'crowd-evacuation',
  'automated-factory',
  'clock',
  'loading-screen',
  'satisfying-button',
  'cursor-experiment',
  'interactive-404',
  'medieval-city',
  'infinite-maze',
  'procedural-biped',
];

function wordCount(value: string) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

describe('browser-autonomy suite', () => {
  it('has unique ids and a complete frozen A/B/C ladder', () => {
    expect(doctorSuite(suite)).toEqual([]);
    const ids = new Set<string>();
    expect(suite.id).toBe('browser-autonomy-v2');
    expect(suite.version).toBe('2.1.0');
    expect(suite.promptLevels.A.name).toBe('Raw');
    expect(suite.promptLevels.B.name).toBe('Autonomous');
    expect(suite.promptLevels.C.name).toBe('Showcase');

    for (const benchmark of suite.benchmarks) {
      expect(ids.has(benchmark.id)).toBe(false);
      ids.add(benchmark.id);
      expect(String(benchmark.prompts?.A || '').trim().length).toBeGreaterThan(0);
      expect(String(benchmark.prompts?.B || '').trim().length).toBeGreaterThan(0);
      expect(String(benchmark.prompts?.C || '').trim().length).toBeGreaterThan(0);
    }
    expect(suite.benchmarks).toHaveLength(1);
    expect(suite.benchmarks.map((benchmark: { id: string }) => benchmark.id)).toEqual([
      'rollercoaster',
    ]);
    expect(suite.benchmarks.map((benchmark: { id: string }) => benchmark.id)).not.toContain(
      'terrain-explorer',
    );
  });

  it('reports duplicate ids through doctorSuite', () => {
    expect(
      doctorSuite({
        promptLevels: { A: { name: 'Raw' } },
        benchmarks: [
          { id: 'rollercoaster', prompts: { A: 'one' } },
          { id: 'rollercoaster', prompts: { A: 'two' } },
        ],
      }),
    ).toEqual(['duplicate id rollercoaster']);
  });

  it('uses the same exact +20 / +20 suffix ladder for every live benchmark', () => {
    const autonomousSuffix = suite.promptLadder.autonomousSuffix;
    const showcaseSuffix = suite.promptLadder.showcaseSuffix;

    expect(suite.promptLadder.autonomousAdditionalWords).toBe(20);
    expect(suite.promptLadder.showcaseAdditionalWords).toBe(20);
    expect(wordCount(autonomousSuffix)).toBe(20);
    expect(wordCount(showcaseSuffix)).toBe(20);

    for (const benchmark of suite.benchmarks) {
      const { A, B, C } = benchmark.prompts;
      expect(B).toBe(`${A} ${autonomousSuffix}`);
      expect(C).toBe(`${B} ${showcaseSuffix}`);
      expect(wordCount(B) - wordCount(A)).toBe(20);
      expect(wordCount(C) - wordCount(B)).toBe(20);
    }
  });

  it('keeps Rollercoaster A byte-for-byte unchanged', () => {
    const rollercoaster = suite.benchmarks.find(
      (benchmark: { id: string }) => benchmark.id === 'rollercoaster',
    );

    expect(rollercoaster.prompts.A).toBe(
      'Create a first-person rollercoaster with continuous playback in a single HTML file using Three.js.',
    );
  });

  it('declares the expanded evaluation profile', () => {
    expect(suite.defaultEvaluationAxes).toEqual([
      'completion',
      'autonomy',
      'judgment',
      'technicalQuality',
      'uxVisualQuality',
      'showcaseQuality',
      'ambition',
      'coherence',
    ]);
  });
});

describe('shelved v2.0.0 benches', () => {
  it('keeps the frozen 31-bench set off the live suite', () => {
    const liveIds = new Set(suite.benchmarks.map((benchmark: { id: string }) => benchmark.id));
    expect(SHELVED_V2_IDS).toHaveLength(31);
    expect(SHELVED_V2_IDS).not.toContain('rollercoaster');
    expect(SHELVED_V2_IDS).not.toContain('terrain-explorer');
    for (const id of SHELVED_V2_IDS) expect(liveIds.has(id)).toBe(false);
  });
});
