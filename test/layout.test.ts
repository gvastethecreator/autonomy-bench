import { describe, expect, it } from 'vite-plus/test';
import {
  cellRelPath,
  galleryDateFolder,
  galleryRelPath,
  promptVersion,
  runTimeFromRunId,
  slug,
} from '../scripts/layout.mjs';

describe('layout', () => {
  it('slugs model ids', () => {
    expect(slug('GPT 5.6 Sol')).toBe('gpt-5.6-sol');
    expect(slug('')).toBe('unknown');
  });

  it('builds prompt-V as benchmark-level', () => {
    expect(promptVersion('endless-driving', 'b')).toBe('endless-driving-B');
  });

  it('reads the run timestamp from a run id', () => {
    expect(runTimeFromRunId('20260821-021413-cursor-8-models-07567c37')).toBe('021413');
  });

  it('keeps ledger cells under model/prompt-V', () => {
    expect(
      cellRelPath({
        model: 'grok-4.6',
        benchmarkId: 'rollercoaster',
        promptLevel: 'A',
      }),
    ).toBe('cells/grok-4.6/rollercoaster-A');
  });

  it('nests extra attempts under the prompt version', () => {
    expect(
      cellRelPath({
        model: 'grok-4.6',
        benchmarkId: 'rollercoaster',
        promptLevel: 'A',
        attempt: 2,
      }),
    ).toBe('cells/grok-4.6/rollercoaster-A/a02');
  });

  it('publishes gallery takes as model/prompt-V/date', () => {
    const rel = galleryRelPath({
      model: 'composer-2.5',
      benchmarkId: 'medieval-city',
      promptLevel: 'C',
      date: '2026-08-21',
      runId: '20260821-021413-cursor-8-models-07567c37',
    });
    expect(rel).toBe('composer-2.5/medieval-city-C/2026-08-21-021413');
    expect(rel.split('/')).toHaveLength(3);
  });

  it('suffixes the date folder when attempt is greater than 1', () => {
    expect(
      galleryDateFolder({
        date: '2026-08-21',
        runId: '20260821-021413-x',
        attempt: 3,
      }),
    ).toBe('2026-08-21-021413-a03');
  });
});
