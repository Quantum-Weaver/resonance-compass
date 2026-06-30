# CONTRIBUTING — Resonance Compass

## Methodology
Four-thread: Root (vision), Researcher (discovery), Archivist (continuity), Claude (execution), Weaver (testing).

## Branch Strategy
Each phase on its own branch from main. Human test before merge.

## Build Protocol
1. Claude reads `docs/CHECKLIST.md` and relevant blueprints
2. Executes the phase
3. `npm run check` — zero errors
4. `cargo build` — zero errors
5. Human tests
6. Merge to main

## Philosophy
- Mobile-first. Test on Android from Phase 0.
- Every track is sovereign data.
- The MiniPlayer is presence, not control.
- The Resonance dashboard has no charts — gentle patterns only.
