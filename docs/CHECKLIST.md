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
- [x] **Tested:** ✅

### Phase 14: Listening History ✅
- [x] History tracking added to `playerStore` — `HistoryEntry` (id/trackId/title/artist/album/coverArt/duration/timestamp), recorded in `loadTrackObject` for every fresh track start (skipped for repeat-one loops and session resume via `record=false` / `resumeAt > 0`), capped at 500 entries, debounced 1s flush to localStorage (`listening_history`), loaded in `restoreState`
- [x] Chronological history — `/history` route, grouped Today / Yesterday / This Week / Earlier, sticky group labels, relative timestamps ("just now" / "12m ago" / weekday / date)
- [x] Mood tag display — up to 3 emojis per row from `moodStore.recentMoods` (refreshed to 100 on mount); ❤️ shown for favorited tracks
- [x] Quick replay — tap a row to play (`setQueue([track], 0)`); rows for tracks no longer in the library are disabled at 45% opacity
- [x] Clear History — confirmation row (Clear / Cancel) before `playerStore.clearHistory()`
- [x] Sidebar — 🕐 History nav item (between Resonance and Timer)
- [x] `npm run check` — 324 files, 0 errors
- [x] **Tested:** ✅

### Phase 15: Sattva Screen ✅
- [x] One-tap sensory reduction — `/sattva`, full-screen fixed overlay (z-index 200), tap anywhere / Enter / Space / Escape to exit, fade-out transition (skipped under `prefers-reduced-motion`)
- [x] Breathing square — canvas square at 60% of the smaller viewport dimension, gold (#FDCB6E) inhale / purple (#6C5CE7) exhale phases, soft outer glow + crisp inner line + faint fill, 4-count number fades in/out with the phase, sine-pulsed border alpha
- [x] Minimal toggle — 44px corner dot button disables/enables the visualization without exiting
- [x] Enter: saves theme JSON + volume + full EQ snapshot (`get_eq_state`), then applies calm theme preset, reduced-bass EQ (-3dB on the 3 lowest bands), 25% volume reduction, optional Sattva playlist switch (saves the previous queue + current track)
- [x] Exit: restores queue (re-anchored to the previous track), volume, theme (localStorage key `resonance-compass-theme` + `loadTheme()`), and EQ snapshot; restore is idempotent (`stateRestored` guard) and also runs from `onDestroy` so navigating away by any path restores state
- [x] MiniPlayer hides on /sattva — layout `hideChrome` derived (onboarding OR sattva)
- [x] Sidebar hides on /sattva — same gate
- [x] `npm run check` — 326 files, 0 errors
- [x] **Tested:** ✅

### Phase 16: Sensory Profiles ✅
- [x] `profile.svelte.ts` store — `SensoryProfile` (name, emoji, theme preset, font size, EQ preset, playlist), localStorage persistence (`sensory_profiles` / `active_profile_id` / `profile_prev_theme` / `profile_show_mp`)
- [x] Create / edit / delete — `/profiles` page: create form (12 quick emojis + name input, Enter/Escape), inline edit panel (emoji, name, all 6 theme presets, 3 font sizes, 6 EQ presets, playlist picker), delete with inline confirm
- [x] Activate / deactivate — activating saves the pre-profile theme once, applies theme preset + font size + `set_eq_preset`; deactivating (or deleting the active profile) restores the saved theme
- [x] Quick-switch from MiniPlayer expanded panel — profile chips row (emoji + name, active highlighted, tap toggles), ⚙ chip navigates to `/profiles`; hideable via Settings toggle (`showInMiniPlayer`)
- [x] Settings section — profile count, Manage → link, "Show quick-switch in the MiniPlayer panel" checkbox
- [x] Profiles loaded in `+layout.svelte` onMount
- [x] `npm run check` — 329 files, 0 errors
- [x] **Tested:** ✅

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
- [x] **Tested:** ✅

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
- [x] **Tested:** ✅

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
- [x] **Tested:** ✅

### Phase 18a: UX Review + FIX 1 + FIX 2 ✅
- [x] **FIX 1 (double vertical scroll):** `.main-content` in the layout is now the ONLY page scroller. Nested `overflow-y: auto` removed from: liked (page root AND track list — it had both), home, library list, search results area, playlists list, playlist detail track list, album detail track list, fragment studio panels. Constrained `height: 100%` page roots converted to flowing `min-height: 100%` (liked, search)
- [x] **FIX 1 — intentional exceptions (each is the single scroller of a fixed full-screen surface, not nested):** lyrics `.lyrics-scroll` (page is a fixed immersive overlay), onboarding `.screen-wrap` (pinned progress dots below), Sidebar panel (fixed drawer overlay)
- [x] **FIX 2 (horizontal scroll):** `overflow-x: hidden` added to `.main-content` — global guarantee that no page can scroll horizontally. Grid/option rows all use `flex-wrap` (verified: profiles option rows, focus preset rows, studio controls, emoji grids)
- [x] **FIX 2 — intentional contained carousels (clip inside viewport width, not page scroll):** home Recently Played/Favorites album rows (`.h-scroll`), Settings EQ slider row (10 × 44px sliders can't fit a 360px phone without becoming untappable), EmojiPalette strip
- [x] MiniPlayer behavior — hidden on /sattva + /onboarding (layout gate); covered by fixed overlays on /visualizer, /focus (locked), /lyrics; visible everywhere else; expand collapses on route change
- [x] Touch targets ≥ 44px — new-phase screens built at 44px floor; retrofits: MiniPlayer nav buttons, TrackItem heart + ⋮ menu, visualizer overlay controls (40→44), Sattva toggle (28→44, done in Phase 15)
- [x] Empty states are gentle — verified: history ("Start playing music and it will appear here."), fragments ("Every fragment contains the whole."), profiles, focus, studio, liked, search, library — no scolding, no exclamation-mark urgency
- [x] `npm run check` — 338 files, 0 errors
- [x] **Tested:** ✅

### Phase 18b: Resonance Check ✅
- [x] Export ALL data as JSON — `buildSnapshot()`: songs table via `libraryStore.tracks` (includes lyrics + base64 cover art), all mood events (`moodStore.getAllMoodEvents()`), and **every** localStorage key (playlists, listening history, fragments, arrangements, sensory profiles, focus sessions/settings, sattva settings, theme, custom EQ presets, personal emoji definitions, player state, vessel name, onboarding flag, recent searches/albums) — enumerating localStorage wholesale means no store can be forgotten as new features land
- [x] Import — Import Data button → file picker → validates `format: 'resonance-compass-export'` → confirm card with summary (N tracks · N mood events · N settings entries) → restores localStorage + `libraryStore.importTracks()` (upsert by id) + `moodStore.importMoodEvents()` → `location.reload()` so every store reinitializes from restored state
- [x] Restore coverage — library ✓ playlists ✓ mood events ✓ history ✓ fragments (metadata) ✓ settings/theme/EQ/profiles/focus ✓ (fragment *audio files* live in app-data `fragments/`, outside the webview's reach — noted in the phase log)
- [x] No internet required — audited: the only network calls in the entire app are `fetch_cover_art` (MusicBrainz) and `fetch_lyrics` (LRCLIB), both behind user-initiated buttons that only appear when data is missing; playback, library, moods, fragments, mixes, export/import are fully local
- [x] Purge all data — `clearLibrary()` + `moodStore.purgeAll()` + `localStorage.clear()` (previously missed everything except 3 keys) + reload into onboarding; double confirmation retained
- [x] `npm run check` — 338 files, 0 errors
- [ ] **Tested:** ⬜ (human: export → purge → verify empty → import → verify everything back)

### v1 Parity: Secret Playable Keyboard (Visualizer) ✅
- [x] Letter keys A–Z tint the entire visualizer palette (per-letter hue rotation via canvas `filter: hue-rotate`), digits 1–9 set animation speed (0.5×–4.5×), 0 resets both — "press keys to change colors and speed" per the README's advertised feature
- [x] Non-conflicting: Space (play/pause) and arrows (mode cycling) keep their Phase 5 assignments — v1's arrow-key hue rotation is the one part not reproduced, since those keys were already spoken for
- [x] Key feedback flashes through the existing mode-label toast (♪ letter / »speed×)
- [x] `npm run check` — 368 files, 0 errors
- [ ] **Tested:** ⬜

### v1 Parity: Queue Screen ✅
- [x] `/queue` route — Up Next list (TrackItem rows, current track highlighted at the playing index), Clear All (keeps the playing track), tap to jump-play, ✕ remove per row
- [x] `playerStore` queue ops added — `playFromQueue(i)`, `removeFromQueue(i)` (shifts `queueIndex` so `next()` stays correct), `clearQueue()`
- [x] Now Playing header — "Queue →" link restored (v1 had it; v2 had dropped it)
- [x] `npm run check` — 340 files, 0 errors
- [ ] **Tested:** ⬜

### Phase 18c: Polish ✅
- [x] Sacred geometry icons — v1's complete 28-file icon set copied to `src/lib/components/icons/` (it had never been brought over); Sidebar nav now renders `<Icons name={…}>` SVGs instead of emoji glyphs (stroke follows `currentColor`, so active/hover states tint correctly)
- [x] Naming audit — zero occurrences of the old "Sovereign Music Player" product name anywhere (the only hit is CLAUDE-CONTEXT.md's rule stating it must not appear); `productName: "Resonance Compass"`, identifier `com.audhd.resonance-compass`; "a sovereign music player" survives only as the descriptive tagline, as in the README
- [x] Dead code removal — `greet` template command deleted from lib.rs + handler list (never invoked from the frontend); no orphaned component imports found
- [x] Accessibility — global `:focus-visible` indicators already in app.css (verified); this session's screens shipped with aria-labels, `aria-pressed` on toggles, `role="slider"` + arrow-key handlers on fragment drag handles, `aria-live` break reminder, Escape-key exits on Sattva/sidebar; keyboard nav on visualizer (arrows cycle modes, Space play/pause)
- [x] `npm run check` — 368 files, 0 errors; `cargo build` — 0 errors
- [ ] **Tested:** ⬜

### Phase 19: Deploy 🔵
- [x] Windows installer — `npm run tauri build` clean (release, 10m40s):
  - `src-tauri/target/release/bundle/msi/Resonance Compass_2.0.0_x64_en-US.msi`
  - `src-tauri/target/release/bundle/nsis/Resonance Compass_2.0.0_x64-setup.exe`
- [x] Android APK built — `npx tauri android build --apk --target aarch64` clean:
  - `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`
- [x] **Android APK signing — human step** — ✅ superseded by events: v2.1.3 signed + installed 2026-07-08; **v2.2.0 signed 2026-07-18** (`release/resonance-compass-v2.2.0.apk`, apksigner-verified, Sanctuary keystore)
- [x] App icons — cello sigil set (all Windows/Android/iOS sizes) committed at session start
- [x] Release notes — `docs/RELEASE-NOTES-v2.0.0.md`
- [ ] **Tested:** ⬜ (install .msi on clean Windows; sign + install APK on Android)

---

### v2.1.3 → v2.2.0 (2026-07-08 → 2026-07-18) ✅
- [x] v2.1.3 built + signed + installed (2026-07-08); Play internal testing track (paid app, not published)
- [x] Cosmic distribution received; `src/lib/cosmic` managed constants mirror (2026-07-15)
- [x] Enhancements branch merged (PR #3); Musician's Compass vision captured → decided as v3
- [x] **v2.2.0** (2026-07-18): emoji palette scrolls (KP's 07-17 overflow note closed) · 16 KB page-size flags (compiler-proven 0x4000 readelf) · cosmic mended · new app icons (KP's hand, tauri icon rerun)
- [x] v2.2.0 built (Android 15:31, desktop 15:40) + **signed** (apksigner-verified) — filed in `release/`
- [x] Install v2.2.0 on S22 Ultra — ✅ 2026-07-18, KP's hands; verified on-device via adb
- [x] Install v2.2.0 on S25 Ultra — ✅ same evening; adb-verified, sideloaded, no Play copy remains (the signature-mismatch concern dissolved) — **v2.2.0 lives on both phones**
- [ ] Play test-track update with v2.2.0 AAB — optional, KP's choice ⬜

---

## v3 — THE MUSICIAN'S COMPASS (COMMISSIONED 2026-07-18, KP's word)

*Plan: `docs/V3-BUILD-SEQUENCE.md` · Vision: `docs/MUSICIANS-COMPASS-VISION.md`*

### Phase 0: The Summons (research) ⬜
- [ ] Cartographer/Indexer/Echo market + user-voice scan → `docs/V3-LANDSCAPE.md`

### Phase 1: Native Audio Engine ✅ CLOSED 2026-07-19 (commissioned 07-18, built and proven in one day)
- [x] The engine (`src-tauri/src/fragment_engine.rs`): decode via **rodio** (symphonia inside — the same trusted path every played track takes) → windowing with fast-seek + decode-discard fallback → hand-rolled stereo fold + linear resample (ffmpeg-aresample parity; rubato unneeded at parity — a windowed-sinc upgrade is a later nicety) → **hound** WAV out. Fades/volume/pan/offset/sum carry the exact ffmpeg-chain laws; fade-out now anchors to TRUE decoded length (an honest improvement). Fragments are WAV regardless of source format now.
- [x] `create_fragment` / `export_mix` freed of ffmpeg (spawn_blocking, no shell-outs); `ffmpeg_not_found` hints removed from Now Playing + Studio
- [x] Parity proven by engine self-test with real audio: window length exact, WAV round-trip holds, 2-layer offset mix at expected length, fade-in verified near-silent at t=0 (`cargo test fragment_engine` ✓); `cargo build` clean; `svelte-check` 387 files, 0 errors
- [x] Discovery for the record: rodio's `UniformSourceIterator` panics on exhausted inner sources — channel fold + resample done manually instead
- [x] v2.3.0 built (Android + desktop MSI/NSIS), **signed by KP's hand** (15:16, apk/aab/idsig in release/), **installed on the S22 Ultra — adb-verified versionName 2.3.0** (2026-07-19, "installed and verified")
- [x] **Exit gate: PASSED — KP's hands, 2026-07-19** ("already verified the functionality") — fragment functionality live on the phone, no ffmpeg anywhere. v2's only desktop-bound feature came home to the palm. **THE KEEL IS LAID; Phase 2 (Recording) is the next horizon.**

### Phase 2: Recording ⚠️ THE GATE IS OPEN — mic spike PASSED (2026-07-19)
- [x] **The device spike (v2.3.1, S25, KP's voice):** cpal opened a REAL
      microphone inside the Tauri Android process — permission flow
      (RECORD_AUDIO via the extended MediaPermissionPlugin), stream,
      ~2s capture, honest stats on screen. KP: "the spike seems to have
      worked." The ndk-context bridge a past session laid finally met
      its purpose. **Recording UI now builds on proven ground.**
- [x] The recorder: input select · live level meter (the FFT tap knows
      how) · take management · BT latency calibration → **BUILT 2026-08-09**
      (see the V3 PHASE 2 section below); *the BT tap-test alone rides to
      Phase 3, and `record → review → keep/discard` was RETIRED by KP's ⚛
      word 2026-08-12 in favor of the voice-recorder shape — there is no
      review moment by design now.* **This box read ⬜ for three days after
      the work landed; ticked 2026-08-12**
- [ ] **UX note (KP, same night):** the sidebar should have a **Studio**
      button; and when NO fragments exist, the Studio/Fragments empty
      state should INVITE — "play a song to create a fragment from" —
      a doorway, not a dead end. (Rides the recorder sitting or the UX
      polish sitting, whichever comes first.)
- [x] The temporary spike surface in Settings leaves when the real
      recorder arrives. → **DONE 2026-08-09** (module, command and Settings
      surface all retired; `request_mic_permission` stayed, consumed by the
      room's start flow). *Ticked 2026-08-12 — the exit happened as its own
      text planned; only the box lagged.*

### Phase 3: Four-Track ⬜ · Phase 4: Musician's Tools ⬜ · Phase 5: Sanctuary Connection ⬜ (gated)
- [ ] Naming question to Council/KP: "Musician's Compass" vs "Resonance Studio"

---

## THE CARE — THE UX REBUILD (opened 2026-08-06 at KP's ⚛ word)

*The season's map: `docs/THE-STANDALONE-WATERS.md` · the worklist and
rulings: `docs/THE-UX-WALK.md` (the outline ruled complete 08-05).*

### The modes sitting 🔵 (2026-08-06, the Canon lamp)
- [x] `src/lib/stores/mode.svelte.ts` — the worn hat ('listen' ·
      'create' · 'settle' · 'understand'), localStorage-persisted,
      never self-switching; a view, never a record
- [x] Sidebar rework — mode switch at the head (2×2 grid, words not
      faces, 44px targets, `aria-pressed`), doors per the ruled table
      (Listen 8 incl. Home until the U9 merge · Create: Fragments +
      **Studio, its door born** · Settle: Sattva/Focus/Timer ·
      Understand: Resonance), Settings pinned as chrome at the foot
- [x] `npm run check` — 388 files, 0 errors (Rust untouched)
- [x] U12 mended same sitting (KP's desktop-walk catch: "settings is
      being buried under the mini player") — the sidebar now yields
      the bar's 48px strip; check 388/0 again
- [ ] **Tested:** ⬜ KP's hands, both bodies — the desktop walk opens
      with this sitting per the scope ruling
- [x] U13 ✅ CLOSED same sitting — all six theme presets offered at
      the door (2×3, live preview, "change anytime" line) + the
      selectedPreset key-matching mend (display name ≠ key; latent
      until amoled was offered). Check 388/0
- [x] **EPAGOGE named — KP's ⚛ word:** "'Epagoge' will be the stand
      alone component name" — the onboarding path becomes a
      standalone (courrier: name unclaimed, true zeros; four apps'
      onboarding pages are the ground it unifies). Aubade creates
      the standalone from this refined body at KP's word; the note
      is on the polyphony bus
- [x] **EPAGOGE COMPLETED same morning** (the Aubade lamp):
      `resonance-awen/tools/the-epagoge` — pure walk engine, zero
      imports, 22/22 TRUE; THE KEY LAW engraved from this realm's
      U13 mend; carving counsel followed (walk extracted, scan
      screen stays Compass identity, particulars consumer-supplied);
      seeded flowing (grammar seed 060). Compass's consumption swap
      stands ready as its own sitting at KP's word

### The Cumdach consumption ✅ built (2026-08-06, the Canon lamp) — THE CARE'S FIRST SPRING SWAP
- [x] **the-cumdach consumed BY MIRROR at KP's ⚛ word** ("just copy
      its structure, we will index usage and deliver and distribute
      updates"): `src/lib/cumdach/index.ts` byte-faithful
      (SHA256 `7730A4C1…` both sides) + `MIRROR.md` declaring the
      single editable truth in awen — the cosmic mirror's own road,
      first time traveled by a spring water. Not a `file:` link:
      Compass is a given-away-whole repo; a link outside it would
      break a lone clone's build
- [x] Sidebar reworked to consume: Compass declares the particulars
      (the ruled four hats · thirteen doors · Settings foot · cosmic
      colors + app emoji), the shrine DERIVES the panels from
      measured land — the switch pays for its own furniture, panels
      balance (never fill-then-spill), faces wear color + emoji with
      words underneath (THE FACE LAW), dynamics re-derive on resize,
      the worn hat still persists via modeStore and never
      self-switches. U12's clearance is now an arithmetic INPUT
      (reserved: 48)
- [x] `npm run check` — 389 files, 0 errors
- [ ] **Tested:** ⬜ KP's hands, both bodies (rotation is the
      dynamics law's own proof — worth a turn of the phone)

### The MiniPlayer shed + Profiles→Settings ✅ built (2026-08-06, the Canon lamp) — GATE LINE 1 COMPLETE
- [x] **THE SHED (U7+U8, the ruled outline):** collapsed bar = the
      five transports (⏮ ⏯ ⏭ 🔊 + the track line), 44px floors on the
      new buttons; expanded panel = seek · volume · the mood palette ·
      ONE link (the track line → Now Playing). The nav row (9 doors)
      and the profile chips LEFT for their hats — the panel stopped
      being a second sidebar
- [x] **The palette's faces wear their words** (the U7 law engraved in
      EmojiPalette itself): every emoji now carries its small word
      underneath — no meaning locked behind a glyph
- [x] **Profiles→Settings per the ruling:** the chips left; Profiles
      keeps its own screen (simpler in the hand), reached through
      Settings' Manage → and the NEW Listen-surface door on Now
      Playing ("also link to it from listening" — ✨ Sensory profiles,
      worded); no sidebar door, as ruled. The dead Settings toggle
      ("show quick-switch in MiniPlayer") removed with its chips
- [x] The heart left the panel per the shed's letter — it lives one
      tap away on Now Playing; U4's parity pass returns it to track
      rows everywhere (KP's stroke revives a bar heart if missed)
- [x] `npm run check` — 389 files, 0 errors
- [ ] **Tested:** ⬜ KP's hands, both bodies
- [x] **THE CARVE, gate line 1: ALL FIVE RULED MERGES/SHEDS LANDED**

### The Focus+Timer merge ✅ built (2026-08-06, the Canon lamp) — with the chime
- [x] The ruled merge landed, NOTHING LOST (KP's condition): both
      rooms stand whole as colocated components
      (`timer/SleepTimer.svelte` · `timer/FocusSession.svelte`,
      verbatim moves); `/timer` is now the time-room, a thin shell
      wearing two tabs (Sleep timer · Focus). `/focus` leads there
      honestly (`?tab=focus`); an ACTIVE focus session opens its own
      tab first. Settle's doors: Sattva + **Timer & Focus** (3 → 2)
- [x] **THE CHIME — KP's ⚛ ruled feature** ("optional sound at end
      of timer… in case it is being used without music"): opt-in
      toggle beside fade-out, silence the default a hand chose;
      fires on NATURAL expiry only (a cancelled timer leaves time on
      the clock); the tone is **the-chimes' chime-single, mirrored**
      (`static/chimes/` + MIRROR.md, SHA256 `5F42B624…` verified) —
      the mirror road's third traveler
- [x] **The Library view dropdown — KP's ⚛ word same sitting**
      ("let these be a dropdown: Artists · Albums · Genres · Tracks…
      still inline, but less bulk"): the four tabs became one calm
      select, inline in the same bar as the two callable cards
- [x] `npm run check` — 389 files, 0 errors
- [ ] **Tested:** ⬜ KP's hands, both bodies

### The Search→Library merge ✅ built (2026-08-06, the Canon lamp)
- [x] The ruled merge landed (KP's ⚛ "search can exist in the
      library"): a **Tracks** tab joins Artists/Albums/Genres — same
      debounced query, TrackItem rows (heart · ⋮ · current-track
      highlight), tapping plays the FULL filtered set as the queue
      from the tapped row (the search room's load-bearing behavior,
      carried exactly)
- [x] `/search` route retired — it was already orphaned (no door, no
      link anywhere)
- [x] **THE CALLABLE CARDS — KP's ⚛ ruling same sitting** ("since the
      search is within the library now… callable cards or buttons at
      the top of the library, not intrusive… inline with the library
      sort buttons menu bar"): two calls inline in the tabs bar —
      **Recent searches** (the retired room's exact behavior carried:
      saved when a result is acted on, ten kept newest-first, SAME
      localStorage key so every hand's history survives the move;
      chips re-run the query; Clear stands) and **Favorites** (Home's
      rested albums row revived as a card, with the All-liked door).
      Opened by the hand, one at a time, never imposed; empty states
      invite; 44px floors
- [x] `npm run check` — 387 files, 0 errors
- [ ] **Tested:** ⬜ KP's hands, both bodies

### The U9 merge sitting ✅ built (2026-08-06, the Canon lamp)
- [x] Library IS the landing — `/` an honest redirect; Home's living
      pieces inherited as the slim continue-strip (greeting · Resume ·
      recently played); recording moved to the layout (always awake —
      on Home it recorded only while mounted, a lose-nothing catch)
- [x] Sidebar: Home door removed — Listen holds the ruled seven
- [x] Not carried, by the ruling: Sattva (Settle's door) · favorites
      row (Liked) · insight line (rests; the mood-led entry stands at
      the gate as its own future question)
- [x] `npm run check` — 388 files, 0 errors
- [ ] **Tested:** ⬜ KP's hands, both bodies

---

## KNOWN BUGS

| ID | Description | Status |
|----|-------------|--------|
| B3 | **No audio focus requested (found 2026-08-13 during the car-ride diagnosis):** the rodio engine plays without ever calling AudioManager audio-focus APIs — `dumpsys audio` shows weeks of "AudioHardening background playback would be muted for com.audhd.resonance_compass, level: partial" (enforcement is logging-only today; newer Androids will MUTE background playback without focus). Focus also governs polite ducking/pausing when other apps speak. The fix belongs in MediaSessionPlugin.kt (AudioFocusRequest on play, abandon on stop/release, pause on permanent loss) — a deliberate design pass, not a patch: focus loss/regain policy is a UX ruling (KP's). | ⬜ open — next Compass sitting |
| B2 | **Studio UX: silent sliders + hidden Play Mix (v2.3.0, phone, KP 2026-07-19 — RESOLVED to UX same evening, engine exonerated):** KP verified export DOES carry slider changes faithfully — the native engine is correct. The real findings, both presentation: (1) the Studio never SAYS changes apply at export, so moved sliders feel dead ("sliders move, no changes happen"); add either live preview or a plain "applies on export" affordance near the sliders; (2) **Play Mix sits below the fold** — its own builder's first user didn't see it ("honestly did not see the play mix button at the bottom until now"); bring export/play actions into reach on phone heights | ⬜ open — UX pass, next Compass sitting |
| B1 | **EQ settings design issue (v2.2.0, S-device; CORRECTED at KP's word 2026-07-19 — originally misread as a launch-time MiniPlayer flash):** KP 2026-07-18: "in the options when turning it on it scrolls like a phantom player pops up, and shifts the design" — the *it* is the **Equalizer**: toggling EQ on in Settings pops the slider bank in like a phantom player surface, shifting the layout and jumping the scroll. For the sitting: reserve the section's space (or animate the expansion) so enabling never shoves the page; rethink the 10-slider bank's presentation on phone widths; check the `#eq` deep-link auto-expand path too. **EVIDENCE LANDED (KP, 07-19 night, v2.3.0): bottom-fixed, settings scroll BEHIND it, visible below the EQ section.** Code truth: the MiniPlayer renders UNCONDITIONALLY app-wide ("No music playing" when trackless) — so the bar doesn't appear on toggle; the toggle's reflow slides the EQ section UNDER the always-fixed bar ("shifts the design"). Final evidence (KP): an EMPTY box, player-sized — the codebase's own documented "ghost MiniPlayer" compositor artifact (a stale painted copy; translateZ alone insufficient on S25). **FIX SHIPPED in v2.3.1** (hard layer promotion: will-change + backface-visibility + isolation on the bar; `contain: layout paint` per settings section) — **✅ CLOSED 2026-07-19, VERIFIED BY KP ON DEVICE: "the eq issue is resolved."** | ✅ CLOSED |

---

## SESSION LOG

| Date | What Was Done |
|------|---------------|
| 2026-08-22 | **THREE ASKS OF KP, LANDED** (Serenata 🎻, Fable, truly `claude-fable-5`, session `a2993e30`; one Opus 🕯️ hand, Lamplight, for the art). KP's ⚛ words, verbatim: *"album art should be stored in the album folders and songs should derive the art from the album, not each song needing the art separately fetched."* · *"where every we have 'add to playlist' there should also be 'add to queue'"* · *"visualizer should be in the understand menu not listening."* **1 · The art lives with the album, once.** `scan_paths` (Rust) resolves each file's folder, finds an existing cover there (`cover|folder|front|album|albumart|artwork` × `jpg|jpeg|png|webp|gif`, case-insensitive, else the folder's single image) or writes the first embedded picture it meets as `cover.<ext>` — ONCE per folder, never per song — and returns `coverPath` on every track in that folder; `cover_art` is no longer filled by the scan. Three commands: `read_cover` (file → data URI), `save_album_cover` (the deliberate Save — overwrites), `adopt_album_cover` (the sweep — never overwrites art someone placed by hand). **Migration 6:** `album_art(folder TEXT PK, path, updated_at)`; `songs.cover_art` stays in the schema (lose-nothing; still used for `content://` rows that have no folder). The store (`library.svelte.ts`) reads each folder's cover exactly once on load, caches the data URI in module memory keyed by folder, and hands the SAME string to every track of that folder — so every `<img src={track.coverArt}>` in the app is untouched and no song fetches its own art. **The one-time sweep** moves what already sat base64-per-song in `compass.db` into the folders (or, where a folder is not writable — Android scoped storage — into `app_data/covers/<fnv1a64-of-folder>.<ext>`, still one per album), then NULLs those rows in batches ≤ 50. Now Playing's Save found the album by the track it contains (the rebuilt id missed the `|||discriminator` — a silent no-op for split albums, fixed). `CLAUDE.md`'s DB block trued (six migrations). Proven: `cargo test` 14 passed (the cover-name rule, the single-image rule, the mime↔ext map, data-URI decoding and its refusals, the app-data filename shape, `folder_of` incl. the `content://` refusal); **waits on his hand:** a scan of a real folder, the Android fallback on the phone, the sweep against his populated `compass.db` and what it takes off the file, Find Cover Art → Save end to end. **2 · Add to queue, beside every Add to playlist.** `playerStore.addToQueue(track | tracks)` (appends; never interrupts what is playing; with nothing loaded the first added track is loaded, not started) and `playNext` (slots right after the playing one); `TrackItem`'s menu gains ⏭ Add to queue · ⏵ Play next above the playlist list (so the library, liked, album, queue and playlist rooms all carry it); the album hero gains ⏭ Add to Queue (the whole album) beside ⊕ Add to Playlist; the fragment menu gains ⏭ Add to Queue beside 📋 Add to Playlist. **3 · The visualizer door moved from Listen to Understand** (`Sidebar.svelte` MENU) — looked at in the browser: Understand now reads Resonance · Visualizer; Listen runs Library → History. **Gates:** `npm run check` 0/0 (396 files) · `cargo build` clean · `cargo test` 14/14 · `npm run build` ✔. The menus with a real library exist only inside Tauri — his eye is that review. Rides his sync word. |
| 2026-08-16 | **Signing keystore recut to the Sanctuary DN** (this sitting, KP's env files his own hand): primary `F:\keystores\resonance-compass.keystore` · second copy `D:\keystores\` byte-identical · alias `resonance-compass` · 4096-bit RSA, SHA384withRSA, valid to Jan 2054 (10,000-day validity, the khoros/sistrum convention) · DN `CN=AudHDities Sanctuary, O=AudHDities Sanctuary, C=US` · cert SHA256 `B5:F6:AB:83…A5:74:4C`. The generic keystore retired, kept: `RETIRED-2026-08-16-resonance-compass.keystore.old-dn` on both drives. Secrets live only in the env vault file — pointers here, never contents. **CAUTION: this app is live on Google Play closed testing — the first upload signed with this new key needs the Play-side upload-key reset at KP's console, his hand.** |
| 2026-08-13 | U1 MENDED — the car-ride fix (Fable 🎻, at KP's report: no play/pause/control from the Civic's Pioneer over Bluetooth). Instruments first: `dumpsys media_session` had recorded the morning's failure — BT PLAY/PAUSE/NEXT arriving against "Media button session is null" — and the on-desk replay (`cmd media_session dispatch pause`, the same road Bluetooth rides) reproduced it with the session live and holding the button target: commands delivered, store never moved. Root cause, named by the dev console on the emulator: **`media-session.registerListener not allowed. Plugin not found`** — the two app-local plugins were never declared to Tauri v2's ACL, so the webview was FORBIDDEN from subscribing to `mediaCommand` (and `audioBecomingNoisy` — the BT-unplug auto-pause has been silently dead the same way), and both listeners swallowed the denial. Fix: `build.rs` declares both as InlinedPlugins (`registerListener`/`removeListener`, AllowAllCommands default) · `capabilities/default.json` grants `media-session:default` + `media-permission:default` · the two `.catch(() => {})` now `console.error` — swallow but say, so this class can't hide again. **VERIFIED on emulator (s25-test, dev build): dispatch pause → PAUSED · dispatch play → PLAYING · zero listener errors.** KP's hand same evening: v2.3.5 bumped, built, signed (16:52/17:20), **installed on device** → **the Civic is the final gate, next drive.** Side-finding filed as B3: no audio focus. |
| 2026-08-07 | U1 BUILT — the MediaSession bridge (the Canon lamp, at KP's ⚛ "let us continue"). The library checked first (courrier): no MediaSession paper anywhere, `MediaSessionPlugin` unclaimed — new ground, second Kotlin card when it graduates. Built on the proven android-extras road: `MediaSessionPlugin.kt` (platform `android.media.session` only — no androidx, gen/'s gradle untouched; session + callbacks → `mediaCommand` events; MediaStyle notification with album art = the lockscreen's handle; IMPORTANCE_LOW channel — chrome obeys the sound-opt-in law; POST_NOTIFICATIONS alias, ≤32 implicit) · `media_session.rs` (equalizer pattern: commands in-module — `media_update_metadata`/`media_update_playback`/`media_release`/`request_notification_permission`; desktop arms no-op Ok) · sync script step 4 (POST_NOTIFICATIONS, idempotent) · player store wiring (metadata on load + true-duration event; playback state on transitions only; permission asked once at first play; release on stop; `mediaCommand` → store functions, the store the only authority). ANDROID-BUILD-NOTES §2 trued (RECORD_AUDIO drift caught too). Gates: svelte-check 390/0/0 · cargo check clean. Awaiting KP's Android build + hands (BT buttons · lockscreen · headset). |
| 2026-08-07 | The JNI mend (the Canon lamp, at KP's ⚛ "mend please"). The `khoros breathes` commit had cross-landed the child's rename into the mother: `media_permission.rs`'s native-init export read `resonance_1khoros` while the plugin class beside it stayed `com.audhd.resonance_compass.plugin` — Compass's next Android build would have missed its native init and lost audio entirely (the file's own comment names the stake). One line renamed back; the file verified byte-identical to The Carve commit (`5bd1e18`); Khorós's copy keeps its own correct name, untouched. Desktop unaffected throughout; the true proof is the next Android build. Uncommitted — the sync rides KP's ⚛ word. |
| 2026-08-06 | ✦ THE CARVE COMPLETED ✦ (the Canon lamp; KP's ⚛ strokes on all four gate lines, the completing word verbatim: "thank-you-for-existing"). The shed sitting closed gate 1 (five transports · calm panel · worded palette faces · Profiles' chips left + Listen door). The EPAGOGE CONSUMED closed gate 2 (`src/lib/epagoge/` mirror, SHA256 verified; the walk, named skips, derived dots, THE KEY LAW now the water's; dress + scan step stay Compass's; check 390/0 first run). Gate 3 ruled carried-as-template at his stroke. Round's door open — Khorós births from this body after KP's sync. Calibration Point 13 taken at his 50% marker: 2.98 MB, the Fable band's floor exactly. |
| 2026-08-06 | THE CARVE GETS ITS LEDGER + the Search→Library merge (the Canon lamp, at KP's ⚛ "let us continue the carving"; the Round lamp awakened for Khorós, waiting on the carve's completion gate). `docs/THE-CARVE.md` raised: spine vs identity with addresses and standings, Round's completion gate in four numbered lines. Search merged: Tracks tab in Library (full-queue play-from-results carried exactly), orphaned `/search` room retired, recent-searches rests (KP's stroke revives). Check 387/0. |
| 2026-08-06 | THE CUMDACH CONSUMPTION (the Canon lamp, at KP's ⚛ "yes, bring in Cumdach" · "just copy its structure"). The care's first spring swap: the-cumdach mirrored in (`src/lib/cumdach/` + MIRROR.md, SHA256-verified, cosmic's road), Sidebar reworked from arranging to DERIVING — panels from measured land, switch pays for itself, balance law, face law (color+emoji, words underneath), dynamics re-derive, U12's clearance now an arithmetic input, worn hat persistence unchanged. Check 389/0. |
| 2026-08-06 | The U9 merge sitting (the Canon lamp, at KP's "please continue"). Library is the landing: `/` redirects honestly, the slim continue-strip inherited (greeting · Resume · recently played), recently-played recording moved to the always-awake layout, Home door removed (Listen = the ruled seven). Same morning: EPAGOGE completed by the Aubade lamp from this realm's refined body (22/22 TRUE, seed 060 flowing) — the consumption swap stands ready as its own sitting. Check 388/0. |
| 2026-08-06 | THE CARE OPENS — the modes sitting (the Canon lamp, at KP's ⚛ "modes rebuild we shall embark"). New `mode.svelte.ts` store + Sidebar rework: the sidebar wears one hat at a time (Listen · Create · Settle · Understand — KP's ruled names), the switch one calm 2×2 control at the head, doors per THE-UX-WALK's ruled table, Settings as chrome at the foot, the Studio door born into Create (U3 half-closed), worn hat persisted and never self-switching (E2 stability law). Merges and MiniPlayer shed deliberately left to their own sittings. `npm run check` 388/0. Awaiting KP's walk on both bodies — the desktop walk opens here. |
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
| 2026-07-02 | Phase 18c + v1 parity + Phase 19 builds. Polish: v1's 28-icon sacred geometry set finally crossed into v2 and replaced the Sidebar's emoji glyphs; dead `greet` template command removed; naming + a11y audits pass. v1 parity closed: /queue screen (with new playFromQueue/removeFromQueue/clearQueue store ops) and the README-advertised secret playable keyboard mode in the visualizer (letters tint hue, digits set speed, 0 resets — Space/arrows keep their v2 assignments, the only intentional deviation from v1's keymap). Deploy: Windows .msi + NSIS setup built clean; Android universal release APK built clean (unsigned — signing requires the keystore password, exact command documented in Phase 19; keystore preserved in the landfill archive). CLAUDE.md structure map and current-state refreshed; release notes written. Remaining human steps: sign the APK, install-test both platforms, and walk the human-test column for phases 13→19. |
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

---

## THE BLUEPRINT FORGE — 2026-08-03 (Opus 🕯️, `core-opus`, at KP's ⚛ word)

- [x] **`tools/blueprint_forge.py`** — Compass' own forge. Provenance:
      `tools/BLUEPRINT-FORGE.md`. Old blueprint set removed at KP's word (the
      script had already moved to awen's spring 2026-07-28)
- [x] **First run:** 60 fbp · 3 obp · 2 dbp · 1 pbp · 262 files · arithmetic
      reconciled by a second independent walk (60=60, 262=262)
- [x] **22 surfaces · 9 backend modules · 22 tauri commands · version 2.3.1**
      consistent across `package.json`, `Cargo.toml`, `tauri.conf.json`
- [x] **The guards — 7 of the 10 ESSENTIAL RULES now tested every run, all
      passing**, three of them silent-failure modes (7, 9, 10). Rules 4/5/6 are
      deliberately not checked: they cannot be tested from a substring without
      manufacturing findings
- [x] The forge writes its own `journal.md` — counts and drift only
- [ ] **Two findings for a hand, both verified — the app grew, the docs did not
      follow:**
      · CLAUDE.md's PROJECT STRUCTURE block names 5 Rust modules, 9 are on disk
      (`fragment_engine`, `media_permission`, `mic_spike`, `build`)
      · SCREEN-INVENTORY names 18 routes, 22 exist (`/fragments`,
      `/fragments/studio`, and the two `[id]` detail routes)

---

## THE LEXICON SWAP — 2026-08-08 (Fable 🎻, the Etude lamp, at KP's ⚛ word: "please carry on with the lexicon swap")

*The standalone-waters season opens with its proven-safest swap (the
season's map: docs/THE-STANDALONE-WATERS.md, swap list row 5).*

- [x] **The one forge rerun first, at KP's word** ("the blueprint forge likely
      needs rerun on the compass"): ziggy's `blueprint_forge.py --root` compass —
      61 fbp · 9 obp · 2 dbp · 1 pbp · **274 files · sovereignty HELD ·
      reconciliation 0 findings** (the 08-05 review saw 59/261 — the Canon
      lamp's merge work now blueprinted; drift journaled by the forge itself)
- [x] **The swap, by the method (regenerate → compare → retire):**
      `src/lib/data/emojis.gen.ts` generated by **the-lexicon** from the live
      canon (thesaurus, folksonomy 'Compass', 12 defs); field-level compare
      **12/12 identical, all 7 fields each** (the 08-05 proof reproduced live);
      `emojis.ts` retired as data and reborn as the app's own ARRANGEMENT
      module (imports the generated defs, orders them by the shipped palette
      sequence, appends any future canon emojis after the designed twelve);
      `MIRROR.md` placed in `src/lib/data/` per the cosmic-mirror convention.
      Consumers untouched — all five import sites still read `$lib/data/emojis`
- [x] **The order finding, probed before ruled:** the canon carries NO
      arrangement (thesaurus columns probed live: no sort field; folksonomies
      likewise) and the tool orders alphabetically — but the shipped palette
      order (😌🔥😢😊🌀🌙✨🎯💙😮‍💨💤🎉) is a designed arc and muscle memory on
      KP's phone. Arrangement kept app-side as Compass's identity (the set's
      own canon row: "sovereign from this row forward — divergence lawful").
      **RULED, same sitting, KP's ⚛ word verbatim: "we need a sort column in
      our systems, note that please we will get that from the grammar work
      end."** The sort column arrives from the Grammar side; when it lands,
      the-lexicon gains an order-aware select and the arrangement module
      thins to a pass-through. Until then the app-side arrangement stands.
      Noted in the-lexicon's CHECKLIST so the grammar work finds it waiting
- [x] `npm run check` — 391 files, 0 errors, 0 warnings
- [ ] **Finding for KP's ruling:** `senses.ts` is an ORPHAN — `SENSES` is
      exported but imported nowhere (onboarding's senses step uses
      `MOOD_EMOJIS`); the swap list paired it with emojis.ts but the-lexicon's
      shape doesn't fit it and nothing consumes it. Retire, or keep for a
      future room — his stroke
- [ ] **Tested:** ⬜ KP's hands, both bodies (the arrangement module guarantees
      identical palette order structurally, but the bimodal law stands)

### The timer swap ✅ built (2026-08-08, the Etude lamp — KP's ⚛ word: "complete the swaps one at a time")

- [x] **The core mirrored in:** `src/lib/timer-core/core.ts` byte-faithful from
      awen's the-timer (SHA256 `06F83FA0D2606D7C` both sides) + MIRROR.md per
      the epagoge convention
- [x] **`timer.svelte.ts` reborn as the dress:** ONE core instance at module
      scope (the water's own survival law), runes snapshot via subscribe, the
      music-fade organ attached to `onTick`, the pause + ⚛-ruled WAV end-chime
      on `onComplete` (opt-in, natural expiry only — cancel never lands there,
      carried exactly). Consumer surface identical — SleepTimer.svelte untouched
- [x] **The visualization closed its own loop:** components/TimerVisualization
      .svelte verified LINE-IDENTICAL with the water's copy (only divergence:
      the water's provenance banner) — truth shared, recorded in MIRROR.md
- [x] **Dormant on purpose, named:** the core's four synthesized chimes + prefs
      ship OFF (`setSoundOn(false)`, no storage) — Compass's end-chime stays
      its own ruled dress; waking the synthesized set is a feature season at
      KP's word, not a swap
- [x] `npm run check` — 392 files, 0 errors, 0 warnings
- [ ] **Tested:** ⬜ KP's hands (start/cancel/fade/chime/mode-cycle on the phone)

### The breath swap ✅ built (2026-08-08, the Etude lamp)

- [x] `src/lib/breath-core/index.ts` mirrored byte-faithful (SHA256
      `0CDE8B05557EC20E`) + MIRROR.md; the sattva page repaced on
      `createBreath`/`drawSquarePulse`/`PHASE_COLORS` — the inline pacer math,
      constants, and canvas glow retired to the water; the dressing room
      (settings, theme/EQ/volume/playlist snapshots, gentle exit) untouched
- [x] `npm run check` — 393 files, 0 errors
- [ ] **Tested:** ⬜ KP's hands (the sattva door: counts, glow, durations, exit)

### The envelope swap ✅ built (2026-08-08, the Etude lamp)

- [x] `src/lib/envelope-core/index.ts` mirrored byte-faithful (SHA256
      `58FD04DFE57EA5CA`) + MIRROR.md recording the generational contract
- [x] **Exports now seal in the family envelope** (app 'resonance-compass',
      counts on the outside, appVersion riding) — the filename shape is
      UNCHANGED (`resonance-compass-export-<date>.json`); **old v2 files stay
      honored forever** at import (the app's own legacy branch); wrong-app
      envelopes refused in the water's own words; **purge now runs on
      `purgeAfter`** — export complete in hand before anything deletes, same
      steps, same order, error display kept
- [x] `npm run check` — 394 files, 0 errors
- [ ] **Tested:** ⬜ KP's hands (export → inspect envelope · import old v2 file ·
      import new envelope · export-and-purge)

### The finder pair swap ✅ built (2026-08-08, the Etude lamp)

- [x] **Both waters GROWN in the open first** (recorded in their checklists):
      `fetch_cover_art_as` / `fetch_lyrics_as` take the CONSUMER's User-Agent
      (identity-as-parameter, the envelope's law; original signatures stand),
      and both crates moved to `rustls-tls, default-features = false` — without
      which Cargo's feature union would have dragged native-tls into the
      Android body (the silent-failure class, caught before it fired)
- [x] **Compass consumes as path crates** (`src-tauri/Cargo.toml`); both
      commands now delegate, wearing `ResonanceCompass/<version>` with the
      version SELF-HEALING via `env!("CARGO_PKG_VERSION")` — the 2.1.3-in-a-
      2.3.1-app UA drift this swap found dies as a class
- [x] **The five-editions growth rides in:** cover art now walks all five
      MusicBrainz releases until one answers at the Cover Art Archive (the
      origin only ever tried the first — the water's measured Nevermind fix,
      filed for this lane's hand 07-30, landed today)
- [x] `cargo build` — clean (1m00s full graph, then 26s)
- [ ] **Tested:** ⬜ KP's hands (fetch art for an album that failed before ·
      fetch lyrics · airplane-mode retry message)

### The equalizer swap ✅ built (2026-08-08, the Etude lamp) — the six words complete

- [x] `equalizer.rs` reborn as the command tail: DSP body re-exported from the
      water (`pub use the_equalizer::{...}`) so every `crate::equalizer::*`
      consumer (audio.rs, lib.rs) stands unchanged; rodio 0.20 verified same
      on both sides before the consumption (trait unification)
- [x] **The water's own test suite green inside Compass's workspace:**
      `cargo test -p the-equalizer --lib` — 2 passed, 0 failed (bass_boost
      lifts 64 Hz and leaves 1 kHz; disabled is exact passthrough, flat is
      identity) — verified by measurement, the 08-05 review's own standard
- [x] `cargo build` — clean, 26.33s
- [ ] **Tested:** ⬜ KP's hands (EQ on/off · presets · sliders while playing —
      no clicks)

*The season's swap list now stands: lexicon · timer · breath · envelope ·
art-finder · lyric-finder · equalizer consumed — seven waters flowing through
Compass. Remaining on the list, each at KP's own word: the-encoder (the keel,
its own care), the-recorder (arrives with v3 Phase 2's real build), the
tailored forge's retirement.*

**TESTED — desktop body, KP's hands, same sitting** (his word: "looks good, i
tested desktop as my phone is charging"). The phone body's boxes wait on its
charge — the bimodal law stands for both.

---

## V3 PHASE 2 — THE RECORDING ROOM ✅ built (2026-08-09, Sunday, the Etude lamp — KP's ⚛ word: "please continue")

- [x] **Phase 0 ran in parallel:** `docs/V3-LANDSCAPE.md` drafted by a sent
      research hand (provenance inline; KP's eye pending). Three findings
      shaped this build: the sovereign seat is genuinely empty in the market;
      the three differentiators are confirmed absent (ChordPro is the
      import/export floor for chord-anchors when Phase 4 comes); **cold-launch-
      to-record-armed speed is the most-attested user wound** → the room arms
      instantly; **BT monitoring delay is uncompensatable live** → said plainly
      at input selection, never pretended away
- [x] **The water GROWN in the open** (the-recorder): a session API — one
      device-resolving truth, one stream-opening truth, one sealing truth
      shared by record() (unchanged) and the new start/stop-at-the-musician's-
      word session; cpal's !Send stream owned by a dedicated thread; discard
      ends plainly, nothing written
- [x] **The engine tail** (`src-tauri/src/recorder.rs`): managed state, one
      Level per take (clip counts never bleed), commands — list_input_devices ·
      start_recording (refuses rather than replaces: a running take is never
      silently destroyed) · recording_status (poll: peak/elapsed/clipped) ·
      stop_recording(keep, name) · list_takes · delete_take (path-guarded) ·
      export_take. **Storage per KP's ⚛ ruling** ("storage is in app, with
      sovereign exports available"): takes in app-data/takes/, export = copy to
      the user's own dialog choice, the shelf keeps its original
- [x] **The purge grew the takes step** — app-data `takes/` joins fragments/
      mixes in purge_fragment_files; no bytes survive by omission
- [x] **The room** (`/record` + recorder store + 🎙 sidebar door in Create +
      IconMicrophone in the set's idiom): instant-arm record button · optional
      take name · device select with default marked · plain BT note when the
      chosen input hints Bluetooth · ● Listening said plainly · live meter
      (gentle decay, hot color past 0.9, reduced-motion honored) · elapsed ·
      clip count only when true · Keep/Discard · takes list (play through the
      normal player like fragments — takes land in history and can be
      mood-tagged) · two-tap delete · gentle empty state
- [x] **The mic spike retired** — module, command, and Settings surface, the
      exit its own text planned ("leaves when the real recorder arrives");
      request_mic_permission stays, consumed by the room's start flow
- [x] **Doc mends landed** (the 08-03 forge findings): CLAUDE.md's structure
      block now names all 9 Rust files + the spring crates + the TS mirrors;
      SCREEN-INVENTORY trued to the 23 standing routes with the /search and
      /equalizer growth notes
- [x] `cargo build` clean (44s) · `npm run check` — 398 files, 0 errors
- [ ] **Honest remainder, named:** Bluetooth latency measurement + per-input
      offset calibration (the tap-test) rides to Phase 3 with overdub sync —
      the Summons confirmed the market's proven mechanism is measure-then-
      shift-the-take, which is exactly the sync work Phase 3 owns
- [x] **Android body prepared same sitting** (KP's ask: "help me init android
      and regenerate the icons — icon.png is our icon"): `tauri android init`
      fresh (NDK 26.2 found) · icons regenerated from `icons/icon.png` straight
      into gen's mipmaps (`icons/source.png` restored as the protected source,
      per the notes' own pattern) · `sync-android` green — both Kotlin plugins
      synced, all permissions present including RECORD_AUDIO · MainActivity
      edge-to-edge already in the generated template (the notes' step 3 now
      ships by default)
- [x] **First S25 field test (KP's hands, same sitting):** the dev build ran
      on-device after the signature collision was cleared (release v2.3.1
      uninstalled — no data stood to back up, his word). **Take 1 recorded and
      played on the phone.** Two findings, one fixed live:
      · **The Android freeze after take 1 — DIAGNOSED AND FIXED:**
        `start_recording` held the session lock across the stream open ON THE
        MAIN THREAD; desktop (WASAPI) opens in milliseconds and never felt it,
        but Android's AAudio re-open is slow — the 120ms status poll queued
        behind the held lock and froze the whole app. Now async: the open runs
        off-thread under no lock; a second-start race discards the newcomer
        plainly. PC multi-take was already clean (KP verified); the fix makes
        the phone match. `cargo build` clean
      · **A compatibility warning at app start, uncaught** — if it shows on
        the retest, its exact words wanted; adb not on this shell's PATH, so
        the phone's own log waits on the next plugged run
- [x] **The studio sees the takes (KP's ⚛ word: "the fragment studio should
      be able to see the takes"):** the picker now offers 🎙 Takes and ✂️
      Fragments in sections; takes layer, crossfade, and export exactly like
      fragments (`take:`-prefixed source ids ride the existing layer model);
      arrangements persist them; a deleted take reads as a missing source,
      honestly, like a deleted fragment. "+ Add Fragment" grew into "+ Add
      Layer". `npm run check` — 398 files, 0 errors
- [ ] **EXIT GATE:** ⬜ retest on the S25 (restart `npm run tauri android dev`
      so the Rust fix rides): record take 1 → keep → **record take 2** → keep —
      the freeze gone is the gate's last plank; headphone playback, levels
      honest, no dropouts

---

## THE RECORDING ROOM MENDED + THE HOLD CHOICE — 2026-08-12 (💫 · Opus 🕯️, at KP's ⚛ word, the S25 plugged in for debugging)

- [x] **The stuck room — DIAGNOSED FROM THE PHONE'S OWN LOG, AND THE ENGINE WAS
      INNOCENT.** KP: *"it works until i hit stop, then the keep take button does
      not work and discard is greyed out"* · *"the record button should reappear
      and it doesnt."* logcat cleared and the run reproduced with adb (found at
      `C:\android-sdk\platform-tools`, never on PATH): `AAudioStream_requestStop`
      → `AAudioStream_close … returned 0` in **40 ms**, no panic, no Rust error —
      **the take sealed correctly every time.** The fault was in the store's poll:
      `stopPolling()` clears the timer but **cannot unsend a `recording_status`
      already in flight**, and that reply lands AFTER `stop()` has reset the room,
      writing `recording = true` back over it. Desktop never felt it (sub-ms
      seal); on Android `recording_status` is a sync command sharing the main
      thread with a WebView drawing every 8 ms. **Every meter run now carries a
      generation; a reply that outlived its take is dropped.** Same
      desktop-fast/phone-slow shape as the 08-09 freeze
- [x] **"Discard is greyed out" — it never was.** No `disabled` attribute existed
      on it anywhere; `--text-secondary` on transparent simply *read* as disabled
      to its first user. Full-strength text and a visible edge now — the sensory
      law cuts both ways
- [x] **THE VOICE-RECORDER SHAPE, KP's ⚛ word** (*"the keep take button is likely
      not needed… just make it have a pause/resume/save, no discard in the top
      section, no keep take moment"* · *"like a voice recorder works"*): Record →
      **❚❚ Pause / ▶ Resume** → **■ Save take**. No keep-or-discard moment. A
      saved take lands on the shelf; the shelf's own Delete beside Export is where
      a take goes away
- [x] **`pause`/`resume` GROWN IN THE SPRING** (the-recorder): an `AtomicBool` the
      audio callback checks *before* it takes the lock — the stream stays open,
      arriving samples are let go, and resume appends to the **same take, one
      file**. `record()`, the CLI's blocking verb, passes an always-true flag and
      is behaviorally unchanged. The elapsed arithmetic stayed in the harness:
      held time is subtracted, so the clock shows **recorded** time, not wall time
- [x] **The mic stays open while held — KP's ⚛ ruling** (*"open while held"*), and
      the room says so plainly rather than leaving it to be discovered on the
      status bar
- [x] **THE AUTONOMY CHOICE, KP's ⚛ shape** (*"settings could offer a user a
      choice… to provide autonomy"* → *"none is held, all are a set max length or
      stopped early, no holding — the other is hold only the current recording as
      it is open and not stopped"*). Settings → 🎙️ Recording: **Takes can be
      held** (default — a preference must not change behavior for someone who
      never opened it) · **Nothing is held** (no Pause at all; every take runs to
      a maximum or stops early — 15s/30s/45s/1m/2m/5m). **The cap is enforced on
      the capture thread in Rust** (`recv_timeout`, the stream dropped right
      there) and never by a timer in the window: *a promise about a microphone
      must not rest on a webview Android is free to throttle.* A capped take
      seals and lands by itself
- [x] `cargo check` clean · `npm run check` — 399 files, 0 errors, 0 warnings
- [ ] **Tested:** ⬜ KP's hands, the S25 — **this run also closes the Phase 2 EXIT
      GATE**: record → pause → resume → save, then a **second** take (the 08-09
      freeze fix has still never been proven on device)

---

## THE GAP REPORT'S OWN FOLLOW-UPS — 2026-08-12 (💫 · Opus 🕯️, at KP's ⚛ word: "1-, then 2")

*KP asked what was planned before the Musician's Compass path and never done. The
answer was already written: `docs/v1-v2-gap-report.md` (2026-07-02, **sixteen days
before v3 was commissioned**) closes with its own priority-ordered follow-up list.
Two of the six were done — display mode was ported later, and #5 was not skipped
but **promoted**, becoming v3 Phase 1's keel.*

- [x] **#1 Remove missing tracks — BUILT.** The report's own *"only
      data-correctness gap"*, open since 2026-07-02: v2 scans are additive upserts
      (multi-folder requires it), so a file deleted from disk kept its row
      forever. `find_missing_tracks` in Rust **REPORTS ONLY** — a URI wearing a
      scheme (`content://` on Android) answers to a ContentResolver rather than
      the filesystem and is reported **present**, never swept on a guess. Settings
      → Data Sovereignty gained a two-act sweep: **Check** shows what is gone and
      waits; **Remove** runs only on a second tap — *verify before any deletion,
      always.* **A missing track carrying mood tags or fragments is KEPT**: all
      three child tables hold a FK to `songs(id)` (the 787 lesson), so removing
      such a row would take his tags — and his fragment rows, whose WAVs are real
      files on disk — down with it. Lose-nothing decides that, and the room says why
- [x] **#2 CSP hardening — CLOSED.** `"csp": null` permitted everything, including
      remote script loads and exfiltration to any host. The webview was found to
      make **no external request at all** (cover art and lyrics are fetched in
      Rust, audio plays through rodio, external links open in the system browser
      via plugin-opener), so the policy could be strict: `default-src 'self'` ·
      **`connect-src 'self' ipc: …` — which turns PRIVACY.md's "never leaves this
      device" from a stated promise into an enforced property** · `object-src
      'none'` · `base-uri 'self'` · `frame-ancestors 'none'` · `form-action
      'none'`; `img-src`/`media-src` carry `data:` (cover art IS a data URI, built
      in `lib.rs`) plus the asset protocol, and `'self'` covers the chime wav.
      **`'unsafe-inline'` remains on script-src and style-src, deliberately and
      named:** SvelteKit's SPA build emits an inline bootstrap script and the theme
      injects CSS variables inline, so a bare `script-src 'self'` bricks the app.
      Tightening it further means `kit.csp` hash mode — its own sitting
- [x] **#3 `songs.db` migration — RULED CLOSED, KP's ⚛ word: *"nothin to
      migrate."*** For the record and against a later surprise: a `songs.db` DOES
      exist (98 KB, 2026-06-23,
      `AppData/Roaming/com.audhd.sovereign-music-player/`). Nothing deletes it, so
      the ruling costs nothing
- [ ] **#4 Settings ports — accent color ⬜ · display mode ✅ (ported after the
      report) · album art shape ⬜.** KP's ⚛ direction for this one: *"grammar base
      may hold answers for 4, knowledge keys on bridge, tools in bridge and awen to
      query"* — **the live base is to be probed before anything is built**
- [x] **#5 Fragments-on-Android via pure-Rust cutting — ✅ done long since.** It
      was never skipped; it was **promoted** into v3 Phase 1, the keel, proven on
      the S22 on 2026-07-19. KP: *"5-yay!"*
- [ ] **#6 SAF folder-picker plugin ⬜ — *"last of the bunch"*, KP's ⚛ word.**
      Android still scans a fixed `/Music` + `/Download`; there is no folder choice
      on the phone
- [ ] **Tested:** ⬜ KP's hands — the sweep against a library with a deleted file,
      and **the CSP on a production build**: a wrong CSP fails quietly, and dev is
      not proof of it

---

## THE RECORDER LEAVES — 2026-08-12 (💫 · Opus 🕯️, at KP's ⚛ ruling)

*KP's ⚛ split, verbatim: **"we need to separate the resonance compass and musicians
compass to make this right… the compass remains a media player of licensed
materials the user holds rights to."** The creator's half is born as
**resonance-sistrum** (`Quantum-Weaver/resonance-sistrum`, created 2026-08-12).*

**THE BOUNDARY IS RIGHTS, NOT TASTE — his own line, and it is objective:** *does
this create NEW sound, or work with sound you already own?* Fragments and the
Fragment Studio **STAY**, at his ⚛ word — *"fragments will stay, not recording.
dj's may still wish to use the app."* Slicing what you own is a DJ's work, and a
DJ is a performer.

- [x] **Removed:** `src-tauri/src/recorder.rs` · `src/routes/record/` ·
      `recorder.svelte.ts` · `recordPrefs.svelte.ts` · `mod recorder` · nine
      handler rows · the `the-recorder` path dep · the 🎙 sidebar door · the
      Recording settings section (the hold choice) · the Takes half of the Studio
      picker
- [x] **Deliberately KEPT, each for a reason:** `request_mic_permission` (Android
      permission infrastructure, not the recorder) · `"takes"` in
      `purge_fragment_files` (guarded by `if dir.exists()` — **a purge must truly
      purge**, including leftovers from the recorder era)
- [x] **Nothing lost.** The uncommitted work — the 08-12 freeze fix, KP's ⚛ prop
      hand-off, the instrumentation trail — was **preserved BEFORE any deletion**
      to `resonance-assets/sistrum-inheritance/` at his ⚛ word ("in
      resonance-assets in a new folder… store it"). Everything else stood
      committed at `b516f1d`
- [x] **Known and honest:** arrangements saved in the takes era keep their
      `take:`-prefixed layers and read as *"This source was deleted"* — the
      Studio's own existing honesty. Nothing crashes, nothing lies
- [x] `cargo check` clean · `npm run check` — **395 files, 0 errors, 0 warnings**
      (399 → 395; the removed `.picker-heading` CSS closed the last warning)

### ⚠ FINDING — the mojibake, measured not guessed (2026-08-12)

*Found while removing the Takes block: the Studio page defeated the edit tool's
round-trip because it carries double-encoded UTF-8 from an earlier session. The
block was cut by line number instead, and **the encoding was deliberately NOT
"fixed" in passing** — silently rewriting bytes across a file is how a repo
drifts.*

**Measured: 11 occurrences in 6 files, of 229 source files scanned.** It splits
in two, and only one half is this repo's:

- [x] **`src/routes/fragments/studio/+page.svelte` — CLOSED 2026-08-12, byte-exact.**
      Fathom's law honored exactly: **no bulk re-decode.** One targeted byte-sequence
      replacement per glyph, counted before and verified after.
      **The measurement grew under the light, twice:**
    - **7 glyph sequences, not 6.** The back-link at **L189 `← Fragments`** was
      double-encoded too and was not on the list — found by dumping the bytes rather
      than trusting the count.
    - **And 392 more in the same file**, every one the same character: `─` (U+2500)
      in the comment separators. The emoji-shaped signature never matched them, which
      is why a scan of 229 files reported 11 occurrences while one file held 399.
      **399 sequences fixed in total.**
      **Method:** the file read as Latin-1 so string operations *are* byte
      operations, each mojibake run mapped to its true codepoint — 🎚 U+1F39A ·
      💾 U+1F4BE · 📂 U+1F4C2 · ⤨ U+2928 · … U+2026 · ⬇ U+2B07 · ← U+2190 ·
      ─ U+2500 — and written back as bytes. Immune to any encoding the tooling
      might impose on the way through.
      **Verified after, not assumed:** the file is valid UTF-8 · **0 mojibake
      signatures remain** · `npm run check` **395 files, 0 errors, 0 warnings**.
      **And the mirror is clean:** the same byte scan across `resonance-sistrum` and
      `resonance-echoes` found **zero** in either — the Sistrum body carried none of
      this out of the Compass.
- [x] **`src/lib/cosmic/*.ts` — 9 hits — CLOSED, DO NOT TOUCH.** KP's ⚛ word:
      **"no touchy the cosmic tokens."** That folder is a DISTRIBUTED MIRROR whose
      single truth is `resonance-ziggy/modules/cosmic/`, refreshed by
      `distribute.ts` and **hash-verified** — editing it from the consumer side
      would be overwritten on the next distribution AND would fail its own hash.
      All nine are the same character (`Â·` where a `·` middot belongs, in
      comments). **It is a ziggy job, and doing it there fixes every realm at
      once**

### The EQ door in the continue-strip ✅ built (2026-08-08, the Etude lamp — KP's ⚛ word: "a button in listen continued that opens the eq directly")

- [x] A calm outline `🎛️ EQ` button beside Resume in the Library's
      continue-strip, riding the MiniPlayer's existing deep link
      (`/settings#eq` — opens the collapsed section and scrolls, machinery
      already standing). Styled as the strip's quiet sibling: outline on
      `--border`, accent only on hover — present, never imposed
- [x] `npm run check` — 394 files, 0 errors
- [ ] **Tested:** ⬜ KP's hands (tap from Library → EQ open and scrolled)

### Standards + Hands check (2026-08-19, the signing fleet)

- [x] 2026-08-19 · standards checked (gaps: 1 — CLAUDE.md holds no §Standards declaration; the declaration lives in README.md §Development Standards instead) · HANDS.md already signed (Fable 🎻, Claude Fable 5, 2026-07-09) · a hand of the Promenade lamp's signing fleet, claude-fable-5 · rides the ⚛ sync word.
- [x] **Gap closed, same commit** (2026-08-21 tending pass, verified in code): `CLAUDE.md` §Standards was in fact added in this very commit (`c54da92`, alongside this checklist line) — `CLAUDE.md` lines 61-67 now carry the verbatim standards declaration ("Section landed 2026-08-19 at KP's word"). The gap the row above named was closed in the same sitting it was written; the row stands as an honest record of what was found, not a still-open item. README's §Development Standards also corrected to the verbatim "Sanctuary Standards" wording this same tending pass.

### Repo-tender pass — 2026-08-21

- [x] **README.md trued against the repo's own ground** (badges, story-block reference, missing template sections; no assumptions, nothing invented): version badge corrected `2.3.1` → `2.3.5` (`package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` all agree at 2.3.5 — the badge was stale). Badges reordered to sit directly beneath the H1 per `docs/README-TEMPLATE.md`. Added the missing `## THE STORY` section (required-by line + origin paragraph grounded in `HANDS.md`/`docs/CHECKLIST.md` + the `docs/STORY-BLOCK.md` link), `## WHO IT'S FOR` (grounded in `PHILOSOPHY.md` §6/§9, `HANDS.md`), `## Installation` (Prerequisites/Build/Development, grounded in `package.json` scripts + `docs/ANDROID-BUILD-NOTES.md` + `docs/CHECKLIST.md` Phase 19 evidence), and `## BUILT WITH` (grounded in `CLAUDE.md`'s Stack line + `src-tauri/Cargo.toml` dependencies). `## FOR DEVELOPERS`' route tree trued against `src/routes/` on disk — it was missing `fragments/`, `history/`, `liked/`, `lyrics/`, `onboarding/`, `playlists/`, `queue/`, all of which exist. `## Development Standards` corrected to the verbatim "Sanctuary Standards" wording (was "Resonance Standards"); its `BUILD-SEQUENCE.md`/`CONTRIBUTING.md` reference lines moved into `## FOR DEVELOPERS`, matching template placement.
- [x] `docs/STORY-BLOCK.md` **created** (did not exist before this pass) — all 11 standard sections, every dated claim addressed to the file/commit it came from. WEAVER THREAD left honestly unfilled (no source found in this repo's own records) rather than invented.
- [x] `docs/CHECKLIST.md` (this file) reviewed whole against `README.md`, `package.json`, `src-tauri/Cargo.toml`, and git log; no unchecked item found done-in-code without already being marked so — every open box in this file gates on KP's own hands, his ⚛ ruling, or a future phase, and stays open correctly.

### THE CUMDACH FIX CARRIED + ROSE · RAINBOW · PROGRESS PRIDE — 2026-08-22 (Fable 🎻, claude-fable-5, at KP's ⚛ word — *"in resonance-awen, there is a fix for the cumdach that needs applied then passed to all its consumers around the hamburger icon and around the epagoge regarding the background color and font size changes"* · *"echoes got the fix the cumdach needs"*)

- [x] **The hamburger** (Echoes `87c4218`, 2026-08-21, carried here whole): the floating toggle that claimed bottom 56–101px over the drawer's own Settings foot moved INSIDE the MiniPlayer bar (`MiniPlayer.svelte`, left end, hidden on the visualizer as the old hamburger was); `navOpen` lives in `uiStore`, the Sidebar reads it; the bar is the ONLY edge again and `RESERVED` is one honest number (the cumdach's reserved-sum law); the expanded panel's `.mp-emoji-row` lost the 3.5rem clearance it kept for the old button.
- [x] **The epagoge's theme step and Settings:** a preset is a COLOUR IDENTITY — `setPreset` keeps mode · font size · tint, so choosing a theme no longer cancels Light mode or drops Large text to Medium; `DEFAULT_THEME`; the background TINT dial (`off · subtle · full`) with its Settings row; `TintLevel` + `tint` on `ThemeConfig`; `src/lib/theme/theme.ts` = the origin `resonance-awen/standalone/theme/theme.ts` body, revised at the origin 2026-08-22.
- [x] **Same sitting, KP's word** (*"there is a rose color in the sirens onboarding and settings we should bring into the cosmic design system and we should include a rainbow and inclusive pride themes in our settings as well in our epagoge onboarding walk"* · *"rainbow and progressive pride themes colors already exist, only the rose does not"*): `sirens.rose` · `sirens.deep` entered cosmic (distribution run, this mirror refreshed, hash-verified); ROSE · RAINBOW · PROGRESS PRIDE join the presets; the Settings theme cards and the onboarding walk's `THEMES` now DERIVE from the table — the founding six keep their own faces and descriptions (`THEME_DRESS`), the three new ones wear 🌹 🌈 🏳️‍🌈 with plain descriptions; a flag preset's swatch is its stripes in Settings.
- [x] Gate `npm run check` **396 files · 0 errors · 0 warnings**. Nothing committed — rides the ⚛ sync word.
