# BLUEPRINT INDEX — Resonance Echoes

## How to use

1. Identify what layer(s) your task touches
2. Read ONLY the relevant blueprint file(s)
3. Do NOT read the entire project blueprint unless needed

## Blueprint Files

| File | Contains | When to Read |
|------|----------|-------------|
| `pbp_resonance_echoes.ai.json` | Complete project overview, phase status | First session, major decisions |
| `layers/obp_routes.ai.json` | All routes, imports, state, navigation | Screen changes |
| `layers/obp_stores.ai.json` | All stores, reactive state, methods | Store changes |
| `layers/obp_components.ai.json` | All components, props, usage | Component changes |
| `layers/obp_rust_backend.ai.json` | Rust files, commands, schema | Backend changes |
| `layers/obp_types.ai.json` | TypeScript interfaces, types | Type changes |

## Task-to-Blueprint Map

| Task | Blueprints Needed |
|------|------------------|
| New screen | routes + components |
| Store logic | stores + types |
| Rust command | rust_backend |
| Styling | styles |
| Bug fix | Specific file from CHECKLIST |

## Phase Instructions

| Phase | Read |
|-------|------|
| Phase 0 (Shell) | components (ComfortBar, sidebar) + routes (layout) |
| Phase 1 (Echo) | stores (echoStore) + rust_backend (commands) + types |