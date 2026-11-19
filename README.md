# Smack That Cat! v0.6.9

The opening mode is SMACK THAT CAT! Quick hits within 0.60 seconds build a combo. Hits earn 2× points from the third consecutive hit and 3× from the sixth. Boss Cat Nisa speaks at the start of her round and reacts to the first hit. The phases use short transitions and additional meows. After collecting six Paw-sy friends, the player can keep tapping for points until the original 10-second timer expires.

At the end of a round, a short score reveal compares the result to the posted high score when the board is available. Then, players can post their score under their own public nickname or a generated label. The shared top ten also shows Nisa hits and the active time to collect all six Paw-sy friends. Existing scores are retained. A dash indicates an unavailable statistic or a run that did not collect all six.

The online leaderboard derives scoring and stats from submitted tap times and a time-limited session. It does not retain the individual tap times. This is a casual leaderboard and browser input is not proof of human play.

Run npm ci and node build.mjs to build dist/index.html. The game embeds the original 16 PNGs and two WAVs, plus two Boss Cat speech clips. Boss Cat speech was generated locally with the [Kokoro-82M model](https://huggingface.co/hexgrad/Kokoro-82M) using its af_bella voice. The standalone works offline. Online standings require the linked private Vercel Blob store and the server-only LEADERBOARD_SIGNING_KEY.
