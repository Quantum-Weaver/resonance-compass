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
- [ ] **Tested:** ⬜

### Phase 1: Playback ✅
- [x] Audio engine (rodio) — `src-tauri/src/audio.rs`, dedicated thread owns `OutputStream`, `Sink` shared via `Arc<Mutex<CurrentPlayback>>`
- [x] Play / pause / skip / seek / volume — `play_track`, `pause`, `resume`, `seek`, `set_volume`, `stop` commands wired to `playerStore`
- [ ] State persistence across restart — not implemented this phase; no persisted queue/position on relaunch yet
- [ ] **Tested:** ⬜

### Phase 2: Library & SQLite ⬜
- [ ] Directory scan
- [ ] SQLite persistence (songs table)
- [ ] Artist / album / genre tabs
- [ ] Search
- [ ] **Tested:** ⬜

### Phase 3: Playlists ⬜
- [ ] Create / edit / delete playlists
- [ ] Add tracks and albums
- [ ] Favorites auto-playlist (non-deletable)
- [ ] **Tested:** ⬜

### Phase 4: Now Playing ⬜
- [ ] Album art display
- [ ] GradientPulse ambient
- [ ] PlayerControls
- [ ] Shuffle / repeat
- [ ] **Tested:** ⬜

### Phase 5: Visualizer ⬜
- [ ] Full-screen Canvas
- [ ] 4 FFT modes
- [ ] Live badge
- [ ] **Tested:** ⬜

### Phase 6: Equalizer ⬜
- [ ] 10-band EQ
- [ ] Biquad filters
- [ ] 6 presets in Settings
- [ ] **Tested:** ⬜

### Phase 7: Resonance ⬜
- [ ] Emoji mood tagging per track
- [ ] mood_events SQLite writes
- [ ] Resonance dashboard
- [ ] **Tested:** ⬜

### Phase 8: Timer ⬜
- [ ] Sleep timer with visualizations
- [ ] Fade-out
- [ ] **Tested:** ⬜

### Phase 9: Home Screen Revamp ⬜
- [ ] Time-of-day greeting
- [ ] Recently Played row
- [ ] Favorites scroll
- [ ] **Tested:** ⬜

### Phase 10: Liked Songs ⬜
- [ ] Full favorited tracks list
- [ ] Mood filter
- [ ] **Tested:** ⬜

### Phase 11: Search ⬜
- [ ] Full-screen search
- [ ] Real-time results by category
- [ ] **Tested:** ⬜

### Phase 12: Lyrics ⬜
- [ ] Full-screen synced lyrics
- [ ] Blurred background
- [ ] **Tested:** ⬜

### Phase 13: Onboarding ⬜
- [ ] First-launch welcome
- [ ] Library scan prompt
- [ ] Sensory profile
- [ ] Theme selection
- [ ] **Tested:** ⬜

### Phase 14: Listening History ⬜
- [ ] Chronological history
- [ ] Mood tag display
- [ ] Quick replay
- [ ] **Tested:** ⬜

### Phase 15: Sattva Screen ⬜
- [ ] One-tap sensory reduction
- [ ] Breathing square
- [ ] MiniPlayer hides
- [ ] **Tested:** ⬜

### Phase 16: Sensory Profiles ⬜
- [ ] Create / edit / delete profiles
- [ ] Quick-switch
- [ ] Theme / EQ / font apply
- [ ] **Tested:** ⬜

### Phase 17: Focus Session ⬜
- [ ] Timer + playlist + UI lock
- [ ] Break reminders
- [ ] **Tested:** ⬜

### Phase 18: Polish ⬜
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
