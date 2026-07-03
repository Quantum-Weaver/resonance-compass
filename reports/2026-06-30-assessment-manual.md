# Resonance Compass v2 — Repository Assessment

**Date:** 2026-06-30
**Scope:** Full local read of `C:\_superposition\AudHDities-Resonance\resonance-compass` (root, `src/`, `src-tauri/`, `docs/`). No GitHub access used. No files modified.
**Method:** Every tracked file read directly from disk; `npm run check` and `cargo check` executed read-only to verify build status; `npm audit` / `npm outdated` run for dependency hygiene.

---

## 1. WHAT EXISTS

### Root

| File | Description |
|---|---|
| `CLAUDE.md` | Session protocol, project structure, essential rules, DB schema, current state — Compass v2 identity |
| `README.md` | Public-facing pitch, v2 rebuild notes, dev structure (describes more routes than exist today) |
| `PHILOSOPHY.md` | The Resonance License — values/ethics layer on top of MIT code license |
| `LICENSE` | MIT, copyright Quantum Weaver 2026 |
| `helper.md` | Ad-hoc session note about a *different* repo (`resonance-echoes`) — Android signing/rebuild instructions. Gitignored pattern but currently tracked in git |
| `package.json` | npm manifest — SvelteKit + Tauri v2 + Tailwind v4 deps, scripts: dev/build/preview/check/tauri |
| `package-lock.json` | npm lockfile |
| `tsconfig.json` | Extends `.svelte-kit/tsconfig.json`, strict mode on |
| `svelte.config.js` | `adapter-static` with `index.html` fallback (Tauri SPA mode) |
| `vite.config.js` | Vite + SvelteKit + Tailwind plugins, Tauri dev-server port 1420 config |
| `.gitignore` | Covers node_modules, build output, env files, keystores, `src-tauri/gen/`, `/reports`, `helper.md`, `generate_blueprint.py` |
| `.claude/settings.json` | Local Claude Code permission allowlist (git status, a python -c invocation) + one `additionalDirectories` entry for `src-tauri` |

### docs/

| File | Description |
|---|---|
| `BUILD-SEQUENCE.md` | 19-phase build plan (Shell → Deploy), one branch per phase |
| `CHECKLIST.md` | Master checklist mirroring BUILD-SEQUENCE; every phase still `⬜ Pending`, including Phase 0 |
| `CLAUDE-CONTEXT.md` | Naming canon, Council of Nine roster, DB schema summary, Android build notes |
| `CONTRIBUTING.md` | Four-thread methodology, branch strategy, build protocol |
| `GIT-HYGIENE.md` | Sanctuary-wide secret-scrubbing guide (BFG instructions, gitignore template) |
| `RESONANCE-GRAMMAR.md` | Protocol spec — atoms/molecules/categories/folksonomy, sovereignty guarantees |
| `SCREEN-INVENTORY.md` | 19 planned screens mapped to routes and phases; 0 marked built |
| `session-reports/2026-06-30-identity-migration.md` | Record of the Echoes→Compass rename (Blocks 1–5), confirms 0 build errors at time of writing |

### src-tauri/ (Rust / Tauri backend)

| File | Description |
|---|---|
| `src/lib.rs` | App entry: 5 SQL migrations (songs, mood_events, favorites, playlists, fragments), registers sql/fs/opener/dialog plugins, one `greet` command |
| `src/main.rs` | Thin entry point calling `resonance_compass_lib::run()` |
| `Cargo.toml` | Crate `resonance_compass_lib`, tauri 2 + plugins (opener, dialog, fs, sql/sqlite), serde |
| `Cargo.lock` | Rust lockfile |
| `build.rs` | tauri-build + Android `libc++_shared` link-search workaround (inherited from Echoes) |
| `tauri.conf.json` | productName/identifier/version = Compass, window 1280×800, **CSP set to `null`** |
| `capabilities/default.json` | ACL: core/sql/fs/opener/dialog defaults + explicit sql allow-* perms |
| `.gitignore` | Ignores `/target` and `/gen/schemas` |
| `icons/` (53 files) | Desktop (ico/icns/png), Android mipmap, iOS AppIcon sets — standard Tauri icon bundle |
| `gen/schemas/*.json` | Auto-generated ACL/capability schemas — present on disk, gitignored, untracked |

