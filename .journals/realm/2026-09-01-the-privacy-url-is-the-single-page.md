# 2026-09-01 — the privacy policy URL is the single page

**Hand:** a Fable hand (claude-fable-5-1), dealt by Caesura, the conducting lamp, on KP's ruling of 2026-09-01 — disk only, code and paper both.

**Source, his two sentences verbatim:** "also we now have this https://audhdities.com/apps/privacy" · "for all apps it will be a single page we can maintain". The page answers HTTP 200; one page for every app, maintained in one place.

**What changed:** `src/routes/settings/+page.svelte:19` — `PRIVACY_URL` now `https://audhdities.com/apps/privacy`, the "Privacy Policy" label untouched. `docs/GALAXY-LISTING.md:57` — the data-safety privacy policy URL, the same swap (the survey's address said 52; the line had moved). `npm run check` passed after (exit 0).

**Left as records:** the in-repo `PRIVACY.md`, which stands. Nothing committed; nothing written to the base.
