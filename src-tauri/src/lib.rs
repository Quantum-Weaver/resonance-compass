use base64::prelude::*;
use lofty::file::AudioFile;
use lofty::file::TaggedFileExt;
use lofty::tag::Accessor;
use lofty::tag::ItemKey;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};
use tauri_plugin_fs::{FilePath, FsExt, OpenOptions};
use tauri_plugin_sql::{Migration, MigrationKind};

mod audio;
mod equalizer;
mod fragment_engine;
mod media_permission;
mod visualizer;

// ── TrackInfo (returned by scan_paths; field names mirror the Track TS interface) ──

#[derive(Debug, Serialize, Clone)]
pub struct TrackInfo {
    pub id: String,
    pub uri: String,
    pub filename: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub genre: Option<String>,
    pub year: Option<u32>,
    #[serde(rename = "trackNumber")]
    pub track_number: Option<u32>,
    pub duration: f64,
    #[serde(rename = "coverArt")]
    pub cover_art: Option<String>,
    pub lyrics: Option<String>,
    #[serde(rename = "dateAdded")]
    pub date_added: u64,
}

// Android's SAF file picker hands back `content://...` URIs, not filesystem
// paths — the last segment is a document ID (often percent-encoded) rather
// than a clean filename. Good enough as a last-resort title fallback; tags
// take priority whenever they're present.
fn display_name_from_uri(uri: &str) -> String {
    if !uri.contains("://") {
        if let Some(name) = Path::new(uri).file_name().and_then(|s| s.to_str()) {
            return name.to_string();
        }
    }
    uri.rsplit('/').next().unwrap_or(uri).to_string()
}

fn parse_metadata(app_handle: &tauri::AppHandle, uri: &str) -> TrackInfo {
    let filename = display_name_from_uri(uri);
    let id = uri.to_string();

    let mut title = Path::new(&filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let mut artist = String::from("Unknown Artist");
    let mut album = String::from("Unknown Album");
    let mut genre: Option<String> = None;
    let mut year: Option<u32> = None;
    let mut track_number: Option<u32> = None;
    let mut cover_art: Option<String> = None;
    let mut lyrics: Option<String> = None;
    let mut duration = 0.0f64;
    let mut date_added = 0u64;

    // Bridged through tauri-plugin-fs so this resolves both plain desktop
    // paths and Android content:// URIs (via ContentResolver) to the same
    // std::fs::File — required since raw std::fs can't open a content:// URI.
    let file_path: FilePath = uri.parse().unwrap();
    let mut opts = OpenOptions::new();
    opts.read(true);

    if let Ok(mut file) = app_handle.fs().open(file_path, opts) {
        date_added = file
            .metadata()
            .and_then(|m| m.modified())
            .map(|t| {
                t.duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
            })
            .unwrap_or(0);

        if let Ok(tagged_file) = lofty::read_from(&mut file) {
            duration = tagged_file.properties().duration().as_secs_f64();

            if let Some(tag) = tagged_file.primary_tag() {
                if let Some(t) = tag.title() {
                    title = t.to_string();
                }
                if let Some(a) = tag.artist() {
                    artist = a.to_string();
                }
                if let Some(a) = tag.album() {
                    album = a.to_string();
                }
                genre = tag.genre().map(|g| g.to_string());

                year = tag
                    .get_string(&ItemKey::RecordingDate)
                    .and_then(|s| s.get(0..4))
                    .and_then(|s| s.parse::<u32>().ok());
                track_number = tag
                    .get_string(&ItemKey::TrackNumber)
                    .and_then(|s| s.parse::<u32>().ok());
                lyrics = tag.get_string(&ItemKey::Lyrics).map(|s| s.to_string());

                if let Some(pic) = tag.pictures().first() {
                    let mime = match pic.mime_type() {
                        Some(lofty::picture::MimeType::Jpeg) => "image/jpeg",
                        Some(lofty::picture::MimeType::Png) => "image/png",
                        Some(lofty::picture::MimeType::Gif) => "image/gif",
                        Some(lofty::picture::MimeType::Tiff) => "image/tiff",
                        Some(lofty::picture::MimeType::Bmp) => "image/bmp",
                        _ => "image/jpeg",
                    };
                    let encoded = BASE64_STANDARD.encode(pic.data());
                    cover_art = Some(format!("data:{};base64,{}", mime, encoded));
                }
            }
        }
    }

    // Fallback: "Artist - Title" filename heuristic
    if artist == "Unknown Artist" && title.contains(" - ") {
        if let Some((a, t)) = title.split_once(" - ") {
            artist = a.trim().to_string();
            title = t.trim().to_string();
        }
    }

    TrackInfo {
        id,
        uri: uri.to_string(),
        filename,
        title,
        artist,
        album,
        genre,
        year,
        track_number,
        duration,
        cover_art,
        lyrics,
        date_added,
    }
}

#[derive(Serialize, Clone)]
struct ScanProgress {
    current: usize,
    total: usize,
}

const AUDIO_EXTENSIONS: &[&str] = &["mp3", "flac", "wav", "aac", "ogg", "m4a"];

fn collect_audio_paths(dir: &Path, out: &mut Vec<String>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                collect_audio_paths(&p, out);
            } else if p
                .extension()
                .map(|e| AUDIO_EXTENSIONS.contains(&e.to_string_lossy().to_lowercase().as_str()))
                .unwrap_or(false)
            {
                out.push(p.to_string_lossy().to_string());
            }
        }
    }
}

