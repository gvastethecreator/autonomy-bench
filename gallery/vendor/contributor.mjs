export const DEFAULT_CONTRIBUTOR_GITHUB = 'gvastethecreator';

/** Known imported runs whose GitHub author was stated after the fact. */
export const RUN_CONTRIBUTORS = {
  '20260823-054616-contributions-rollercoaster-a-12d99759': 'franky47',
};

export function fallbackGithubForReceipt(receipt) {
  const fromRun = RUN_CONTRIBUTORS[receipt?.runId];
  if (fromRun) return fromRun;
  return DEFAULT_CONTRIBUTOR_GITHUB;
}

export function githubAvatarUrl(login) {
  const github = String(login || '')
    .trim()
    .replace(/^@/, '');
  if (!github) return '';
  return `https://github.com/${encodeURIComponent(github)}.png`;
}

function safeAvatarUrl(url, github) {
  const fallback = githubAvatarUrl(github);
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return fallback;
    if (parsed.hostname === 'github.com' || parsed.hostname === 'avatars.githubusercontent.com') {
      return url;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export function resolveContributor(value, fallbackGithub = DEFAULT_CONTRIBUTOR_GITHUB) {
  const github = String(value?.github || value?.login || fallbackGithub || '')
    .trim()
    .replace(/^@/, '');
  const handle = github || fallbackGithub;
  return {
    github: handle,
    avatarUrl: safeAvatarUrl(String(value?.avatarUrl || '').trim(), handle),
  };
}

export function stampContributor(receipt, fallbackGithub = DEFAULT_CONTRIBUTOR_GITHUB) {
  if (!receipt || typeof receipt !== 'object') return { receipt, changed: false };
  const next = resolveContributor(receipt.contributor, fallbackGithub);
  const prev = receipt.contributor;
  const changed = !prev || prev.github !== next.github || prev.avatarUrl !== next.avatarUrl;
  if (!changed) return { receipt, changed: false };
  return { receipt: { ...receipt, contributor: next }, changed: true };
}
