# Smack That Cat! v0.6.19

Paw-sy Roundup shows two friends and a tabby distractor. After every collection, remaining friends refill and their positions shuffle. Tabby distractors give feedback and no score. Friends remain collected. When one friend remains, two distractors appear.

The round lasts at most ten seconds and ends on the sixth friend. Roundup points equal the whole seconds displayed on the clock at completion, rounded up from the remaining milliseconds. Completion at exactly three seconds earns seven points. An incomplete team earns zero Roundup points. Opening and boss hits still earn one point per hit.

The score reveal shows tap points plus Roundup points and presents the collected team together. The new time-based leaderboard uses leaderboard-roundup-clock-v1.json. Earlier Roundup standings remain in leaderboard-roundup-trial.json and old sessions can still submit under their original rules.

Tests passed for decoys, shuffled unique pickups, six catches in three seconds, client/server scoring agreement, millisecond boundaries, partial completion, late presses and restart. Run npm ci and node build.mjs to build the hosted game.
