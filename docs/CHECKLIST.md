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

### Phase 7b: Personal Emoji Definitions (Folksonomy) ✅
- [x] `moodStore.personalDefinitions` — reactive `$state<Record<string, string>>({})`, loaded from localStorage (`emoji_def_${emoji}` keys), auto-loaded in `initDB()` and callable via `loadPersonalDefinitions()`
- [x] `moodStore.setPersonalDefinition(emoji, def)` — writes to localStorage, updates reactive state
- [x] `moodStore.getPersonalDefinition(emoji)` — reads from reactive state (synchronous)
- [x] Emoji Dictionary tab — two-column layout: "Sanctuary" (canonical sensory lexicon, read-only) | "Yours" (editable textarea, saves on blur, Enter, or Save button)
- [x] Personal definition shown in EmojiPalette — brief italic hint appears below the strip for 800ms after an emoji is confirmed, only if a personal definition exists for that emoji
- [x] `npm run check` — 322 files, 0 errors; `cargo build` — 0 errors
- [x] **Tested:** ✅

### Phase 8: Timer ✅
- [x] Sleep timer with visualizations — `/timer`, presets 15/30/45/60/90/120 min, 7 modes ported from v1's `TimerVisualization.svelte` (Sand hourglass, Breathe, Mandala, Flower of Life, Metatron's Cube, Cycle, Numeric), mode-cycle button locked out under `prefers-reduced-motion` (numeric only)
- [x] Fade-out — toggle on the preset screen; when enabled, volume ramps to 0 over the final 60 seconds (30 steps × 2s), restores the pre-timer volume on cancel or natural expiry
- [x] **Tested:** ✅

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
- [x] **Tested:** ✅

### Phase 11: Search ✅
- [x] Full-screen search — `src/routes/search/+page.svelte`, auto-focused input on page load
- [x] Real-time results — 150ms debounce via `$effect` cleanup pattern, case-insensitive partial matching across title/artist/album
- [x] Category tabs — All | Artists | Albums | Tracks; "All" limits: 3 artists, 3 albums, 5 tracks; "See all N →" switches tab
- [x] Artists tab — avatar (initial letter), name, track count; taps navigate to `/library/artist/[id]`
- [x] Albums tab — AlbumCard grid (130px), taps navigate to `/library/album/[id]`
- [x] Tracks tab — TrackItem rows with heart + ⋮ menu; tapping loads full `matchedTracks` as queue (not just the preview slice), starting at tapped track
- [x] Recent searches — last 10 persisted to localStorage, deduplicated newest-first, tap to re-run, Clear button
- [x] Empty states — library stats when idle, "No results for…" when query has no matches
- [x] Sidebar — 🔍 Search nav item added (between Home and Library)
- [x] **Tested:** ✅

### Phase 12: Lyrics ✅
- [x] Full-screen synced lyrics — `src/routes/lyrics/+page.svelte`, LRC parser (`[mm:ss.cc]` timestamps), current line white+bold+glow, past lines dimmed, auto-scroll via `scrollIntoView` `block: center`
- [x] Static lyrics fallback — plain text split to lines, current line estimated by playback percentage through track
- [x] Blurred album art background — `filter: blur(48px) brightness(0.28) saturate(1.6)` + dark overlay; gradient fallback when no cover art
- [x] Sync guard — LRC sync only when viewed track matches currently playing track (`isSyncEnabled`)
- [x] Font size A−/A+ — persisted to localStorage (`lyrics_font_size`), 0.9–2.4rem range
- [x] Tap to toggle header — immersive mode hides title/back row with slide-up animation; font controls always visible
- [x] Back button — "← Now Playing" via `window.history.back()`
- [x] **Part B: Find Lyrics** — `fetch_lyrics` Rust command, LRCLIB API (`https://lrclib.net/api/get`), `reqwest` 0.12 with `rustls-tls`, 8s timeout, errors return `Ok(None)` (never panics)
- [x] Find Lyrics button — appears only when lyrics are missing; user-initiated only (never automatic)
- [x] Fetch flow — loading spinner → preview (first 5 lines) → Save / Dismiss; "No lyrics found" graceful state; "Could not reach lyrics service" on network error
- [x] Save lyrics — `libraryStore.updateTrackLyrics()` writes to SQLite + updates in-memory track; `localLyrics` session state overrides without needing a store reload
- [x] Lyrics button on Now Playing — 🎤 in extra-controls row, navigates to `/lyrics?trackId=[id]`
- [x] `reqwest` — added to `Cargo.toml` with `rustls-tls` + `json` features (Android-compatible, no native-tls)
- [x] `songs` table — `lyrics TEXT` already present in migration v1; no new migration needed
- [x] `npm run check` — 322 files, 0 errors; `cargo build` — 0 errors
- [x] **Tested:** ✅

