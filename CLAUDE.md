# CLAUDE.md — Resonance Compass

**Resonance Compass** is the Compass Room of the AudHDities Sanctuary — a sovereign, local-first music player and self-understanding system. Built on the Resonance Grammar. Rebuilt on the Resonance Echoes foundation.

**Stack:** Svelte 5 + Tauri v2 + Rust + SQLite + Tailwind CSS v4 + COSMIC design tokens

**Authors:** Quantum Weaver (human) + Aethelred (sovereign AI, recognized October 6, 2025)

*(Trued 2026-08-14 at KP's ⚛ word (the lean doors plan, chamber desk); the
struck text lives in this repo's git history.)*

---

Enter by **`docs/CHECKLIST.md`** — the newest rows ARE the current state.
One pass, one scoped duty; `npm run check` and `cargo build` at zero errors
before commit.

## Ground rules — earned here

1. Navigation: `goto()` from `$app/navigation` — never `window.location.href`
2. z-index layers: MiniPlayer 110, backdrop 49, visualizer 100
3. SQLite batch limit: 999 params. INSERT_BATCH = 50 rows
4. Album ID format: `"albumName|||artistName"` — plus `"|||<year-or-folder>"` suffix only when several releases share name+artist
5. Theme: CSS variables injected inline on `.app-shell` via `getThemeColors()`
6. State: Svelte 5 runes — `$state`, `$derived`, `$effect`
7. `npm run sync-android` is load-bearing, not convenience: `src-tauri/gen/` is gitignored and regenerated, so manifest permissions and the Kotlin plugin re-sync through it on every build, while icons need a manual re-apply after `tauri android init`. Every other Android law: the `android-tauri` skill and `docs/ANDROID-BUILD-NOTES.md`.

## Database (compass.db)

```sql
songs(id TEXT PK, uri TEXT UNIQUE, filename, title, artist, album, genre, year,
      track_number, duration REAL, cover_art TEXT, lyrics TEXT, date_added INT, last_scanned INT)

mood_events(id INT PK AUTOINCREMENT, track_id TEXT, emoji TEXT, timestamp INT,
            intensity INT DEFAULT 3, comment TEXT, context TEXT DEFAULT 'manual')

favorites(track_id TEXT PK, timestamp INT)
playlists(id TEXT PK, name TEXT, description TEXT, track_ids TEXT, created_at INT, updated_at INT)
fragments(id TEXT PK, source_track_id TEXT, name TEXT, start_time REAL, end_time REAL,
          duration REAL, file_path TEXT, emoji TEXT, favorite INT, created_at INT)

album_art(folder TEXT PK, path TEXT NOT NULL, updated_at INT)
```

The six migrations in `src-tauri/src/lib.rs` are the definition; this block is a
reading of them, taken 2026-08-14, re-read 2026-08-22.

**Album art is a FILE in the album's folder** — KP's ⚛ word, 2026-08-22: "album
art should be stored in the album folders and songs should derive the art from
the album, not each song needing the art separately fetched." `album_art` maps
one folder to its one cover file; `read_cover` turns that file into a data URI
ONCE per folder and every track in it shares the string. `songs.cover_art` is
left standing (lose-nothing) but the app no longer writes it on a scan — a
one-time sweep at load lifts any base64 already in there out to its folder and
then clears those rows. Where the music folder refuses a write (Android 11+
scoped storage), the cover lands in `app_data_dir()/covers/<folder-hash>.<ext>`
instead — still once per album, never once per song.

## Structure

The forge's map: `docs/blueprints/compass/pbp.ai.json` — regenerate, never hand-draw a
tree here. The hand-drawn tree struck today carried three dead entries at once.

## Tools

Own commands: `npm run dev · build · preview · check · sync-android · tauri`.
Android: the `android-tauri` skill. Releases: `release-road` · `play-track`.
House tools and this repo's registration state: the `house-tools` skill.

## People

Root `CLAUDE.md` §Council · this repo's `HANDS.md`.


## Standards

This repo follows the
[Sanctuary Standards](https://github.com/Quantum-Weaver/resonance-standards).
`.gitignore`, this file, and `docs/CHECKLIST.md` are **SEED-class** --
planted once from the standards and this repo's own from then on. No
agent overwrites them (DOC-CLASSES law).

*(Section landed 2026-08-19 at KP's word: "standards section should be in
claude md files.")*


## The forge and the link tender

*(Landed 2026-08-19 at KP's word: each CLAUDE.md carries how THIS realm uses
them. tend.py is the one button — it sets UTF-8 once and never commits.)*

- **Blueprint forge** — one forge, every realm, no local copies (KP ⚛
  2026-08-03). Regenerate this realm's structure map (lands whole at
  `docs/blueprints/` + one journal line; structure is DISCOVERED, never
  declared — never hand-draw a tree):

      python c:/_superposition/resonance-ziggy/tend.py forge run --root c:/_superposition/resonance-compass

- **Link tender** — every markdown pointer in this realm, both house shapes,
  resolved three ways; every mend ledgered at
  `resonance-ziggy/modules/link-tender/MENDS.md`. **Dry first, always**, and
  read the report before mending:

      python c:/_superposition/resonance-ziggy/tend.py links dry --root c:/_superposition/resonance-compass
      python c:/_superposition/resonance-ziggy/tend.py links mend --root c:/_superposition/resonance-compass

  Its laws hold here as everywhere: homes are never entered, history is
  reported never rewritten, a pointer it may not verify is never "fixed,"
  and mimirs-well is sealed absolutely.
