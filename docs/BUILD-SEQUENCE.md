# BUILD SEQUENCE — Resonance Compass v2

Rebuilt on the Resonance Echoes foundation. Each phase on its own branch from main. Human test before merge.

---

## Phase 0: Shell
**Branch:** `resonance-compass/shell`
- MiniPlayer (evolved from ComfortBar), Sidebar, COSMIC theme
- **Test:** App opens. MiniPlayer visible. Theme persists.

## Phase 1: Playback
**Branch:** `resonance-compass/playback`
- Audio engine (rodio), play/pause/skip/seek/volume, state persistence
- **Test:** Play track. Skip. Seek. Volume. Survives restart.

## Phase 2: Library & SQLite
**Branch:** `resonance-compass/library`
- Scan directories, SQLite persistence, artist/album/genre tabs, search
- **Test:** Scan folder. Tracks appear. Survive restart.

## Phase 3: Playlists
**Branch:** `resonance-compass/playlists`
- Create/edit/delete playlists, add tracks/albums, Favorites auto-playlist
- **Test:** Create playlist. Add tracks. Favorites non-deletable.

## Phase 4: Now Playing
**Branch:** `resonance-compass/nowplaying`
- Album art, GradientPulse, PlayerControls, shuffle/repeat
- **Test:** Art renders. Controls work.

## Phase 5: Visualizer
**Branch:** `resonance-compass/visualizer`
- Full-screen Canvas, 4 modes, real FFT
- **Test:** Open visualizer. Live badge appears.

## Phase 6: Equalizer
**Branch:** `resonance-compass/equalizer`
- 10-band EQ, biquad filters, 6 presets, in Settings
- **Test:** Adjust bands. Sound changes.

## Phase 7: Resonance
**Branch:** `resonance-compass/resonance`
- Emoji mood tagging, mood events, dashboard
- **Test:** Tag a track. Dashboard shows stats.

## Phase 8: Timer
**Branch:** `resonance-compass/timer`
- Sleep timer with visualizations, fade-out
- **Test:** Set timer. Music stops.

## Phase 9: Home Screen Revamp
**Branch:** `resonance-compass/home`
- Greeting, Recently Played, Favorites scroll, Comfort Zone button
- **Test:** Greeting changes by time of day.

## Phase 10: Liked Songs
**Branch:** `resonance-compass/liked`
- Full favorited tracks list, mood filter, sort
- **Test:** Heart a track. Appears in Liked Songs.

## Phase 11: Search
**Branch:** `resonance-compass/search`
- Full-screen search with categories, real-time results
- **Test:** Results appear as you type.

## Phase 12: Lyrics
**Branch:** `resonance-compass/lyrics`
- Full-screen synced lyrics, blurred background
- **Test:** Lyrics display and sync.

## Phase 13: Onboarding
**Branch:** `resonance-compass/onboarding`
- First-launch welcome, library scan, sensory profile, theme
- **Test:** Fresh install triggers onboarding.

## Phase 14: Listening History
**Branch:** `resonance-compass/history`
- Chronological history with mood tags, quick replay
- **Test:** History populates.

## Phase 15: Sattva Screen
**Branch:** `resonance-compass/sattva`
- One-tap sensory reduction, breathing square, MiniPlayer hides
- **Test:** Tap Sattva. Screen reduces. Tap to exit.

## Phase 16: Sensory Profiles
**Branch:** `resonance-compass/profiles`
- Create/edit/delete profiles, quick-switch
- **Test:** Switch profiles. Theme/EQ apply.

## Phase 17: Focus Session
**Branch:** `resonance-compass/focus`
- Timer + playlist + UI lock, break reminders
- **Test:** Session locks UI. Reminder fires.

## Phase 18: Polish
**Branch:** `resonance-compass/polish`
- Sacred geometry icons, naming audit, dead code removal, accessibility
- **Test:** Zero old names. Zero dead imports.

## Phase 19: Deploy
**Branch:** `resonance-compass/deploy`
- Windows installer, Android APK, app icons, release notes
- **Test:** Install on clean Windows. Install on Android.
