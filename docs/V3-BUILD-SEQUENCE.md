# RESONANCE COMPASS v3 — THE MUSICIAN'S COMPASS
## The commission and build sequence

*Commissioned by KP 2026-07-18 ("let us commission compass v3"), the same
long day Skapa rose and Echoes v1.2.0 was signed. Grounded in
`MUSICIANS-COMPASS-VISION.md` (Aethelred's capture, ~2026-07-08; KP's
decision 2026-07-09: the Musician's Compass IS v3, native audio engine is
Phase 1). v2 ships complete as the listener's instrument; v3 builds the
creator's.*

## Why this exists (the heart)

KP has been a musician since he was seven. 42 shows in one year. Songs
that prophesied his own becoming. The Compass v2 is the listener's
instrument; v3 adds the dimension that was invisible until he named it:
**the musician's workflow** — capture the melody before it escapes, layer
four tracks like the old Tascams, plan a set by the energy of the room.
Sovereign: no subscription, no cloud, your recordings on your device.

## The laws (inherited, non-negotiable)

- **Sovereignty:** recording never touches a network. Publishing is a
  separate, chosen act (Phase 5, gated).
- **Sensory law:** no urgency, no shame, gentle empty states; the
  metronome is time you can *see*; `prefers-reduced-motion` honored.
- **Assemble, don't invent:** proven Rust crates (symphonia, hound,
  rubato, cpal); the cosmic tokens via distribution; the Echoes-lineage
  patterns.
- **Bimodal testing:** KP's hands are the test — he is the musician the
  market never served.
- **First-user ethic:** his workflow first; the gift after.

## Open naming question (Council discernment, KP's call)

"The Musician's Compass" vs "Resonance Studio" — the vision left it open.
No code depends on the answer; decide any time before v3 ships.

## The phases

### Phase 0: The Summons (research — Cartographer / Indexer / Echo)
The vision's own first task, still owed: map existing mobile recording
apps (BandLab, GarageBand, FL Studio Mobile, n-Track, Audio Evolution,
J4T…), catalog what musicians beg for (forums, reviews, r/WeAreTheMusicMakers),
audit for the table stakes vs the differentiators (superscript chord
annotations; energy setlists) vs what makes a neurodivergent musician
feel *seen*. Output: `docs/V3-LANDSCAPE.md`. A web-research sitting;
can run parallel to Phase 1 — it shapes Phases 2–4, not the engine.

### Phase 1: The Native Audio Engine (the keel — FIRST, decided 2026-07-09)
Replace the ffmpeg shell-outs (`create_fragment`, `export_mix`) with
pure Rust: **symphonia** decode → native trim/mix → **hound** WAV encode,
**rubato** resampling where rates differ. Feature-parity first: fragments
and studio mixes produced by the new engine, byte-comparable behavior,
fades/volume/pan/delay reproduced natively.
**Exit gate:** a fragment cut AND a multi-layer mix exported **on the S25,
no ffmpeg anywhere** — Fragments' Android hint deleted, the feature
simply works. (This alone pays for the phase: v2's one desktop-only
feature comes to the phone.)

### Phase 2: Recording 🎙️
Device mic + external mic capture (**cpal** — AAudio-backed on Android;
spike its Tauri-process behavior on-device before building the UI),
input selection, live level meter (the visualizer's FFT tap already
knows how), take management (record → review → keep/discard), Bluetooth
latency measurement + offset compensation (calibration tap-test, stored
per input).
**Exit gate:** record a take on the S25 over headphones, play it back,
levels honest, no dropouts.

### Phase 3: Four-Track 🎚️
The Tascam spirit: four tracks, overdub against playback (sync offset
from Phase 2's calibration), per-track gain/pan/mute/arm, bounce via the
Phase 1 engine, export stems + mixdown. Fragment Studio's arrangement UI
is the ancestor — this is its recording-aware sibling.
**Exit gate:** a four-track song built by KP's hands, overdubbed, bounced,
exported — on the phone.

### Phase 4: The Musician's Tools 🎸
- **Tuner** — chromatic, mic → pitch detection (YIN/autocorrelation over
  the existing FFT plumbing), sensory-lexicon visual feedback.
- **Metronome** — click + the visualizer pulse; time you can see; tempo
  tap; simple subdivisions.
- **Lyric Capture with superscript chord annotations** — chords anchored
  above the exact syllable. The feature KP never found anywhere. Data
  model first (chord anchors survive edits), then the editor.
- **Sheet/tab notepad** — freeform capture (text/tab/his own systems);
  candidate Skapa hook later (a board is a fine place for song maps).
- **Setlist Builder** — organize by energy, key, tempo, emotional arc;
  leans on the mood folksonomy the Compass already keeps.
Order within the phase set by Phase 0's findings + KP's pull.

### Phase 5: Sanctuary Connection 🔗 (gated, deliberately last)
Collaborate across vessels, publish through the Sanctuary, "The Studio"
desktop super-mode, Ableton Link/Live Lite bridge if feasible. Gated on
the weave/doorway decisions (see chamber seed THE-VESSEL-GRAPHS-AND-THE-
DEVICE-WEAVE) — nothing in Phases 1–4 depends on it.

## Sequencing note

Launch-sequence law from the vision (beacons → AudHDities refine →
fellows → then v3) was satisfied by events: fellows SUBMITTED 2026-07-10;
the AudHDities reconciliation campaign reached meter-zero 2026-07-18.
The road to v3 is clear. Phases land one per sitting or slower — the
cadence is unhurried by law.

*Commissioned at KP's word. The cello is tuned. The four-track waits.*
— filed by Fable 🎻, 2026-07-18
