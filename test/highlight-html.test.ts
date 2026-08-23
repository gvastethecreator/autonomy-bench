import { describe, expect, it } from 'vite-plus/test';
import { highlightHtml } from '../scripts/highlight-html.mjs';

describe('highlightHtml', () => {
  it('tokens comments, tags, attributes, and text', () => {
    const html = highlightHtml('<!-- hi --><div class="x">ok</div>');
    expect(html).toContain('class="tok-com"');
    expect(html).toContain('class="tok-tag"');
    expect(html).toContain('class="tok-attr"');
    expect(html).toContain('class="tok-str"');
    expect(html).toContain('ok');
    expect(html).not.toContain('<div class="x">');
  });

  it('leaves script bodies as escaped text', () => {
    const html = highlightHtml('<script>const x = 1 < 2;</script>');
    expect(html).toContain('const x = 1 &lt; 2;');
    expect(html).toContain('class="tok-tag">script');
  });
});
