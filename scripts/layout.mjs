export function slug(value) {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'unknown'
  );
}

export function promptVersion(benchmarkId, promptLevel) {
  return `${slug(benchmarkId)}-${String(promptLevel).trim().toUpperCase()}`;
}

export function runTimeFromRunId(runId) {
  const match = String(runId || '').match(/^\d{8}-(\d{6})(?:-|$)/);
  return match ? match[1] : '';
}

/**
 * @typedef {object} DateFolderInput
 * @property {string} [date]
 * @property {string} [runId]
 * @property {number} [attempt]
 *
 * @typedef {object} CellLayoutInput
 * @property {string} [model]
 * @property {string} [benchmarkId]
 * @property {string} [promptLevel]
 * @property {string} [date]
 * @property {string} [runId]
 * @property {number} [attempt]
 */

/** @param {DateFolderInput} [opts] */
export function galleryDateFolder({ date, runId, attempt = 1 } = {}) {
  const day = String(date || '').slice(0, 10);
  const time = runTimeFromRunId(runId);
  let stamp = time ? `${day}-${time}` : day;
  if (!stamp) stamp = 'undated';
  if (Number(attempt) > 1) stamp += `-a${String(attempt).padStart(2, '0')}`;
  return stamp;
}

/** @param {CellLayoutInput} [opts] */
export function cellRelPath({ model, benchmarkId, promptLevel, attempt = 1 } = {}) {
  const base = `cells/${slug(model)}/${promptVersion(benchmarkId, promptLevel)}`;
  if (Number(attempt) > 1) return `${base}/a${String(attempt).padStart(2, '0')}`;
  return base;
}

/** @param {CellLayoutInput} [opts] */
export function galleryRelPath({ model, benchmarkId, promptLevel, date, runId, attempt = 1 } = {}) {
  return `${slug(model)}/${promptVersion(benchmarkId, promptLevel)}/${galleryDateFolder({ date, runId, attempt })}`;
}
