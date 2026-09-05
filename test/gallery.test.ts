import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { gallerySuitePath, runGalleryCli } from '../scripts/gallery.mjs';
import { loadSuite } from '../scripts/suite.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const gallerySrc = readFileSync(join(here, '..', 'scripts', 'gallery.mjs'), 'utf8');

describe('gallery CLI module', () => {
  it('can be imported without publishing', () => {
    expect(typeof runGalleryCli).toBe('function');
  });

  it('publishRuns loads the live suite.json file', () => {
    expect(gallerySrc).toMatch(/function publishRuns[\s\S]*loadLiveSuite\(\)/);
    expect(() => loadSuite()).toThrow();
    const suitePath = gallerySuitePath();
    expect(suitePath.replaceAll('\\', '/')).toMatch(/suites\/browser-autonomy\/suite\.json$/);
    const suite = loadSuite(suitePath);
    expect(suite).not.toBeNull();
    expect(suite.benchmarks.map((row: { id: string }) => row.id)).toEqual([
      'rollercoaster',
      'fireworks',
    ]);
  });
});
