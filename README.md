# Smack That Cat! v0.6.5

This repository packages the supplied standalone tapping game. The first screen, play controls, timings, scoring, cinematics, artwork, and audio are all from the original v0.6.5 file.

The repository stores the 16 original PNGs and two WAVs as individual files with an `original-` prefix. The build embeds them into the unchanged game template and verifies the result against the SHA-256 checksum of the original standalone. Vercel publishes only the verified build.

Run `node build.mjs`, then open `dist/index.html` to play. For Vercel, import the repository at its root.
