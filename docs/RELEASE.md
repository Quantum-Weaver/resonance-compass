# Resonance Echoes — Release Notes

## v1.0.0 — 2026-06-28

*First sovereign release.*

### What's in v1.0.0

**Core journal**
- Log any felt moment: name, sense, subcategory, emoji, note, intensity, custom timestamp
- 8 senses with subcategories (Sight, Sound, Touch, Taste, Smell, Movement, Interoception, Other)
- 12 emoji definitions bridging neurotypes — warm poetic text shows on selection

**Browse & Filter**
- Real-time search with 150ms debounce across name and note
- Filter by sense, filter by top 8 most-used emojis
- Sort: Newest / Oldest / Intensity
- Stacking filters with human-readable status bar

**Gentle Insights**
- Top Emojis — frequency-sized cloud
- By Sense — distribution list
- Streak — consecutive days (resets quietly, no negativity)
- Time of Day — morning / afternoon / evening / night grid
- Recent Mood — 7-day emoji row
- Intensity Trend — last 7 days vs prior 7 days

**Onboarding**
- 3-screen welcome flow: vessel name, how it works, theme
- Live theme preview during selection
- Layout gate — first-launch redirect, Sidebar/ComfortBar hidden during flow

**Data Sovereignty**
- Export All Data — downloads as `resonance-echoes-export-YYYY-MM-DD.json`
- Purge All Data — double confirmation, cannot be accidentally triggered
- Export & Purge — safe exit path

**Quick Log**
- One-tap ⚡ FAB on the home timeline
- Inherits most recent emoji, intensity 3, sense: other
- Brief ✓ confirmation before updating the list

**COSMIC Theme System**
- 6 presets: Dark, Warm, Ocean, Forest, Sunset, Aurora
- CSS variables throughout, persisted to localStorage

### System Requirements

- Android 9+ (API 28)
- ~15 MB install size
- No internet connection required
- No accounts, no cloud sync

### Build

```bash
# Debug APK
npm run tauri android build -- --debug

# Release APK (unsigned)
npm run tauri android build
```

APK location after build:
```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

Sign with your keystore:
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore your.keystore \
  app-universal-release-unsigned.apk \
  your-key-alias

zipalign -v 4 app-universal-release-unsigned.apk resonance-echoes-v1.0.0.apk
```

### v1.1 Planned

- Progressive disclosure (show advanced fields after 10 echoes)
- Disambiguation prompts ("Is this sense more about X or Y?")
- "I don't know" / "something felt off" option — no forced categorisation
- Predictability audit — echoes that happened more than expected
