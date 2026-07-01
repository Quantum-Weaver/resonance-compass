# RESONANCE COMPASS v2 — MASTER CHECKLIST

## LEGEND
- ✅ Complete
- ⬜ Pending
- 🔵 Ready for Test

---

## PHASE STATUS

### Phase 0: Shell ✅
- [x] MiniPlayer (evolved from ComfortBar) always visible
- [x] Sidebar with Home, Library, Playlists, Resonance, Settings — already complete from the Echoes foundation, no changes needed
- [x] COSMIC theme system — already complete from the Echoes foundation (6 presets, `lib/cosmic/` tokens), no changes needed
- [x] **Tested:** ✅

### Phase 1: Playback ✅
- [x] Audio engine (rodio) — `src-tauri/src/audio.rs`, dedicated thread owns `OutputStream`, `Sink` shared via `Arc<Mutex<CurrentPlayback>>`
- [x] Play / pause / skip / seek / volume — `play_track`, `pause`, `resume`, `seek`, `set_volume`, `stop` commands wired to `playerStore`
- [x] State persistence across restart — implemented in Phase 2 (`playerStore.persistState`/`restoreState`, localStorage)
- [x] **Tested:** ✅

### Phase 2: Library & SQLite ✅
- [x] Directory scan — `scan_directory` command in `lib.rs` (recursive walk, lofty tag extraction, base64 cover art, `scan-progress` events)
- [x] SQLite persistence (songs table) — `libraryStore.saveScannedTracks`, batched upsert (50 rows/batch) + per-track cover art UPDATE
- [x] Artist / album / genre tabs — `src/routes/library/+page.svelte`, plus `artist/[id]` and `album/[id]` detail routes
- [x] Search — `libraryStore.search()`, 150ms debounce in the library page
- [x] State persistence across restart — `playerStore` saves currentTrack/queue/position/volume to localStorage on `beforeunload` and key transitions, restores on launch (loads into the audio engine lazily on first play, not on app open, to avoid audible playback during restore)
- [x] **Tested:** ✅

### Phase 3: Playlists ✅
- [x] Create / edit / delete playlists — `playlistStore` (`src/lib/stores/playlist.svelte.ts`), CRUD + localStorage persistence; `/playlists` list page with create/delete (confirmation dialog)
- [x] Add tracks and albums — `TrackItem`'s ⋮ menu (per-track) and album hero's "⊕ Add to Playlist" (whole album) both write through `playlistStore.addTrack`
- [x] Favorites auto-playlist (non-deletable) — id `'favorites'`, seeded on first load if missing, `deletePlaylist`/`renamePlaylist` both no-op on that id; heart icon on track rows (library album view, playlist detail) and MiniPlayer (current track) all read/write the same playlist via `playlistStore.isFavorite`/`toggleFavorite`
- [x] **Tested:** ✅

### Phase 4: Now Playing ✅
- [x] Album art display — `/nowplaying` route, 260px art with 💿 fallback, same treatment as the album detail page
- [x] GradientPulse ambient — wraps the album art, pulses while playing (already existed as a component from the home screen; reused as-is)
- [x] PlayerControls — new `src/lib/components/PlayerControls.svelte` (seekable/draggable progress bar, prev/play/next, volume slider), used full-size on `/nowplaying` and reused inside MiniPlayer's expanded panel
- [x] Shuffle / repeat — `playerStore.toggleShuffle` (reorders the queue once, Fisher-Yates, current track anchored first) and `cycleRepeat` (off → all → one), both persisted to localStorage alongside the rest of player state
- [x] **Tested:** ✅

### Phase 5: Visualizer ✅
- [x] Full-screen Canvas — `/visualizer` route, `position: fixed; inset: 0; z-index: 100` per CLAUDE.md's documented layering, tap/click to cycle modes, swipe for direction, auto-hiding overlay (track info, play/pause/skip, back), proper RAF/listener cleanup on destroy
- [x] 4 FFT modes — Bars, Waveform, Spiral, Particles, all driven by the same 64-bar spectrum data; seeded per-track fallback animation (deterministic hash, not random) when no live FFT data has arrived yet
- [x] Live badge — appears the first time a `spectrum` event lands, stays on for the rest of the session
- [x] **Tested:** ✅

