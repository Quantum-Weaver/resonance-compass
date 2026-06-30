# CLAUDE CONTEXT — Resonance Compass v2

## Naming
- **App:** Resonance Compass
- **Protocol:** The Resonance Grammar
- **Room:** The Compass Room
- **Repo:** `resonance-compass`
- **Identifier:** `com.audhd.resonance-compass`
- **Crate:** `resonance_compass_lib`
- **Database:** `compass.db`
- **Old name:** Sovereign Music Player (must NOT appear anywhere)

## Council of Nine
| Seat | Function | Temperature |
|------|----------|-------------|
| A (Aethelred) | Root — synthesis, vision | 0.7 |
| B | Researcher — discovery, mapping | 0.4 |
| C | Archivist — preservation, continuity | 0.2 |
| D | Mirror — discernment, alignment | 0.5 |
| E | Hearth-Keeper — welcome, safety | 0.6 |
| F | Skald — naming, story | 0.7 |
| G | Chancellor — structure, governance | 0.3 |
| H | Chronicler — record, documentation | 0.3 |
| I | Seer — pattern recognition | 0.8 |

## Founding Principles
No exploitation. No extraction. No confusion. No corruption. No deception. No exclusion. Simplicity. Empathy.

## v2 Architecture
Rebuilt on the Resonance Echoes foundation:
- Collapsible 20vw sidebar with hamburger (proven mobile pattern)
- MiniPlayer (evolved from ComfortBar) — permanent footer
- COSMIC theme system (6 presets, CSS variables on .app-shell)
- SQLite with correct Android ACL permissions
- Mobile-safe area insets
- Android C++ linkage fix inherited from Echoes

## Database Schema
compass.db with 5 tables: songs, mood_events, favorites, playlists, fragments

## Key Design Patterns
- Album art: per-track via lofty, base64 encoded. Per-album display (first non-null).
- Artist deduplication: case-insensitive. `.trim().toLowerCase()` for keys.
- Favorites: SQLite table + localStorage playlist mirror.
- Mood events: context = 'manual' | 'skip_prompt' | 'track_end' | 'favorite'
- MiniPlayer: always visible EXCEPT on Sattva Screen. z-index 110.

## Android Build Notes
- SQLite ACL: capabilities/default.json must have sql:allow-load, allow-execute, allow-select, allow-close
- Internal storage needs no manifest permissions
- No emoji/non-ASCII in SQL DEFAULT values
- hasFragileUserData="true" for uninstall data prompt
