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
        ['classic', 'combo-v1', 'combo-six-finish', 'hits-six-v1', 'roundup-v1', 'roundup-clock-v1'].includes(rules)) return { id, started, rules };
  } catch {}
  return null;
}

export function countTaps(taps, rules = 'classic', friendIds) {
  if (!taps || typeof taps !== 'object') return null;
  let score = 0;
  for (const [phase, [duration, limit]] of Object.entries(PHASES)) {
    const stamps = taps[phase];
    const maximum = phase === 'paw' ? ['roundup-v1', 'roundup-clock-v1'].includes(rules) ? 6 : rules !== 'combo-v1' ? 18 : limit : limit;
    if (!Array.isArray(stamps) || stamps.length > maximum) return null;
    let previous = -Infinity;
    let streak = 0;
    for (const time of stamps) {
      const gap = time - previous;
      if (!Number.isSafeInteger(time) || time < 0 || time >= duration || gap < 0) return null;
      if (phase === 'tabby' && ['combo-v1', 'combo-six-finish'].includes(rules)) {
        streak = nextStreak(streak, gap);
        score += comboMultiplier(streak);
      } else if (phase !== 'paw' || rules !== 'roundup-clock-v1') {
        score++;
      }
      previous = time;
    }
  }
  if (['roundup-v1', 'roundup-clock-v1'].includes(rules) && (!Array.isArray(friendIds) || friendIds.length !== taps.paw.length ||
      new Set(friendIds).size !== friendIds.length ||
      friendIds.some(id => !Number.isInteger(id) || id < 0 || id > 5))) return null;
  const roundupPoints = rules === 'roundup-clock-v1' && taps.paw.length === 6
    ? Math.max(0, Math.ceil((10000 - taps.paw[5]) / 1000)) : 0;
  return score + roundupPoints > 0 ? {
    score: score + roundupPoints,
    roundupPoints,
    friends: ['roundup-v1', 'roundup-clock-v1'].includes(rules) ? taps.paw.length : Math.min(6, Math.floor(taps.paw.length / 3)),
    bossHits: taps.boss.length
  } : null;
}

export function runCanBePosted(run, taps, now = Date.now()) {
  const completed = ['roundup-v1', 'roundup-clock-v1'].includes(run.rules) ? taps.paw.length === 6 : ['combo-six-finish', 'hits-six-v1'].includes(run.rules) && taps.paw.length === 18;
  const endOfPaw = completed ? taps.paw.at(-1) : 10000;
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

// Weekly competition runs Monday 00:00 to Monday 00:00 in Malaysia (UTC+8).
export function weekWindow(now = Date.now()) {
  const offset = 8 * 60 * 60 * 1000;
  const local = new Date(now + offset);
  const monday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (local.getUTCDay() + 6) % 7);
  return { key:new Date(monday).toISOString().slice(0,10), start:monday-offset, end:monday-offset+7*86400000 };
}
const rankEntries = entries => [...entries].sort((a,b) => b.score-a.score || b.friends-a.friends || a.posted-b.posted || a.id.localeCompare(b.id)).slice(0,LEADERS);
export function weeklyLeaders(state, now = Date.now()) {
  const week=weekWindow(now);
  // Seed the first weekly board from retained scores without changing all-time standings.
  const entries=state.weekly?.key===week.key ? state.weekly.leaders : state.leaders;
  return rankEntries(entries.filter(entry => entry.posted>=week.start && entry.posted<week.end));
}
export function boardResponse(state, now = Date.now()) {
  const week=weekWindow(now);
  return {ranks:publicRanks(state),weeklyRanks:publicRanks({leaders:weeklyLeaders(state,now)}),weekStarts:new Date(week.start).toISOString(),weekEnds:new Date(week.end).toISOString()};
}

export function publishEntry(current, run, result, now = Date.now(), name = '') {
  const recent = current.recent.filter(item => item.started + SESSION_LIFETIME >= now);
  if (recent.some(item => item.id === run.id)) return current;
  if (recent.length >= MAX_TRACKED_RUNS) return null;
  const entry = { id: run.id, player: name || 'Cat ' + run.id.slice(0, 6).toUpperCase(), ...result, posted: now };
  const leaders = rankEntries([...current.leaders,entry]);
  const weekly = {key:weekWindow(now).key,leaders:rankEntries([...weeklyLeaders(current,now),entry])};
  return { leaders, weekly, recent: [...recent, run] };
}

export function publicRanks(state) {
  return state.leaders.map(({ id, player, score, friends, bossHits = null }) =>
    ({ id, player, score, friends, bossHits }));
}

