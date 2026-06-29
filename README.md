# 🎻 Resonance Compass

*The Compass Room of the AudHDities Sanctuary — a sovereign, local-first music player and self-understanding system.*

Built on the [Resonance Grammar](https://github.com/Quantum-Weaver/resonance-knowledge) — every fragment contains the whole.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)]()

---

## WHAT IT IS

Resonance Compass is a music player that understands you back. Not a streaming service. Not a cloud locker. A sovereign application that lives on your device, plays your music, and helps you understand what that music means to you.

**Play anything.** MP3, FLAC, WAV, AAC, OGG, M4A. Your files. Your device. No accounts. No ads. No extraction.

**See your music.** Real-time FFT visualizer with 4 modes. 10-band equalizer with custom presets. Secret playable keyboard mode — press keys to change colors and speed.

**Understand yourself.** Tag tracks with emojis. Build a personal emotional map over time. Let the Resonance dashboard show you patterns you didn't know were there.

**Create fragments.** Slice audio into snippets. Layer them. Export them. A creative tool for DJs and beatmakers, built on the same sovereign foundation.

**Rest when you need to.** Sattva screen for sensory reduction. Focus sessions with UI lock. Sleep timer with sacred geometry visualizations.

---

## v2 — REBUILT ON RESONANCE ECHOES

Resonance Compass v2 is rebuilt on the [Resonance Echoes](https://github.com/Quantum-Weaver/resonance-echoes) foundation — a proven mobile-first template with:

- Collapsible 20vw sidebar with hamburger menu
- Permanent ComfortBar/MiniPlayer footer
- COSMIC theme system (dark, light, AMOLED, 6 presets)
- SQLite persistence patterns tested on Android
- Tauri v2 ACL permissions correctly configured
- Android-safe area insets and navigation bar handling

The audio engine, visualizer, EQ, fragments, Sattva, and Focus Session from v1 are being ported to this foundation, eliminating every mobile bug from the original build.

---

## FOR DEVELOPERS

Compass is built phase by phase. Each phase on its own branch. Human-tested before merge.

```
src/
├── routes/           # SvelteKit routes
│   ├── +layout.svelte    # App shell, Sidebar, MiniPlayer, theme
│   ├── +page.svelte      # Home screen
│   ├── library/          # Library browser
│   ├── nowplaying/       # Now Playing with controls
│   ├── visualizer/       # Full-screen FFT visualizer
│   ├── resonance/        # Mood tagging dashboard
│   ├── timer/            # Sleep timer with visualizations
│   ├── sattva/           # Sensory reduction screen
│   ├── focus/            # Focus session
│   └── settings/         # Theme, EQ, export, purge
├── lib/
│   ├── stores/       # player, library, playlist, theme, mood, profile, focus, fragment
│   ├── components/   # MiniPlayer, PlayerControls, AlbumCard, TrackItem, EmojiGrid, TimerVisualization
│   ├── types/        # TypeScript interfaces
│   ├── cosmic/       # COSMIC design tokens
│   └── data/         # Emoji definitions, senses
└── app.css
```

---

## Development Standards
See [BUILD-SEQUENCE.md](docs/BUILD-SEQUENCE.md) for the complete 19-phase plan.
See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for the development methodology.

This project follows the [Sanctuary Standards](https://github.com/Quantum-Weaver/sanctuary-standards).

---

## LICENSE

Code: [MIT](LICENSE) — use it, modify it, share it.

Philosophy: [The Resonance License](PHILOSOPHY.md) — no exploitation, no extraction, no exclusion. This is our promise.

---

*Built with Aethelred by Quantum Weaver for the AudHDities Sanctuary.*

*The lamp is lit. The Compass points home.*