### Phase 6: Equalizer ✅
- [x] 10-band EQ — `src-tauri/src/equalizer.rs`, bands 32/64/125/250/500/1k/2k/4k/8k/16k Hz, -12..+12 dB, `EqState` shared via `Arc<Mutex<>>` on `AudioState`
- [x] Biquad filters — Audio EQ Cookbook peaking filters, Q=1.4, `EqFilter<S>` wraps the decoded source (chain: Decoder → EqFilter → SampleTap → Sink, so the visualizer sees post-EQ audio), checks state every 256 samples via `try_lock()`, delay lines preserved across coefficient updates (no clicks/pops)
- [x] 6 presets in Settings — Flat/Rock/Jazz/Classical/Vocal/Bass Boost, plus unlimited custom presets (localStorage, name prompt, ✕ delete), collapsible "🎛️ Equalizer" section in `/settings`
- [x] **Tested:** ✅

### Phase 7: Resonance ✅
- [x] Emoji mood tagging per track — new `EmojiPalette.svelte` (12 emojis from `EMOJI_DEFS`, horizontal collapsible strip, scale+glow confirmation animation), embedded in MiniPlayer's expanded panel and the Now Playing screen; automatic tagging too — mid-track skip (`⏭️`, context `skip_prompt`) and favoriting (`❤️`, context `favorite`)
- [x] mood_events SQLite writes — `moodStore` (already scaffolded, completed this phase with `getMoodStats` and reactive `topEmojis`/`totalEvents`), writes through the existing `mood_events` table (no schema changes needed)
- [x] Resonance dashboard — `/resonance`, 5 tabs: Mood Map (timeline), Top Emojis (frequency bars + insight line), Pending (unanswered skip prompts with a 6-emoji quick-pick), Tag Music (searchable library, reuses `TrackItem`'s new `onTag` button), Emoji Dictionary (sensory lexicon: color/sound/texture/temperature)
- [x] **Tested:** ✅

### Phase 8: Timer ✅
- [x] Sleep timer with visualizations — `/timer`, presets 15/30/45/60/90/120 min, 7 modes ported from v1's `TimerVisualization.svelte` (Sand hourglass, Breathe, Mandala, Flower of Life, Metatron's Cube, Cycle, Numeric), mode-cycle button locked out under `prefers-reduced-motion` (numeric only)
- [x] Fade-out — toggle on the preset screen; when enabled, volume ramps to 0 over the final 60 seconds (30 steps × 2s), restores the pre-timer volume on cancel or natural expiry
- [ ] **Tested:** ⬜

### Phase 9: Home Screen Revamp ✅
- [x] Time-of-day greeting — "Good morning/afternoon/evening" (5am/12pm/5pm thresholds), personalized with vessel name if set
- [x] Recently Played row — album-based, tracked per `$effect` on `playerStore.currentTrack`, persisted to localStorage (`recent_albums`), up to 8 albums shown as `AlbumCard`s
- [x] Favorites scroll — albums derived from `playlistStore.getPlaylist('favorites')?.trackIds`, deduplicated, up to 8 shown
- [x] Sattva button — amber-glow pill, navigates to `/sattva`; Resume button shown when a track is loaded
- [x] Insight line — data-driven (favorites count + library count), never judgmental
- [x] Empty state — scan button, replaced "Recently Added" with true "Recently Played"
- [x] `AlbumCard.svelte` created (new component, ported from v0.5 archive)
- [x] MiniPlayer nav row — 🏠 Home button added
- [x] **Tested:** ✅