// Each entry may be a directory (walked recursively — desktop folder picker,
// Android's fixed public Music/Download dirs) or a single file path / content://
// URI (opened directly). Android has no folder-picker dialog, so its directories
// arrive as well-known paths readable once media permission is granted.
#[tauri::command]
fn scan_paths(app_handle: tauri::AppHandle, paths: Vec<String>) -> Result<Vec<TrackInfo>, String> {
    let mut files: Vec<String> = Vec::new();
    for entry in &paths {
        let p = Path::new(entry);
        if p.is_dir() {
            // Probe storage access early so the frontend can show a useful error
            if let Err(e) = fs::read_dir(p) {
                return Err(if e.kind() == std::io::ErrorKind::PermissionDenied {
                    "PERMISSION_DENIED: Storage access is required to scan music files. \
                     Please grant Media or Files access in \
                     Settings → Apps → Resonance Compass → Permissions."
                        .to_string()
                } else {
                    format!("Cannot read directory: {e}")
                });
            }
            collect_audio_paths(p, &mut files);
        } else {
            files.push(entry.clone());
        }
    }

    let total = files.len();
    let mut tracks = Vec::with_capacity(total);
    for (i, uri) in files.iter().enumerate() {
        tracks.push(parse_metadata(&app_handle, uri));
        let _ = app_handle.emit("scan-progress", ScanProgress { current: i + 1, total });
    }
    Ok(tracks)
}

// ── Media permission commands (Android runtime prompt; desktop always granted) ─

#[tauri::command]
async fn check_audio_permission(app_handle: tauri::AppHandle) -> Result<bool, String> {
    #[cfg(target_os = "android")]
    {
        return media_permission::check(&app_handle);
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = app_handle;
        Ok(true)
    }
}

#[tauri::command]
async fn request_audio_permission(app_handle: tauri::AppHandle) -> Result<bool, String> {
    #[cfg(target_os = "android")]
    {
        // run_mobile_plugin blocks until the vessel answers the system dialog —
        // keep that wait off the async runtime's core threads.
        return tauri::async_runtime::spawn_blocking(move || {
            media_permission::request(&app_handle)
        })
        .await
        .map_err(|e| e.to_string())?;
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = app_handle;
        Ok(true)
    }
}

// ── fetch_cover_art (MusicBrainz + Cover Art Archive, opt-in, user-initiated) ─

