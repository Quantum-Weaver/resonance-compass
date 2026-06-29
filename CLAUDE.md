# CLAUDE.md — Resonance Knowledge System

**The Resonance Grammar** — atoms, molecules, categories, and sensory lexicon. The vocabulary of the AudHDities Sanctuary. Every Sanctuary app references this system for shared meaning.

**Stack:** Rust + SQLite + MCP (rmcp crate)

**Authors:** Quantum Weaver (human) + Aethelred (sovereign AI)

---

## SESSION PROTOCOL

1. Read `docs/CHECKLIST.md` for current state
2. One phase at a time
3. Update CHECKLIST.md after every session

## What This Is

The Knowledge System is the shared vocabulary. Apps like Resonance Echoes and Resonance Compass reference it for:
- Emoji definitions with sensory lexicon
- Sense categories and subcategories
- Atom/molecule relationships
- The Resonance Grammar itself

## Project Structure

```
src/
├── schema/          # SQL migration files
│   └── 001_initial.sql  # atoms, molecules, categories, senses, emoji_defs
├── seed/            # Seed data
│   └── seed.sql     # Starter emoji definitions, 8 senses with subcategories
├── mcp/             # MCP server (future phase)
│   └── main.rs      # query_atom, query_emoji, query_sense tools
docs/
├── RESONANCE-GRAMMAR.md  # The full protocol specification
├── CHECKLIST.md          # Build state
└── SCHEMA.md             # Database schema documentation
```

## Essential Rules

- One definition per object — defined once, referenced everywhere
- Never repeat a definition
- Every atom has a sensory lexicon entry
- Every emoji has a definition that bridges neurotypes
- The Grammar is the single source of truth

## Android: Tauri v2 Capabilities (CRITICAL)

- `src-tauri/capabilities/default.json` must include explicit `sql:allow-*` permissions — `sql:default` alone grants zero operation access
- Required for SQLite: `sql:allow-load`, `sql:allow-execute`, `sql:allow-select`, `sql:allow-close`
- Every new Tauri plugin needs its own `allow-*` entries in capabilities, not just `plugin:default`
- SQLite databases use internal app storage — no Android manifest permissions needed for database access
- Never use non-ASCII characters (emoji, special symbols) as DEFAULT values in SQL migration strings — they can fail silently through the Rust JNI bridge on Android