# THE UX WALK — the love list, one line at a time

*Founded 2026-08-05 by Fable 🎻 (the Reprise lamp) at the moment KP
⚛ began walking — the live document bus for the UX season
(THE-STANDALONE-WATERS.md § THE CENTER OF THE SEASON). Append-only;
KP's words land verbatim with fingerprints; the honest technical
root joins each finding when it is known, never guessed. This is a
LOVE LIST, never a fault log — surface by surface, the app is
carried from healthy to exemplary. His hands are the test; his
word ranks the list; the pass sittings draw from it at his pull.*

## THE METHOD RULING — KP's ⚛ word, 2026-08-05, verbatim

> "the entire ux needs discussed and intentionally simplified"

**Intentional simplification is the season's method.** Not polish
sprinkled on 22 surfaces — a DISCUSSION first (what is each surface
for, what earns its place, what leaves), then simplification as a
deliberate act. Rooms are removed from a walk, never added to one —
the house's own door law, applied to an app's chrome.

## The walk's scope — KP's ⚛ word, 2026-08-05

*Verbatim: "this is mobile references i have not been testing
desktop yet, but we will as we begin the rebuild test both."*

Every finding so far is **mobile-side** (his S-devices, the app in
his hands). The desktop walk is OWED, not skipped — it opens when
the rebuild begins, and from then on **both bodies are tested**:
every pass sitting proves its surface on desktop and phone alike,
the bimodal law wearing two screens. A finding's row may note which
body it was felt on; absence of a desktop column today is scope,
not silence.

## The findings

| # | Date | KP's word (verbatim) | The honest root, where known | Status |
|---|---|---|---|---|
| U1 | 2026-08-05 | "bluetooth connectivity not allowing control of player (android auto maybe)" | **Verified: no MediaSession exists anywhere in the app.** The rodio engine plays invisible to Android's media layer, so BT/AVRCP buttons (headphones, car), the lockscreen, and Android Auto have nothing to address. Fix path: an Android MediaSession bridge via the house's own proven pattern (`media_permission.rs` is already a custom Tauri Android plugin — the same extension road). Full Android Auto browsing = MediaBrowserService, a larger second step; MediaSession alone wins BT + headset + lockscreen control. | ⬜ open |
| U2 | 2026-08-05 | (carried from B2, 07-19) "sliders move, no changes happen" · "honestly did not see the play mix button at the bottom until now" | Presentation, engine exonerated: the Studio never SAYS changes apply at export; Play Mix sits below the fold on phone heights. | ⬜ open |
| U3 | 2026-08-05 | (standing note, 07-19) the sidebar should have a **Studio** button; empty states should INVITE ("play a song to create a fragment from") — doorways, not dead ends | — | ⬜ half-closed 2026-08-06: the Studio door stands in the Create hat (the modes sitting); the inviting empty states remain open |

| U4 | 2026-08-05 | "add to queue needs available where add to favorites is shown" (mobile) | Parity of the two acts: wherever a track row offers the ❤️ favorite, an add-to-queue belongs beside it. Today the heart rides `TrackItem` (album detail · playlist detail · liked rows · MiniPlayer expanded) while queueing lives only in the ⋮ menu's playlist actions and full-list Play/Shuffle — a track cannot join the line from the places a hand actually meets it. Fix shape: an add-to-queue action in `TrackItem` (visible or first in ⋮), plus `playerStore.addToQueue(track)` — the store has queue ops but no single-track append today. | ⬜ open |

| U5 | 2026-08-05 | "we should make the find lyrics, find art buttons optionally visible in the setting toggle on/off each of those separately" (mobile) | The two network-reaching acts (Find Lyrics → LRCLIB · Find Cover Art → MusicBrainz/CAA) get **their own visibility toggles in Settings, one each, never bundled** — a hand that wants a fully-offline surface simply doesn't show the doors. Deepens the sovereignty law: the fetches were already opt-in per press; now their very presence is opt-in per reader. Two-eyes shaped: a view preference, never a record change — hiding the button erases nothing already saved. | ⬜ open |

