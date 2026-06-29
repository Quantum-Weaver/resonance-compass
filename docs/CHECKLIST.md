# RESONANCE ECHOES — MASTER CHECKLIST

*Single source of truth for build state.*

## LEGEND
- ✅ Complete
- ⚠️ In Progress
- 🔴 Broken
- ⬜ Pending
- 🔵 Ready for Test

---

## PHASE STATUS

### Phase 0: Shell ✅
- [x] App layout with ComfortBar footer
- [x] Collapsible sidebar (20vw, hamburger below status bar)
- [x] COSMIC theme system
- [x] Mobile-safe areas
- [x] **Tested:** ✅

### Phase 1: The Echo ✅
- [x] Echo form (name, sense, subcategory, emoji, note, intensity, timestamp)
- [x] echoStore with reactive state (Svelte 5 $state, SQLite via tauri-plugin-sql)
- [x] DB migration v2 (correct schema: name, sense, subcategory, note, timestamp)
- [x] Home timeline with EchoCard (emoji, name, sense badge, relative time, intensity dots, note preview)
- [x] **Tested:** ✅

### Phase 2: Browse & Filter ✅
- [x] Debounced search (150ms, name + note fields, real-time)
- [x] Filter by sense (8 chips, horizontal scroll, accent glow)
- [x] Filter by emoji (top 8 most-used, dynamic)
- [x] Sort: Newest / Oldest / Intensity ↓
- [x] Combined filtering — search + sense + emoji + sort all stack
- [x] Filter status bar: "12 echoes in 👁️ Seen · 😌" + Clear all
- [x] Empty state per filter with inline Clear link
- [x] Load more (50 per page)
- [x] **Tested:** ✅

### Phase 3: Gentle Insights ✅
- [x] Top Emojis — frequency-sized cloud, top 8, warm "most felt" label
- [x] By Sense — distribution list ordered by count, muted at 0
- [x] Streak — consecutive calendar days, resets quietly (no negativity)
- [x] Time of Day — 4-period grid (morning/afternoon/evening/night), accent on dominant
- [x] Recent Mood — 7-day emoji row (today→left), most intense echo per day, · for empty days
- [x] Intensity Trend — compare last 7 vs prior 7 days
- [x] All empty states are invitations, not failures
- [x] **Tested:** ✅

### Phase 4: Onboarding ✅
- [x] Welcome screen — 🧭 sigil with GradientPulse, title, subtitle
- [x] Vessel name input (optional) — saves to localStorage resonance-echoes-vessel-name
- [x] How it works — 3 mini cards (log, patterns, sovereignty)
- [x] Theme selection — Dark / Warm / Ocean with live preview + accent swatch
- [x] Progress indicator — 3 dots, active elongated, done dimmed
- [x] Layout gate — first launch redirects to /onboarding; Sidebar + ComfortBar hidden
- [x] onboarding_complete flag — set on "Enter Echoes"; prevents re-showing
- [x] ComfortBar greeting reads vessel_name after onboarding
- [x] **Tested:** ✅

### Phase 5: Data Sovereignty ✅
- [x] Settings page — Theme, Font size, Data Sovereignty, About sections
- [x] Export JSON — Blob download, filename resonance-echoes-export-YYYY-MM-DD.json
- [x] Purge All Data — double confirmation flow (confirm1 → confirm2 → execute)
- [x] Export & Purge — exports first, same double-confirm, redirects to onboarding
- [x] purgeAll() added to echoStore — DELETE FROM echoes, clears reactive state
- [x] Theme cards in settings match onboarding, apply live via themeStore.setPreset()
- [x] Font size selector: Small / Medium / Large
- [x] **Tested:** ✅

### Phase 6: Mobile Ship ✅
- [x] Quick Log FAB — one-tap ⚡ on home, inherits last emoji, intensity 3, ✓ animation (1.1s)
- [x] Emoji definition display — warm poetic text appears below emoji grid on selection (fade-in)
- [x] Save confirmation — Save Echo button shows ✓ for 900ms before navigating home
- [x] App icon — custom COSMIC purple compass-ring (1024x1024), all densities regenerated
- [x] Version bump — package.json + tauri.conf.json → 1.0.0; About section updated
- [x] docs/RELEASE.md created — build/sign commands, feature list, system requirements, v1.1 planned
- [x] **Tested:** ✅

