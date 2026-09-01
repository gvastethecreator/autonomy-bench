import { describe, expect, it } from 'vite-plus/test';
import {
  datesInMonth,
  formatMonth,
  formatRunInMonth,
  monthKey,
  monthsFromDates,
  pickCellForMonth,
  pickLatestCell,
} from '../scripts/run-month.mjs';

describe('monthKey', () => {
  it('reads YYYY-MM from a gallery date stamp', () => {
    expect(monthKey('2026-08-23-034329')).toBe('2026-08');
    expect(monthKey('2026-08-21-021413-a02')).toBe('2026-08');
    expect(monthKey('')).toBe('');
  });
});

describe('monthsFromDates', () => {
  it('lists unique months newest first', () => {
    expect(
      monthsFromDates(['2026-08-21-021413', '2026-08-23-034329', '2026-07-01-010000']),
    ).toEqual(['2026-08', '2026-07']);
  });
});

describe('datesInMonth', () => {
  it('keeps only stamps in the selected month, newest first', () => {
    expect(
      datesInMonth(['2026-08-21-021413', '2026-07-01-010000', '2026-08-23-034329'], '2026-08'),
    ).toEqual(['2026-08-23-034329', '2026-08-21-021413']);
  });
});

describe('formatMonth', () => {
  it('names the month for the primary select', () => {
    expect(formatMonth('2026-08')).toBe('August 2026');
  });
});

describe('formatRunInMonth', () => {
  it('shows day and time once the month is already selected', () => {
    expect(formatRunInMonth('2026-08-23-034329')).toBe('23 · 03:43');
    expect(formatRunInMonth('2026-08-21-021413-a02')).toBe('21 · 02:14 a02');
  });
});

describe('pickLatestCell', () => {
  it('returns the newest cell across months', () => {
    const picked = pickLatestCell([
      { date: '2026-08-21-021413', src: 'aug.html' },
      { date: '2026-07-01-010000', src: 'july.html' },
    ]);
    expect(picked?.src).toBe('aug.html');
  });
});

describe('pickCellForMonth', () => {
  it('returns the newest cell in that month', () => {
    const picked = pickCellForMonth(
      [
        { date: '2026-08-21-021413', src: 'old.html' },
        { date: '2026-08-23-034329', src: 'new.html' },
        { date: '2026-07-01-010000', src: 'july.html' },
      ],
      '2026-08',
    );
    expect(picked?.src).toBe('new.html');
  });
});