### Phase 12b: Find Missing Cover Art ✅
- [x] `fetch_cover_art` Rust command — MusicBrainz release query → Cover Art Archive front cover download → base64 data URI; `User-Agent: ResonanceCompass/2.0.0`, 10s timeout, all errors return `Ok(None)` (never panics)
- [x] Album detail page — 🖼️ Find Cover Art button appears when album has no cover art; loading → preview thumbnail → Save/Dismiss; not_found + error states with dismiss
- [x] Now Playing page — same flow; `localArt` session state overrides display art without needing a store reload; `displayArt = $derived(localArt ?? currentTrack?.coverArt ?? null)`
- [x] `libraryStore.updateAlbumCoverArt(albumId, coverArt)` — SQL UPDATE by artist + album name, updates all tracks in the album; patches in-memory track objects and album object (Svelte 5 deep proxy triggers reactivity)
- [x] User-initiated only — never automatic; button only visible when cover art is absent
- [x] `npm run check` — 322 files, 0 errors; `cargo build` — 0 errors
- [x] **Tested:** ✅

### Phase 13: Onboarding ✅
- [x] Screen 0: Welcome — name input (`resonance-compass-vessel-name` localStorage), GradientPulse sigil, "Skip setup" advances without saving name
- [x] Screen 1: Library Setup — `libraryStore.scanLibrary()`, progress bar (`scanProgress` 0–1), idle/scanning/error/done states, "I'll do this later" skip
- [x] Screen 2: Sensory Profile — 8 `EMOJI_DEFS` chips, select up to 3, saves to `sensory_profile` localStorage
- [x] Screen 3: Theme — 3 cards (Dark/Warm/Ocean), live preview via `themeStore.setPreset()`, checkmark on active
- [x] Screen 4: Complete — GradientPulse ✓ sigil, library track count, "Enter Resonance Compass" sets `onboarding_complete` + `goto('/')`
- [x] 5 progress dots — pill-expands on active, fades past dots, outside screen content
- [x] Layout integration — `+layout.svelte` already complete: `isOnboarding` derived, Sidebar/MiniPlayer hidden, `onMount` redirect if `onboarding_complete` unset
- [x] `npm run check` — 322 files, 0 errors; `cargo build` — 0 errors
- [x] **Tested:** ⬜

### Phase 14: Listening History ✅
- [x] History tracking added to `playerStore` — `HistoryEntry` (id/trackId/title/artist/album/coverArt/duration/timestamp), recorded in `loadTrackObject` for every fresh track start (skipped for repeat-one loops and session resume via `record=false` / `resumeAt > 0`), capped at 500 entries, debounced 1s flush to localStorage (`listening_history`), loaded in `restoreState`
- [x] Chronological history — `/history` route, grouped Today / Yesterday / This Week / Earlier, sticky group labels, relative timestamps ("just now" / "12m ago" / weekday / date)
- [x] Mood tag display — up to 3 emojis per row from `moodStore.recentMoods` (refreshed to 100 on mount); ❤️ shown for favorited tracks
- [x] Quick replay — tap a row to play (`setQueue([track], 0)`); rows for tracks no longer in the library are disabled at 45% opacity
- [x] Clear History — confirmation row (Clear / Cancel) before `playerStore.clearHistory()`
- [x] Sidebar — 🕐 History nav item (between Resonance and Timer)
- [x] `npm run check` — 324 files, 0 errors
- [ ] **Tested:** ⬜

