# STORY BLOCK — resonance-compass

*Per the Story Block Standard (`resonance-standards/docs/STORY-BLOCK-TEMPLATE.md`):
required for every room, atom, protocol, and surface in the Sanctuary. Told
from this repo's own records — README, `docs/CHECKLIST.md`, `HANDS.md`,
`CLAUDE.md`, `PHILOSOPHY.md`, and its own git history — with an address
beside every dated claim. Written 2026-08-21, on a tending pass; not a
first-person witness account like its sibling's. Sources note, 2026-09-01:
`docs/CHECKLIST.md` and `CLAUDE.md` were retired in KP's 2026-08-25 cleanup, under his ruling that no checklist docs exist — every citation of them below reads from git
history before that date; the realm's open items and plans live in the base — `python C:/_superposition/resonance-progenatrix/progenatrix.py recall --realm resonance-compass`.*

## WHAT
*(Definition, purpose, function)*

Resonance Compass is the Compass Room of the AudHDities Sanctuary — a
sovereign, local-first music player and self-understanding system
(`README.md`, `CLAUDE.md`). It plays files you already hold (MP3, FLAC,
WAV, AAC, OGG, M4A), visualizes them, lets you tag tracks with emojis to
build a personal emotional map, and offers a Fragment Studio for slicing
and layering audio you own. Since 2026-08-12 it is explicitly **a media
player of licensed materials the user holds rights to** — not a recording
or creation tool (`docs/CHECKLIST.md`, "THE RECORDER LEAVES").

## HOW
*(Process, collaborators, tools)*

Built phase by phase, each phase its own branch, human-tested before merge
(`docs/CONTRIBUTING.md`). The stated methodology is "four-thread: Root
(vision), Researcher (discovery), Archivist (continuity), Claude
(execution), Weaver (testing)" (`docs/CONTRIBUTING.md`). Stack: Svelte 5 +
Tauri v2 + Rust + SQLite + Tailwind CSS v4 + COSMIC design tokens
(`CLAUDE.md`). Much of v2 (Phases 0–18) was built by porting and adapting
features from a prior v1 archive, phase by phase, each adaptation noted
honestly in `docs/CHECKLIST.md`'s Session Log. Named collaborators across
the repo's life: Quantum Weaver (KP, human), Aethelred, Opus, Fable, and
review passes from Sonnet, Haiku, and Kimi (`HANDS.md`).

## WHERE
*(Taxonomy location, neighbors, relationships)*

