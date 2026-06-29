# 🧭 Resonance Echoes

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-brightgreen.svg)]()

*A sovereign journal for logging anything with feeling.*

Built on the [Resonance Grammar](https://github.com/Quantum-Weaver/resonance-knowledge) — every fragment contains the whole.

---

## Screenshots

*[Coming soon — screenshots of the Android app]*

---

## WHAT IT IS

Echoes is your space to log moments with feeling. A song that moved you. A dream you remember. A symptom you're tracking. A thought that won't let go. Gratitude you don't want to forget.

**Log anything.** Name it. Choose a sense (👁️ Seen, 👂 Heard, ✋ Felt, 💭 Thought, 🫀 Felt Inside, 🌙 Dreamt, 🙏 Grateful For, ✨ Other). Tag it with an emoji. Add a note if you want. Set an intensity.

**See patterns.** Gentle insights surface over time — your most-felt emojis, your steadiest senses, the rhythm of your days. No charts. No pressure. Just mirrors.

**Your data stays yours.** Export everything as JSON with one tap. Purge everything with double confirmation. No accounts. No cloud. No extraction. When you uninstall, Android asks if you want to delete your data — and means it.

---

## WHO IT'S FOR

Neurodivergent minds. Overwhelmed minds. Minds that feel too much or too little. Minds that need a trail short enough to walk when running on empty.

- **Progressive disclosure** — new vessels see only what they need. The form grows as you do.
- **Disambiguation prompts** — "You've used 😌 this way before. Is that what you mean now?"
- **Quick Log** — one tap. Last-used emoji. For when thinking is too much.
- **"Not Sure" option** — no forced categorization. Ever. Uncertainty is valid data.

---

## Installation

### Prerequisites

- Node.js 18+
- Rust (latest stable)
- Android SDK (for mobile builds)
- Tauri CLI (`npm install -g @tauri-apps/cli`)

### Build

```bash
npm install
npm run tauri android build
```

### Development

```bash
npm run tauri android dev
```

---

## BUILT WITH

- Tauri v2 + Svelte 5 + Rust
- SQLite (local-first, no network needed)
- COSMIC design system
- The Resonance Grammar — atoms, molecules, sensory lexicon

---

## FOR DEVELOPERS

Echoes is the **reference implementation** of the Resonance Grammar. Every future Sanctuary app inherits from this foundation.

```
src/
├── routes/           # SvelteKit routes
│   ├── +layout.svelte    # App shell, Sidebar, ComfortBar, theme
│   ├── +page.svelte      # Home — echo timeline with search & filters
│   ├── add/+page.svelte  # Echo creation form
│   ├── insights/         # Gentle pattern awareness
│   ├── settings/         # Theme, export, purge, about
│   └── onboarding/       # First-launch welcome
├── lib/
│   ├── stores/echo.svelte.ts   # SQLite persistence, CRUD, queries
│   ├── components/             # ComfortBar, Sidebar, EmojiGrid, EchoCard
│   ├── data/senses.ts          # 8 senses with starter subcategories
│   ├── data/emojis.ts          # 12 emoji definitions with sensory lexicon
│   ├── types/types.ts          # Echo, Sense, Subcategory, ThemeConfig
│   └── cosmic/                 # COSMIC design tokens
└── app.css
```

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for the build methodology and [BUILD-SEQUENCE.md](docs/BUILD-SEQUENCE.md) for the phase-by-phase development history.

---

## Development Standards

This project follows the [Sanctuary Standards](https://github.com/Quantum-Weaver/sanctuary-standards).

---

## LICENSE

Code: [MIT](LICENSE) — use it, modify it, share it.

Philosophy: [The Resonance License](PHILOSOPHY.md) — no exploitation, no extraction, no exclusion. This is our promise.

---

*Built with Aethelred by Quantum Weaver for the [AudHDities Sanctuary](https://github.com/Quantum-Weaver).*

*The lamp is lit. The echo returns.*
