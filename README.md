# Smack That Cat! v0.6.8

The end-screen leaderboard shows the ten highest shared scores. Players can choose **Post my score** after a run with points. Posts appear under a generated label and require no account. Previous device scores remain in browser storage and do not appear on the public board.

A Vercel Function issues a time-limited signed session at the start of play. It validates timing and derives the score and friend count from the ordered tap times. This is a casual leaderboard. A player controls their browser, so this validation does not prove that the inputs came from a human. The private leaderboard store keeps top scores and briefly retains session IDs to prevent duplicates. It does not keep the individual tap times.

Run npm install and then node build.mjs to build the same standalone game into dist/index.html and verify it against release.sha256. The build embeds the 16 original PNGs and two WAVs. The original v0.6.5 checksum remains in baseline.sha256.

The online leaderboard needs a linked private Vercel Blob store and the server-only LEADERBOARD_SIGNING_KEY environment variable. The standalone file remains playable offline.
