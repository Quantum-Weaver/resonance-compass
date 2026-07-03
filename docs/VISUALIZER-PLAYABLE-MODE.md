# Visualizer Playable Mode — Developer Guide

`src/routes/visualizer/+page.svelte` — the full-screen visualizer is secretly an
instrument: the keyboard shapes color, speed, and hue in real time, layered on top
of whatever the music is doing. This documents how it works, the full key map, and
how to extend it.

---

## 1. The reactive chain: audio → pixels

```
audio.rs sink (EqFilter → SampleTap)
  └─ SampleTap captures left-channel samples, try_send → bounded crossbeam channel
       └─ visualizer.rs FFT thread (~30 fps): Hann window → 2048-pt FFT
            → 64 log-spaced bars, normalized 0..1 → emits Tauri event "spectrum"
                 └─ +page.svelte listen("spectrum") → targetBars[64]
                      └─ smoothSpectrum() per frame:
                           smoothed += (target × sensitivity − smoothed) × 0.35
                           └─ barLevel(i) / bandLevel(lo,hi) / fftEnergy()
                                └─ the 7 mode renderers
```

Key properties:

- **`SampleTap` never blocks the audio callback** (bounded channel + `try_send`) —
  the visualizer can lag or die without affecting playback.
- **`smoothedBars` advances once per frame in `draw()`**, not per mode, so every
  renderer sees the same eased data. The 0.35 lerp is the attack/release feel.
- **Fallback motion**: until the first `spectrum` event arrives (`liveFFT` false),
  `barLevel` synthesizes deterministic per-track motion from an FNV hash of the
  track id — the visualizer is never dead, just dreaming.
- **Sensitivity** (settings panel) scales `targetBars` *before* smoothing
  (low 0.55× / medium 1× / high 1.6×, clamped to 1), so responsiveness changes but
  the ease curve stays identical.

## 2. The playable keyboard map

| Input | Effect |
|---|---|
| `Q W E R T Y U I O P` | **Warm palette** (reds → oranges → golds) + per-key hue tint |
| `A S D F G H J K L` | **Cool palette** (blues → purples → teals) + per-key hue tint |
| `Z X C V B N M` | **Earth palette** (browns → greens → sands) + per-key hue tint |
| `1`–`9` | Speed burst: 0.5× – 4.5× (decays back to 1×, see §3) |
| `↑` / `↓` | Rotate hue ±15° |
| `←` / `→` | Cycle visualizer mode (also: tap/click canvas, swipe) |
| `Space` | Play / pause |
| `0` | Full reset: hue 0, speed 1×, key palette released |

Two deliberate deviations from early design notes: **Space stays play/pause** and
**Left/Right stay mode-cycling** — both are v1-parity muscle memory and announced
in the page's `aria-label`. Reset lives on `0`, hue rotation on Up/Down.

Within a row, the key's position sets a hue tint: the center key is the pure
family color, edges bend ±~40° (`(idx − (len−1)/2) × 9`). So `T` ≠ `Q` even
though both are warm.

## 3. How effects combine

- **Palette resolution** (one place: `activeStops()`):
  `keyPalette` (keyboard row, if any) → else the ⚙ setting → `auto` resolves via
  `updateAutoPalette()`. Every renderer samples color exclusively through
  `cosmicColor(t)` (piecewise-linear RGB interpolation over the palette's stops),
  so a palette change recolors all seven modes instantly.
- **Hue mixing is additive-blend, not last-key-wins**: each keypress does
  `keyHue = keyHue × 0.4 + tint × 0.6` — playing a run of keys glides the hue
  toward each new note instead of snapping. The final hue is applied as a single
  canvas-wide `ctx.filter = hue-rotate(keyHue)` over whatever the palette drew.
- **Speed decay**: digits set `speedMult`; every frame it eases back toward 1
  with `speedMult += (1 − speedMult) × dtRaw × 0.08` (~9 s half-life) — a burst
  settles like a struck string. The effective speed each frame is
  `speedMult × settingSpeedFactor()` (slow 0.6 / normal 1 / fast 1.6 /
  auto = 0.6 + energy × 1.2).
- **Virtual clock**: `virtualTs += dtRaw × speed` and all renderers animate off
  `virtualTs`. This is why speed changes feel like tempo changes — multiplying
  the raw timestamp instead would teleport every phase on each change.
- **Auto palette** re-evaluates at most every 2.5 s (hysteresis, no strobing):
  energy > 0.55 → warm · treble > 1.2×bass → cool · energy < 0.18 → earth ·
  else cosmic. A keyboard-row palette suspends auto until `0` reset.

## 4. Adding a new mode

1. Add the name to the `VisMode` union, `MODES` array, and `MODE_LABELS`.
2. Write `drawYourMode(ctx, W, H, ts)`. Rules of the house:
   - Read audio only through `barLevel(i, ts)` / `bandLevel(lo, hi, ts)` /
     `fftEnergy()` / `bassEnergy()` — they handle live-FFT, fallback, paused,
     and reduced-motion states for free.
   - Take **all** color from `cosmicColor(t)` so palettes and key rows work.
   - Animate off the passed `ts` (virtual clock) so speed control works.
   - Gate continuous motion and `shadowBlur` glow behind `!reducedMotion`.
3. Add the dispatch branch in `draw()`.

Mode cycling, swipe, labels, and the overlay need no changes — they derive from
`MODES`.

## 5. Adding a new palette

Add an entry to `PALETTES` (stops: `[t, r, g, b]`, first and last should share a
color since several modes treat `t` cyclically), add its name to the
`PaletteName` union and `PALETTE_OPTIONS`, and optionally teach
`updateAutoPalette()` when to choose it. Keyboard rows map to palettes in
`KEY_ROWS`.

## 6. Settings & persistence

The ⚙ panel (top-right, fades with the overlay chrome) writes
`localStorage["resonance-compass-visualizer"]`:

```json
{ "palette": "cosmic", "speed": "normal", "sensitivity": "medium" }
```

- Values are validated against the option lists on load — bad/stale data falls
  back to defaults.
- The first-visit "Press keys to play ⌨️" toast sets
  `localStorage["visualizer-key-hint-seen"]` immediately and never shows again.
- Keyboard shortcuts are always active, panel open or closed; every keypress
  flashes a `⌨ …` label so the instrument acknowledges the note.
