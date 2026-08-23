import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const suite = JSON.parse(
  readFileSync(join(root, 'suites', 'browser-autonomy', 'suite.json'), 'utf8'),
);

describe('browser-autonomy suite', () => {
  it('has unique ids and A/B/C prompts', () => {
    const ids = new Set<string>();
    for (const benchmark of suite.benchmarks) {
      expect(ids.has(benchmark.id)).toBe(false);
      ids.add(benchmark.id);
      for (const level of ['A', 'B', 'C'] as const) {
        expect(String(benchmark.prompts?.[level] || '').trim().length).toBeGreaterThan(0);
      }
    }
    expect(suite.benchmarks.length).toBeGreaterThan(0);
  });

  it('gives every C prompt a specific self-running showcase direction', () => {
    expect(suite.promptLevels.C.name).toBe('Showcase');
    for (const benchmark of suite.benchmarks) {
      expect(benchmark.prompts.C).toContain('visually striking animated showcase');
      expect(benchmark.prompts.C).toMatch(/automatic|automatically/);
      expect(benchmark.prompts.C).toMatch(/do not require/i);
      expect(benchmark.prompts.C).not.toContain('polished interactive experience');
    }
    const cPrompts = suite.benchmarks.map(
      (benchmark: { prompts: { C: string } }) => benchmark.prompts.C,
    );
    expect(new Set(cPrompts).size).toBe(suite.benchmarks.length);
  });

  it('replaces the infinite maze ladder with autonomous traversal prompts', () => {
    const maze = suite.benchmarks.find(
      (benchmark: { id: string }) => benchmark.id === 'infinite-maze',
    );

    expect(maze.prompts.A).toBe(
      'Create a continuously self-navigating infinite first-person maze in a single HTML file using Three.js. When the page loads, start the journey automatically. Do not require keyboard, mouse, touch, or pointer-lock input.',
    );
    expect(maze.prompts.B).toContain(
      'Generate new maze sections ahead of the camera and choose valid routes automatically.',
    );
    expect(maze.prompts.C).toContain(
      'Generate new maze sections ahead of the camera and choose valid routes without stopping or getting trapped.',
    );
    expect(maze.prompts.C).toContain(
      'Give successive areas distinct architecture, lighting, atmosphere, landmarks, and moments of discovery.',
    );
  });
});
