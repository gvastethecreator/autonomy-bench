export function canScrambleText(value) {
  const text = String(value ?? '');
  return text.length > 0 && !/[&<>]/.test(text);
}

export function splitChangedText(from, to, minKeep = 2) {
  const a = String(from ?? '');
  const b = String(to ?? '');
  if (a === b) {
    return { prefix: b, fromMid: '', toMid: '', suffix: '' };
  }
  let prefixLen = 0;
  const limit = Math.min(a.length, b.length);
  while (prefixLen < limit && a[prefixLen] === b[prefixLen]) prefixLen += 1;
  let suffixLen = 0;
  while (
    suffixLen < a.length - prefixLen &&
    suffixLen < b.length - prefixLen &&
    a[a.length - 1 - suffixLen] === b[b.length - 1 - suffixLen]
  ) {
    suffixLen += 1;
  }
  if (prefixLen < minKeep) prefixLen = 0;
  if (suffixLen < minKeep) suffixLen = 0;
  return {
    prefix: b.slice(0, prefixLen),
    fromMid: a.slice(prefixLen, a.length - suffixLen),
    toMid: b.slice(prefixLen, b.length - suffixLen),
    suffix: suffixLen ? b.slice(b.length - suffixLen) : '',
  };
}