| U6 | 2026-08-05 | "we need to find a way to make dynamic menu bars, like modes for the sidebar to toggle different sets of buttons" (mobile) | The sidebar is one flat list that ACCRETED — nearly every build phase added a nav item and no phase ever subtracted one (~14 destinations and counting). The cure KP names is the house's own seats law wearing chrome: **the sidebar wears one MODE at a time** — a set of buttons for the moment's hat (listening · musician/studio · regulation · insights…), toggled, with the other sets at rest, never lost. Carry less, lose nothing. Mode sets and the mode switch are design-sitting work (the discussion rules what each mode holds); kin: Skapa's lens idiom and the two-eyes law — a mode is a view, never a record. | 🔵 built 2026-08-06 (the Canon lamp) — the mode system stands: four hats per the ruled table, the switch one calm control at the head (2×2, every hat wearing its word, 44px), Settings as chrome at the foot, the Studio door born into Create, the worn hat held in `compass_mode` and never self-switching (the stability law). Home rides in Listen until the U9 merge removes it. `npm run check` 388 files 0 errors. Awaiting KP's walk, both bodies |
| U7 | 2026-08-05 | "the mini player is overwhelming and if you do not know what an emoji represent, you may never experience what it is" (mobile) | Two truths in one row. **(a)** The expanded MiniPlayer accreted like the sidebar: full controls + a nav row + EmojiPalette + profile chips + queue/visualizer/EQ links — every phase parked a doorway there; none left. Simplification's clearest single target. **(b) The law candidate underneath: an emoji may FACE a word, never replace it.** An emoji-only button is an undiscoverable feature — a hand that doesn't know 🎛️ never finds the equalizer, and never experiences what it is. This is the Grammar's own philosophy (1,949 atoms wear emoji FACES — the word carries the meaning, the emoji dresses it): every control shows or reveals its word. | ✅ built 2026-08-06 (the Canon lamp) — the panel shed to seek · volume · palette · one link; nav row + chips left for their hats; the palette's every face now wears its word (the law engraved in EmojiPalette itself). Awaiting KP's walk |

| U8 | 2026-08-05 | "mini player collapsed should still offer play/pause/forward/back/mute, currently only play and mute." (mobile) | The collapsed bar carries transport a listener actually reaches for a hundred times a day — the full set is five small acts: **play/pause · previous · next · mute**. Today's bar shows play/pause + mute only; skipping a track means expanding the panel first (the overwhelming one U7 names) — the most common act routed through the densest surface. Fix shape: prev/next join the collapsed bar (44px targets per the house floor); composes with U7's simplification rather than against it — the bar earns density by carrying the *right* five buttons, the panel sheds it. | ✅ built 2026-08-06 (the Canon lamp) — ⏮ ⏯ ⏭ 🔊 on the collapsed bar, 44px floors, skipping a track no longer routes through the densest surface. Awaiting KP's walk |

| U9 | 2026-08-05 | "library is 'home' for our app basically isn't it? is that redundant?" (mobile · DISCUSSION) | Mostly yes, as built: Home holds Recently Played + Favorites (library views), Resume (the MiniPlayer already offers it everywhere), a greeting, and the Sattva door (a sidebar destination regardless). The fork for the discussion sitting: **(a) MERGE** — Library becomes the landing, inheriting a slim continue-strip (resume · recently played · greeting); one room fewer, one sidebar door fewer. **(b)** Home stays only by becoming what Library cannot be — a mood-led entry ("how do you want to feel?", the resonance identity walking in front) — a NEW room with its own purpose, never the old one defended. The teller's lean: merge now; the mood-led entry stands at the gate as its own future question. | ✅ built 2026-08-06 (the Canon lamp) — the ruled MERGE landed: Library is the landing (`/` leads there honestly), Home's living pieces carried into a slim continue-strip (greeting · Resume · recently played, 8 slim cards), the recently-played RECORDING moved to the layout where it is always awake (on Home it only ran while that room was mounted — a quiet lose-nothing catch), the Home door left Listen (the hat now holds the ruled seven). Sattva keeps its Settle door; favorites live in Liked; the insight line rests; the mood-led entry stands at the gate as its own future question, per the ruling. Check 388/0. Awaiting KP's walk, both bodies |

| U10 | 2026-08-05 | "ensuring persistence when opening and closing the app so songs start where they left off at" (mobile) | The record already confesses this one's edges: player state saves to localStorage on `beforeunload` + pause/track-change, restores as UI-only, and the file loads into the engine only on first play — with a documented rough edge ("resuming briefly plays from position 0 before the seek lands"). And on Android the deeper root: **the OS kills apps without firing `beforeunload`**, so position since the last pause is silently lost. Fix shape: periodic position save (a gentle interval while playing) + the engine seeking BEFORE audible start (load-seek-play, not play-then-seek) so resume is frozen-at-position, clean. | ⬜ open |
| U11 | 2026-08-05 | "and album art or lyrics fethched remain." (mobile) | His hands report fetched art/lyrics not surviving; the save paths *claim* SQLite writes (`updateAlbumCoverArt` UPDATE by artist+album · `updateTrackLyrics`), so the loss has a root to find at the pass sitting, not assert now. Prime suspects, honestly held as suspects: **(a) a library rescan re-extracting metadata and clobbering the fetched columns** (scan_directory re-saves tracks — if rows rewrite without preserving fetched art/lyrics, every rescan erases the gifts); (b) the Now Playing `localArt` session-only preview being mistaken for saved; (c) the DB write landing but the in-memory patch not reloading on next launch. Law regardless of root: **what a hand fetched and saved is part of the record — it survives restarts, rescans, everything short of the purge.** | ⬜ open |