---

### v1.1: Accessibility & Sovereignty ✅
- [x] Progressive disclosure — form shows name/sense/emoji only until 10 echoes; "Advanced" toggle for early access
- [x] Uninstall guide — neutral button in Data Sovereignty; shows Android uninstall instructions (no in-app action)
- [x] Disambiguation prompts — emoji used with multiple past senses shows chip row; dismissed per-emoji via state
- [x] "Not Sure" sense option — ❓ dashed button at end of sense row; saves sense='not_sure', subcategory=''; ❓ badge in timeline; counted separately in insights
- [x] Emoji skip — "— skip / not sure" below grid saves emoji='❓'; 5s nudge "No pressure. You can skip this."
- [x] Predictability audit — 7th insight card "Patterns"; visible after 20 echoes; 30% threshold + 3 minimum occurrences
- [x] **Tested:** ✅

---

## KNOWN BUGS

| ID | Description | Status |
|----|-------------|--------|
| B1 | SQLite ACL error on Android: "command plugin:sql\|execute not allowed by ACL" | ✅ Fixed — added `sql:allow-load`, `sql:allow-execute`, `sql:allow-select`, `sql:allow-close` to `capabilities/default.json` |
| B2 | Migration v2 used emoji `'✨'` as SQL DEFAULT value — breaks JNI encoding on Android SQLite | ✅ Fixed — changed to `DEFAULT ''` in migration v2; migration v3 ensures clean schema |
| B3 | `addEcho()` silently returned null instead of throwing when db was null | ✅ Fixed — now throws descriptive error; dbError banner shown in add form |

## SESSION LOG

| Date | What Was Done |
|------|---------------|
| 2026-06-28 | Repo created. Foundation files. Config refined. Scaffold builds clean. |
| 2026-06-28 | Phase 0 complete. ComfortBar, Sidebar, GradientPulse, theme store, senses data, icon set. npm run check: 0 errors. cargo build: clean. Pending human test on Android. |
| 2026-06-28 | Phase 1 complete. echoStore (Svelte 5 $state + SQLite), Echo interface updated, DB migration v2, /add form (sense, subcategory, emoji, note, intensity, timestamp), home timeline with EchoCards. Pending human test. |
| 2026-06-28 | Android debug session. Fixed three blocking bugs: SQLite ACL permissions (capabilities/default.json), migration emoji encoding (v3 migration), silent null-db failure. Added dense logcat diagnostics. Hamburger moved to bottom thumb zone. |
| 2026-06-28 | Phase 2 complete. Search (150ms debounce), sense filter chips, emoji filter chips (top 8), sort (newest/oldest/intensity), combined filtering, filter status bar, empty-state-per-filter. All client-side over in-memory echoes. npm run check: 0 errors. |
| 2026-06-28 | Phase 3 complete. Insights page: Top Emojis (frequency-sized cloud), By Sense (sorted list), Streak (consecutive day counter), Time of Day (4-period grid, accent on dominant), Recent Mood (7-day row), Intensity Trend (week comparison). All $derived.by client-side, no new DB queries. npm run check: 0 errors. |
| 2026-06-28 | Phase 4 complete. Onboarding: 3-screen linear flow (Welcome → How it works → Theme), 🧭 GradientPulse sigil, vessel name saved to localStorage, live theme switching in Screen 3, layout gate (goto /onboarding on first launch), Sidebar/ComfortBar hidden during flow. npm run check: 0 errors. |
| 2026-06-28 | Phase 5 complete. Settings: theme/font-size selection, Export JSON (Blob download), Purge (double confirm → clear DB + localStorage → /onboarding), Export & Purge. purgeAll() added to echoStore. npm run check: 0 errors. |
| 2026-06-28 | Phase 6 complete. Quick Log FAB (⚡ → ✓ animation), emoji definition display in add form (fade-in poetic text), save confirmation (✓ 900ms before goto), COSMIC compass-ring icon (all densities), version → 1.0.0, docs/RELEASE.md created. npm run check: 0 errors. |
| 2026-06-28 | v1.1 complete. Progressive disclosure (10-echo gate), disambiguation prompts (emoji × sense), ❓ Not Sure sense option, emoji skip (5s nudge), Uninstall guide in settings, Patterns insight card (20-echo gate, 30% threshold). npm run check: 0 errors. |