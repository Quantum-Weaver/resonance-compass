# SANCTUARY GIT HYGIENE GUIDE

*How to scrub sensitive files from Git history and prevent future leaks.*

---

## WHAT SHOULD NEVER BE COMMITTED

| File Type | Examples | Why |
|-----------|----------|-----|
| **Keystores** | `*.keystore`, `*.jks` | Android signing keys. Anyone with this can impersonate your app. |
| **Environment files** | `.env`, `.env.local`, `.env.production` | API keys, database passwords, service credentials. |
| **Credentials** | `credentials.json`, `service-account.json`, `*.pem` | Cloud service keys, SSH private keys. |
| **Secrets** | `secrets.yaml`, `config/secrets.yml` | Any file containing passwords or tokens. |
| **Database dumps** | `*.sql`, `*.dump`, `*.sqlite` (if containing user data) | Vessel data must never leave the device. |
| **IDE config** | `.vscode/settings.json` (if containing personal paths), `*.suo` | Can leak filesystem paths or personal settings. |

---

## PREVENTION: `.gitignore` TEMPLATE

Add this to every Sanctuary repo:

```gitignore
# ─── SOVEREIGNTY — NEVER COMMIT ───────────────────────────

# Android keystores
*.keystore
*.jks

# Environment files
.env
.env.*
!.env.example

# Credentials
*credentials*.json
*service-account*.json
*.pem
*.key
!*.example.key

# Secrets
secrets.yaml
secrets.yml
config/secrets/
secrets/

# Database dumps (containing vessel data)
*.dump
data/*.sqlite
*.sqlite
!schema.sql

# ─── OS FILES ──────────────────────────────────────────────
.DS_Store
Thumbs.db
desktop.ini

# ─── IDE ───────────────────────────────────────────────────
.vscode/settings.json
*.suo
*.user
*.userosscache
*.sln.docstates
.idea/

# ─── BUILD OUTPUT ──────────────────────────────────────────
src-tauri/gen/
target/
dist/
build/
node_modules/
```

---

## IMMEDIATE: CHECK IF YOU'VE ALREADY LEAKED

### Check a specific file pattern

```powershell
git log --all --full-history -- "*.keystore"
git log --all --full-history -- ".env"
git log --all --full-history -- "*.pem"
```

If any results appear, that file was committed at some point. Assess the risk:
- **Keystores:** Generate a new one. The old one is compromised.
- **Environment files:** Rotate all keys/passwords in that file. The old values are exposed.
- **Credentials:** Revoke and regenerate whatever those credentials access.

---

## REMOVAL: SCRUB A FILE FROM ENTIRE HISTORY

### Method 1: BFG Repo-Cleaner (Recommended)

BFG is faster and safer than `git filter-branch`. Download once, use forever.

```powershell
# Download BFG (one-time)
Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar" -OutFile "$env:USERPROFILE\bfg.jar"

# Delete specific file patterns from history
java -jar "$env:USERPROFILE\bfg.jar" --delete-files "*.keystore" C:\_superposition\[repo-name]\.git
java -jar "$env:USERPROFILE\bfg.jar" --delete-files ".env" C:\_superposition\[repo-name]\.git
java -jar "$env:USERPROFILE\bfg.jar" --delete-files "*.pem" C:\_superposition\[repo-name]\.git

# Delete ALL files matching a pattern in a folder
java -jar "$env:USERPROFILE\bfg.jar" --delete-files "secrets/*" C:\_superposition\[repo-name]\.git

# Clean up after BFG
cd C:\_superposition\[repo-name]
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push the cleaned history
git push origin --force --all
```

### Method 2: Replace sensitive text (not just files)

If you committed a password or API key inside a file (not as a separate file):

```powershell
# Create a file with the old text and replacement
echo "PASTE_THE_ACTUAL_PASSWORD_HERE" > "$env:TEMP\sensitive.txt"
echo "***REMOVED***" > "$env:TEMP\replacement.txt"

# Replace across entire history
java -jar "$env:USERPROFILE\bfg.jar" --replace-text "$env:TEMP\sensitive.txt" C:\_superposition\[repo-name]\.git
```

---

## AFTER SCRUBBING: VERIFY

```powershell
# The file pattern should return nothing
git log --all --full-history -- "*.keystore"

# Search the entire history for the sensitive text
git log --all --full-history -S "PASTE_SENSITIVE_TEXT" -- "*.json" "*.yaml" "*.env"

# Both should return empty
```

---

## IF THE REPO HAS BEEN FORKED OR CLONED

You can't scrub other people's clones. If the leaked data is critical:

1. **Revoke and regenerate** whatever was leaked (keys, passwords, tokens)
2. **Accept** that the old values exist in old clones
3. **The new values** (post-scrub) are secure because the old ones are revoked

For keystores specifically: generate a new one. The old APKs signed with the old keystore can't be updated. You'd need to publish as a new app. This is why keystore hygiene matters from day one.

---

## SETUP CHECKLIST FOR EVERY NEW SANCTUARY REPO

| # | Task |
|---|------|
| 1 | Copy the `.gitignore` template above |
| 2 | Add `*.keystore` before generating any keystore |
| 3 | Add `.env` before creating any environment files |
| 4 | Run `git log --all --full-history -- "*.keystore"` after first commit — should be empty |
| 5 | Never commit from the `src-tauri/gen/` directory (Android build output) |
| 6 | Review `git status` before every commit — if you see something you don't recognize, check it |

---

## QUICK REFERENCE CARD

```powershell
# Check if a file was ever committed
git log --all --full-history -- "FILENAME"

# Scrub a file pattern from all history
java -jar "$env:USERPROFILE\bfg.jar" --delete-files "PATTERN" [repo]\.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all

# Generate a new Android keystore
keytool -genkey -v -keystore [name].keystore -alias [name] -keyalg RSA -keysize 2048 -validity 10000