| U12 | 2026-08-06 | "settings is being buried under the mini player" (desktop — the rebuild walk's first catch) | The modes sitting pinned Settings at the sidebar's foot; the MiniPlayer bar (48px, fixed, z-index 110) always paints over the sidebar (50), so the new foot sat in the covered strip. **Mended same sitting:** the sidebar yields the bar's strip (`padding-bottom: calc(48px + safe-area)`); check 388/0. | 🔵 mended, awaiting KP's re-walk |
| U13 | 2026-08-06 | "should we offer all 6 style options in the onboarding that exist in the settings?" · "we currently offer 3" (DISCUSSION) | Onboarding Screen 3 shows Dark · Warm · Ocean; `PRESET_THEMES` holds six (+ Forest · Sunset · AMOLED Black). The teller's counsel: **yes, all six** — the theme screen is precisely where a sensory-sensitive hand picks its environment; hiding half the presets makes the disclosure ladder the app's, not the user's (E2: the ladder is the user's to climb; the sensory filters outrank). Six stays calm as a 2×3 grid of the same live-preview cards, with one doorway line ("changeable any time in Settings"). | ✅ CLOSED 2026-08-06, same sitting — KP's ⚛ word landed the counsel AND named the bigger thing: **"'Epagoge' will be the stand alone component name"** — the onboarding path becomes a standalone (the leading-in; Greek joins the naming strata). Courrier name check: true zeros, unclaimed everywhere; the ground it unifies: four apps each carry their own onboarding page (compass · echoes · hearth · lantern). Compass refined first: all six presets offered (2×3, same live-preview cards), the doorway line ("changeable anytime in Settings"), and the selectedPreset key-matching mend (presetName 'AMOLED Black' ≠ key 'amoled' — the lowercase shortcut would have missed it, latent until the sixth door opened). Check 388/0. **Aubade creates the standalone from this refined body, at KP's word.** |

