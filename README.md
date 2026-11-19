# Smack That Cat! v0.6.20

Preserves the original tapping game, artwork, randomized smack/meow audio and full five-second Nisa fight. Roundup still ends on the sixth friend: points equal the displayed whole seconds left (rounded up). Completing at exactly three seconds earns seven Roundup points; incomplete teams earn zero Roundup points. Opening and Nisa hits earn one point each.

## Player experience

- Personal best, a six-friend Paw-sy album with lifetime collection counts, and a daily 18-friend challenge save locally in this browser. Partial collections count. Completion awards a dated cosmetic ribbon; no score bonus, sign-in or missed-day penalty. The album shows the most recent seven ribbons; up to 365 are retained.
- Local progress uses the device's local calendar day. Storage failures are explained and do not block play. Clearing browser data clears this progress.
- The return cinematic explains catching friends and avoiding tabbies before the ten-second Roundup starts. Target labels reinforce the distinction. No gameplay timer was shortened.
- Closing page retains posting and immediate replay, adding personal-best feedback and progress toward the daily ribbon.

## Online leaderboard

“This Week” and “All Time” tabs show the top ten runs with player names, scores and Nisa hits. Weekly competition runs Monday 00:00 to the following Monday 00:00 in Malaysia (UTC+8). All-time scores retain the current scoring-rule history.

Both periods are stored atomically in the existing private Blob at `leaderboard-roundup-clock-v1.json`. Weekly top ten are retained independently of all-time qualification. Existing retained scores seed the first weekly board. Prior rules boards are preserved and prior clients can still submit. Weekly rollover is calculated on server reads and writes; no scheduled reset or deletion is needed.

## Build and checks

Run `npm ci`, `npm test`, and `node build.mjs`. Vercel serves `dist/` and the existing leaderboard function. Tests cover scoring, distractors, friend uniqueness, timeout/restart, daily completion and reset, reload persistence, blocked/corrupt storage, Malaysia weekly boundaries, preservation of all-time scores, and duplicate submission retries.
