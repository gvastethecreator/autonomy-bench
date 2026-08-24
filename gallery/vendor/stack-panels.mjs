export function stackHeading(kind, label) {
  const name = kind === 'html' ? 'HTML' : 'Receipt';
  const rest = String(label || '').trim();
  return rest ? name + ' · ' + rest : name;
}

export function receiptBindKey(cell, label) {
  const rec = cell && (cell.receipt || cell.glance);
  if (!rec) return '';
  return [
    String(label || ''),
    rec.status || '',
    rec.completedAt || '',
    rec.durationMs == null ? '' : String(rec.durationMs),
    rec.effectiveModel || '',
    rec.requestedModel || '',
  ].join('\t');
}

export function shouldReuseSource(boundSrc, boundReady, src) {
  return boundReady === '1' && boundSrc === String(src || '');
}

export function nextPanelKeys(prevKeys, nextKeys) {
  const prev = [...prevKeys];
  const next = [...nextKeys];
  const want = new Set(next);
  const have = new Set(prev);
  return {
    remove: prev.filter((key) => !want.has(key)),
    add: next.filter((key) => !have.has(key)),
    order: next,
  };
}
