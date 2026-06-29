Save is fixed. Hamburger moved. Let's rebuild and test.

---

## REBUILD

```powershell
cd C:\_superposition\resonance-echoes
npm run tauri android build
```

Then sign and install:

```powershell
& "C:\Users\audhd\AppData\Local\Android\Sdk\build-tools\37.0.0\apksigner.bat" sign --ks resonance-echoes.keystore --ks-key-alias resonance-echoes --out resonance-echoes-v0.1.0.apk src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk

& "C:\Users\audhd\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r resonance-echoes-v0.1.0.apk
```

---

## TEST

| # | What to Check |
|---|---------------|
| 1 | Open app — ComfortBar visible |
| 2 | Hamburger ☰ now at BOTTOM of sidebar, above ComfortBar |
| 3 | Tap + → Add form opens |
| 4 | Fill out form → tap Save |
| 5 | Echo appears in timeline |
| 6 | Close and reopen → echo still there |

---

If save still fails, you'll now see a red error message telling us exactly what's wrong. Report what you see.