#[tauri::command]
async fn fetch_cover_art(artist: String, album: String) -> Result<Option<String>, String> {
    // Ok(None) = no matching release / no front image (honest "not found").
    // Err(..) = transient failure (network, timeout, MusicBrainz 503 rate-limit)
    // so the UI can retry rather than falsely report "not found". The compliant
    // User-Agent (app name/version + contact URL) is REQUIRED by MusicBrainz —
    // a vague one gets throttled, a prime cause of the same-album flakiness.
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .user_agent("ResonanceCompass/2.1.3 ( https://audhdities.com )")
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    // Step 1: MusicBrainz — find the release MBID
    let query = format!("artist:{} release:{}", artist, album);
    let mb_resp = client
        .get("https://musicbrainz.org/ws/2/release/")
        .query(&[("query", query.as_str()), ("fmt", "json"), ("limit", "5")])
        .send()
        .await
        .map_err(|e| format!("Could not reach MusicBrainz: {e}"))?;

    if !mb_resp.status().is_success() {
        return Err(format!("MusicBrainz returned {}", mb_resp.status()));
    }

    let mb_json = mb_resp
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Could not read MusicBrainz response: {e}"))?;

    let mbid = match mb_json
        .get("releases")
        .and_then(|r| r.as_array())
        .and_then(|arr| arr.first())
        .and_then(|rel| rel.get("id"))
        .and_then(|id| id.as_str())
    {
        Some(id) => id.to_string(),
        None => return Ok(None),
    };

    // Step 2: Cover Art Archive — download front image as base64 data URI
    let caa_url = format!("https://coverartarchive.org/release/{}/front", mbid);
    let caa_resp = client
        .get(&caa_url)
        .send()
        .await
        .map_err(|e| format!("Could not reach Cover Art Archive: {e}"))?;

    if caa_resp.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(None);
    }
    if !caa_resp.status().is_success() {
        return Err(format!("Cover Art Archive returned {}", caa_resp.status()));
    }

    let mime = caa_resp
        .headers()
        .get("content-type")
        .and_then(|ct| ct.to_str().ok())
        .map(|ct| ct.split(';').next().unwrap_or("image/jpeg").trim().to_string())
        .unwrap_or_else(|| "image/jpeg".to_string());

    let bytes = caa_resp
        .bytes()
        .await
        .map_err(|e| format!("Could not download cover image: {e}"))?;

    if bytes.is_empty() {
        return Ok(None);
    }

    Ok(Some(format!("data:{};base64,{}", mime, BASE64_STANDARD.encode(&bytes))))
}

// ── fetch_lyrics (LRCLIB, opt-in, user-initiated only) ──────────────────────

#[derive(Serialize)]
pub struct LyricsResult {
    #[serde(rename = "syncedLyrics")]
    synced_lyrics: Option<String>,
    #[serde(rename = "plainLyrics")]
    plain_lyrics: Option<String>,
}

#[derive(Deserialize)]
struct LrclibResponse {
    #[serde(rename = "syncedLyrics")]
    synced_lyrics: Option<String>,
    #[serde(rename = "plainLyrics")]
    plain_lyrics: Option<String>,
}

#[tauri::command]
async fn fetch_lyrics(artist: String, title: String) -> Result<Option<LyricsResult>, String> {
    // Ok(None) means LRCLIB genuinely has no lyrics for this track.
    // Err(..) means a *transient* failure (network, timeout, rate-limit) so the
    // UI can offer a retry instead of falsely reporting "no lyrics found" — the
    // silent Ok(None)-on-everything was why lyrics appeared once and not the next
    // time for the same song.
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(12))
        .user_agent("ResonanceCompass/2.1.3 ( https://audhdities.com )")
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    let resp = client
        .get("https://lrclib.net/api/get")
        .query(&[("artist_name", &artist), ("track_name", &title)])
        .send()
        .await
        .map_err(|e| format!("Could not reach LRCLIB: {e}"))?;

    // 404 is LRCLIB's honest "not found"; any other non-2xx is transient.
    if resp.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(None);
    }
    if !resp.status().is_success() {
        return Err(format!("LRCLIB returned {}", resp.status()));
    }

    let body: LrclibResponse = resp
        .json()
        .await
        .map_err(|e| format!("Could not read LRCLIB response: {e}"))?;

    if body.synced_lyrics.is_none() && body.plain_lyrics.is_none() {
        return Ok(None);
    }

    Ok(Some(LyricsResult {
        synced_lyrics: body.synced_lyrics,
        plain_lyrics: body.plain_lyrics,
    }))
}