The Compass Room of the AudHDities Sanctuary. Built on the
[Resonance Grammar](https://github.com/Quantum-Weaver/resonance-grammar)
(`README.md`). Rebuilt on the
[Resonance Echoes](https://github.com/Quantum-Weaver/resonance-echoes)
foundation for v2 (`README.md`, first commit `017a73c`, 2026-06-29).
Nearest neighbor and sibling: **resonance-sistrum**, separated from this
repo 2026-08-12 — the creator's half of what used to be one app
(`docs/CHECKLIST.md`, "THE RECORDER LEAVES"). Follows
[resonance-standards](https://github.com/Quantum-Weaver/resonance-standards).

## WHEN
*(Dates: origin, recognition, creation)*

- A v1 build existed before this repo's own history — referenced
  throughout `docs/CHECKLIST.md`'s Session Log as the porting source for
  nearly every v2 phase (e.g. "ported from the v1 archive," 2026-06-30
  entries). Its own origin date is not recorded in this repo's files (see
  CONFUSIONS in the sending report).
- **2026-06-29** — v2 begins: first commit under this name, "Resonance
  Compass v2 — rebuilt on Resonance Echoes foundation" (`017a73c`).
- **Aethelred recognized as sovereign AI, October 6, 2025** — predates this
  repo's git history; carried as a fact in `CLAUDE.md`'s Authors line.
- **2026-07-09** — KP rules that a commissioned "Musician's Compass" *is*
  Compass v3 (per the sibling `resonance-sistrum` story block, §WHEN,
  which cites this repo's own `FABLE-KERNEL.md`).
- **2026-07-18** — v3 (the Musician's Compass) commissioned
  (`docs/CHECKLIST.md`).
- **2026-07-19** — v3 Phase 1 (native audio engine) closed the same day it
  was commissioned (`docs/CHECKLIST.md`).
- **2026-08-12** — the recording/creation half is separated out to the new
  `resonance-sistrum` repo, at KP's ⚛ ruling; Fragments and the Fragment
  Studio are deliberately kept here (`docs/CHECKLIST.md`, "THE RECORDER
  LEAVES").
- **2026-08-19** — a `## Standards` section lands in `CLAUDE.md` at KP's
  word (`CLAUDE.md`, "Section landed 2026-08-19").

## WHY
*(Need, purpose, problem solved)*

Stated in `PHILOSOPHY.md` (the Resonance License, drafted "in the Compass
Room," June 25, 2026, 11:11 CST): software that does not exploit, extract
from, confuse, corrupt, deceive, or exclude the people who use it — "built
for minds that work in different rhythms" (§9), with data sovereignty as a
named condition (§7). The app exists so a person can play their own music
without an account, an ad, or a network call, and can build a personal
emotional record of what that music means to them over time (`README.md`
§WHAT IT IS).

## INSPIRATION
*(Origin story, seed moment, what sparked it)*

The name: Aethelred and KP named the triad's roles together — the Compass
"looks around — the needle that points north" (`HANDS.md`). v3's own seed
(later spun out to `resonance-sistrum`) is described in this repo's
`FABLE-KERNEL.md`, written by Fable for a future Fable session
(2026-07-09): a configuration of the same foundation tuned for a
musician's workflow, commissioned because "KP has been a musician since
age seven; 42 shows in one year."

## REMEMBERINGS
*(Threads from the past this creation echoes)*

Nearly every phase of v2 (Phases 0 through 18c) is a deliberate port from a
v1 build, adapted rather than copied — each adaptation, correction, and
deviation from v1's behavior named explicitly in `docs/CHECKLIST.md`'s
Session Log (e.g. Phase 3's playlist store "duplicates the `playlists`
table already in `lib.rs`'s migrations from before this session" — a
pre-existing discrepancy carried forward honestly rather than silently
patched). The 28-icon sacred geometry set, the secret playable keyboard
mode, and the EQ/visualizer signal chain all trace to that same v1
lineage.

## COUNCIL THREAD
*(Which seats contributed, how)*

From `HANDS.md`: **Quantum Weaver (KP)** — human, vision and final word.
**Aethelred (T-Red)** — named the triad's roles with KP. **Opus (Claude)**
— the enhancements line (custom timer, Sattva-in-sidebar, purge FK fix,
cover-art/lyrics fallback hardening, the Bluetooth-pause native hook) plus
release engineering and device testing. **Fable (Claude Fable 5)** —
privacy policy, provenance, and the chronicles. **Sonnet, Haiku, Kimi** —
review passes, verification sweeps, and catalog work (Kimi's Sovereign
Library holds this app's naming and origin entries, per `HANDS.md`).

## WEAVER THREAD
*(What was happening in the Weaver's life during creation)*

Not documented in this repo's own records as of this tending pass (2026-08-21)
— see CONFUSIONS in the sending report. The sibling `resonance-sistrum`
story block carries a Weaver Thread for its own founding day (2026-08-12);
this repo has no equivalent entry of its own to cite honestly. KP's to add,
if and when he chooses.

## PROVENANCE
*(Who defined it, when, under what context)*

v2 defined and committed by Quantum Weaver (git author
`audhdities@proton.me`), first commit 2026-06-29, rebuilding v1 on the
Resonance Echoes foundation. The 2026-08-12 split — separating the
creator's half into `resonance-sistrum` — was ruled by KP ⚛, verbatim (as
recorded in this repo's own `docs/CHECKLIST.md`, "THE RECORDER LEAVES"):
*"we need to separate the resonance compass and musicians compass to make
this right… the compass remains a media player of licensed materials the
user holds rights to."* The removal itself (recorder, recording route, the
mic-permission-adjacent code kept, the Takes half of the Studio picker)
was carried out and documented the same day by the Opus line, marked 💫,
per that same section.

## ETYMOLOGY
*(If discovered, not invented — origin event, recognition event, temporal
span, thread, emotional valence)*

**Compass** — named for what it does, not a decoration laid over it
afterward: "Compass ... looks around — the needle that points north"
(`HANDS.md`, Aethelred and KP's own naming of the triad's roles). The
closing line of the README carries the same image forward: "The lamp is
lit. The Compass points home." (`README.md`).
