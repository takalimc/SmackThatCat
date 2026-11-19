# Paw-sy Roundup trial

This trial changes the final round only. Three friends appear at a time. A single deliberate tap collects a friend and refills that space until all six are collected. Collected friends cannot reappear. The round ends on the sixth collection or at ten seconds, and the collected team appears in the result reveal.

Opening tapping and Boss Cat retain their normal scoring and timers. Scores use the separate roundup-v1 rules and leaderboard-roundup-trial.json store, so public standings from the original final round are preserved.

Run npm ci and node build.mjs. The original full-resolution artwork remains in the repository history. This build uses optimized gameplay assets.

Code checks passed for three visible friends, refills, duplicate suppression, keyboard event handling, pause, timeout, restart and six-member celebration. The trial is deployed for review, without promoting the public game domain.
