import { describe, expect, it } from 'vite-plus/test';
import {
  catalogAllowsVote,
  countsFromRows,
  createMemoryVoteStore,
  deleteVote,
  isVoteModelId,
  parseVotePromptId,
  putVote,
  snapshotVotes,
  uniqueLeader,
  votePromptId,
  voteStateFromPayload,
} from '../scripts/votes.mjs';

describe('votePromptId', () => {
  it('builds prompt-V as experiment-level', () => {
    expect(votePromptId('rollercoaster', 'a')).toBe('rollercoaster-A');
    expect(votePromptId('endless-driving', 'B')).toBe('endless-driving-B');
  });

  it('rejects empty or unknown levels', () => {
    expect(votePromptId('rollercoaster', 'D')).toBe('');
    expect(votePromptId('', 'A')).toBe('');
  });
});

describe('parseVotePromptId', () => {
  it('splits on the last hyphen so experiment slugs can contain hyphens', () => {
    expect(parseVotePromptId('endless-driving-A')).toEqual({
      experiment: 'endless-driving',
      level: 'A',
    });
  });

  it('rejects a prompt id without a level', () => {
    expect(parseVotePromptId('rollercoaster')).toEqual({
      experiment: '',
      level: '',
    });
  });
});

describe('uniqueLeader', () => {
  it('returns the unique max', () => {
    expect(uniqueLeader({ 'grok-4.6': 3, 'composer-2.5': 1 })).toBe('grok-4.6');
  });

  it('returns null on a tie', () => {
    expect(uniqueLeader({ 'grok-4.6': 2, 'composer-2.5': 2 })).toBeNull();
  });

  it('returns null when there are no votes', () => {
    expect(uniqueLeader({})).toBeNull();
    expect(uniqueLeader({ 'grok-4.6': 0 })).toBeNull();
  });
});

describe('countsFromRows', () => {
  it('drops empty models and zero counts', () => {
    expect(
      countsFromRows([
        { model_id: 'grok-4.6', n: 4 },
        { model_id: '', n: 9 },
        { model_id: 'composer-2.5', n: 0 },
      ]),
    ).toEqual({ 'grok-4.6': 4 });
  });
});

describe('voteStateFromPayload', () => {
  it('computes leader and keeps mine only when it is a model id', () => {
    expect(
      voteStateFromPayload({
        promptId: 'rollercoaster-A',
        counts: { 'grok-4.6': 2, 'composer-2.5': 1 },
        mine: 'grok-4.6',
      }),
    ).toEqual({
      promptId: 'rollercoaster-A',
      counts: { 'grok-4.6': 2, 'composer-2.5': 1 },
      mine: 'grok-4.6',
      leader: 'grok-4.6',
    });
  });

  it('clears a forged mine value', () => {
    expect(isVoteModelId('not a model')).toBe(false);
    expect(voteStateFromPayload({ mine: 'not a model', counts: {} }).mine).toBeNull();
  });
});

describe('catalogAllowsVote', () => {
  const catalog = {
    cells: [
      {
        experiment: 'rollercoaster',
        level: 'A',
        model: 'grok-4.6',
        src: 'grok-4.6/rollercoaster-A/2026-08-24/index.html',
      },
      {
        experiment: 'rollercoaster',
        level: 'B',
        model: 'requested-id',
        modelKey: 'glm-5.3-max',
        src: 'glm-5.3-max/rollercoaster-B/2026-08-24/index.html',
      },
      {
        experiment: 'rollercoaster',
        level: 'C',
        model: 'composer-2.5',
        src: '',
      },
    ],
  };

  it('allows a playable cell', () => {
    expect(catalogAllowsVote(catalog, 'rollercoaster-A', 'grok-4.6')).toBe(true);
  });

  it('rejects a missing src', () => {
    expect(catalogAllowsVote(catalog, 'rollercoaster-C', 'composer-2.5')).toBe(false);
  });

  it('matches modelKey', () => {
    expect(catalogAllowsVote(catalog, 'rollercoaster-B', 'glm-5.3-max')).toBe(true);
  });
});

describe('memory vote store', () => {
  it('puts, replaces, and deletes a vote', async () => {
    const store = createMemoryVoteStore();
    const first = await putVote(store, {
      voterId: '11111111-1111-4111-8111-111111111111',
      promptId: 'rollercoaster-A',
      modelId: 'grok-4.6',
      now: '2026-08-27T00:00:00.000Z',
    });
    expect(first.mine).toBe('grok-4.6');
    expect(first.leader).toBe('grok-4.6');
    const replaced = await putVote(store, {
      voterId: '11111111-1111-4111-8111-111111111111',
      promptId: 'rollercoaster-A',
      modelId: 'composer-2.5',
      now: '2026-08-27T00:00:01.000Z',
    });
    expect(replaced.mine).toBe('composer-2.5');
    expect(replaced.counts).toEqual({ 'composer-2.5': 1 });
    const cleared = await deleteVote(store, {
      voterId: '11111111-1111-4111-8111-111111111111',
      promptId: 'rollercoaster-A',
    });
    expect(cleared.mine).toBeNull();
    expect(cleared.counts).toEqual({});
    const empty = await snapshotVotes(
      store,
      'rollercoaster-A',
      '11111111-1111-4111-8111-111111111111',
    );
    expect(empty.leader).toBeNull();
  });
});
