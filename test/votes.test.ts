import { describe, expect, it } from 'vite-plus/test';
import {
  countsFromRows,
  isVoteModelId,
  parseVotePromptId,
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