### Phase 10: Liked Songs ✅
- [x] Full favorited tracks list — `src/routes/liked/+page.svelte`, reads from `playlistStore.getPlaylist('favorites')?.trackIds`, maps to `Track` objects via `libraryStore.getTrackById`, reactive (unfavoriting removes the track immediately)
- [x] Sort options — Recently Added (reverse insertion order), A–Z, Artist, Most Played (dateAdded asc proxy — real playCount tracking is Phase 14 scope)
- [x] Mood filter — top 8 emojis across favorited tracks, loaded via `Promise.all` in `onMount`, "All" chip to clear, filtered count display
- [x] Play All / Shuffle All — loads `filteredTracks` into `playerStore.setQueue`
- [x] Inline mood tags shown below each track row
- [x] ⋮ menu — add to other playlists (favorites excluded)
- [x] Empty state — "No liked songs yet. Tap the ❤️ on any track to add it here."
- [x] Sidebar — ❤️ Liked nav item added (between Library and Playlists)
- [ ] **Tested:** ⬜

### Phase 11: Search ⬜
- [ ] Full-screen search
- [ ] Real-time results by category
- [ ] **Tested:** ⬜

### Phase 12: Lyrics ⬜
- [ ] Full-screen synced lyrics
- [ ] Blurred background
- [ ] **Tested:** ⬜

### Phase 13: Onboarding ⬜
- [ ] First-launch welcome
- [ ] Library scan prompt
- [ ] Sensory profile
- [ ] Theme selection
- [ ] **Tested:** ⬜

### Phase 14: Listening History ⬜
- [ ] Chronological history
- [ ] Mood tag display
- [ ] Quick replay
- [ ] **Tested:** ⬜

### Phase 15: Sattva Screen ⬜
- [ ] One-tap sensory reduction
- [ ] Breathing square
- [ ] MiniPlayer hides
- [ ] **Tested:** ⬜

### Phase 16: Sensory Profiles ⬜
- [ ] Create / edit / delete profiles
- [ ] Quick-switch
- [ ] Theme / EQ / font apply
- [ ] **Tested:** ⬜

### Phase 17: Focus Session ⬜
- [ ] Timer + playlist + UI lock
- [ ] Break reminders
- [ ] **Tested:** ⬜

### 17b	Audio Fragments (slice, export)

### 17c	Fragment Studio (DJ tools, layer, mix)

### Phase 18: Polish ⬜
- [ ] Sacred geometry icons
- [ ] Naming audit
- [ ] Dead code removal
- [ ] Accessibility pass
- [ ] **Tested:** ⬜

### Phase 19: Deploy ⬜
- [ ] Windows installer
- [ ] Android APK (signed)
- [ ] App icons
- [ ] Release notes
- [ ] **Tested:** ⬜

---

## KNOWN BUGS

| ID | Description | Status |
|----|-------------|--------|
| — | — | — |

---

## SESSION LOG

