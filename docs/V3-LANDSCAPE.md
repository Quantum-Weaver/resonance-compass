# V3-LANDSCAPE — the mobile music-recording territory

*Phase 0 draft — researched 2026-08-09 by a sent hand at the Etude lamp's
dispatch; KP's eye pending.*

*Commission: V3-BUILD-SEQUENCE.md Phase 0 ("The Summons") — map the existing
apps, catalog what musicians beg for, sort table stakes from differentiators
from what makes a neurodivergent musician feel seen. Every claim carries its
source beside it. Where a source is a vendor blog or an aggregator of uncertain
authorship, it is marked so. Where nothing could be verified, that is said
plainly — no invented statistics anywhere in this file.*

---

## 1. The map — existing mobile recording apps

Prices are as listed in August 2026 US stores/sites; app-store prices drift by
region and time.

| App | Platform | Pricing model | Cloud dependence | Core recording | Sovereignty posture |
|---|---|---|---|---|---|
| **BandLab** | iOS, Android, web, desktop ([bandlab.com](https://www.bandlab.com/membership)) | Freemium; core recording free; Membership ~$14.95/mo (Pro listed $79/yr in a 2026 sale) for distribution/AI tools ([bandlab.com/membership](https://www.bandlab.com/membership), [BandLab blog](https://blog.bandlab.com/bandlab-membership/)) | **Cloud-native.** All projects saved online; offline you can record but cannot save or publish until reconnected ([BandLab Help Center](https://help.bandlab.com/hc/en-us/articles/360025765673-Using-BandLab-Offline)) | Multitrack recording, mixing, virtual instruments, collaboration — genuinely capable and free ([bandlab.com](https://www.bandlab.com/membership)) | **Account required; data lives on their servers.** Exporting sections of a project unsupported ([Help Center](https://help.bandlab.com/hc/en-us/articles/115002959774-How-do-I-download-tracks)); privacy policy changes at their discretion ([BandLab privacy policy](https://blog.bandlab.com/privacy-policy/)) |
| **GarageBand** | iOS/iPadOS + Mac only — no Android, no Windows ([App Store](https://apps.apple.com/us/app/garageband/id408709785), [TechRadar](https://www.techradar.com/reviews/apple-garageband)) | Free | Local files; iCloud optional | Up to 32 tracks; multi-take recording (new take per pass, kept on one track) ([Apple Support](https://support.apple.com/en-us/101934)) | No account needed beyond the Apple ID the device already has; recordings stay on device. The sovereignty cost is the platform lock itself |
| **FL Studio Mobile** | Android, iOS, Windows, macOS ([Image-Line](https://www.image-line.com/fl-studio/pricing)) | One-time ~$14 (+ IAPs); paid updates free thereafter ([Producer Society](https://producersociety.com/is-fl-studio-mobile-a-one-time-purchase/) — enthusiast site) | None required | Audio recording, multitrack projects, mixer with per-track mute/solo/pan/volume ([App Store](https://apps.apple.com/app/id432850619)) | No account, offline, one-time purchase — one of the sovereign-leaning options |
| **n-Track Studio** | iOS, Android, Windows, Mac ([ntrack.com](https://ntrack.com/android-multitrack-studio.php)) | Free tier (8 tracks); subscriptions $1.49–$5.99/mo; one-time "Pro" purchase exists (~$29.99) ([App Store](https://apps.apple.com/us/app/n-track-studio-daw-make-music/id1130289718)) | Free tier historically saved projects only via their Songtree cloud ([Gizmodo download page](https://gizmodo.com/download/n-track-studio)) | Unlimited tracks (paid), effects, WAV/MP3 export (paid) | **Saving/export gated behind payment.** Users on n-Track's own forum report the new version "requires a subscription even to save" ([n-Track forum](https://discussion.ntrack.com/t/subscription-model/16229)); App Store reviewers complain of upgrade nagging ([App Store reviews](https://apps.apple.com/us/app/n-track-studio-daw-make-music/id1130289718?see-all=reviews&platform=ipad)) |
| **Audio Evolution Mobile Studio** | Android (iOS version exists separately) ([extreamsd.com](https://www.extreamsd.com/index.php/products/audio-evolution-mobile-for-android)) | One-time ~$11.99 + optional IAPs (USB low-latency driver ~€3.99) ([Google Play](https://play.google.com/store/apps/details?id=com.extreamsd.aemobile)) | None; works offline ([Google Play](https://play.google.com/store/apps/details?id=com.extreamsd.aemobile)) | Multitrack audio+MIDI, 250+ USB interfaces, mixer automation, **automated latency measurement + compensation** (recordings shifted back by measured latency so overdubs sit in sync) ([official manual](https://www.audio-evolution.com/manual/android/html/LatencyCompensation.html)) | No account found in research; offline; one-time purchase. The closest existing thing to a sovereign serious recorder on Android |
| **J4T Multitrack Recorder** | Android ([AppBrain](https://www.appbrain.com/app/j4t-multitrack-recorder/com.jaytronix.multitracker)) | One-time $3.49, no subscription ([AppBrain](https://www.appbrain.com/app/j4t-multitrack-recorder/com.jaytronix.multitracker)) | None | A compact 4-track for song sketches and demos — the Tascam spirit, minimal ([jaytronix](https://jaytronix-multitracker.andro.io/)) | Offline, no account, tiny. Proof the four-track idea fits a phone; long in the tooth |
| **Cubasis 3** (Steinberg) | iOS, iPadOS, Android, Chromebook ([Google Play](https://play.google.com/store/apps/details?id=com.steinberg.cubasis3&hl=en_US)) | One-time $49.99; free LE version ([App Store](https://apps.apple.com/us/app/cubasis-3-daw-music-studio/id1207839273)) | None required | Full mobile DAW: record/mix/edit, input/output device selection, Bluetooth audio recording, Ableton Link sync ([Engadget](https://www.engadget.com/cubasis-3-mobile-daw-android-163900963.html)) | One-time purchase, offline-capable — the "pro" sovereign-leaning option at a pro price |
| **Roland Zenbeats** | iOS, Android, Mac, Windows ([Google Play](https://play.google.com/store/apps/details?id=jp.co.roland.zenbeats&hl=en_US)) | Free tier; platform unlock from ~$15; "Max" $150 or via Roland Cloud membership from $3/mo ([MusicRadar](https://www.musicradar.com/news/roland-zenbeats-3-drum-sampler)) | Project sharing leans on Google Drive/OneDrive; Roland Cloud tie-in ([Google Play](https://play.google.com/store/apps/details?id=jp.co.roland.zenbeats&hl=en_US)) | Loop/beat-centric creation with recording; drum sampler | Freemium ladder into a vendor cloud membership |
| **Dolby On** | iOS, Android ([dolby.com](https://www.dolby.com/apps/dolby-on/)) | Free | Recordings on device; account optional, used for saving/sharing conveniences ([Softonic listing](https://dolby-on-record-audio-music.en.softonic.com/android) — aggregator) | One-tap capture with automatic noise reduction, limiting, EQ, spatial ([App Store](https://apps.apple.com/us/app/dolby-on-record-audio-video/id1443964192)) | Closest big-brand analog to "just record, no account" — but single-track capture, not a studio |
| **Zoom Handy Recorder / HandyRec** | iOS, Android; designed around Zoom's own mics ([zoomcorp.com](https://zoomcorp.com/en/us/software-product-page/software-sub-cat/handy-recorder-pro/)) | Free companion apps | Local files; direct upload to cloud sharing sites offered, not required ([Zoom manual, PDF](https://zoomcorp.com/media/documents/E_HandyRec_for_Android.pdf)) | High-quality PCM/AAC stereo capture, auto-record on signal, normalize/divide, compressor/EQ/reverb ([Zoom manual](https://zoomcorp.com/media/documents/E_HandyRecorder_v4.0_PRO2.pdf)) | Field-recorder posture: hardware-first, files-first. Not multitrack |
| **Koala Sampler** | iOS, Android ([koalasampler.com](https://www.koalasampler.com/)) | One-time $4.99 (+ Samurai IAP ~$15) ([Equipboard](https://equipboard.com/items/koala-sampler-ios)) | None found in research | Sampler/beatmaker (record anything via mic, chop, sequence) — adjacent to recording, beloved ([DJ TechTools](https://djtechtools.com/2023/02/07/meet-the-koala-sampler-app-a-mobile-production-powerhouse-now-with-stems/)) | One-time, offline, no account found. Proof that musicians reward small sovereign tools with devotion |
| **Tape It** | iOS only ([tape.it](https://tape.it/)) | Free (mono); Pro subscription ~$20/yr for stereo HD + AI noise reduction ([Vision Ireland review](https://vi.ie/the-tape-it-recorder-app-on-iphone/)) | Local-first capture; sharing features layered on | Musician's voice-memo replacement: markers while recording, waveforms, text/photo notes for lyrics/chords/gear ([tape.it](https://tape.it/), [MusicTech](https://musictech.com/news/gear/tape-it-musician-smart-recorder-app-iphone/)) | The idea-capture niche validated — but iOS-only and the good mics cost a subscription |

Not researched in depth this sitting (noted for completeness): Auria Pro (iOS),
Walk Band, Lexis Audio Editor, Music Maker JAM, Voloco, Moises. None of these
surfaced in research as changing the conclusions below.

### What the map says, plainly

- **The capable free option is cloud-shackled** (BandLab: account required,
  projects live on their servers, saving needs a connection — [BandLab Help
  Center](https://help.bandlab.com/hc/en-us/articles/360025765673-Using-BandLab-Offline)).
- **The sovereign options are either old, tiny, or expensive** (J4T at $3.49
  and aging; Audio Evolution at ~$12 with a functional but dated reputation;
  Cubasis at $49.99).
- **Nobody combines** account-free + offline-forever + serious multitrack +
  modern design. That seat is empty. (Claim of absence, based on this research
  sitting; a fuller sweep could yet surprise — but nothing in any list of
  "best mobile DAWs" consulted occupies it.)

---

## 2. What musicians beg for — the voice of the user

Sourcing note: direct Reddit thread access was unreliable from here;
r/WeAreTheMusicMakers threads did not surface directly in search. The findings
below come from app-vendor forums, app-store reviews, music-press reporting,
and (marked) vendor blogs. Treat vendor blogs as directionally useful, not
neutral.

### Recurring complaints

**Subscriptions — the loudest, most unanimous grievance in music software.**
- Dislike of subscriptions is described as "almost universal" across older and
  younger musicians ([MusicRadar](https://www.musicradar.com/music-tech/plugins/dg-wip-all-subscription-models-are-from-satan-and-there-is-a-special-place-in-hell-for-those-people-in-charge-that-went-for-this-business-model-are-music-software-subscriptions-really-as-bad-as-some-people-say)).
- Waves went subscription-only and was forced to backpedal by backlash;
  Minimal Audio reversed its subscription-only synth; VCV+ drew blowback for
  costing more than a perpetual license within eight months ([MusicRadar](https://www.musicradar.com/music-tech/plugins/dg-wip-all-subscription-models-are-from-satan-and-there-is-a-special-place-in-hell-for-those-people-in-charge-that-went-for-this-business-model-are-music-software-subscriptions-really-as-bad-as-some-people-say), [gearnews](https://www.gearnews.com/plugin-subscriptions-why-the-hate-should-you-go-perpetual/)).
- On mobile specifically: n-Track users on the company's own forum protest that
  saving now requires a subscription ([n-Track forum](https://discussion.ntrack.com/t/subscription-model/16229));
  reviewers praise the rare "buy it once, own it" option as "a unique jewel in
  today's subscription-heavy app market" ([randyhanley.com review](https://randyhanley.com/review-n-track-studio-pro-for-ios-i-did-not-know-it-was-this-good/)).
- The underlying reasons named: ownership, long-term commitment to one's
  tools, and subscription fatigue ([musictech.com](https://musictech.com/features/opinion-analysis/music-production-subscription-era/), [Kuassa](https://www.kuassa.com/the-pros-and-cons-of-subscription-based-licensing-models-for-vst-plug-ins/)).

**Latency — the technical wall, especially on Android.**
- Android's Compatibility Definition says devices *should* reach ≤50 ms
  continuous round-trip latency and ≤30 ms input latency — "should," not
  "must" ([Android CDD](https://android.googlesource.com/platform/compatibility/cdd/+/refs/heads/master-cuttlefish-testing-release/5_multimedia/5_6_audio-latency.md), [AOSP measurements](https://source.android.com/docs/core/audio/latency/measurements)).
- Bluetooth adds 34–200 ms depending on codec, versus roughly 5–10 ms wired
  ([Soundcore blog](https://www.soundcore.com/blogs/headphones/how-to-fix-headphone-latency) — vendor blog; corroborated by [Ableton's help article](https://help.ableton.com/hc/en-us/articles/6130134332188-Bluetooth-Headphones-and-Latency-in-Note) and [MusicRadar](https://www.musicradar.com/news/can-you-produce-music-using-bluetooth-headphones)).
  Ableton's own guidance for its Note app: Bluetooth monitoring while recording
  is not workable; compensation can align the *recorded* take but cannot fix
  what you *hear* in real time ([Ableton](https://help.ableton.com/hc/en-us/articles/6130134332188-Bluetooth-Headphones-and-Latency-in-Note)).
- The working precedent: Audio Evolution ships an automated latency test and
  shifts recordings back by the measured amount so overdubs land in sync
  ([Audio Evolution manual](https://www.audio-evolution.com/manual/android/html/LatencyCompensation.html)).
  This is exactly the calibration-tap-test shape Phase 2 already planned.

**Cloud lock-in and export gates.**
- BandLab: recordings made offline cannot even be saved until the network
  returns ([BandLab Help Center](https://help.bandlab.com/hc/en-us/articles/360025765673-Using-BandLab-Offline)).
- n-Track free tier: project saving via their cloud community ([Gizmodo](https://gizmodo.com/download/n-track-studio)).
- The pattern: the free tiers keep your work hostage — export, stems, or even
  *saving* are the paywall. (Characterization mine, from the sources above.)

**Friction kills capture — the voice-memo lesson.**
- Multiple musician-facing sources converge on the same finding: DAWs are
  built for production, not capture; by the time the app is open and the input
  configured, the idea is gone — which is why so many musicians default to the
  built-in voice memo app despite its uselessness for organizing ("dozens of
  audio files… 'Voice Memo 47' with no memory of what any of them were")
  ([Song Cage blog](https://songcage.com/blog/best-apps-for-capturing-song-ideas-fast/) — vendor blog, [Dubnote blog](https://dubnote.com/blog/best-voice-memo-apps-for-musicians) — vendor blog, [ScoreCloud](https://scorecloud.com/learn/capture-musical-ideas-fast/) — vendor blog).
  These are vendors selling the cure, so the diagnosis is self-serving — but
  the existence of a whole product niche (Tape It, Dubnote, Song Cage,
  Apple's discontinued Music Memos) is itself evidence the pain is real.

**Cluttered / opaque interfaces.**
- Even GarageBand — the most polished on-ramp in the market — draws criticism
  that it "offers no indication whatsoever as to what you're supposed to do"
  with many features and is less novice-friendly than it looks
  ([Ethan Hein, UI case study](https://ethanhein.substack.com/p/user-interface-case-study-ios-garageband), [The Outline](https://theoutline.com/post/2157/why-are-there-so-many-knobs-in-garage-band)).

**Gamification pressure (from the adjacent learning-app market).**
- Streak mechanics in Yousician/Simply Piano are reported to feel patronizing
  to some users and to "add anxiety to an activity that already carries its
  own stakes" ([trophy.so analysis](https://trophy.so/blog/streaks-feature-gamification-examples) — gamification-vendor blog, candid about the tradeoff; also [MasterPiano review](https://www.masterpiano.com/yousician-review), [pianoers.com](https://pianoers.com/simply-piano-review-the-honest-truth-about-learning-piano-with-an-app/)).
- No source was found praising streaks/pressure mechanics in a *creation* app.
  BandLab's social-feed dynamics drew no specific complaint threads in this
  research; that absence is noted honestly rather than filled in.

### Recurring wishes

Drawn from the same sources: **own your tools** (one-time purchase), **work
anywhere** (offline), **capture in seconds** (one gesture from idea to
recording), **overdub in sync** (latency handled for you), **get your audio
out** (WAV/stem export never gated), **32-bit/quality options** without a
"pro" tax, and **an interface that doesn't bury the record button**.

---

## 3. The sort

### TABLE STAKES — every serious app has it; v3 cannot ship without

| Feature | Who has it (evidence) |
|---|---|
| Multitrack record + overdub | BandLab, GarageBand, FL Studio Mobile, n-Track, Audio Evolution, Cubasis (map above) |
| Input selection (device / external / USB) | Cubasis ([Engadget](https://www.engadget.com/cubasis-3-mobile-daw-android-163900963.html)), Audio Evolution ([Google Play](https://play.google.com/store/apps/details?id=com.extreamsd.aemobile)) |
| Live level metering | Universal in the category (uncontroversial; no single citation) |
| Latency measurement + recording-offset compensation | Audio Evolution's automated test is the reference implementation ([manual](https://www.audio-evolution.com/manual/android/html/LatencyCompensation.html)) |
| Take management (record → review → keep/discard) | GarageBand multi-take ([Apple Support](https://support.apple.com/en-us/101934)) |
| Per-track gain/pan/mute | FL Studio Mobile mixer ([App Store](https://apps.apple.com/app/id432850619)), all serious peers |
| WAV export + stems | All paid tiers; often gated in free tiers (n-Track — [App Store](https://apps.apple.com/us/app/n-track-studio-daw-make-music/id1130289718)) |
| Tuner + metronome | Table stakes named in the vision itself; ubiquitous as standalone apps |

### DIFFERENTIATORS — rare or absent in the market

- **Sovereignty as a stance.** One-time-or-free + no account + offline-forever
  + serious multitrack + modern design: **no app found occupies all of it**
  (map above). The nearest neighbors each miss: Audio Evolution (dated, Android
  UI conventions), Cubasis ($49.99), J4T (minimal, aging), Dolby On (single
  track), GarageBand (Apple-only).
- **Superscript chord annotations anchored to syllables — the honest nuance.**
  The *concept* of syllable-anchored chords is not new: ChordPro has anchored
  chords to syllables in text since the 1990s (`[C]syl-la-ble`), and viewer
  apps (OnSong, SongbookPro) render them above the lyric line
  ([ChordPro on Wikipedia](https://en.wikipedia.org/wiki/ChordPro), [OnSong manual](https://onsongapp.com/docs/features/formats/onsong/chords/), [songbook-pro.com](https://songbook-pro.com/)).
  What was **not found anywhere**: a *songwriting editor* inside a *recording
  app* where chord anchors are a first-class data model that survives lyric
  edits — the performance apps are viewers of finished charts, and the
  songwriting apps (Songwriter's Pad "insert chords within lyrics" ([Google Play](https://play.google.com/store/apps/details?id=com.songwriterpad.sspai&hl=en_US)),
  Lyric Notepad ([App Store](https://apps.apple.com/us/app/lyric-notepad-song-writing/id1435329761)))
  treat chords as inline text, not anchored annotation, and none is a
  multitrack recorder. KP's feature, precisely stated, is confirmed absent:
  *edit-surviving syllable anchors, beside the recorder, sovereign.* Building
  on ChordPro as the import/export floor would inherit a 30-year ecosystem.
- **Energy-based setlist planning.** Gig apps track key, tempo, duration, and
  custom fields (BandHelper ([features](https://www.bandhelper.com/main/features.html)),
  Setlist Helper ([setlisthelper.com](https://www.setlisthelper.com/)), Set List
  Maker ([setlistmaker.com](http://www.setlistmaker.com/))) — but a
  first-class *energy arc* view for live musicians was not found in any
  mainstream setlist app. The precedent lives next door in DJ tooling: Mixed
  In Key's Energy Level 1–10 and the "sketch an energy map (low → medium →
  high → peak → release)" workflow ([mixedinkey.com](https://mixedinkey.com/workflows/use-energy-level-detection/), [mixedinkey harmonic-mixing guide](https://mixedinkey.com/harmonic-mixing-guide/sorting-playlists-by-energy-level/)).
  One web micro-tool claims key/tempo/energy set planning ([hub2.day page](https://local-band-practice-setlist-planner.hub2.day/))
  but its provenance is unclear (possibly generated); it is not evidence of a
  served market. **Confirmed rare-to-absent for band/songwriter setlists** —
  and the Compass's mood folksonomy is a moat here no competitor has.
- **The capture niche is validated but unserved on Android, sovereignly.**
  Tape It proves musicians will adopt a purpose-built capture tool — but it is
  iOS-only and subscription-gated for quality ([tape.it](https://tape.it/),
  [Vision Ireland](https://vi.ie/the-tape-it-recorder-app-on-iphone/)).

### WHAT MAKES A NEURODIVERGENT MUSICIAN FEEL SEEN — absent as a category

Searched for: mobile DAWs or recorders advertising reduced-motion support,
calm/gentle empty states, no-streak design, sensory-considerate interfaces.
**Nothing was found.** No mainstream mobile music-creation app surfaced in this
research presenting any of these as a design commitment. (Claim of absence
from one research sitting, stated as such.) What the record does show:

- Overwhelm is real and documented: neurodivergent musicians describe
  processing "everything at once" where neurotypical filtering is automatic
  ([Diary of an ADHD Strategist](https://elidervonte.substack.com/p/overcoming-overwhelm) — personal account; [DMA dissertation on classical musicians with ADHD](https://openscholar.uga.edu/record/5449/files/hoffman_joy_e_202012_dma.pdf) — academic).
- Streak/pressure mechanics measurably add anxiety for some users
  ([trophy.so](https://trophy.so/blog/streaks-feature-gamification-examples)) —
  and creation apps have begun importing social-feed dynamics (BandLab's
  community layer) without any opt-out posture found.
- The market's answer to "gentle" is marketing tone, not interaction design:
  no app found honors `prefers-reduced-motion` (or platform equivalents) as a
  stated feature, none describes empty states as a design surface, none
  promises the absence of urgency.

The whole third category — no urgency, no shame, no streaks, gentle empty
states, reduced-motion honored, offline-forever as a nervous-system guarantee
rather than a feature bullet — is **open territory**. The ComfortBar lineage
walks into an empty field.

---

## 4. What this means for Phases 2–4

**Table stakes v3 must not skip (Phase 2, being built now):**
1. **Latency calibration is not optional polish — it is the difference between
   a toy and a recorder.** Audio Evolution's automated measure-and-shift is
   the proven mechanism ([manual](https://www.audio-evolution.com/manual/android/html/LatencyCompensation.html));
   Phase 2's per-input calibration tap-test matches the best practice already
   in the market. Store the offset per input, as planned.
2. **Tell the truth about Bluetooth.** Compensation can place the recorded
   take correctly on the timeline, but 34–200 ms of BT monitoring delay cannot
   be engineered away ([Ableton](https://help.ableton.com/hc/en-us/articles/6130134332188-Bluetooth-Headphones-and-Latency-in-Note)).
   The UI should say so plainly (wired monitoring recommended while tracking;
   BT playback fine) — warnings never softened is also good audio engineering.
3. **Honest level metering with clip indication** — "levels honest" is already
   the exit gate; nothing found in the market changes it.
4. **Take management modeled on GarageBand's multi-take** (record → review →
   keep/discard) is the pattern users already know ([Apple Support](https://support.apple.com/en-us/101934)).
5. **Seconds-to-record is a headline feature, not a nicety.** The strongest
   recurring user story in the capture literature: the idea dies while the app
   loads. Measure cold-launch-to-armed on the S25 and treat it as a spec.
6. **Recording works with zero network, always, and saving is never gated** —
   this is where BandLab (can't save offline) and n-Track (pay to save) leave
   their users, per Section 2. v3's sovereignty law is directly load-bearing
   against the market's two biggest betrayals.

**Differentiators confirmed absent in the market (Phases 3–4):**
- **Sovereign four-track with modern design** — the seat is empty (Section 3).
  Phase 3 as planned walks into it.
- **Edit-surviving syllable-anchored chord annotation inside a recorder** —
  confirmed absent; adopt ChordPro as import/export floor to inherit its
  ecosystem while building the superscript editor as the original thing it is
  ([ChordPro](https://en.wikipedia.org/wiki/ChordPro)).
- **Energy-arc setlists for live musicians** — absent in mainstream gig apps;
  precedent exists only in DJ tooling (Mixed In Key), and the Compass's mood
  folksonomy gives v3 a data source no competitor has ([mixedinkey.com](https://mixedinkey.com/workflows/use-energy-level-detection/)).
- **The entire sensory-considerate category** — no competitor found even
  gesturing at it. Every gentle empty state, every honored reduced-motion
  preference, every absence-of-streak is differentiation the market has left
  on the table.

**One sequencing note for Phase 4, from the evidence:** the capture pain
(voice-memo friction, "Voice Memo 47" oblivion) is the most widely-attested
user wound in Section 2, and Tape It proves the niche while leaving Android
and sovereignty unserved. If Phase 0 findings weigh the order of Phase 4's
tools, quick-capture-plus-organization (recording + lyric capture + markers)
has the strongest evidence pull.

---

*Sources are linked inline throughout. Aggregator/AI-generated-looking pages
(unanswered.io, checkthat.ai, grokipedia, hub2.day) were either avoided or
flagged where mentioned. Reddit was not directly reachable from this hand's
search; the forum-voice section leans on vendor forums, app-store reviews, and
music press instead — a fuller r/WeAreTheMusicMakers read remains open for a
future sitting or KP's own scroll.*
