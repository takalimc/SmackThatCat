import { get, put, BlobPreconditionFailedError, BlobServiceNotAvailable, BlobServiceRateLimited } from '@vercel/blob';
import { issueTicket, verifyTicket, countTaps, runCanBePosted, parsePlayerName, publishEntry, publicRanks } from '../lib/leaderboard.mjs';

const currentPath = 'leaderboard-hits-v2.json';
const MAX_REQUEST_BYTES = 12000;
const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store' }
});
const emptyBoard = () => ({ leaders: [], recent: [] });

async function readBoard(pathname = currentPath) {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result) return { state: emptyBoard() };
  if (!result.stream) throw Error('Missing score data');
  return { state: await new Response(result.stream).json(), etag: result.blob.etag };
}

async function readInput(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json') || !request.body) return;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0, text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {}
}

async function saveScore(run, score, name) {
  const pathname = run.rules === 'hits-six-v1' ? currentPath : 'leaderboard-v1.json';
  for (let attempt = 0; attempt < 6; attempt++) {
    let etag;
    let writing = false;
    try {
      const current = await readBoard(pathname);
      etag = current.etag;
      const next = publishEntry(current.state, run, score, Date.now(), name);
      if (next === null) return json({ error: 'The leaderboard is busy. Try again shortly.' }, 503);
      if (next === current.state) return json({ ranks: publicRanks(current.state), entryId: run.id });
      writing = true;
      await put(pathname, JSON.stringify(next), {
        access: 'private',
        contentType: 'application/json',
        ...(etag ? { allowOverwrite: true, ifMatch: etag } : { allowOverwrite: false })
      });
      return json({ ranks: publicRanks(next), entryId: run.id });
    } catch (error) {
      const creationRace = writing && !etag && /already exists/i.test(error.message);
      if (!creationRace && !(error instanceof BlobPreconditionFailedError ||
          error instanceof BlobServiceNotAvailable || error instanceof BlobServiceRateLimited)) throw error;
      if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 80 * (attempt + 1) + Math.random() * 70));
    }
  }
  console.warn('Leaderboard write retries exhausted');
  return json({ error: 'The leaderboard is busy. Try again shortly.' }, 503);
}

export default {
  async fetch(request) {
    try {
      if (request.method === 'GET') return json({ ranks: publicRanks((await readBoard()).state) });
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) return json({ error: 'Invalid origin.' }, 403);
      const input = await readInput(request);
      if (!input || typeof input !== 'object') return json({ error: 'Invalid request.' }, 400);
      const key = process.env.LEADERBOARD_SIGNING_KEY;
      if (!key) throw Error('Missing leaderboard signing key');
      if (input.action === 'start') {
        const rules = ['combo-v1', 'combo-six-finish', 'hits-six-v1'].includes(input.rules) ? input.rules : 'classic';
        return json({ ticket: issueTicket(key, Date.now(), rules) });
      }
      const run = verifyTicket(input.ticket, key);
      const score = run && countTaps(input.taps, run.rules);
      if (!run || !score || !runCanBePosted(run, input.taps)) {
        return json({ error: 'This run could not be verified for the leaderboard.' }, 422);
      }
      const name = parsePlayerName(input.name);
      if (name === null) return json({ error: 'Use up to 20 letters, numbers, spaces, or common name punctuation.' }, 422);
      return await saveScore(run, score, name);
    } catch (error) {
      console.error('Leaderboard request failed', error?.constructor?.name ?? 'UnknownError');
      return json({ error: 'The online leaderboard is unavailable. Try again shortly.' }, 503);
    }
  }
};
