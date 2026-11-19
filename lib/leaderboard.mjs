import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_LIFETIME = 30 * 60 * 1000;
const MIN_ROUND_TIME = 31500;
const MIN_TAP_SPACING = 15;
const PHASES = { tabby: [15000, 1000], boss: [5000, 334], paw: [10000, 18] };
const MAX_TRACKED_RUNS = 512;
const LEADERS = 10;

function sign(payload, key) {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function issueTicket(key, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify([randomBytes(16).toString('hex'), now])).toString('base64url');
  return payload + '.' + sign(payload, key);
}

export function verifyTicket(ticket, key, now = Date.now()) {
  if (typeof ticket !== 'string' || !/^[\w-]{1,112}\.[\w-]{43}$/.test(ticket)) return null;
  const [payload, signature] = ticket.split('.');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload, key)))) return null;
  try {
    const [id, started] = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const elapsed = now - started;
    if (/^[a-f0-9]{32}$/.test(id) && Number.isSafeInteger(started) &&
        elapsed >= MIN_ROUND_TIME && elapsed <= SESSION_LIFETIME) return { id, started };
  } catch {}
  return null;
}

export function countTaps(taps) {
  if (!taps || typeof taps !== 'object') return null;
  let score = 0;
  for (const [phase, [duration, limit]] of Object.entries(PHASES)) {
    const stamps = taps[phase];
    if (!Array.isArray(stamps) || stamps.length > limit) return null;
    let previous = -Infinity;
    for (const time of stamps) {
      if (!Number.isSafeInteger(time) || time < 0 || time >= duration || time - previous < MIN_TAP_SPACING) return null;
      previous = time;
    }
    score += stamps.length;
  }
  return score > 0 ? { score, friends: Math.floor(taps.paw.length / 3) } : null;
}

export function publishEntry(current, run, result, now = Date.now()) {
  const recent = current.recent.filter(item => item.started + SESSION_LIFETIME >= now);
  if (recent.some(item => item.id === run.id)) return current;
  if (recent.length >= MAX_TRACKED_RUNS) return null;
  const entry = { id: run.id, player: 'Cat ' + run.id.slice(0, 6).toUpperCase(), ...result, posted: now };
  const leaders = [...current.leaders, entry]
    .sort((a, b) => b.score - a.score || b.friends - a.friends || a.posted - b.posted || a.id.localeCompare(b.id))
    .slice(0, LEADERS);
  return { leaders, recent: [...recent, run] };
}

export function publicRanks(state) {
  return state.leaders.map(({ id, player, score, friends }) => ({ id, player, score, friends }));
}