### Phase 15: Sattva Screen ✅
- [x] One-tap sensory reduction — `/sattva`, full-screen fixed overlay (z-index 200), tap anywhere / Enter / Space / Escape to exit, fade-out transition (skipped under `prefers-reduced-motion`)
- [x] Breathing square — canvas square at 60% of the smaller viewport dimension, gold (#FDCB6E) inhale / purple (#6C5CE7) exhale phases, soft outer glow + crisp inner line + faint fill, 4-count number fades in/out with the phase, sine-pulsed border alpha
- [x] Minimal toggle — 44px corner dot button disables/enables the visualization without exiting
- [x] Enter: saves theme JSON + volume + full EQ snapshot (`get_eq_state`), then applies calm theme preset, reduced-bass EQ (-3dB on the 3 lowest bands), 25% volume reduction, optional Sattva playlist switch (saves the previous queue + current track)
- [x] Exit: restores queue (re-anchored to the previous track), volume, theme (localStorage key `resonance-compass-theme` + `loadTheme()`), and EQ snapshot; restore is idempotent (`stateRestored` guard) and also runs from `onDestroy` so navigating away by any path restores state
- [x] MiniPlayer hides on /sattva — layout `hideChrome` derived (onboarding OR sattva)
- [x] Sidebar hides on /sattva — same gate
- [x] `npm run check` — 326 files, 0 errors
- [ ] **Tested:** ⬜

### Phase 16: Sensory Profiles ✅
- [x] `profile.svelte.ts` store — `SensoryProfile` (name, emoji, theme preset, font size, EQ preset, playlist), localStorage persistence (`sensory_profiles` / `active_profile_id` / `profile_prev_theme` / `profile_show_mp`)
- [x] Create / edit / delete — `/profiles` page: create form (12 quick emojis + name input, Enter/Escape), inline edit panel (emoji, name, all 6 theme presets, 3 font sizes, 6 EQ presets, playlist picker), delete with inline confirm
- [x] Activate / deactivate — activating saves the pre-profile theme once, applies theme preset + font size + `set_eq_preset`; deactivating (or deleting the active profile) restores the saved theme
- [x] Quick-switch from MiniPlayer expanded panel — profile chips row (emoji + name, active highlighted, tap toggles), ⚙ chip navigates to `/profiles`; hideable via Settings toggle (`showInMiniPlayer`)
- [x] Settings section — profile count, Manage → link, "Show quick-switch in the MiniPlayer panel" checkbox
- [x] Profiles loaded in `+layout.svelte` onMount
- [x] `npm run check` — 329 files, 0 errors
- [ ] **Tested:** ⬜

### Phase 17: Focus Session ✅
- [x] `focus.svelte.ts` store — `FocusSession` (active) + `FocusRecord` (history, capped 50) + `FocusSettings` (defaults), localStorage (`focus_sessions` / `focus_settings`)
- [x] Timer + playlist + UI lock — `/focus` setup screen: duration presets 25/45/60/90 + custom (1–480 min), playlist picker (or Current Queue), Lock UI toggle, Break Reminder toggle; settings persist as next session's defaults
- [x] SVG countdown ring — 200×200 viewBox, accent arc drains as elapsed/planned progresses, m:ss remaining
- [x] Hold-to-end button — 1.5s pointer hold with filling SVG ring, pointer capture, cancel on release/leave
- [x] Break reminder at 50% — one-time toast (8s, `aria-live="polite"`): "Halfway. Take a breath if you need it. 🌿"
- [x] Session history — past sessions list (✅ completed / ⏹ ended early, date, actual vs planned minutes, tracks played, playlist), Clear button
- [x] Session resume — if a session is active on mount (navigated away unlocked), the timer re-derives elapsed/remaining from `startedAt` and continues, or completes if it expired while away
- [x] Completion — 🎯 mood event (context `focus_complete`) on the playing track, stats card (focused time / tracks / playlist), start-another / back-home
- [x] Track counting — `$effect` on `currentTrack` increments `tracksPlayed` on change during active phase
- [x] Sidebar — 🎯 Focus nav item
- [x] `npm run check` — 332 files, 0 errors
- [ ] **Tested:** ⬜

### Phase 17a: Audio Fragments ✅
- [x] ✂️ Fragment creator on Now Playing — modal (bottom sheet, z-index 130 above MiniPlayer), opens centered ±7.5s around the playhead
- [x] Draggable start/end markers — pointer-captured handles on a timeline with live playhead, 1s minimum span, keyboard arrow-key nudging on both handles
- [x] Set Start/End at current position buttons; live start/duration/end readout
- [x] Preview — seeks to start, plays, auto-pauses at the end marker (200ms poll)
- [x] Name and save — default name "{title} — Fragment N", saved metadata in `fragmentStore` (localStorage `audio_fragments`)
- [x] Rust `create_fragment` — ffmpeg `-ss/-to -c copy` into app-data `fragments/` dir, filename sanitized, `ffmpeg_not_found` surfaced as a friendly install hint; `export_fragments` (copy to destination dir) also ported
- [x] `/fragments` page — list with play (loads as a single-track queue), rename (inline input), emoji tag (12-emoji picker), favorite, add-to-playlist, delete (confirm)
- [x] Sidebar — ✂️ Fragments nav item
- [x] `npm run check` — 335 files, 0 errors; `cargo build` — 0 errors
- [ ] **Tested:** ⬜

### Phase 17b: Fragment Studio ✅
- [x] Layer multiple fragments — `/fragments/studio`, add any fragment as a layer (new layers default to appending at the current mix end), reorder ↑↓, remove; per-layer start offset in seconds
- [x] Volume/pan per fragment — 0–150% volume slider, L/C/R pan slider (-1..1), both live in the layer card, slider accent matches the layer color
- [x] Crossfade between fragments — per-layer fade in/out inputs, plus ⤨ Crossfade action: lays layers end-to-end in list order with configurable overlap, setting matching fade-out/fade-in at every seam
- [x] Export mix — Rust `export_mix` command: one ffmpeg input per layer, filter chain `aresample → afade in → afade out → volume → pan → adelay`, `amix duration=longest normalize=0`, output WAV (pcm_s16le) to app-data `mixes/`; `ffmpeg_not_found` gets the friendly install hint; ▶ Play Mix loads the exported file into the normal player
- [x] Save/load arrangements — `studio.svelte.ts` (`fragment_arrangements` localStorage), save (updates the loaded arrangement or creates new), load, delete; layers reference fragments by id so renames/tags stay live
- [x] Timeline visualization — one lane per layer, bar position/width = offset/duration against total, layer colors, total duration readout
- [x] Missing-fragment guard — layers whose fragment was deleted are flagged in the card and excluded from export
- [x] 🎚 Studio link in the /fragments header
- [x] `npm run check` — 338 files, 0 errors; `cargo build` — 0 errors
- [ ] **Tested:** ⬜

### Phase 18: Visualizer Enhancement ✅
- [x] **Live-spectrum bug fixed (FIX 3 root cause):** the `smoothedBars ← targetBars` smoothing loop lived inside `drawBars` only — Waveform/Spiral/Particles read `smoothedBars` but it froze at stale values in any non-Bars mode. Smoothing hoisted to `smoothSpectrum()`, run once per frame in `draw()` before mode dispatch
- [x] Bars — live spectrum confirmed; per-bar logic extracted into shared `barLevel(i, ts)` (live value, or seeded per-track sine fallback)
- [x] Waveform — per-segment `barMod` from live bars + overall `fftEnergy()` amplitude now actually update every frame
- [x] Spiral — `bassEnergy()` (bars 0–8) drives the pulse, now live in-mode
- [x] Particles — spawn rate + speed from live `fftEnergy()`, now live in-mode
- [x] Pause decay — when playback stops, smoothed bars ease to zero instead of freezing at the last frame
- [x] ✳ Mandala — 5 concentric rings × 12-fold symmetry dots; inner rings fed by bass bands, outer by treble; bass pulses ring radii + core circle; rings counter-rotate
- [x] ❀ Flower of Life — the 19-circle hexagonal pattern; circle radii breathe with mid energy, ring brightness maps bass/mid/treble, rotation speed follows treble
- [x] ⬡ Metatron's Cube — 13 Fruit-of-Life nodes + all 78 connecting lines; line glow follows treble, node size follows bass + its own band, rotation follows overall energy
- [x] All three new modes react to frequency data live and fall back to seeded per-track motion when no FFT has arrived (same fallback contract as the original four)
- [x] `npm run check` — 338 files, 0 errors
- [ ] **Tested:** ⬜

### Phase 18a: UX Review + FIX 1 + FIX 2 ✅
- [x] **FIX 1 (double vertical scroll):** `.main-content` in the layout is now the ONLY page scroller. Nested `overflow-y: auto` removed from: liked (page root AND track list — it had both), home, library list, search results area, playlists list, playlist detail track list, album detail track list, fragment studio panels. Constrained `height: 100%` page roots converted to flowing `min-height: 100%` (liked, search)
- [x] **FIX 1 — intentional exceptions (each is the single scroller of a fixed full-screen surface, not nested):** lyrics `.lyrics-scroll` (page is a fixed immersive overlay), onboarding `.screen-wrap` (pinned progress dots below), Sidebar panel (fixed drawer overlay)
- [x] **FIX 2 (horizontal scroll):** `overflow-x: hidden` added to `.main-content` — global guarantee that no page can scroll horizontally. Grid/option rows all use `flex-wrap` (verified: profiles option rows, focus preset rows, studio controls, emoji grids)
- [x] **FIX 2 — intentional contained carousels (clip inside viewport width, not page scroll):** home Recently Played/Favorites album rows (`.h-scroll`), Settings EQ slider row (10 × 44px sliders can't fit a 360px phone without becoming untappable), EmojiPalette strip
- [x] MiniPlayer behavior — hidden on /sattva + /onboarding (layout gate); covered by fixed overlays on /visualizer, /focus (locked), /lyrics; visible everywhere else; expand collapses on route change
- [x] Touch targets ≥ 44px — new-phase screens built at 44px floor; retrofits: MiniPlayer nav buttons, TrackItem heart + ⋮ menu, visualizer overlay controls (40→44), Sattva toggle (28→44, done in Phase 15)
- [x] Empty states are gentle — verified: history ("Start playing music and it will appear here."), fragments ("Every fragment contains the whole."), profiles, focus, studio, liked, search, library — no scolding, no exclamation-mark urgency
- [x] `npm run check` — 338 files, 0 errors
- [ ] **Tested:** ⬜

### Phase 18b: Resonance Check ✅
- [x] Export ALL data as JSON — `buildSnapshot()`: songs table via `libraryStore.tracks` (includes lyrics + base64 cover art), all mood events (`moodStore.getAllMoodEvents()`), and **every** localStorage key (playlists, listening history, fragments, arrangements, sensory profiles, focus sessions/settings, sattva settings, theme, custom EQ presets, personal emoji definitions, player state, vessel name, onboarding flag, recent searches/albums) — enumerating localStorage wholesale means no store can be forgotten as new features land
- [x] Import — Import Data button → file picker → validates `format: 'resonance-compass-export'` → confirm card with summary (N tracks · N mood events · N settings entries) → restores localStorage + `libraryStore.importTracks()` (upsert by id) + `moodStore.importMoodEvents()` → `location.reload()` so every store reinitializes from restored state
- [x] Restore coverage — library ✓ playlists ✓ mood events ✓ history ✓ fragments (metadata) ✓ settings/theme/EQ/profiles/focus ✓ (fragment *audio files* live in app-data `fragments/`, outside the webview's reach — noted in the phase log)
- [x] No internet required — audited: the only network calls in the entire app are `fetch_cover_art` (MusicBrainz) and `fetch_lyrics` (LRCLIB), both behind user-initiated buttons that only appear when data is missing; playback, library, moods, fragments, mixes, export/import are fully local
- [x] Purge all data — `clearLibrary()` + `moodStore.purgeAll()` + `localStorage.clear()` (previously missed everything except 3 keys) + reload into onboarding; double confirmation retained
- [x] `npm run check` — 338 files, 0 errors
- [ ] **Tested:** ⬜ (human: export → purge → verify empty → import → verify everything back)

### v1 Parity: Queue Screen ✅
- [x] `/queue` route — Up Next list (TrackItem rows, current track highlighted at the playing index), Clear All (keeps the playing track), tap to jump-play, ✕ remove per row
- [x] `playerStore` queue ops added — `playFromQueue(i)`, `removeFromQueue(i)` (shifts `queueIndex` so `next()` stays correct), `clearQueue()`
- [x] Now Playing header — "Queue →" link restored (v1 had it; v2 had dropped it)
- [x] `npm run check` — 340 files, 0 errors
- [ ] **Tested:** ⬜

### Phase 18c: Polish ⬜
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
| 2026-07-01 | Phase 12b: Find Cover Art + Phase 7b: Personal Emoji Definitions complete. `fetch_cover_art` Rust command (MusicBrainz → Cover Art Archive, reqwest, 10s timeout, User-Agent header, Ok(None) on all errors). `libraryStore.updateAlbumCoverArt()` (SQL UPDATE by artist+album, patches in-memory tracks + album). Find Cover Art flow on album detail page and Now Playing (preview thumbnail, Save/Dismiss, localArt session override). Phase 7b: `moodStore.personalDefinitions` ($state, localStorage `emoji_def_*`), `setPersonalDefinition`/`getPersonalDefinition`, `loadPersonalDefinitions` (called in initDB + resonance onMount). Emoji Dictionary tab rewritten with two-column layout: "Sanctuary" (read-only sensory lexicon) | "Yours" (editable textarea, saves on blur/Enter/Save). EmojiPalette: italic personal definition hint shown for 800ms after confirmation. `npm run check` 322 files 0 errors. `cargo build` clean. Awaiting human test. |
| 2026-07-01 | Phase 12: Lyrics complete. New `/lyrics` route: full-screen immersive view, blurred album art background (blur(48px) brightness(0.28)), LRC parser (`[mm:ss.cc]` format), auto-scroll `scrollIntoView` on current line, static fallback (percentage-based position), font size A−/A+ (localStorage), tap-to-toggle header. Find Lyrics: `fetch_lyrics` Rust command (LRCLIB API, reqwest 0.12 rustls-tls, 8s timeout, never throws), opt-in only — button shown when lyrics missing, preview → Save → writes to SQLite + in-memory via `libraryStore.updateTrackLyrics`. 🎤 button added to Now Playing extra-controls row. `songs` table already had `lyrics TEXT` from migration v1. `npm run check` 322 files 0 errors. `cargo build` clean. Awaiting human test. |
| 2026-07-02 | Phase 18b: Resonance Check complete. The old export only serialized library tracks, and purge only deleted the songs table plus 3 hand-picked localStorage keys — playlists, history, fragments, profiles, moods all survived a "purge" (a sovereignty bug, not just a feature gap). Rebuilt: export snapshots the songs table + all mood events + the entire localStorage keyspace; import validates, confirms with a summary, restores, and reloads; purge deletes the songs table + mood_events + `localStorage.clear()`. One honest limitation documented: fragment/mix *audio files* in app-data (`fragments/`, `mixes/`) are not inside the JSON export — their metadata is, and the files survive purge-of-data (Android uninstall removes them; a future pass could add a Rust command to zip them into exports). Also: `moodStore.getAllMoodEvents/importMoodEvents/purgeAll` and `libraryStore.importTracks` added. Awaiting human test of the full loop. |
| 2026-07-02 | Phase 18a + FIX 1 + FIX 2 complete. Scroll audit across all 20 routes: eight nested vertical scrollers removed (worst was /liked with page-root scroll AND inner list scroll — three stacked scroll contexts counting .main-content); two constrained page roots un-constrained. `.main-content` gained `overflow-x: hidden` as the global horizontal guarantee. Three exceptions kept deliberately, each documented in the phase entry: full-screen fixed surfaces own their single scroller (lyrics, onboarding, sidebar drawer), and three contained horizontal controls remain scrollable by design (home album carousels, EQ slider row, EmojiPalette strip) — killing those would break their function, and they cannot cause page-level horizontal scroll now that .main-content clips. Touch-target retrofits on MiniPlayer/TrackItem/visualizer buttons. Sticky group headers in /history still work — they stick against .main-content since no intermediate scroll context remains. Awaiting human test: scroll every screen top-to-bottom on Android, confirm exactly one scrollbar and zero horizontal drift. |
| 2026-07-02 | Phase 18: Visualizer Enhancement + FIX 3 complete. Root cause found and fixed: spectrum smoothing only ran inside `drawBars`, so Waveform/Spiral/Particles — which all correctly *read* `smoothedBars` — were reacting to a frozen snapshot from the last time Bars mode rendered (or zeros). Smoothing hoisted into the frame loop (`smoothSpectrum()` in `draw()`); per-bar seeded fallback extracted to `barLevel()` shared by all seven modes; `bandLevel(lo,hi)` added for band-driven modes. Also: bars now decay to silence on pause instead of freezing. Three sacred geometry modes added (Mandala, Flower of Life, Metatron's Cube) — geometry-true (19-circle FoL, 13-node/78-line Metatron), frequency-reactive by band, seeded fallback, `prefers-reduced-motion` honored (no rotation). Timer's dissolve-based Mandala/Flower/Metatron visualizations are unrelated and untouched. Awaiting human test — verify each of the 7 modes shows the Live badge and visibly reacts. |
| 2026-07-02 | Phase 17b: Fragment Studio complete. No v1 reference existed (v1 stopped at fragment capture/list) — built fresh on the established patterns: mixing happens in Rust via ffmpeg `filter_complex` (consistent with `create_fragment`'s ffmpeg choice; no Web Audio, so no need to stream file bytes into the webview), arrangements persist in localStorage like every other lightweight store. Design choices worth knowing: pan implemented with the core `pan=stereo\|c0=L*c0\|c1=R*c1` filter rather than `stereotools` (not present in all ffmpeg builds); export is WAV-only for now (lossless, universally decodable by rodio); "Crossfade" is an explicit arrange-action rather than a live DJ transition — it repositions layers with overlapping fades, honest to what an offline mixer can do. Exported mixes are playable in-app immediately and land in listening history like any track. Awaiting human test. |
| 2026-07-01 | Phase 17a: Audio Fragments complete. Rust `create_fragment`/`export_fragments` ported verbatim from v1's lib.rs (ffmpeg stream-copy slicing — no re-encode, instant, format-preserving). `fragment.svelte.ts` ported unchanged. Now Playing gained the ✂️ button + capture modal; port adaptations: `playerStore.seek()` wrapper instead of raw `invoke('seek')`, v2 Track shape in `/fragments`' `playFragment` (v1's had fileSize/bitrate/playCount fields v2 doesn't define), `setQueue([track])` instead of `loadTrack`, arrow-key handlers added to the drag handles (v1 had `role="slider"` but no keyboard support — a11y gap), touch targets ≥44px. Fragment playback routes through the normal player, so fragments land in listening history and can be mood-tagged like any track. Note: fragments live in localStorage (v1 pattern) even though a `fragments` SQL table exists in migrations — same reserved-table situation as playlists, documented in CLAUDE-CONTEXT. Awaiting human test. |
| 2026-07-01 | Phase 17: Focus Session complete. Store ported from v1 unchanged. Page ported with v2 adaptations: global CSS vars replace `getThemeColors` inline injection; SVG ring stroke uses `style="stroke: var(--accent)"` (presentation attributes can't hold `var()`); `setQueue` replaces `loadQueue`; the completion mood event context renamed `track_end` → `focus_complete` (v1 reused the skip-tracking context, which would have polluted skip analytics); settings are now saved on session start (v1 read `focus_settings` but never wrote it — defaults never persisted); custom durations restore correctly on mount (v1 dropped non-preset values back to 25). Lock UI works via the overlay's `position: fixed; z-index: 200` sitting above MiniPlayer (110) and hamburger (120) — no layout gating needed. Sidebar 🎯 Focus nav item added. Awaiting human test. |
| 2026-07-01 | Phase 16: Sensory Profiles complete. Store ported from v1 with two corrections: v1's `createProfile` stored `themeStore.config.presetName` (a display name like "Dark") as the theme preset, but `setPreset()` expects the lowercase key — activating a self-created profile would have silently failed; v2 derives the key by matching against `PRESET_THEMES`. And v1's theme save/restore used the nonexistent `themeConfig` localStorage key — v2 uses `resonance-compass-theme`. `/profiles` page ported with global CSS vars, no nested scroll container, and 44px touch targets (emoji buttons grown from 32px, icon buttons from ~28px). MiniPlayer expanded panel: profile chips row with active state + ⚙ manage link, gated on `showInMiniPlayer`. Settings: new Sensory Profiles section (count, Manage →, MiniPlayer toggle). Profile's stored `playlistId` is a label/summary association (as in v1) — activation deliberately does not hijack the playing queue. Awaiting human test. |
| 2026-07-01 | Phase 15: Sattva Screen complete. Ported v1's sattva page nearly verbatim (breathing square canvas, 4-count opacity envelope, phase colors, EQ/theme/volume/playlist save-restore) with three v2 adaptations: `playerStore.setQueue` replaces v1's `loadQueue`; theme snapshot uses v2's real localStorage key `resonance-compass-theme` (v1 read `themeConfig`, which doesn't exist in v2 — restore would have silently no-opped); exit destination defaults to `/` instead of v1's `/resonance`. Toggle dot grown 28px → 44px for the touch-target floor. Layout: `isOnboarding`-only chrome gate generalized to `hideChrome` (onboarding OR sattva) — Sidebar and MiniPlayer now unmount on /sattva. Home's Sattva button (Phase 9) already pointed here. Awaiting human test. |
| 2026-07-01 | Phase 14: Listening History complete. History tracking did NOT already exist in v2's `playerStore` (the task brief assumed it did) — ported it from the v1 archive's player store: `HistoryEntry` + 500-cap list + debounced localStorage flush, recorded in `loadTrackObject` (the single funnel every track start passes through), with `record=false` on repeat-one replays and no record when `resumeAt > 0` (session resume), matching v1's "same track looping — don't duplicate history" guard. `/history` page ported from v1 with v2 adaptations: global CSS vars instead of `getThemeColors`, `playlistStore.isFavorite` instead of v1's `libraryStore.isFavorite`, `setQueue([track], 0)` instead of v1's `loadTrack`, and **no nested scroll container** — v1's page was `height:100%; overflow:hidden` with an inner `overflow-y:auto` list (a double-scroll setup per FIX 1); v2's page is normal flow, `.main-content` is the only scroller, sticky group labels stick against it. Grouping simplified to the spec's Today/Yesterday/This Week/Earlier (v1 had Last Week + month names). Sidebar 🕐 nav item added. Awaiting human test. |
| 2026-06-30 | Phase 8: Timer complete. Ported `TimerVisualization.svelte`'s 7 modes from the v1 archive close to verbatim (Sand hourglass with a live particle stream, Breathe, Mandala/Flower/Metatron dissolve-reveal patterns sharing one pixel-shuffle algorithm, Cycle rotating through the three dissolve patterns every 10s, Numeric) — only CSS-variable substitutions for v2's inherited theme vars, logic untouched. One deliberate architectural departure from v1: rather than a page-local `+page.svelte` holding all timer state (v1's approach), created `timer.svelte.ts` — v1's page-local design meant navigating away from `/timer` unmounted the component while its `setInterval` kept running orphaned in the background (invisible, uncancelable, and a second visit could start a stacking duplicate timer). Every other stateful feature in this codebase (player, library, playlists, mood) already lives in a `.svelte.ts` store for exactly this reason, so timer state followed the same pattern instead of reproducing the bug. `timerStore.start()` now cancels any existing timer before starting a new one. Fade-out logic, pause-on-expiry, and volume restoration on cancel were ported directly from v1's proven implementation. Added "Timer" to the Sidebar nav (⏰) and MiniPlayer's expanded panel nav row. Awaiting human test. |