`audio.rs`, `equalizer.rs`, `visualizer.rs` named in `CLAUDE.md`'s project-structure diagram **do not exist yet** — they are Phase 1/5/6 future work, correctly reflected as not-yet-built.

### src/ (frontend)

| File | Description |
|---|---|
| `app.css` | Thin orchestration layer: imports Tailwind v4 + 3 of 7 generated COSMIC CSS files, global resets, focus-visible/reduced-motion rules |
| `app.html` | SvelteKit shell, title "Resonance Compass" |
| `lib/types/types.ts` | `ThemeConfig`, `Track`, `MoodEvent`, `Album`, `Artist`, `Playlist`, `PlayerState`, `Sense`, `Subcategory` — matches DB schema in CLAUDE.md |
| `lib/stores/library.svelte.ts` | SQLite-backed library store (Svelte 5 runes); `scanLibrary()` stubbed for Phase 2 |
| `lib/stores/mood.svelte.ts` | SQLite-backed mood_events store; full CRUD + top-emoji aggregation, functional today |
| `lib/stores/player.svelte.ts` | In-memory playback state; all transport methods (`play`/`pause`/`next`/`seek`) are stubs awaiting Phase 1 audio backend |
| `lib/stores/theme.svelte.ts` | localStorage-persisted theme config, 6 presets |
| `lib/theme/theme.ts` | `PRESET_THEMES` + `getThemeColors()` mapping ThemeConfig → CSS variable values |
| `lib/components/Sidebar.svelte` | Collapsible 20vw nav (Home/Library/Playlists/Resonance/Settings), hamburger toggle, mobile backdrop |
| `lib/components/ComfortBar.svelte` | Bottom bar (expand/collapse greeting + quick actions) — **still named/keyed as ComfortBar**, not yet renamed to MiniPlayer per CLAUDE.md naming convention |
| `lib/components/GradientPulse.svelte` | Reusable radial-glow wrapper with optional pulse animation; used on Home + Onboarding sigils |
| `lib/data/emojis.ts` | 12 `EmojiDef` entries (Resonance Grammar sensory lexicon) — calm/energy/sad/happy/overstimulated/etc. |
| `lib/data/senses.ts` | 8 `Sense` categories (seen/heard/felt/thought/felt_inside/dreamt/grateful_for/other) with subcategories — not yet wired into any route |
| `lib/cosmic/index.ts` | Barrel export for the entire COSMIC token system |
| `lib/cosmic/colors.ts` | ~150 color tokens — brand, mood, **Council/Pantheon entity colors, Pride flags, alchemical/mystical colors** — far broader than this app's actual surface |
| `lib/cosmic/consciousness.ts` | "Consciousness levels," "beam intensity," "vessel capacity" tier system — appears to be ported wholesale from the AudHDities main platform, no usage found in Compass routes/components |
| `lib/cosmic/dimensions.ts` | Spacing/breakpoint/sizing scale, business-page dimensions (stat cards, hero sections) unrelated to a music player |
| `lib/cosmic/effects.ts` | ~120 gradients (deity/pantheon/pride/business-page), glow/shadow/backdrop/holographic effect tokens |
| `lib/cosmic/motion.ts` | Durations/easings/keyframes/Framer-Motion-style presets, "consciousness emergence" animation configs |
| `lib/cosmic/positioning.ts` | Viewport anchors, parallax layers, 3D camera/orbit configs, **zoom targets keyed to unrelated app sections** (`council`, `marketplace`, `observatory`, `invitation` — Council Chamber / business platform concepts) |
| `lib/cosmic/typography.ts` | Font families (medieval/runic/arcane/fantasy), domain/entity-specific typography, business-page type scales |
| `lib/styles/custom_overrides.css` | Mostly-empty manual override stub (container query + Safari/Firefox fixes) |
| `lib/styles/generated/variables.css` (478 ln) | **Imported** — CSS custom properties |
| `lib/styles/generated/animations.css` (471 ln) | **Imported** |
| `lib/styles/generated/text_effects.css` (470 ln) | **Imported** |
| `lib/styles/generated/domains.css` (1518 ln) | **Not imported anywhere** |
| `lib/styles/generated/parallax.css` (524 ln) | **Not imported anywhere** |
| `lib/styles/generated/typography.css` (1581 ln) | **Not imported anywhere** |
| `lib/styles/generated/zoom.css` (128 ln) | **Not imported anywhere** |
| `routes/+layout.ts` | `export const ssr = false` — required for Tauri SPA mode |
| `routes/+layout.svelte` | App shell: theme CSS vars on `.app-shell`, conditional Sidebar/ComfortBar (hidden during onboarding), onboarding redirect logic |
| `routes/+page.svelte` | Home — empty-state placeholder with GradientPulse sigil, live track count |
| `routes/library/+page.svelte` | Static placeholder, "Coming in Phase 2" |
| `routes/playlists/+page.svelte` | Static placeholder, "Coming in Phase 3" |
| `routes/resonance/+page.svelte` | Static placeholder, "Coming in Phase 4" (BUILD-SEQUENCE actually assigns Resonance to **Phase 7** — mismatch) |
| `routes/settings/+page.svelte` | **Fully functional** — theme picker, font size, JSON export, two-step purge confirmation, uninstall guide. Most complete screen in the app |
| `routes/onboarding/+page.svelte` | **Fully functional** 3-screen flow — name capture, feature intro, theme selection, writes `onboarding_complete` |

