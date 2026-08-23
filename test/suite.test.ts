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
});
