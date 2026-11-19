# Smack That Cat! v0.6.6

This patch preserves the original tapping game, artwork, sound files, scoring and phase sequence. It removes the browser tap highlight, blocks zoom gestures in the arena, removes the artificial tap cooldown, and decodes the original tap sounds once for immediate playback.

The 16 PNGs and two WAVs are the original assets. The build embeds them into the game template and verifies the result against `release.sha256`. The original v0.6.5 checksum remains in `baseline.sha256` and matches the original backup commit.

Run `node build.mjs`, then open `dist/index.html` to play. For Vercel, import the repository at its root.
