import { describe, expect, it } from 'vite-plus/test';
import {
  DEFAULT_CONTRIBUTOR_GITHUB,
  fallbackGithubForReceipt,
  githubAvatarUrl,
  resolveContributor,
  stampContributor,
} from '../scripts/contributor.mjs';

describe('resolveContributor', () => {
  it('defaults to the maintainer GitHub login', () => {
    expect(resolveContributor(undefined)).toEqual({
      github: DEFAULT_CONTRIBUTOR_GITHUB,
      avatarUrl: githubAvatarUrl(DEFAULT_CONTRIBUTOR_GITHUB),
    });
  });

  it('keeps a stated GitHub login and derives the avatar', () => {
    expect(resolveContributor({ github: 'franky47' })).toEqual({
      github: 'franky47',
      avatarUrl: 'https://github.com/franky47.png',
    });
  });

  it('rejects non-GitHub avatar URLs', () => {
    expect(resolveContributor({ github: 'franky47', avatarUrl: 'javascript:alert(1)' })).toEqual({
      github: 'franky47',
      avatarUrl: 'https://github.com/franky47.png',
    });
  });
});

describe('stampContributor', () => {
  it('fills a missing contributor without dropping other fields', () => {
    const { receipt, changed } = stampContributor({ requestedModel: 'qwen-3.8-27b' });
    expect(changed).toBe(true);
    expect(receipt.requestedModel).toBe('qwen-3.8-27b');
    expect(receipt.contributor.github).toBe(DEFAULT_CONTRIBUTOR_GITHUB);
  });

  it('does not overwrite a different stated contributor', () => {
    const { receipt, changed } = stampContributor({
      contributor: { github: 'franky47', avatarUrl: 'https://github.com/franky47.png' },
    });
    expect(changed).toBe(false);
    expect(receipt.contributor.github).toBe('franky47');
  });

  it('uses the imported-run author when the run is a known contribution', () => {
    expect(
      fallbackGithubForReceipt({
        runId: '20260823-054616-contributions-rollercoaster-a-12d99759',
      }),
    ).toBe('franky47');
  });
});
