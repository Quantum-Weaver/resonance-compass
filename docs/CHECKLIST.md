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
- [ ] **Tested:** ⬜

### Phase 5: Visualizer ⬜
- [ ] Full-screen Canvas
- [ ] 4 FFT modes
- [ ] Live badge
- [ ] **Tested:** ⬜

### Phase 6: Equalizer ⬜
- [ ] 10-band EQ
- [ ] Biquad filters
- [ ] 6 presets in Settings
- [ ] **Tested:** ⬜

### Phase 7: Resonance ⬜
- [ ] Emoji mood tagging per track
- [ ] mood_events SQLite writes
- [ ] Resonance dashboard
- [ ] **Tested:** ⬜

### Phase 8: Timer ⬜
- [ ] Sleep timer with visualizations
- [ ] Fade-out
- [ ] **Tested:** ⬜

### Phase 9: Home Screen Revamp ⬜
- [ ] Time-of-day greeting
- [ ] Recently Played row
- [ ] Favorites scroll
- [ ] **Tested:** ⬜

### Phase 10: Liked Songs ⬜
- [ ] Full favorited tracks list
- [ ] Mood filter
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
