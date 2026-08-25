import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const suite = JSON.parse(
  readFileSync(join(root, 'suites', 'browser-autonomy', 'suite.json'), 'utf8'),
);

function wordCount(value: string) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

describe('browser-autonomy suite', () => {
  it('has unique ids and a complete frozen A/B/C ladder', () => {
    const ids = new Set<string>();
    expect(suite.id).toBe('browser-autonomy-v2');
    expect(suite.version).toBe('2.0.0');
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

    expect(suite.benchmarks).toHaveLength(33);
  });

  it('uses the same exact +20 / +20 suffix ladder for every benchmark', () => {
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

  it('neutralizes unnecessary interaction and quality pressure in Raw prompts', () => {
    const forbidden =
      /\b(polished|exceptional|exceptionally|creative|playful|playable|explorable)\b/i;
    const interactiveIds = suite.benchmarks
      .filter((benchmark: { prompts: { A: string } }) =>
        /\binteractive\b/i.test(benchmark.prompts.A),
      )
      .map((benchmark: { id: string }) => benchmark.id);

    for (const benchmark of suite.benchmarks) {
      expect(benchmark.prompts.A).not.toMatch(forbidden);
    }

    expect(interactiveIds).toEqual(['cursor-experiment']);
  });

  it('keeps Infinite Maze autonomous while removing redundant input instructions', () => {
    const maze = suite.benchmarks.find(
      (benchmark: { id: string }) => benchmark.id === 'infinite-maze',
    );

    expect(maze.prompts.A).toBe(
      'Create a continuously self-navigating infinite first-person maze in a single HTML file using Three.js.',
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
