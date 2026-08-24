function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );
}

function highlightAttrs(rest) {
  let out = '';
  const re = /(\s+)|([^\s=/>]+)(?:(\s*=\s*)("[^"]*"|'[^']*'|[^\s/>]+))?/g;
  let m;
  while ((m = re.exec(rest))) {
    if (m[1]) {
      out += escapeHtml(m[1]);
      continue;
    }
    out += `<span class="tok-attr">${escapeHtml(m[2])}</span>`;
    if (m[3] != null) {
      out += `<span class="tok-punc">${escapeHtml(m[3])}</span>`;
      out += `<span class="tok-str">${escapeHtml(m[4])}</span>`;
    }
  }
  return out;
}

function highlightTag(tag) {
  const m = /^(<\/?)([^\s/>]*)([\s\S]*?)(\/?>)$/.exec(tag);
  if (!m) return `<span class="tok-tag">${escapeHtml(tag)}</span>`;
  return (
    `<span class="tok-punc">${escapeHtml(m[1])}</span>` +
    (m[2] ? `<span class="tok-tag">${escapeHtml(m[2])}</span>` : '') +
    highlightAttrs(m[3]) +
    `<span class="tok-punc">${escapeHtml(m[4])}</span>`
  );
}

function nextTagEnd(input, start) {
  const end = input.indexOf('>', start);
  return end === -1 ? input.length : end + 1;
}

export function highlightHtml(source) {
  const input = String(source ?? '');
  let out = '';
  let i = 0;
  while (i < input.length) {
    if (input.startsWith('<!--', i)) {
      const end = input.indexOf('-->', i + 4);
      const endAt = end === -1 ? input.length : end + 3;
      out += `<span class="tok-com">${escapeHtml(input.slice(i, endAt))}</span>`;
      i = endAt;
      continue;
    }
    if (input[i] === '<') {
      const endAt = nextTagEnd(input, i);
      const tag = input.slice(i, endAt);
      out += highlightTag(tag);
      i = endAt;
      const rawName = /^<\s*([^\s/>]+)/.exec(tag);
      const name = rawName ? rawName[1].toLowerCase() : '';
      const selfClosing = /\/\s*>$/.test(tag) || tag.startsWith('</');
      if (!selfClosing && (name === 'script' || name === 'style' || name === 'textarea')) {
        const close = `</${name}>`;
        const closeAt = input.toLowerCase().indexOf(close, i);
        if (closeAt === -1) {
          out += escapeHtml(input.slice(i));
          break;
        }
        out += escapeHtml(input.slice(i, closeAt));
        const closeEnd = nextTagEnd(input, closeAt);
        out += highlightTag(input.slice(closeAt, closeEnd));
        i = closeEnd;
      }
      continue;
    }
    const next = input.indexOf('<', i);
    const end = next === -1 ? input.length : next;
    out += escapeHtml(input.slice(i, end));
    i = end;
  }
  return out;
}
