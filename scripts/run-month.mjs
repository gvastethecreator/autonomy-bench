export function monthKey(stamp) {
  const match = String(stamp || '').match(/^(\d{4}-\d{2})/);
  return match ? match[1] : '';
}

export function monthsFromDates(dates) {
  const seen = new Set();
  const out = [];
  for (const stamp of dates || []) {
    const key = monthKey(stamp);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out.sort((a, b) => b.localeCompare(a));
}

export function datesInMonth(dates, month) {
  const key = monthKey(month) || String(month || '');
  if (!key) return [];
  return (dates || [])
    .filter((stamp) => monthKey(stamp) === key)
    .sort((a, b) => b.localeCompare(a));
}

export function formatMonth(month) {
  const match = String(month || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return String(month || '');
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  if (Number.isNaN(date.getTime())) return String(month);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatRunInMonth(stamp) {
  const full = String(stamp || '').match(
    /^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})(?:-a(\d+))?$/,
  );
  if (!full) return String(stamp || '');
  let out = `${full[3]} · ${full[4]}:${full[5]}`;
  if (full[7]) out += ` a${full[7]}`;
  return out;
}

export function pickLatestCell(cells) {
  const list = [...(cells || [])];
  list.sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')));
  return list[0] || null;
}

export function pickCellForMonth(cells, month) {
  const key = monthKey(month) || String(month || '');
  const inMonth = (cells || []).filter((cell) => monthKey(cell.date) === key);
  return pickLatestCell(inMonth);
}
