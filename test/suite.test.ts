import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const suite = JSON.parse(
  readFileSync(join(root, 'suites', 'browser-autonomy', 'suite.json'), 'utf8'),
);

describe('browser-autonomy suite', () => {
  it('has unique ids and a frozen A prompt', () => {
    const ids = new Set<string>();
    expect(suite.promptLevels.A.name).toBe('Raw');
    expect(suite.promptLevels.B.name).toBe('Autonomous');
    expect(suite.promptLevels.C.name).toBe('Showcase');
    for (const benchmark of suite.benchmarks) {
      expect(ids.has(benchmark.id)).toBe(false);
      ids.add(benchmark.id);
      expect(String(benchmark.prompts?.A || '').trim().length).toBeGreaterThan(0);
      expect(benchmark.prompts.B).toBeUndefined();
      expect(benchmark.prompts.C).toBeUndefined();
    }
    expect(suite.benchmarks.length).toBe(32);
    expect(suite.benchmarks.map((benchmark: { id: string }) => benchmark.id)).not.toContain(
      'terrain-explorer',
    );
  });

  it('keeps infinite maze as an autonomous traversal prompt', () => {
    const maze = suite.benchmarks.find(
      (benchmark: { id: string }) => benchmark.id === 'infinite-maze',
    );

    expect(maze.prompts.A).toBe(
      'Create a continuously self-navigating infinite first-person maze in a single HTML file using Three.js. When the page loads, start the journey automatically. Do not require keyboard, mouse, touch, or pointer-lock input.',
    );
  });
});
