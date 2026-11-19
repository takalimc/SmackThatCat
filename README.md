# Smack That Cat! v0.6.16

This is the approved v0.6.16 release.

Each hit earns one point. Consecutive opening-round hits build a separate combo which ends on a miss or a gap longer than 0.6 seconds. Random supplied meows follow the smack with a short spacing rule so rapid tapping does not keep cancelling every meow.

The boss introduction precedes the full five-second timer. Boss hits shake Nisa with action lines and an outline. Music changes for the boss, eviction and return. Pause and background handling preserve cinematic time as well as play time. The round ends on collecting six friends or timing out, followed by the high-score reveal and optional named leaderboard post.

Hosted assets are resized copies. The full-resolution source images remain in the repository's original asset files. Run npm ci and node build.mjs to create dist. The hosted game is about 8 MB. The build serves assets as separate files.

The public one-point season uses leaderboard-hits-v3.json. The tested QA standings remain in leaderboard-hits-v2.json. Previous multiplier standings remain in leaderboard-v1.json. Existing sessions from earlier releases remain compatible. The server validates score and phase timestamps and uses optimistic concurrency and retries when writing. This is a casual leaderboard and browser-generated inputs are not proof of human play.

## QA performed

- Controlled-clock checks passed for visible idle combo expiry, one-point scoring, pause through both cinematics, full Paw-sy time, early six-cat ending, mute/music behavior and reset.
- A complete browser run at a short landscape size passed. The target fit in the arena and friend instructions were visible.
- A browser run through the local review page connected to the staged Vercel server started at zero, collected six friends, posted QA Test Cat with 19 points and zero Nisa hits, and restarted at zero.
- Submitting the same signed test session twice returned the same entry ID and exactly one leaderboard row.
- The fresh standings currently contain labeled QA entries. The older board has not been deleted.
- Real iPhone/Android touch and audio output remain unverified. The 320-pixel viewport override could not be confirmed reliably in the browser tool, so narrow-device QA remains pending.

The staging test used the project's Vercel automation access. Project protection is enabled for the review URL. The public game's domain was not promoted.

The six supplied impact files are included as normalized 0.24-second gameplay edits in assets/smack-1.wav through assets/smack-6.wav. The game randomly chooses an impact and a meow. The meow starts after the impact. Original source files in Downloads were not modified.

Boss Cat has a separate pool of eight impact edits and five meows supplied by the project owner. The three-impact body-punch source has strikes near 0.18, 1.40, and 2.60 seconds. The gameplay edit keeps only the first strike. Each boss press scores one point and chooses one impact. Meows follow at a short spacing interval during rapid play to control overlap.

Landing music attempts autoplay on page entry and resumes on the first interaction if browser autoplay rules block it. The landing page has a Play music / Music on control. The Rank column has a fixed width and cannot wrap. The boss entrance has its own 1.8-second duration before the full five-second play timer starts.

Paw-sy instructions now follow each step of the two-tabby/friend sequence. Results give the nickname and score-posting action before replay. The high-score reveal lasts 2.2 seconds. Completed combos end with encouraging text.