// ── Fragment commands ─────────────────────────────────────────────────────────

#[tauri::command]
async fn create_fragment(
    app_handle: tauri::AppHandle,
    source_path: String,
    start_secs: f64,
    end_secs: f64,
    output_name: String,
) -> Result<String, String> {
    let fragments_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("fragments");

    fs::create_dir_all(&fragments_dir)
        .map_err(|e| format!("Cannot create fragments dir: {e}"))?;

    let safe_name: String = output_name
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            c => c,
        })
        .collect();

    // The native engine renders fragments as WAV regardless of source
    // format (v3 Phase 1 — no ffmpeg, works on phones).
    let output_path = fragments_dir.join(format!("{}.wav", safe_name));
    let output_str = output_path.to_string_lossy().to_string();

    tauri::async_runtime::spawn_blocking(move || {
        let samples = fragment_engine::decode_window(&source_path, start_secs, end_secs)?;
        fragment_engine::write_wav(Path::new(&output_path), &samples)?;
        Ok(output_str)
    })
    .await
    .map_err(|e| format!("fragment task failed: {e}"))?
}

// ── Fragment Studio: mix export ───────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct MixLayer {
    pub path: String,
    pub offset_secs: f64,
    pub volume: f64,
    pub pan: f64,
    pub fade_in: f64,
    pub fade_out: f64,
    /// Kept for API compatibility with the studio UI; the native engine
    /// (v3 Phase 1) anchors fade-out to the true decoded length instead.
    #[allow(dead_code)]
    pub duration: f64,
}

#[tauri::command]
async fn export_mix(
    app_handle: tauri::AppHandle,
    layers: Vec<MixLayer>,
    output_name: String,
) -> Result<String, String> {
    if layers.is_empty() {
        return Err("No layers to mix".to_string());
    }

    let mixes_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("mixes");

    fs::create_dir_all(&mixes_dir).map_err(|e| format!("Cannot create mixes dir: {e}"))?;

    let safe_name: String = output_name
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            c => c,
        })
        .collect();

    let output_path = mixes_dir.join(format!("{}.wav", safe_name));
    let output_str = output_path.to_string_lossy().to_string();

    // The native engine (v3 Phase 1): decode/fade/pan/delay/sum in-process.
    // Same laws as the old ffmpeg chain; fade-out now anchors to each
    // layer's true decoded length instead of the UI-carried duration.
    let specs: Vec<fragment_engine::LayerSpec> = layers
        .iter()
        .map(|l| fragment_engine::LayerSpec {
            path: l.path.clone(),
            offset_secs: l.offset_secs,
            volume: l.volume,
            pan: l.pan,
            fade_in: l.fade_in,
            fade_out: l.fade_out,
        })
        .collect();

    tauri::async_runtime::spawn_blocking(move || {
        let master = fragment_engine::mix_layers(&specs)?;
        fragment_engine::write_wav(Path::new(&output_path), &master)?;
        Ok(output_str)
    })
    .await
    .map_err(|e| format!("mix task failed: {e}"))?
}