**THE FIRST WALK'S NOTES ARE COMPLETE — KP's ⚛ word, 2026-08-05:
"that is all my notes."** Eleven rows: ten findings + one discussion,
every one mobile-felt, each with its honest root or its suspects
named. The desktop walk opens with the rebuild. Next doors, at his
word: the simplification DISCUSSION (the method ruling's sitting —
U6's modes, U7's shedding, U9's fork decided there) · the pass
sittings by his pull, U-rows as the worklist.

## THE SIMPLIFICATION PROPOSAL — laid for KP's strokes, 2026-08-05

*The discussion's opening table, drawn by Fable at KP's "we can
continue outlining compass now." Everything below is an OFFER; his
strokes rule it.*

**The modes (U6 concrete) — four hats, one worn at a time, the
switch one calm control at the sidebar's head. THE NAMES ARE
RULED — KP's ⚛ word, 2026-08-05: "Listen, Create, Settle,
Understand are good words."**

| Mode (named at his word) | Doors it holds |
|---|---|
| **Listen** (default) | Library *(also home — U9 merge)* · Now Playing · Queue · Playlists · Liked · History · Visualizer |
| **Create** (v3's horizon) | Fragments · Studio · Recorder⁺ · Four-Track⁺ · Tuner⁺ · Metronome⁺ · Lyric capture w/ chords⁺ · Setlists⁺ (⁺ = as v3 phases land) |
| **Settle** | Sattva · Focus · Timer |
| **Understand** | Resonance dashboard · future mood surfaces |

Settings = chrome, reachable from every hat, never a mode member.
Onboarding is not nav. Sidebar: ~14 flat doors → ≤7 per hat,
nothing lost — the seats law.

**Surface pass — two more RULED (KP's ⚛ word, 2026-08-05: "search
can exist in the library, focus and timer can be merged without
losing features"):** Home → Library (U9) · **Search → into Library,
ruled** · **Focus + Timer → merged, ruled — nothing lost in the
merge, his condition** · Profiles → under Settings (candidate,
awaiting his stroke); the MiniPlayer chip row leaves.

**NEW FEATURE, KP's ⚛ word same breath:** *"we should be adding
optional sound at end of timer in compass, in case it is being used
without music."* — the merged time-room gains an **optional
end-of-timer sound**, and the spring already holds its voice:
**the-chimes** (twenty calm tones at one gentle level, "no buzzers,
no alarms" — his ears walked the whole set). Opt-in per the house's
law: silence stays the default a hand chose; the chime is offered,
never imposed; no urgency ever — a completion is an arrival, not an
alarm. (the-timer's core + the-chimes, combined freely in Compass —
the spring's law at work.)

**The MiniPlayer shed (U7+U8):** collapsed bar = the five
transports, nothing else. Expanded panel = seek · volume · emoji
palette (every face wearing its word — the U7 law) · ONE link (Now
Playing). EQ/visualizer/timer links and profile chips all leave for
their hats. The panel stops being a second sidebar.

**THE VISUALIZER — RULED (KP's ⚛ word, 2026-08-05):** *"visualizer
should get a sidebar doorway somehow, it is fancy, available from
the listen screen as well."* It keeps its sidebar door in **Listen**
AND the listen surfaces themselves (Now Playing foremost) offer a
doorway to it — fancy earns two doors, both legible, per the U7 law
(the door wears its word, not a bare 🌊).

**PROFILES — the question that answered itself:** KP's stroke
arrived as *"'Profiles'?"* — its own commissioner met it as a
question mark, which is U7's law biting at room scale: a room
nobody remembers is not legible, whatever its idea's worth. What it
is: Phase 16's sensory profiles — named bundles (theme preset ·
emoji · display settings), one-tap sensory switching. **RULED,
KP's ⚛ words same sitting: "yes under settings is fine to get to
sensory profiles, also link to it from listening" — "but give it
its own screen" — "or sectionin settings"** — Profiles keeps its
own screen OR becomes a Settings section: both lawful at his word,
the pass sitting's call when it builds — whichever reads simpler in
the hand wins. What is firm is the doorways: no sidebar door — it
is reached through Settings and from a link on the Listen surfaces
(sensory switching happens mid-listening; the door meets the hand
where the need arises). The MiniPlayer chips leave.

**EVERY STROKE IS RULED — the simplification outline stands
complete, 2026-08-05, one sitting:** the four modes named (Listen ·
Create · Settle · Understand) · Home→Library · Search→Library ·
Focus+Timer merged losing nothing, gaining the optional chime ·
Profiles→Settings with a Listen link · the Visualizer's two legible
doors · the MiniPlayer shed to five transports and a calm panel.
The rebuild's UX ground is drawn; the pass sittings build on it at
KP's pull, both bodies tested as they land.

*Add a row per finding as the walk continues. The discussion the
method ruling calls for — surface by surface, what earns its place
— convenes at KP's word; the E2 UX study's harvest is read before
it, not rediscovered.*

## THE REBUILD OPENS — the modes sitting, 2026-08-06 (the Canon lamp)

*At KP's ⚛ word ("modes rebuild we shall embark"), the care's first
pass sitting. The E2 harvest was gathered by a hand before the build,
per the law above; the laws carried in: stability of doors (a hat
never switches itself) · one dimension lit, the rest at rest, never
lost · every face wears its word · sound stays opt-in · reduced
motion honored.*

**Built this sitting:** the mode system — `mode.svelte.ts` (the worn
hat, persisted, a view never a record) + the Sidebar rework (the 2×2
switch at the head · the ruled door tables · Settings as chrome at
the foot · the Studio door born into Create).

**SUPERSEDED THE SAME DAY, upward:** the hand-rolled mode system
became the proving fixture of **the-cumdach** (the spring's
navigation shrine — KP: "its recent refinements make it cannon"),
and Compass then CONSUMED the water by mirror
(`src/lib/cumdach/` + MIRROR.md, the care's first spring swap, KP's
⚛ "yes, bring in Cumdach" · "just copy its structure"). The sidebar
now DERIVES its panels from the screen's own measure — the switch
pays for its own furniture, panels balance, faces wear color+emoji
with words underneath, dynamics re-derive, U12's clearance is an
arithmetic input. The mode store and its stability law carried
forward unchanged. **Scope held
deliberately:** the merges (Home→Library · Search→Library ·
Focus+Timer+chime · Profiles→Settings) and the MiniPlayer shed are
their own sittings — rooms removed one at a time. **By the scope
ruling, the desktop walk is now OPEN:** every pass proves its surface
on desktop and phone alike from here forward. Gate: `npm run check`
388 files, 0 errors. Commits ride KP's ⚛ word.