### static/

| File | Description |
|---|---|
| `favicon.png` | **Used** — referenced in `app.html` |
| `Icon-1.png`, `Icon-2.png`, `QW-logo.png`, `aethelred-avatar.png`, `cello.png`, `favicon2.png`, `svelte.png`, `tauri.png`, `tauri.svg`, `thread.png`, `vite.png` | **Unused** — no references anywhere in `src/`. Combined ~12 MB of unreferenced image assets (Tauri/Svelte/Vite default template logos + Sanctuary branding art) |

### Build/tooling artifacts present on disk (not part of source review, noted for completeness)

- `.svelte-kit/` — SvelteKit-generated types/routes, gitignored, regenerates on `npm run check`/`dev`
- `node_modules/` — installed, present
- `src-tauri/target/` — Rust build cache, gitignored, **contains stale artifacts from a different absolute path** (see §5 Test Readiness)

---

## 2. WHAT'S MISSING

**Standard project/Sanctuary files**
- No `CHANGELOG.md`
- No `SECURITY.md` (notable given `docs/GIT-HYGIENE.md` exists and is security-adjacent)
- No `CODE_OF_CONDUCT.md`
- No `.env.example` despite `.gitignore` explicitly carving out `!.env.example`
- No `docs/RELEASE.md` (deleted during identity migration per the session report; not yet recreated, and Phase 19 is "Deploy")

**CI/CD**
- No `.github/workflows/` — no automated `npm run check` / `cargo check` on push or PR, despite CLAUDE.md mandating both as pre-commit gates. Currently human-enforced only.

**Test infrastructure**
- No test framework in `package.json` (no Vitest, Playwright, `@testing-library/svelte`, etc.)
- No `*.test.ts` / `*.spec.ts` files anywhere in the repo
- No Rust `#[cfg(test)]` modules in `src-tauri/src`
- CLAUDE.md's verification gate is "Human tests every phase before merge" — by design there is no automated regression safety net, which is a reasonable choice for a one-developer Sanctuary project but worth naming explicitly before Phase 0 begins and the codebase grows

**Config gaps**
- `tauri.conf.json` → `app.security.csp` is `null` (no Content Security Policy). Tauri's own docs recommend setting an explicit CSP even for local-first apps, since this app embeds a webview that loads local HTML/JS.
- `package.json` has no `"engines"` field pinning a Node version, despite the project depending on modern syntax (`@types/node@^26`, TypeScript 5.6).

