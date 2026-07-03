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

// ── fetch_cover_art (MusicBrainz + Cover Art Archive, opt-in, user-initiated) ─

#[tauri::command]
async fn fetch_cover_art(artist: String, album: String) -> Result<Option<String>, String> {
    let Ok(client) = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .user_agent("ResonanceCompass/2.0.0 (resonance-compass)")
        .build()
    else {
        return Ok(None);
    };

    // Step 1: MusicBrainz — find the release MBID
    let query = format!("artist:{} release:{}", artist, album);
    let Ok(mb_resp) = client
        .get("https://musicbrainz.org/ws/2/release/")
        .query(&[("query", query.as_str()), ("fmt", "json"), ("limit", "5")])
        .send()
        .await
    else {
        return Ok(None);
    };

    if !mb_resp.status().is_success() {
        return Ok(None);
    }

    let Ok(mb_json) = mb_resp.json::<serde_json::Value>().await else {
        return Ok(None);
    };

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
    let Ok(caa_resp) = client.get(&caa_url).send().await else {
        return Ok(None);
    };

    if !caa_resp.status().is_success() {
        return Ok(None);
    }

    let mime = caa_resp
        .headers()
        .get("content-type")
        .and_then(|ct| ct.to_str().ok())
        .map(|ct| ct.split(';').next().unwrap_or("image/jpeg").trim().to_string())
        .unwrap_or_else(|| "image/jpeg".to_string());

    let Ok(bytes) = caa_resp.bytes().await else {
        return Ok(None);
    };

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
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
    {
        Ok(c) => c,
        Err(_) => return Ok(None),
    };

    let resp = match client
        .get("https://lrclib.net/api/get")
        .query(&[("artist_name", &artist), ("track_name", &title)])
        .send()
        .await
    {
        Ok(r) => r,
        Err(_) => return Ok(None),
    };

    if resp.status() == 404 || !resp.status().is_success() {
        return Ok(None);
    }

    let body: LrclibResponse = match resp.json().await {
        Ok(b) => b,
        Err(_) => return Ok(None),
    };

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
    let source = Path::new(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("mp3")
        .to_lowercase();

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

    let output_path = fragments_dir.join(format!("{}.{}", safe_name, ext));
    let output_str = output_path.to_string_lossy().to_string();

    let result = std::process::Command::new("ffmpeg")
        .args([
            "-y",
            "-i",
            &source_path,
            "-ss",
            &format!("{:.3}", start_secs),
            "-to",
            &format!("{:.3}", end_secs),
            "-c",
            "copy",
            &output_str,
        ])
        .output();

    match result {
        Ok(out) if out.status.success() => Ok(output_str),
        Ok(out) => Err(format!(
            "ffmpeg failed: {}",
            String::from_utf8_lossy(&out.stderr)
        )),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Err("ffmpeg_not_found".to_string()),
        Err(e) => Err(format!("Failed to run ffmpeg: {e}")),
    }
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

    let mut cmd = std::process::Command::new("ffmpeg");
    cmd.arg("-y");

    for layer in &layers {
        cmd.args(["-i", &layer.path]);
    }

    let mut filters: Vec<String> = Vec::new();
    let mut mix_inputs = String::new();

    for (i, layer) in layers.iter().enumerate() {
        let vol = layer.volume.clamp(0.0, 2.0);
        let pan = layer.pan.clamp(-1.0, 1.0);
        let left = if pan <= 0.0 { 1.0 } else { 1.0 - pan };
        let right = if pan >= 0.0 { 1.0 } else { 1.0 + pan };
        let delay_ms = (layer.offset_secs.max(0.0) * 1000.0).round() as u64;
        let fade_out_start = (layer.duration - layer.fade_out).max(0.0);

        let mut chain = format!("[{i}:a]aresample=44100,aformat=channel_layouts=stereo");
        if layer.fade_in > 0.0 {
            chain.push_str(&format!(",afade=t=in:st=0:d={:.3}", layer.fade_in));
        }
        if layer.fade_out > 0.0 {
            chain.push_str(&format!(
                ",afade=t=out:st={:.3}:d={:.3}",
                fade_out_start, layer.fade_out
            ));
        }
        chain.push_str(&format!(",volume={:.3}", vol));
        chain.push_str(&format!(",pan=stereo|c0={:.3}*c0|c1={:.3}*c1", left, right));
        chain.push_str(&format!(",adelay={delay_ms}|{delay_ms}[a{i}]"));

        filters.push(chain);
        mix_inputs.push_str(&format!("[a{i}]"));
    }

    filters.push(format!(
        "{}amix=inputs={}:duration=longest:normalize=0[out]",
        mix_inputs,
        layers.len()
    ));

    cmd.args(["-filter_complex", &filters.join(";")]);
    cmd.args(["-map", "[out]", "-c:a", "pcm_s16le", &output_str]);

    let result = cmd.output();

    match result {
        Ok(out) if out.status.success() => Ok(output_str),
        Ok(out) => Err(format!(
            "ffmpeg failed: {}",
            String::from_utf8_lossy(&out.stderr)
        )),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Err("ffmpeg_not_found".to_string()),
        Err(e) => Err(format!("Failed to run ffmpeg: {e}")),
    }
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

    tauri::Builder::default()
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
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_paths,
            fetch_cover_art,
            fetch_lyrics,
            create_fragment,
            export_fragments,
            export_mix,
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
