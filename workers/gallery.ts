import {
  catalogAllowsVote,
  countsFromRows,
  deleteVote,
  isVoteModelId,
  isVoterId,
  parseVotePromptId,
  putVote,
  snapshotVotes,
} from '../scripts/votes.mjs';

const COOKIE = 'ab_voter';
const MAX_BODY = 2048;
const YEAR = 60 * 60 * 24 * 365;

type VoteRow = { model_id: string; n: number };
type MineRow = { model_id: string };
type Catalog = {
  cells?: Array<{
    experiment?: string;
    level?: string;
    model?: string;
    modelKey?: string;
    src?: string | null;
  }>;
};

function json(body: unknown, status = 200, cookie = ''): Response {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  if (cookie) headers.set('set-cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function cookieValue(request: Request): string {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(COOKIE + '=')) continue;
    return decodeURIComponent(trimmed.slice(COOKIE.length + 1).trim());
  }
  return '';
}

function cookieHeader(request: Request, voterId: string): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(voterId)}; Path=/; Max-Age=${YEAR}; HttpOnly; SameSite=Lax${secure}`;
}

function voterFrom(request: Request): { id: string; fresh: boolean } {
  const existing = cookieValue(request);
  if (isVoterId(existing)) return { id: existing, fresh: false };
  return { id: crypto.randomUUID(), fresh: true };
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (raw.length > MAX_BODY) throw new Error('payload');
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('payload');
  return parsed as Record<string, unknown>;
}

function promptFrom(value: unknown): string {
  const parsed = parseVotePromptId(typeof value === 'string' ? value : '');
  if (!parsed.experiment) return '';
  return `${parsed.experiment}-${parsed.level}`;
}

function d1VoteStore(db: D1Database) {
  return {
    async counts(promptId: string) {
      const tallies = await db
        .prepare('SELECT model_id, COUNT(*) AS n FROM votes WHERE prompt_id = ? GROUP BY model_id')
        .bind(promptId)
        .all();
      return countsFromRows((tallies.results || []) as VoteRow[]);
    },
    async mine(promptId: string, voterId: string) {
      const row = await db
        .prepare('SELECT model_id FROM votes WHERE voter_id = ? AND prompt_id = ?')
        .bind(voterId, promptId)
        .first<MineRow>();
      const mineRaw = row?.model_id || '';
      return isVoteModelId(mineRaw) ? mineRaw : null;
    },
    async upsert(record: {
      voterId: string;
      promptId: string;
      modelId: string;
      now: string;
    }) {
      await db
        .prepare(
          `INSERT INTO votes (voter_id, prompt_id, model_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(voter_id, prompt_id) DO UPDATE SET
         model_id = excluded.model_id,
         updated_at = excluded.updated_at`,
        )
        .bind(record.voterId, record.promptId, record.modelId, record.now, record.now)
        .run();
    },
    async remove(record: { voterId: string; promptId: string }) {
      await db
        .prepare('DELETE FROM votes WHERE voter_id = ? AND prompt_id = ?')
        .bind(record.voterId, record.promptId)
        .run();
    },
  };
}

async function catalogAllows(
  env: Env,
  request: Request,
  promptId: string,
  modelId: string,
): Promise<boolean> {
  const asset = await env.ASSETS.fetch(new URL('/catalog.json', request.url));
  if (!asset.ok) return false;
  const catalog = (await asset.json()) as Catalog;
  return catalogAllowsVote(catalog, promptId, modelId);
}

async function handleVotes(request: Request, env: Env, url: URL): Promise<Response> {
  const voter = voterFrom(request);
  const cookie = voter.fresh ? cookieHeader(request, voter.id) : '';
  const store = d1VoteStore(env.DB);

  if (request.method === 'GET') {
    const promptId = promptFrom(url.searchParams.get('prompt'));
    if (!promptId) return json({ error: 'Unknown prompt' }, 400, cookie);
    return json(await snapshotVotes(store, promptId, voter.id), 200, cookie);
  }

  if (!sameOrigin(request)) return json({ error: 'Cross-origin vote blocked' }, 403, cookie);

  if (request.method === 'PUT') {
    let body: Record<string, unknown>;
    try {
      body = await readBody(request);
    } catch {
      return json({ error: 'Bad vote payload' }, 400, cookie);
    }
    const promptId = promptFrom(body.promptId);
    const modelId = typeof body.modelId === 'string' ? body.modelId.trim() : '';
    if (!promptId || !isVoteModelId(modelId)) return json({ error: 'Unknown take' }, 400, cookie);
    if (!(await catalogAllows(env, request, promptId, modelId))) {
      return json({ error: 'Unknown take' }, 404, cookie);
    }
    const now = new Date().toISOString();
    return json(
      await putVote(store, { voterId: voter.id, promptId, modelId, now }),
      200,
      cookieHeader(request, voter.id),
    );
  }

  if (request.method === 'DELETE') {
    let body: Record<string, unknown>;
    try {
      body = await readBody(request);
    } catch {
      return json({ error: 'Bad vote payload' }, 400, cookie);
    }
    const promptId = promptFrom(body.promptId ?? url.searchParams.get('prompt'));
    if (!promptId) return json({ error: 'Unknown prompt' }, 400, cookie);
    return json(
      await deleteVote(store, { voterId: voter.id, promptId }),
      200,
      cookieHeader(request, voter.id),
    );
  }

  return json({ error: 'Method not allowed' }, 405, cookie);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/votes' || url.pathname === '/api/votes/') {
      try {
        return await handleVotes(request, env, url);
      } catch {
        return json({ error: 'Vote store failed' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