**Backend modules described in CLAUDE.md but not yet created** (expected — they're future phases, not a defect):
- `src-tauri/src/audio.rs` (Phase 1)
- `src-tauri/src/equalizer.rs` (Phase 6)
- `src-tauri/src/visualizer.rs` (Phase 5)

---

## 3. GAPS — Stated vs. Actual

| Area | Stated | Actual |
|---|---|---|
| **Component naming** | CLAUDE.md: "MiniPlayer (evolved from ComfortBar)"; BUILD-SEQUENCE Phase 0 explicitly calls for the ComfortBar→MiniPlayer evolution | Component file is still `ComfortBar.svelte`, store/aria text still says "echo" (`aria-label="Quick add echo"`, line 48) and `comfort-bar__*` class names throughout. The Phase 0 rename has not happened yet — consistent with CHECKLIST showing Phase 0 as `⬜ Pending`, but worth flagging since CLAUDE.md's "PROJECT STRUCTURE" section already documents it as if renamed |
| **Resonance phase number** | `BUILD-SEQUENCE.md` and `CHECKLIST.md` assign Resonance dashboard to **Phase 7**; `SCREEN-INVENTORY.md` also says Phase 7 | `routes/resonance/+page.svelte` placeholder copy says "Coming in Phase 4" |
| **Identity migration completeness** | Session report claims "No 'echoes' in any store, route, type, or component (4 intentional historical references remain in docs)" | One non-doc instance remains: `ComfortBar.svelte:48` `aria-label="Quick add echo"`. Also `goto('/insights')` and `goto('/library')` calls in the same file reference a route (`/insights`) that the same session report says was deleted |
| **`helper.md`** | `.gitignore` lists `helper.md` as a file that should never be committed | It's tracked in git (`git ls-files` confirms) and contains operational notes — including a keystore-signing command — for a *different* repository (`C:\_superposition\resonance-echoes`), not this one. It predates the gitignore rule and was never removed |
| **CHECKLIST vs CLAUDE.md "CURRENT STATE"** | CLAUDE.md: "Blocks 1-3 complete... Phase 0 ready to begin" | Session report says Blocks 1–**5** are complete (not 3), and CHECKLIST.md's Session Log entry agrees ("Blocks 1-5... Phase 0 ready to begin"). CLAUDE.md itself is slightly stale on the block count |
| **GradientPulse / EmojiGrid / TimerVisualization** | CLAUDE.md and README list `GradientPulse`, `EmojiGrid`, `TimerVisualization`, `MiniPlayer`, `PlayerControls`, `AlbumCard`, `TrackItem` under `lib/components/` | Only `Sidebar.svelte`, `ComfortBar.svelte`, `GradientPulse.svelte` exist. The rest are aspirational (future-phase) listings in the docs, not present yet — expected at this stage, but the docs read as if describing current structure rather than target structure |
| **COSMIC design-system scope** | Described in CLAUDE.md as "COSMIC design tokens" for this app | The actual `lib/cosmic/*` files are a near-complete port of a much larger platform's design system (Council of Nine entity colors/gradients/typography, Norse/Pagan/Pantheon deity tokens, Pride flag palettes, business-page hero/stat-card dimensions, 3D camera/orbit configs for an "immersive panorama" UI). None of the Council/Pantheon/Pride/business/3D-camera tokens are referenced anywhere in `src/routes` or `src/lib/components`. This is a wholesale import from the AudHDities frontend (confirmed by `docs/session-reports/2026-06-30-identity-migration.md`, which records a 1,720-file scan of that codebase) rather than a Compass-scoped token set |
| **Senses data** | `lib/data/senses.ts` defines a full taxonomy (Seen/Heard/Felt/Thought/Felt Inside/Dreamt/Grateful For/Other) | Not imported or referenced by any route, store, or component. Unclear if this belongs to Compass at all, or is a leftover from a different Sanctuary app (it reads like a journaling/check-in taxonomy, not a music-player concept) |
| **Generated CSS** | `app.css` comment says it imports "Generated COSMIC styles" | Only 3 of the 7 generated CSS files are actually `@import`-ed (`variables.css`, `animations.css`, `text_effects.css`). `domains.css`, `parallax.css`, `typography.css`, and `zoom.css` (3,751 lines combined) sit unused in the bundle path but are not part of the Vite build graph — i.e., they're dead weight on disk, not a shipped-bytes problem, but indicate the COSMIC export pipeline isn't scoped to what Compass actually needs |

---

## 4. VULNERABILITIES

**Severity: Low — none of these are exploitable today given the app has no network surface, but they're worth closing before more screens land.**

1. **CSP disabled.** `src-tauri/tauri.conf.json` → `"csp": null`. Tauri webviews without a CSP are more exposed to injected-script risk if any future feature renders untrusted content (e.g., lyrics fetched from an external source, ID3 metadata rendered as HTML, or a future "import playlist from URL" feature). Recommend setting an explicit policy now, even a permissive one, so it's not forgotten once content-handling features ship.
2. **Untrusted third-party `$schema` URL.** `src-tauri/capabilities/default.json` and `src-tauri/gen/schemas/*.json` reference `https://raw.githubusercontent.com/nickknapton88/tauri-docs/dev/crates/tauri-utils/schema/capabilities.json` instead of the official `https://schema.tauri.app/...` host used in `tauri.conf.json`. This is editor-tooling-only (affects JSON Schema autocomplete, not runtime), but pointing at an arbitrary personal fork is a minor supply-chain/trust smell worth fixing to the canonical schema host.
3. **Stale Echoes description string.** `capabilities/default.json` → `"description": "Default capabilities for Resonance Echoes"`. Not a security hole, but it's metadata drift in a file that governs the app's actual permission surface — worth keeping accurate so future permission reviews aren't second-guessing which app a capability file belongs to.
4. **`helper.md` tracked in git despite being gitignored.** It documents a keystore-signing workflow for a sibling repo (`resonance-echoes`), including the literal keystore filename and alias (not the key itself). Low risk on its own, but it's evidence the gitignore-after-the-fact pattern doesn't retroactively untrack files — worth a `git rm --cached` pass plus a check of whether any actual `.keystore`/`.env` file was ever committed (per the procedure in `docs/GIT-HYGIENE.md` itself: `git log --all --full-history -- "*.keystore"`). This assessment did not run that history scan since it would require git-history access beyond a working-tree read; flagging as a recommended follow-up.
5. **`.claude/settings.json` allows `PowerShell(python -c $script)`.** This permits arbitrary inline Python execution without per-invocation review. Not a vulnerability in the shipped app, but it's a broad standing grant in the dev environment's permission file — worth scoping down if it's no longer needed for whatever it was added for.
6. **Low-severity transitive npm vulnerability.** `npm audit` reports 3 low-severity advisories, all tracing to `cookie <0.7.0` via `@sveltejs/kit`'s SSR cookie handling (GHSA-pxg6-pf52-xh8x — out-of-bounds characters in cookie name/path/domain). Irrelevant in practice since `ssr = false` (pure SPA, no server-rendered cookies), but the fix requires a SvelteKit major-version bump, which is worth tracking rather than acting on immediately.
7. **~12 MB of unreferenced static assets** (`static/QW-logo.png`, `cello.png`, `thread.png`, `aethelred-avatar.png`, etc.) — not a security issue, but worth noting alongside the gitignore/hygiene pass since large unused binaries bloat every clone and could carry embedded metadata (EXIF, etc.) worth scrubbing before a public release given the "no extraction" / "no exclusion" philosophy in PHILOSOPHY.md.

**No `.env`, credentials, keys, or `*.keystore` files were found on disk in this working tree.** The `.gitignore` patterns for secrets (env files, keystores, `src-tauri/gen/`) are correctly in place and match the `docs/GIT-HYGIENE.md` template.

---

## 5. TEST READINESS

**Frontend (`npm run check`): ✅ PASSES.** Ran live — `294 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. Matches the session report's claim.

**Backend (`cargo check`): ❌ FAILS — currently broken.**

```
error: failed to run custom build command for `resonance-compass v2.0.0`
failed to read plugin permissions: failed to read file
'\\?\C:\_superposition\resonance-compass\src-tauri\target\debug\build\tauri-d620c58b779b15f6\out\permissions\app\autogenerated\commands\app_hide.toml':
The system cannot find the path specified. (os error 3)
```

Root cause: `src-tauri/target/` contains build-script output baked with the **old absolute path** `C:\_superposition\resonance-compass\...` rather than the current location `C:\_superposition\AudHDities-Resonance\resonance-compass\...`. The repository was evidently moved/renamed at some point after the last successful `cargo build`, and the stale `target/` cache (gitignored, machine-local) still references the old path. This is not a source-code defect — it will not reproduce on a clean clone or CI runner — but **on this machine, `cargo build`/`cargo check` will fail until the stale cache is cleared** (`cargo clean` inside `src-tauri/`, or simply delete `src-tauri/target/`). This directly contradicts CLAUDE.md's pre-commit gate ("`cargo build` — zero errors before commit") for anyone working from this checkout right now, and should be the first thing fixed before Phase 0 work begins. No source files were touched to make this assessment — the fix is a cache clear, not a code change, but it's flagged here rather than performed since the brief was read-only.

**What can be tested today (manually, per CLAUDE.md's "human tests every phase" model):**
- Onboarding flow (3 screens, name capture, theme selection) — fully wired
- Settings: theme switching, font size, data export (JSON download), purge flow with two-step confirm — fully wired, exercises the `songs` table end-to-end via `libraryStore.clearLibrary()`
- Theme persistence across reload (`themeStore` ↔ localStorage)
- Sidebar navigation + collapse/expand on mobile width
- SQLite schema creation (5 migrations) — implicitly exercised whenever the app opens, since `libraryStore.initDB()` runs on layout mount

**What cannot be tested yet** (stubbed, by design, per current phase):
- Anything audio (`playerStore` methods are `console.log` stubs — no Phase 1 backend)
- Library scanning (`scanLibrary()` stub)
- Playlists, mood-tagging UI (store layer exists and is functional, but no UI calls `moodStore.addMoodEvent` anywhere yet)
- Visualizer, equalizer, fragments (no backend modules exist)

**No automated test suite exists** at any layer (frontend or backend) — see §2. All verification is currently manual, consistent with the documented "Human tests every phase before merge" protocol, but means there is zero regression protection as the codebase grows past placeholder screens.

---

## 6. RECOMMENDATIONS (priority order, before Phase 0 begins)

1. **Fix the broken Rust build on this machine.** `cargo clean` (or delete `src-tauri/target/`) to clear the stale-path build cache, then re-run `cargo build` to confirm a real zero-error baseline. Right now CLAUDE.md's stated pre-commit gate is unverifiable as written.
2. **Finish the ComfortBar → MiniPlayer rename** (file name, component name, CSS class prefixes, the leftover `aria-label="Quick add echo"`, and the dangling `goto('/insights')` call to a deleted route) as the literal first item of Phase 0 — the docs already describe it as done, so closing this gap removes a doc/code mismatch before it compounds.
3. **Remove or relocate `helper.md`.** It's tracked despite being gitignored, documents a different repo's signing workflow, and serves no purpose in Compass. `git rm helper.md` (keep gitignore entry for future safety).
4. **Run the `docs/GIT-HYGIENE.md` history scan** (`git log --all --full-history -- "*.keystore" ".env" "*.pem"`) once, now, while the repo is small — cheap insurance, and the doc exists specifically for this.
5. **Scope the COSMIC token import down to what Compass actually uses**, or explicitly document why the full Council/Pantheon/business-page/3D-camera token set is being kept. As written it's >2,500 lines of unused exports (consciousness.ts, most of positioning.ts/typography.ts/effects.ts) that will make future "is this dead code or load-bearing?" audits slower. At minimum, drop the 4 unimported generated CSS files (`domains.css`, `parallax.css`, `typography.css`, `zoom.css` — 3,751 lines) since they aren't even wired into `app.css`.
6. **Delete or use the 11 unreferenced static assets** (~12 MB). Keep `favicon.png`; either wire the rest into onboarding/about screens or remove them.
7. **Set an explicit CSP** in `tauri.conf.json` instead of `null`, and point the capabilities `$schema` at the official `schema.tauri.app` host instead of a personal GitHub fork.
8. **Correct the Resonance placeholder's phase number** (says Phase 4, should say Phase 7 per BUILD-SEQUENCE/CHECKLIST/SCREEN-INVENTORY) and reconcile CLAUDE.md's "Blocks 1-3" with the session report's "Blocks 1-5."
9. **Decide whether `lib/data/senses.ts` belongs in this repo.** It's unused and reads like a different Sanctuary app's data model — either wire it into a Compass feature or remove it so it doesn't get treated as in-scope by a future session.
10. **Once Phase 0–2 land real interactive surface, add a minimal automated check** (even just `svelte-check` + a handful of Vitest unit tests around the store layer — `mood.svelte.ts` and `library.svelte.ts` already have pure, testable SQL-row-mapping functions) so the "human tests every phase" model has a cheap automated floor under it. Not urgent today given the codebase is mostly placeholders, but worth deciding before Phase 7 (Resonance/mood logic) makes manual-only testing more error-prone.
11. **Add `.github/workflows/check.yml`** running `npm run check` (and `cargo check` once issue #1 is fixed) on push, so the CLAUDE.md gates are enforced automatically rather than relying on memory each session.
12. **Add a Node `engines` field** to `package.json` pinning the minimum Node version actually required, given the dependency on `@types/node@^26` and modern tooling.

---

*Assessment performed by reading every tracked file in the working tree directly from disk. No network/GitHub access used. No source files modified.*
