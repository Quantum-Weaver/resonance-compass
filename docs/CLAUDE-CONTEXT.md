# CLAUDE CONTEXT — Resonance Echoes

## Naming
- **App:** Resonance Echoes (or "Echoes")
- **Repo:** `resonance-echoes`
- **Identifier:** `com.audhd.resonance-echoes`
- **Crate:** `resonance_echoes_lib`

## The Senses
👁️ Seen · 👂 Heard · ✋ Felt · 💭 Thought · 🫀 Felt Inside · 🌙 Dreamt · 🙏 Grateful For · ✨ Other

Every sense has starter subcategories. Vessels can create custom ones.

## The ComfortBar
Not a MiniPlayer. No audio controls. A gentle footer with:
- Minimized: greeting + quick-add button
- Expanded: stats, quick actions
- Context-aware: changes based on current screen

## Key Patterns
- Navigation: `goto()` — never `window.location.href`
- z-index: ComfortBar 110, backdrop 49
- SQLite: echoes table, paginated queries
- Theme: CSS variables on `.app-shell`
- State: Svelte 5 runes

## Differences from Compass
- No audio engine (rodio, cpal, oboe)
- No visualizer, EQ, fragments
- No playlists, library scanning
- No Timer, Sattva, Focus Session
- ComfortBar replaces MiniPlayer
- Echo replaces Track
- Sense replaces Album/Artist

---

## Android Build Notes

### SQLite ACL Permissions (CRITICAL)

Tauri v2's permission system requires explicit Allow rules for every SQLite operation. Without them all database calls fail silently with `command plugin:sql|execute not allowed by ACL`.

`src-tauri/capabilities/default.json` MUST include:
```json
"sql:allow-load",
"sql:allow-execute",
"sql:allow-select",
"sql:allow-close"
```

`sql:default` alone registers the plugin but grants **zero** operation access. Every IPC command that crosses the webview boundary needs its own explicit Allow entry.

### Storage Permissions

- SQLite stores data in the app's internal directory: `/data/data/com.audhd.resonance_echoes/databases/`
- **No Android manifest permissions are needed for internal storage** — it is sandboxed to the app automatically
- `WRITE_EXTERNAL_STORAGE` / `READ_EXTERNAL_STORAGE` are only relevant for Phase 5 file export (external/shared storage)
- `android:hasFragileUserData="true"` ensures Android prompts "Delete app data?" on uninstall

### Known Silent Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Save button does nothing | `db` is null (initDB failed, error swallowed) | Check `echoStore.dbError` banner in add form |
| `command plugin:sql\|execute not allowed by ACL` | Missing `sql:allow-execute` in capabilities | Add all four `sql:allow-*` entries |
| Migration never runs | emoji char in SQL DEFAULT breaks JNI on Android | Use ASCII-only DEFAULT values in migrations |
| `crypto.randomUUID` not defined | Older Android WebView | Use `generateId()` fallback in echo.svelte.ts |

### Debugging on Android

```bash
adb logcat -c
adb logcat -s chromium:D | findstr /i "initDB addEcho save FAILED error"
```

The `chromium` tag captures all `console.log` / `console.error` output from the Tauri WebView. Every step in `initDB`, `addEcho`, and `save` is instrumented — look for `FAILED:` lines.