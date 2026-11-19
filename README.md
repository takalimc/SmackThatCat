# Smack That Cat! v0.6.10

The opening mode is SMACK THAT CAT! Quick hits within 0.60 seconds build a combo. Hits earn 2× points from the third consecutive hit and 3× from the sixth. Each round starts at zero. Paw-sy ends on the sixth friend or when the 10-second timer runs out.

The original artwork, taps and meows are joined by a soft original instrumental loop. The mute button controls music and effects. Boss Cat's quote stays on screen during the round. The leaderboard shows the posted nickname, score, and Nisa hits.

The leaderboard validates timing against each release's scoring rules, including a successful early finish. It retries transient storage writes using the same run ID, so a retry cannot post the score twice. Private storage keeps the top ten and recently used run IDs without retaining tap times.

Run npm ci and node build.mjs to build dist/index.html. The checked build includes the original 16 PNGs and two WAVs plus an original background loop. The standalone works offline. The online standings require the linked private Vercel Blob store and server-only LEADERBOARD_SIGNING_KEY.