// Full-sovereignty companion to the DB purge: the fragments/mixes tables lose
// their rows in SQL, this removes the audio bytes they pointed at (app-data
// fragments/ and mixes/ directories, recreated on next fragment creation).
#[tauri::command]
async fn purge_fragment_files(app_handle: tauri::AppHandle) -> Result<(), String> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    for sub in ["fragments", "mixes"] {
        let dir = data_dir.join(sub);
        if dir.exists() {
            fs::remove_dir_all(&dir).map_err(|e| format!("Cannot remove {sub}: {e}"))?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn export_fragments(paths: Vec<String>, dest_dir: String) -> Result<u32, String> {
    let dest = Path::new(&dest_dir);
    if !dest.exists() {
        return Err(format!("Destination directory does not exist: {dest_dir}"));
    }
    let mut copied = 0u32;
    for path_str in &paths {
        let src = Path::new(path_str);
        if !src.exists() {
            continue;
        }
        let file_name = src.file_name().unwrap_or_default();
        let dst = dest.join(file_name);
        if fs::copy(src, &dst).is_ok() {
            copied += 1;
        }
    }
    Ok(copied)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (vis_tx, vis_rx) = visualizer::make_channel();
    let eq_state = Arc::new(Mutex::new(equalizer::EqState::default()));

    let migrations = vec![
        Migration {
            version: 1,
            description: "create_songs_table",
            sql: "CREATE TABLE IF NOT EXISTS songs (
                id TEXT PRIMARY KEY,
                uri TEXT NOT NULL UNIQUE,
                filename TEXT NOT NULL,
                title TEXT NOT NULL,
                artist TEXT NOT NULL DEFAULT 'Unknown Artist',
                album TEXT NOT NULL DEFAULT 'Unknown Album',
                genre TEXT,
                year INTEGER,
                track_number INTEGER,
                duration REAL NOT NULL DEFAULT 0,
                cover_art TEXT,
                lyrics TEXT,
                date_added INTEGER NOT NULL DEFAULT 0,
                last_scanned INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
            CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_mood_events_table",
            sql: "CREATE TABLE IF NOT EXISTS mood_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                track_id TEXT NOT NULL,
                emoji TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                intensity INTEGER DEFAULT 3,
                comment TEXT,
                context TEXT DEFAULT 'manual',
                FOREIGN KEY (track_id) REFERENCES songs(id)
            );
            CREATE INDEX IF NOT EXISTS idx_mood_track ON mood_events(track_id);
            CREATE INDEX IF NOT EXISTS idx_mood_time ON mood_events(timestamp);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_favorites_table",
            sql: "CREATE TABLE IF NOT EXISTS favorites (
                track_id TEXT PRIMARY KEY,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (track_id) REFERENCES songs(id)
            );",
            kind: MigrationKind::Up,
        },
        // Reserved for a possible future SQLite migration. Playlists (including the
        // 'favorites' auto-playlist) currently live in localStorage via playlistStore
        // (see docs/CLAUDE-CONTEXT.md) — this table is created but not written to.
        Migration {
            version: 4,
            description: "create_playlists_table",
            sql: "CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                track_ids TEXT NOT NULL DEFAULT '[]',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_fragments_table",
            sql: "CREATE TABLE IF NOT EXISTS fragments (
                id TEXT PRIMARY KEY,
                source_track_id TEXT NOT NULL,
                name TEXT NOT NULL,
                start_time REAL NOT NULL,
                end_time REAL NOT NULL,
                duration REAL NOT NULL,
                file_path TEXT,
                emoji TEXT,
                favorite INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (source_track_id) REFERENCES songs(id)
            );",
            kind: MigrationKind::Up,
        },
    ];

    let builder = tauri::Builder::default()
        .setup(move |app| {
            visualizer::start(app.handle().clone(), vis_rx);
            let audio_state = audio::AudioState::init(app.handle().clone(), vis_tx, eq_state);
            app.manage(audio_state);
            Ok(())
        })
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:compass.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init());

    #[cfg(target_os = "android")]
    let builder = builder.plugin(media_permission::init());

    builder
        .invoke_handler(tauri::generate_handler![
            scan_paths,
            check_audio_permission,
            request_audio_permission,
            fetch_cover_art,
            fetch_lyrics,
            create_fragment,
            export_fragments,
            export_mix,
            purge_fragment_files,
            audio::play_track,
            audio::pause,
            audio::resume,
            audio::seek,
            audio::set_volume,
            audio::stop,
            equalizer::get_eq_state,
            equalizer::set_eq_band,
            equalizer::set_eq_preamp,
            equalizer::toggle_eq,
            equalizer::set_eq_preset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Resonance Compass");
}
