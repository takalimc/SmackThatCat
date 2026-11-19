# Smack That Cat! v0.6.7

The original tapping game, artwork, and sound files remain in use. This version adds short sound cues for phase changes and Paw-sy collection, a one-second minimum hold for the six-cat celebration, and an end-screen leaderboard for the five highest scores on the current device. The leaderboard uses browser storage. Scores are sorted by score, then number of friends collected, then by the earlier result.

The 16 original PNGs and two WAVs are embedded by the build, which checks the finished file against `release.sha256`. The original v0.6.5 checksum remains in `baseline.sha256`.

Run `node build.mjs`, then open `dist/index.html` to play. For Vercel, import the repository at its root.
