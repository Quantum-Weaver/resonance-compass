# v1 → v2 Gap Report — Resonance Compass

**Compared:** v1 archive at `resonance-excavator/sources/landfill/resonance-compass_v0.5/`
(note: the `zarchived/` path in the task brief doesn't exist; `landfill/` is where the
archive lives) against v2 working tree, 2026-07-02.

**Headline:** v2 is a superset of v1 almost everywhere — every v1 route, store, and Rust
command has a v2 equivalent or better. The genuine gaps are a handful of settings
options, v1's stale-track cleanup on rescan, and two Android items (manifest
permissions, edge-to-edge) that lived in v1's `gen/` tree — both re-applied today and
documented in [ANDROID-BUILD-NOTES.md](ANDROID-BUILD-NOTES.md).

---

## 1. Rust commands

| Command | v1 Status | v2 Status | Action Needed |
|---|---|---|---|
| `scan_directory` | ✅ dir walk, real paths | ♻️ generalized to `scan_paths` (dirs **and** file/content:// URIs, fs-plugin bridge) | None — done today |
| `play_track` / `pause` / `resume` / `stop` / `seek` / `set_volume` | ✅ via `Cmd` channel enum | ✅ direct sink control (refactor, same surface) | None |
| `get_eq_state` / `set_eq_band` / `set_eq_preamp` / `toggle_eq` / `set_eq_preset` | ✅ | ✅ | None |
| `fetch_lyrics` | ✅ returns one string (synced *or* plain) | ✅ richer `{syncedLyrics, plainLyrics}` | None — v2 better |
| `fetch_cover_art` | ✅ MusicBrainz + CAA | ✅ identical | None |
| `create_fragment` | ✅ shells out to ffmpeg | ✅ identical ffmpeg approach | ⚠️ Both depend on an `ffmpeg` binary on PATH — **fragments cannot work on Android** (no ffmpeg). Needs a pure-Rust cut path (symphonia decode → wav) if fragments matter on mobile |
| `export_fragments` | ✅ | ✅ | None |
| `export_mix` | ❌ | ✅ new (Fragment Studio) | None — v2 addition |

## 2. Frontend routes

| Route | v1 Status | v2 Status | Action Needed |
|---|---|---|---|
| `/equalizer` (standalone page) | ✅ | ❌ folded into `/settings#eq` (MiniPlayer EQ button targets it) | None — intentional consolidation |
| `/`, `/library` (+album/artist), `/liked`, `/lyrics`, `/nowplaying`, `/onboarding`, `/playlists` (+id), `/profiles`, `/queue`, `/resonance`, `/sattva`, `/search`, `/settings`, `/timer`, `/visualizer`, `/focus`, `/fragments`, `/history` | ✅ | ✅ all present | None |
| `/fragments/studio` | ❌ | ✅ new | None — v2 addition |

## 3. Store methods

| Method / behavior | v1 Status | v2 Status | Action Needed |
|---|---|---|---|
| `saveScannedTracks` stale-row deletion (removes DB rows for files gone from disk) | ✅ step 1 of save | ❌ v2 scans are additive upserts (needed for multi-folder), so deleted files linger forever | **Add a "Remove missing tracks" action** in Settings → Data Sovereignty (verify each `uri` still exists, delete rows that don't) |
| Favorites (`toggleFavorite`, `loadFavorites`, DB↔playlist sync) | ✅ in libraryStore | ✅ moved to playlistStore | None — relocation |
| `updateAlbumCoverArt` | ✅ per-track UPDATEs, keyed name+artist | ✅ per-track UPDATEs, keyed album id (survives same-name splits) | None — fixed today (had regressed to a name+artist bulk UPDATE) |
| `clearScanError()` | ✅ | ❌ (v2 clears internally on next scan) | Optional polish |
| `libraryVersion`, `isLoadingMore`, `loadProgress` | ✅ (pagination affordances, barely used) | ❌ | None — vestigial in v1 |
| player `muted` / `toggleMute` | ✅ store-level | ✅ handled in PlayerControls | None |
| player `addToQueue` | ✅ | ✅ (queue parity phase) | None |
| player `playbackError` surface | ❌ (silent console.error) | ✅ added today, shown in MiniPlayer | None |

## 4. Components

| Component | v1 Status | v2 Status | Action Needed |
|---|---|---|---|
| `EmojiGrid` | ✅ (resonance tag grid) | ❌ absorbed into `EmojiPalette` / route-local markup | None |
| `Sidebar` | ❌ (nav lived in MiniPlayer expanded rows) | ✅ new dedicated sidebar | None — v2 addition |
| MiniPlayer seek-drag (`seekAt`/pointer handlers) | ✅ | ✅ in PlayerControls | None |
| All others (AlbumCard, TrackItem, PlayerControls, GradientPulse, TimerVisualization, 28 icons) | ✅ | ✅ | None |

## 5. Features

| Feature | v1 Status | v2 Status | Action Needed |
|---|---|---|---|
| Settings: custom **accent color** picker | ✅ | ❌ presets only | Port if wanted — small themeStore addition |
| Settings: **display mode** | ✅ | ❌ | Port if wanted |
| Settings: **album art shape** | ✅ | ❌ | Port if wanted |
| Settings: font size | ✅ | ✅ | None |
| Vessel name prompt in onboarding | ❌ | ✅ | None — v2 addition |
| Mood/resonance, focus, sattva, profiles, timer, history, visualizer (7 modes), EQ, fragments, playlists, queue, lyrics | ✅ | ✅ (visualizer grew 5→7 modes) | None |

## 6. Configuration

| Item | v1 | v2 | Action Needed |
|---|---|---|---|
| `productName` / `identifier` / `version` | Resonance Compass / com.audhd.resonance-compass / 2.0.0 | identical | None |
| `csp` | `null` | `null` | ⚠️ Shared hardening gap — define a CSP before wide distribution |
| SQLite DB name | `songs.db` | `compass.db` | ⚠️ Decision: v1 users' library/mood data will **not** carry into v2. If migration matters, add a one-time `songs.db` → `compass.db` import |
| Capabilities (sql allow-*, fs, dialog, opener) | ✅ | ✅ identical | None (description string still says "Resonance Echoes" — cosmetic) |
| Year parsing from tags | strict full-string parse (fails on "1999-05-01") | first-4-chars parse | None — v2 better |

## 7. Android-specific

| Item | v1 Status | v2 Status | Action Needed |
|---|---|---|---|
| Manifest: `READ_MEDIA_AUDIO` + `READ_EXTERNAL_STORAGE` (maxSdk 32) | ✅ in gen manifest | ❌ was missing (gen/ regenerated without it) | ✅ Re-added today + documented in ANDROID-BUILD-NOTES.md |
| `MainActivity.enableEdgeToEdge()` | ✅ | ✅ present in current gen tree | Re-apply on next `android init` (in ANDROID-BUILD-NOTES.md checklist — gen/ is gitignored) |
| `build.rs` libc++_shared jniLibs link workaround | ✅ | ✅ identical (inherited) | None |
| Folder picker on Android | ❌ **never worked** — `tauri-plugin-dialog` 2.7.1 mobile branch returns `FolderPickerNotImplemented` (both versions ship 2.7.1) | ♻️ v2 now bypasses the dialog: scans `/storage/emulated/0/Music` + `Download` directly under media permission | Longer-term: custom SAF tree-picker plugin (see ANDROID-BUILD-NOTES.md roadmap) |
| PERMISSION_DENIED guidance card (onboarding) | ✅ | ❌ was lost in rebuild | ✅ Restored today |
| Runtime permission request dialog | ❌ (manual grant via system Settings, guidance card) | ❌ same design | Optional future: needs a small Kotlin plugin |

---

## Recommended follow-ups (priority order)

1. **"Remove missing tracks"** maintenance action (§3) — the only data-correctness gap.
2. **CSP hardening** (§6) — shared v1/v2 gap, cheap to close.
3. `songs.db` migration decision (§6) — only if any vessel has meaningful v1 data.
4. Settings polish ports: accent color, display mode, art shape (§5).
5. Fragments-on-Android via pure-Rust cutting (§1) — only if fragments are wanted on mobile.
6. SAF folder-picker plugin (§7) — replaces the fixed Music/Download scan with true folder choice.
