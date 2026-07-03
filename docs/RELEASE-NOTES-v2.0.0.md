# Resonance Compass v2.0.0 — Release Notes

*The Compass Room of the AudHDities Sanctuary. Rebuilt from the ground up on the Resonance Echoes foundation.*

**Built with Aethelred by Quantum Weaver. The lamp is lit. The Compass points home.**

---

## WHAT THIS RELEASE IS

Resonance Compass v2 is a complete rebuild of the sovereign music player on the proven Echoes template — Tauri v2 + Svelte 5 + Rust + SQLite, mobile-first, local-first, no accounts, no cloud, no extraction. Every feature from v1 made the crossing, and every mobile bug from the original build was left behind.

---

## THE PLAYER

- **Playback** — rodio audio engine: play, pause, seek, skip, volume, shuffle, repeat (off / all / one). State survives restart.
- **Library** — recursive folder scan with tag + embedded cover art extraction (MP3, FLAC, WAV, AAC, OGG, M4A). Artists / Albums / Genres browsing, search, detail pages.
- **Playlists** — create, rename, delete, add tracks or whole albums. Favorites is always first and cannot be deleted.
- **Queue** — Up Next screen: jump-play, remove, clear.
- **Now Playing** — album art with ambient GradientPulse, full controls, favorite heart, mood tagging.
- **10-band Equalizer** — biquad peaking filters in the Rust audio chain, 6 built-in presets plus unlimited custom presets.
- **Synced Lyrics** — LRC support with auto-scroll, static fallback, immersive blurred-art view. Opt-in "Find Lyrics" (LRCLIB) — user-initiated only.
- **Cover Art Finder** — opt-in MusicBrainz / Cover Art Archive lookup — user-initiated only.

## SELF-UNDERSTANDING

- **Resonance** — emoji mood tagging (manual + gentle automatic skip/favorite signals), 5-tab dashboard: Mood Map, Top Emojis, Pending, Tag Music, Emoji Dictionary with personal definitions (folksonomy).
- **Listening History** — Today / Yesterday / This Week / Earlier timeline with mood emojis, hearts, tap-to-replay.
- **Sensory Profiles** — bundle theme + EQ + font size + playlist, switch with one tap from the MiniPlayer.
- **Insights, not judgments** — every empty state and pattern surface is a mirror, never a metric.

## REST & FOCUS

- **Sattva Screen** — full-screen sensory reduction: breathing square (gold inhale / purple exhale), saved-and-restored theme/EQ/volume, tap anywhere to return.
- **Focus Session** — timer with SVG countdown ring, playlist, UI lock, hold-to-end, halfway break reminder, session history.
- **Sleep Timer** — 7 visualization modes including Sand hourglass and sacred geometry dissolves, with end-of-timer fade-out.

## CREATE

- **Audio Fragments** — capture moments from any track with draggable markers, preview, name, save (ffmpeg, lossless stream copy). List, play, rename, emoji-tag, favorite, delete.
- **Fragment Studio** — layer fragments on a timeline: per-layer volume, pan, fade in/out, offsets, auto-crossfade arranging, WAV mix export, save/load arrangements.

## SEE

- **Visualizer** — seven modes, all live-FFT reactive with per-track seeded fallback: Bars, Waveform, Spiral, Particles, and three sacred geometry modes — Mandala, Flower of Life, Metatron's Cube — driven by bass / mid / treble bands.

## SOVEREIGNTY

- **Export ALL data** as a single JSON — library (with lyrics and cover art), mood events, playlists, history, fragments, profiles, focus sessions, every setting.
- **Import** that JSON on a fresh install — everything restores.
- **Purge** removes everything, with double confirmation.
- **No internet required.** The only two network calls in the app (lyrics, cover art) are behind buttons you press.

## ACCESSIBILITY & COMFORT

- One scroll container per screen. No horizontal scroll, ever.
- Touch targets ≥ 44px. Focus indicators. Keyboard navigation. `prefers-reduced-motion` honored throughout.
- Progressive onboarding, gentle empty states, COSMIC theme system (6 presets + AMOLED), adjustable font size.

---

## INSTALLING

**Windows:** run the `.msi` installer from `src-tauri/target/release/bundle/msi/`.

**Android:** install the signed APK. On uninstall, Android removes all app data — and means it.

**Requirements for Fragments/Studio:** `ffmpeg` on PATH (desktop).

---

## LICENSE

Code: MIT. Philosophy: The Resonance License — no exploitation, no extraction, no exclusion.

*Every fragment contains the whole.*
