import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { BRAND, brandIcon, harnessBrand, modelBrand } from '../scripts/brands.mjs';

const catalog = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../gallery/catalog.json'), 'utf8'),
);

describe('modelBrand', () => {
  it('maps every catalog model to a known mark', () => {
    for (const model of catalog.models) {
      const brand = modelBrand(model.id);
      expect(BRAND[brand], model.id).toBeTruthy();
    }
  });

  it('uses vendor marks instead of the generic brain when a logo exists', () => {
    expect(modelBrand('gemini-3.1-pro')).toBe('gemini');
    expect(modelBrand('composer-2.5')).toBe('cursor');
    expect(modelBrand('deepseek-v4-flash-high')).toBe('deepseek');
    expect(modelBrand('glm-5.3-max')).toBe('zai');
    expect(modelBrand('gpt-5.6-sol-high')).toBe('openai');
    expect(modelBrand('grok-4.6-high')).toBe('grok');
    expect(modelBrand('hy3')).toBe('hunyuan');
    expect(modelBrand('kimi-k3-max')).toBe('kimi');
    expect(modelBrand('muse-spark-1.2-free')).toBe('meta');
    expect(modelBrand('qwen-3.8-27b')).toBe('qwen');
    expect(modelBrand('claude-opus-5-high')).toBe('claude');
    expect(modelBrand('opus-4.6')).toBe('claude');
    expect(modelBrand('sonnet-4.6')).toBe('claude');
    expect(modelBrand('ox-alpha-free')).toBe('opencode');
    expect(modelBrand('ornith-1.5-35b')).toBe('brain');
  });
});

describe('harnessBrand', () => {
  it('maps catalog harnesses to vendor marks', () => {
    expect(harnessBrand('cursor')).toBe('cursor');
    expect(harnessBrand('antigravity')).toBe('antigravity');
    expect(harnessBrand('grok')).toBe('grok');
    expect(harnessBrand('codex-app')).toBe('openai');
    expect(harnessBrand('claude-code')).toBe('claude');
    expect(harnessBrand('opencode')).toBe('opencode');
    expect(harnessBrand('zcode')).toBe('zai');
    expect(harnessBrand('not captured')).toBe('');
  });
});

describe('brandIcon', () => {
  it('emits currentColor SVG for every mapped brand', () => {
    const names = new Set(catalog.models.map((m: { id: string }) => modelBrand(m.id)));
    for (const name of names) {
      const svg = brandIcon(name);
      expect(svg).toContain('brand-icon');
      expect(svg).toContain('viewBox="0 0 24 24"');
    }
  });
});
