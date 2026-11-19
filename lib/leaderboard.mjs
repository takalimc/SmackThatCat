import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { nextStreak, comboMultiplier } from './combo.mjs';

const SESSION_LIFETIME = 30 * 60 * 1000;
const BEFORE_PAW_MS = 24600;
const TIMING_TOLERANCE_MS = 3100;
const PHASES = { tabby: [15000, 1000], boss: [5000, 334], paw: [10000, 667] };
const MAX_TRACKED_RUNS = 512;
const LEADERS = 10;

function sign(payload, key) {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function issueTicket(key, now = Date.now(), rules = 'classic') {
  const payload = Buffer.from(JSON.stringify([randomBytes(16).toString('hex'), now, rules])).toString('base64url');
  return payload + '.' + sign(payload, key);
}

export function verifyTicket(ticket, key, now = Date.now()) {
  if (typeof ticket !== 'string' || !/^[\w-]{1,112}\.[\w-]{43}$/.test(ticket)) return null;
  const [payload, signature] = ticket.split('.');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload, key)))) return null;
  try {
    const [id, started, rules = 'classic'] = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const elapsed = now - started;
    if (/^[a-f0-9]{32}$/.test(id) && Number.isSafeInteger(started) &&
        elapsed >= 0 && elapsed <= SESSION_LIFETIME &&
        ['classic', 'combo-v1', 'combo-six-finish'].includes(rules)) return { id, started, rules };
  } catch {}
  return null;
}

export function countTaps(taps, rules = 'classic') {
  if (!taps || typeof taps !== 'object') return null;
  let score = 0;
  for (const [phase, [duration, limit]] of Object.entries(PHASES)) {
    const stamps = taps[phase];
    const maximum = phase === 'paw' && rules !== 'combo-v1' ? 18 : limit;
    if (!Array.isArray(stamps) || stamps.length > maximum) return null;
    let previous = -Infinity;
    let streak = 0;
    for (const time of stamps) {
      const gap = time - previous;
      if (!Number.isSafeInteger(time) || time < 0 || time >= duration || gap < 0) return null;
      if (phase === 'tabby' && rules !== 'classic') {
        streak = nextStreak(streak, gap);
        score += comboMultiplier(streak);
      } else {
        score++;
      }
      previous = time;
    }
  }
  return score > 0 ? {
    score,
    friends: Math.min(6, Math.floor(taps.paw.length / 3)),
    bossHits: taps.boss.length
  } : null;
}

export function runCanBePosted(run, taps, now = Date.now()) {
  const endOfPaw = run.rules === 'combo-six-finish' && taps.paw.length === 18 ? taps.paw[17] : 10000;
  return now - run.started >= BEFORE_PAW_MS + endOfPaw - TIMING_TOLERANCE_MS;
}

export function parsePlayerName(value) {
  if (value === undefined) return '';
  if (typeof value !== 'string') return null;
  const name = value.normalize('NFC').trim().replace(/ +/g, ' ');
  if (!name) return '';
  if ([...name].length > 20 || !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} '’.\-]*$/u.test(name)) return null;
  return name;
}

export function publishEntry(current, run, result, now = Date.now(), name = '') {
  const recent = current.recent.filter(item => item.started + SESSION_LIFETIME >= now);
  if (recent.some(item => item.id === run.id)) return current;
  if (recent.length >= MAX_TRACKED_RUNS) return null;
  const entry = { id: run.id, player: name || 'Cat ' + run.id.slice(0, 6).toUpperCase(), ...result, posted: now };
  const leaders = [...current.leaders, entry]
    .sort((a, b) => b.score - a.score || b.friends - a.friends || a.posted - b.posted || a.id.localeCompare(b.id))
    .slice(0, LEADERS);
  return { leaders, recent: [...recent, run] };
}

export function publicRanks(state) {
  return state.leaders.map(({ id, player, score, friends, bossHits = null }) =>
    ({ id, player, score, friends, bossHits }));
}