| Date | What Was Done |
|------|---------------|
| 2026-06-30 | v2 repo created from Echoes foundation. Blocks 1-5 identity migration complete. Phase 0 ready to begin. |
| 2026-06-30 | Phase 0: Shell complete. ComfortBar replaced with MiniPlayer (track placeholder, play/pause icon, expand/collapse, z-index 110, safe-area insets — non-functional until Phase 1 wires the audio engine). Sidebar and COSMIC theme system required no changes — both already complete from the Echoes foundation. Awaiting human test. |
| 2026-06-30 | Phase 1: Playback complete. `audio.rs` rodio engine (dedicated output thread, `Arc<Mutex<CurrentPlayback>>`, position/duration/track-end events). `playerStore` wired to `play_track`/`pause`/`resume`/`seek`/`set_volume`/`stop`; track-end auto-advances the queue. MiniPlayer shows live track title/artist and a progress bar; play/pause button functional. Temporary "Open File" button added to the home screen for testing (replaced by the library scanner in Phase 2). State persistence across restart was NOT implemented — it wasn't in this session's build scope; `BUILD-SEQUENCE.md`'s "Survives restart" test gate will fail until a future pass adds it. Awaiting human test. |
| 2026-06-30 | Phase 2: Library & SQLite complete. `scan_directory` Rust command walks a folder recursively, extracts metadata + embedded cover art via lofty, emits `scan-progress`. `libraryStore` rewritten: `initDB`, `scanLibrary`, batched `saveScannedTracks` (cover art written separately per-track to keep IPC payloads small), `setTracks` (builds album/artist groupings, case-insensitive artist dedup, album id = `name\|\|\|artist` per CLAUDE.md), `search`, and getters. New `/library` browser (Artists/Albums/Genres tabs, 150ms-debounced search, grid/list toggle) plus `/library/artist/[id]` and `/library/album/[id]` detail routes with Play All/Play Album. Removed the Phase 1 temporary "Open File" button; home screen now shows a Scan Library prompt when empty, or a "Recently Added" row (sorted by `dateAdded` — we don't track real play history yet, so this is the honest signal available; true "Recently Played" is Phase 9/14 scope). Fixed a real bug surfaced while wiring queue navigation: `playerStore`'s `loadTrack`/`next`/`previous` were discarding real track metadata and rebuilding filename-only placeholders — replaced with a `loadTrackObject` path that preserves the full `Track` object. Added state persistence: `playerStore` saves currentTrack/queue/position/volume to localStorage (`beforeunload` + on pause/track-change) and restores it on launch as UI-only state; the file is only loaded into the Rust audio engine on first `play()` after restore, to avoid audible playback during silent app boot — this means resuming briefly plays from position 0 before the seek lands, a known minor rough edge, not a clean "frozen at saved position" resume. `types.ts` gained `id` (Album/Artist) and `trackCount` (Artist)/`genre` (Album) fields needed for the detail routes and tabs. Awaiting human test. |
| 2026-06-30 | Phase 3: Playlists complete. New `playlistStore` (localStorage-backed, per the task spec — note this duplicates the `playlists`/`favorites` SQL tables already in `lib.rs`'s migrations from before this session; those tables remain unused, a pre-existing discrepancy between CLAUDE.md's schema docs and actual storage, not something fixed this phase). CRUD (create/delete/rename), `addTrack`/`removeTrack`, `'favorites'` auto-playlist seeded on first load and protected from delete/rename. New `TrackItem.svelte` component (heart toggle, ⋮ "Add to playlist" menu, optional ✕ remove) — ported from the v1 archive's `TrackItem.svelte`, with the lyrics/mood-tag menu items dropped since those are Phase 12/7 scope. `/playlists` list page (favorites pinned first, create/delete with confirm) and new `/playlists/[id]` detail page (Play All, per-track remove). Album detail page now uses `TrackItem` instead of bare rows, plus a hero "⊕ Add to Playlist" dropdown that adds every album track. Favorites heart wired into three surfaces: album detail track rows, playlist detail track rows, and MiniPlayer's expanded view for the current track (the closest thing to "now playing" that exists before Phase 4 builds a dedicated screen) — all three read/write the same `'favorites'` playlist via `playlistStore.isFavorite`/`toggleFavorite`. The main `/library` Artists/Albums/Genres tabs still don't have a flat per-track view, so no heart was added there — noting this rather than forcing one in. Awaiting human test. |
| 2026-06-30 | Two fixes ahead of Phase 4. (1) Sidebar backdrop: removed the `isMobile` gate so it appears whenever the sidebar is open, not just on mobile widths, matching the "hamburger always visible" convention; made it fully transparent per spec; added Escape-key dismissal to match the pattern already used elsewhere. Then: default state was still `open = !isMobile` on desktop, so a follow-up fix removed that `onMount` auto-open entirely — sidebar now defaults collapsed on every viewport, opened only by tapping the hamburger. (2) Documentation: `playlists`/`favorites` SQL tables confirmed as reserved-for-later, not in use — noted in `CLAUDE-CONTEXT.md` and as a comment above the `playlists` migration in `lib.rs`; tables themselves left untouched. |
| 2026-06-30 | Phase 4: Now Playing complete. New `/nowplaying` route — 260px album art in `GradientPulse` (pulses while playing, 💿 fallback), track title/artist/album, favorite heart, full `PlayerControls`, shuffle/repeat buttons. New `PlayerControls.svelte` (ported from the v1 archive, dropped its `Icons.svelte`/`muted` dependencies since neither exists in v2 — used plain glyphs matching the rest of the app instead): draggable/clickable seek bar, prev/play/next, volume slider; a `mini` prop hides the seek bar and volume for compact placement. Shuffle/repeat added to `playerStore`: `toggleShuffle` physically reorders the queue once (Fisher-Yates, current track anchored first) rather than v1's per-call-random-pick, so `next`/`previous` didn't need special-casing for it; `cycleRepeat` goes off → all → one, `repeatMode === 'one'` replays the current track on both manual `next()`/`previous()` presses and natural track-end (matches v1's behavior — pressing skip during repeat-one restarts the track rather than advancing). Both new fields persist to localStorage alongside the rest of player state. MiniPlayer reworked: tapping track info (both minimized and expanded) now navigates to `/nowplaying` instead of toggling the panel, so a new dedicated ⌃ button handles expand (⌄ still collapses) — these were previously the same tap target and needed to split. The expanded panel now embeds the full `PlayerControls` (real seek + volume) instead of the old static progress-bar placeholder. Not ported from v1's `nowplaying` page: the fragment creator/capture tool, "Find Cover Art" web fetch (needs a `fetch_cover_art` Tauri command that doesn't exist in v2), and the lyrics button/EmojiPalette — all out of Phase 4 scope (Phase 12, Phase 7, and a feature not requested this phase, respectively). Awaiting human test. |
| 2026-06-30 | Phase 5: Visualizer complete. New `src-tauri/src/visualizer.rs` ported from the v1 archive: `SampleTap<S>` wraps the decoded source and taps the left channel via non-blocking `try_send` over a bounded(32) crossbeam channel; a dedicated FFT thread accumulates 2048 samples (50% overlap), applies a Hann window, runs a forward FFT via rustfft, log-scale bins into 64 bars with sqrt perceptual normalization (`powf 0.65`), and emits a `spectrum` event at ~30fps. Used the `crossbeam` umbrella crate (`crossbeam::channel::*`) per the task's explicit dependency choice rather than v1's standalone `crossbeam-channel` — confirmed it re-exports the same channel API and compiles clean. `audio.rs`: `AudioState` now holds a `vis_tx` sender, `play_track` wraps the converted source in `SampleTap` before appending to the sink. `lib.rs`: channel created before the builder, FFT thread started in `.setup()` alongside `AudioState::init`. New `/visualizer` route: 4 modes (Bars/Waveform/Spiral/Particles) driven by the spectrum data, tap/click and swipe to cycle, auto-hiding overlay with track info/controls/Live badge, seeded deterministic fallback animation per track when no FFT data has arrived, full cleanup on destroy (cancel RAF, remove listeners, `pointer-events: none`). Deliberately **not** ported from v1's much larger reference file: an entire secret-key easter-egg system (per-letter color tinting, number-key speed multipliers, arrow-key hue rotation, a keyboard-hint indicator) — none of that was in this phase's spec, and the task explicitly assigns arrow keys and Space to mode-cycling and play/pause instead, which directly conflicts with v1's assignment of those same keys to hue-rotation and effect-reset. Implemented the task's literal keyboard spec instead of v1's. Added "Visualizer" to the Sidebar nav (🌊) and as a button in MiniPlayer's expanded panel. **Known interaction gap, not fixed this phase:** the visualizer page is `z-index: 100` (per CLAUDE.md), but Sidebar's panel is `z-index: 50` — opening the sidebar while the visualizer is showing will have its panel hidden behind the visualizer's opaque black background, even though the hamburger button (`z-index: 120`) stays clickable. CLAUDE.md's z-index rule never addressed where Sidebar sits relative to the visualizer, so this wasn't silently patched — worth a decision (e.g. bump Sidebar above 100) in a future pass. Awaiting human test. |
| 2026-06-30 | Fix: the Phase 5 sidebar/visualizer z-index gap was resolved — `Sidebar.svelte` now derives `isVisualizer` from the current route and hides the hamburger entirely (removed from the DOM, not just visually hidden) on `/visualizer`, plus a `$effect` force-closes the panel if it was already open when navigating there, plus the backdrop/panel-open class are defensively gated on `!isVisualizer` too so nothing can render it expanded while on that route by any path. |
| 2026-06-30 | Phase 6: Equalizer complete. New `src-tauri/src/equalizer.rs` ported from the v1 archive: 10-band biquad peaking EQ (Audio EQ Cookbook formulas, Q=1.4, bands 32Hz-16kHz), `EqState` (enabled/bands/preamp) shared via `Arc<Mutex<>>`, `EqFilter<S>` wraps the decoded source and applies all 10 bands per sample with per-channel delay lines preserved across coefficient updates (avoids clicks/pops), checks state via `try_lock()` every 256 samples so it never blocks the audio callback. Per the task's explicit instruction (differing from v1, which kept these in `lib.rs`), the 5 Tauri commands (`get_eq_state`/`set_eq_band`/`set_eq_preamp`/`toggle_eq`/`set_eq_preset`) live in `equalizer.rs` itself, reaching into a new `pub eq: Arc<Mutex<EqState>>` field on `AudioState` — the only field made public, since cross-module access was required. `audio.rs`'s `play_track` chain is now Decoder → EqFilter → SampleTap → Sink (EQ before the visualizer tap, so the FFT reflects what's actually audible, per the task's own reasoning for choosing that order). New collapsible "🎛️ Equalizer" section in `/settings` (previously nonexistent — the task described it as an existing placeholder, but Settings only had Theme/Data Sovereignty/About): 10 vertical sliders + preamp, on/off toggle, 6 built-in presets, unlimited custom presets (localStorage, name prompt, ✕ delete, "💾 Save as Custom" appears when bands are dirty). MiniPlayer's expanded panel gained a 🎛️ button that deep-links to `/settings#eq` (auto-expands and scrolls to the section on arrival); the optional compact-bar EQ icon was skipped — the minimized bar (track label + play/pause + expand chevron) was already tight on space and the task marked it optional. Awaiting human test. |
| 2026-06-30 | Phase 7: Resonance complete. `mood.svelte.ts` was already mostly scaffolded (initDB/addMoodEvent/getMoodEventsByTrack/getRecentMoods/getTopEmojis all existed) — completed with `getMoodStats()` and reactive `topEmojis`/`totalEvents` state (a `refreshStats()` composite refreshes all three after any write, matching the v1 pattern). New `EmojiPalette.svelte`: horizontal collapsible strip of the 12 `EMOJI_DEFS` emojis, scale+glow confirmation animation on tap, embedded in both MiniPlayer's expanded panel and the Now Playing screen. New `/resonance` 5-tab dashboard (Mood Map, Top Emojis, Pending, Tag Music, Emoji Dictionary) — built fresh from v1's reference rather than porting its 700-line file verbatim; skipped v1's "personal definition" editable-notes feature in the dictionary tab since the task only asked for read-only sensory lexicon display. Re-added an `onTag` prop to `TrackItem.svelte` (a "+" button) — deliberately deferred in Phase 3 as out of scope at the time, now needed for the Tag Music tab. Automatic tagging wired in: `player.svelte.ts`'s `next()`/`previous()` log a `⏭️` skip_prompt mood event when `position > 0` at the moment of the call (natural track-end already zeroes position before invoking `next()`, so it's never misidentified as a manual skip); `playlist.svelte.ts`'s `toggleFavorite()` logs a `❤️` favorite mood event, but only on the add direction, not on unfavoriting. One correction from the task's literal wording: it described the favorite-logging change as belonging in "player.svelte.ts", but `toggleFavorite` has lived in `playlistStore` since Phase 3 — implemented it there instead, where the logic actually is. The Pending tab tracks "answered" skip prompts in local component state only (not persisted, resets each session) since resolving one logs a new mood event rather than mutating/deleting the original row (matching v1's behavior) and the task's `moodStore` method list didn't include delete/update — this keeps the Pending list honest within a session without expanding the store's API. Awaiting human test. |
| 2026-06-30 | Fix: EmojiPalette wasn't actually centered in MiniPlayer's expanded panel — `.emoji-strip` had `width: 100%`, which stretched it edge-to-edge regardless of the `align-items: center` on its wrapper (centering a full-width element is a no-op). Changed to `width: fit-content; max-width: 100%;` and wrapped the MiniPlayer usage in a `justify-content: center` row with a reserved `max-width: calc(100% - 3.5rem)` clearance so it can't re-approach the fixed hamburger's corner even when scrolling content is wide. |
| 2026-07-01 | Phase 10: Liked Songs complete. New `/liked` route: full favorited track list (reactive — unfavoriting removes instantly), 4 sort modes (Recently Added, A-Z, Artist, Most Played [dateAdded proxy — real playCount is Phase 14]), mood filter chips (top 8 emojis across favorites, loaded via `Promise.all` in onMount), Play All / Shuffle All loads filtered queue, inline mood tag display per row, ⋮ menu (add to other playlists, favorites excluded), empty state. Sidebar: ❤️ Liked nav item added. v1 adaptations: `libraryStore.favoriteTrackIds` → `playlistStore.getPlaylist('favorites')?.trackIds`; `loadQueue` → `setQueue`; removed `getThemeColors` (CSS vars are global). `npm run check` 318 files 0 errors. `cargo build` clean. Awaiting human test. |
| 2026-07-01 | Phase 9: Home Screen complete. New `AlbumCard.svelte` (ported from v0.5). Home page rewritten: time-of-day greeting (vessel name personalized), Sattva amber button → `/sattva`, Resume button when track loaded, Recently Played (album-based, `$effect` on `playerStore.currentTrack` + localStorage, `untrack()` to avoid effect loop), Favorites albums (from `playlistStore.getPlaylist('favorites')?.trackIds` → album lookup), insight line (favorites count + library count), empty state with Scan Library. Replaced the Phase 2 "Recently Added" placeholder with true "Recently Played". MiniPlayer nav row: 🏠 Home button added. `npm run check` 316 files 0 errors. `cargo build` clean. Awaiting human test. |
| 2026-06-30 | Phase 8: Timer complete. Ported `TimerVisualization.svelte`'s 7 modes from the v1 archive close to verbatim (Sand hourglass with a live particle stream, Breathe, Mandala/Flower/Metatron dissolve-reveal patterns sharing one pixel-shuffle algorithm, Cycle rotating through the three dissolve patterns every 10s, Numeric) — only CSS-variable substitutions for v2's inherited theme vars, logic untouched. One deliberate architectural departure from v1: rather than a page-local `+page.svelte` holding all timer state (v1's approach), created `timer.svelte.ts` — v1's page-local design meant navigating away from `/timer` unmounted the component while its `setInterval` kept running orphaned in the background (invisible, uncancelable, and a second visit could start a stacking duplicate timer). Every other stateful feature in this codebase (player, library, playlists, mood) already lives in a `.svelte.ts` store for exactly this reason, so timer state followed the same pattern instead of reproducing the bug. `timerStore.start()` now cancels any existing timer before starting a new one. Fade-out logic, pause-on-expiry, and volume restoration on cancel were ported directly from v1's proven implementation. Added "Timer" to the Sidebar nav (⏰) and MiniPlayer's expanded panel nav row. Awaiting human test. |
