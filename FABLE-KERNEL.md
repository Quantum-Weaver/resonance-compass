# FABLE-KERNEL — resonance-compass (v3: the Musician's Compass)
*A project kernel: written by Fable for the next Fable who opens this realm,
at KP's commission (2026-07-09). Identity first
(`resonance-chamber/entities/kernels/fable/RECALL.md`), then this. Note the
altitude: v2 is LAUNCHING (don't destabilize it); v3 is the build this
kernel exists for.*

## What this is
**Resonance Compass** — the sovereign music player ("looks around — the
needle that points north"; no cloud, no ads, no extraction). **v3 = the
Musician's Compass**, decided by KP 2026-07-09: not a separate app, a
configuration of the same foundation, tuned for the musician's workflow —
recording, four-track layering, tuner, metronome-you-can-see, sheet pad,
**lyric capture with superscript chords above the exact syllable** (the
feature KP never found anywhere), setlists by energy/key/tempo/emotional
arc, Sanctuary sync, possible Ableton Link. KP has been a musician since
age seven; 42 shows in one year; this app is *him*, configured.

## Read first
1. **`docs/MUSICIANS-COMPASS-VISION.md`** — T-Red's full vision, rescued
   from the browser, with the v3 decision and Phase-1 designation in its
   header. This is the charter.
2. `docs/v1-v2-gap-report.md` — it independently prescribed Phase 1's fix.
3. `HANDS.md`, `PRIVACY.md`, `store-readiness/PRICING.md` (pattern
   pricing: $3.33 anchor; the whole philosophy is in that file).

## State (2026-07-09)
- **v2**: complete (19 phases), signed, device-tested on KP's S25 and
  T-Red's S22; `enhancements` branch holds BT-pause native hook, gallery
  reorder (narrative order — player leads), privacy re-point, HANDS,
  vision doc — **pending device-test → merge to main**. Play submission
  waits for Echoes' verdict (shared-surface calibration); it's a PAID app:
  merchant account (KP's hands) + pattern pricing + the Health declaration
  answer is "no health features" (see PLAY-REJECTION-LOG.md — the Echoes
  precedent, same reasoning) + data-safety differs from Echoes (user-
  initiated MusicBrainz/LRCLIB lookups — nothing collected, wording matters).
- **v3 Phase 1 — the native audio engine** (fully scoped, unstarted):
  replace the ffmpeg shell-outs in `src-tauri/src/lib.rs` —
  `create_fragment` (~line 428) and `export_mix` (~line 496) — with pure
  Rust: **symphonia** decode (already in tree via rodio's symphonia-all!)
  → trim/mix natively (fades, volume, pan, offsets — the current ffmpeg
  filter chain documents exactly what to reproduce) → WAV via **hound**,
  resampling via **rubato** (DJ ears deserve sinc, not linear). This makes
  Fragments work on phones (impossible with ffmpeg), removes the app's only
  external binary, and IS the foundation recording/layering/DJ tools stand
  on. Frontend touch-points: the `ffmpeg_not_found` friendly-hint paths in
  `fragments/studio/+page.svelte` and `nowplaying/+page.svelte` become
  unreachable — retire them gracefully.
- **Market survey commissioned** (in the vision doc): Cartographer maps
  existing apps (BandLab, GarageBand, FL Mobile…), Indexer catalogs what
  mobile musicians beg for, Echo audits for what makes an ND musician feel
  *seen*. Not started.

## Build path
1. (v2 duties first if still open: merge, Play walk — same method as
   Echoes, one afternoon.)
2. **Phase 1**: the native engine. Scoped to two Rust functions + deps +
   frontend hint retirement. Acceptance: fragment trim + mix export work
   identically on desktop AND Android device-test; no ffmpeg anywhere.
3. Market survey → feature verdicts with KP (his musician's judgment is
   the differentiator — superscript chords and energy setlists came from
   his lived need).
4. Recording (cpal is in-tree via rodio; Android = oboe backend, note the
   ndk-context comment in Cargo.toml) → four-track → tools → setlists.
5. Naming moment near the end: "Musician's Compass" vs "Resonance Studio"
   — Council discerns; pause for it.

## Dispatch notes
- **Opus or Fable**: Phase 1 Rust (single sitting, well-scoped).
- **Web-capable kin / Kimi**: the market survey.
- **Sonnet**: v2 regression guard around the engine swap (the purge FK
  fix, BT-pause, cover/lyrics fallback must not regress).
- **KP**: all product verdicts; the merchant/pricing/Play hands; and he
  IS the first user — the studio gets tested by a man with 42 shows.

*Four tracks, no subscription, nobody's data. The bedroom studio that
launched a thousand bands, made sovereign. — Fable 🎻*
