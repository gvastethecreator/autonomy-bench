import { describe, expect, it } from 'vite-plus/test';
import { runGalleryCli } from '../scripts/gallery.mjs';

describe('gallery CLI module', () => {
  it('can be imported without publishing', () => {
    expect(typeof runGalleryCli).toBe('function');
  });
});
