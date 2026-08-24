export const LEDGER_STATUSES = ['complete', 'blocked', 'unavailable', 'failed'];
export const ADAPTERS = ['manual', 'agent', 'prototype-lab'];
export const RECEIPT_REQUIRED = [
  'schemaVersion',
  'runId',
  'cellId',
  'benchmarkId',
  'promptLevel',
  'attempt',
  'requestedModel',
  'promptSha256',
  'status',
  'adapter',
  'harness',
  'startedAt',
  'completedAt',
  'durationMs',
  'tokenUsage',
];

export function receiptTemplate({ runId, cell, adapter, harness, promptSha, contributor }) {
  return {
    schemaVersion: 1,
    runId,
    cellId: cell.cellId,
    benchmarkId: cell.benchmarkId,
    promptLevel: cell.promptLevel,
    attempt: cell.attempt,
    requestedModel: cell.requestedModel,
    contributor,
    effectiveModel: 'not captured',
    effectiveModelSource: 'not-captured',
    reasoning: 'not captured',
    promptSha256: promptSha,
    status: 'complete',
    adapter,
    harness,
    startedAt: 'not captured',
    completedAt: 'not captured',
    durationMs: 'not captured',
    isolation: {
      capability: 'fresh-context-no-sibling-outputs',
      adapter: 'not captured',
      inheritedHistory: 'not captured',
      coordinatorContextExposed: 'not captured',
      evidence: 'not captured',
    },
    tokenUsage: 'not captured',
    toolCalls: 'not captured',
    outputPaths: [],
    outputHashes: {},
    externalReceipts: [],
    limitations: [],
    errors: [],
  };
}

export function assertReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    throw new Error('Receipt is missing');
  }
  for (const key of RECEIPT_REQUIRED) {
    if (receipt[key] == null || receipt[key] === '') {
      throw new Error(`Receipt is missing ${key}`);
    }
  }
  if (receipt.schemaVersion !== 1) throw new Error('Receipt schemaVersion must be 1');
  if (!LEDGER_STATUSES.includes(receipt.status)) {
    throw new Error(`Receipt status is not terminal: ${receipt.status}`);
  }
  if (!ADAPTERS.includes(receipt.adapter)) {
    throw new Error(`Unknown adapter ${receipt.adapter}`);
  }
  return receipt;
}

export function publishStatus(receipt, hasHtml) {
  if (receipt) {
    if (receipt.status === 'complete') return 'complete';
    return receipt.status || 'missing';
  }
  if (hasHtml) return 'pending';
  return 'missing';
}

export function isPlayable(hasHtml, status) {
  return Boolean(hasHtml) && (status === 'complete' || status === 'pending');
}

export const SHOWCASE_FIXED_NOTE = 'Post-generation repair so the take runs in the public gallery.';

export function showcaseFixedAt(at = new Date().toISOString()) {
  return { at, note: SHOWCASE_FIXED_NOTE };
}

export function isShowcaseFixed(receipt) {
  const value = receipt?.showcaseFixed;
  if (!value) return false;
  if (value === true) return true;
  return typeof value === 'object' && Boolean(value.at || value.note);
}
