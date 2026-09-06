# Old-house paths made relative — 2026-09-06

- `package.json` — `sync-android` runs `node ../resonance-ziggy/modules/android-extras/sync-android-extras.mjs resonance-compass`; every realm is a sibling under the house, so the path resolves from the repo root.

Verified: `package.json` parses; a `git grep` for the old folder name returns no hits.
