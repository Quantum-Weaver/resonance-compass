use base64::prelude::*;
use lofty::file::AudioFile;
use lofty::file::TaggedFileExt;
use lofty::tag::Accessor;
use lofty::tag::ItemKey;
use serde::Serialize;
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};
use tauri_plugin_sql::{Migration, MigrationKind};

mod audio;
mod equalizer;
mod visualizer;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Welcome to Resonance Compass, {}!", name)
}

// ── TrackInfo (returned by scan_directory; field names mirror the Track TS interface) ──

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

fn parse_metadata(path: &Path) -> TrackInfo {
    let filename = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let uri = path.to_string_lossy().to_string();
    let id = uri.clone();

    let mut title = path
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

    if let Ok(tagged_file) = lofty::read_from_path(path) {
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

    // Fallback: "Artist - Title" filename heuristic
    if artist == "Unknown Artist" && title.contains(" - ") {
        if let Some((a, t)) = title.split_once(" - ") {
            artist = a.trim().to_string();
            title = t.trim().to_string();
        }
    }

    let date_added = fs::metadata(path)
        .and_then(|m| m.modified())
        .map(|t| {
            t.duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs()
        })
        .unwrap_or(0);

    TrackInfo {
        id,
        uri,
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

fn collect_audio_paths(dir: &Path, out: &mut Vec<std::path::PathBuf>) {
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
                out.push(p);
            }
        }
    }
}

#[tauri::command]
fn scan_directory(app_handle: tauri::AppHandle, dir_path: String) -> Result<Vec<TrackInfo>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err(format!("Directory not found: {dir_path}"));
    }

    if let Err(e) = fs::read_dir(path) {
        return Err(if e.kind() == std::io::ErrorKind::PermissionDenied {
            "PERMISSION_DENIED: Storage access is required to scan music files.".to_string()
        } else {
            format!("Cannot read directory: {e}")
        });
    }

    let mut paths = Vec::new();
    collect_audio_paths(path, &mut paths);
    let total = paths.len();

    let mut tracks = Vec::with_capacity(total);
    for (i, file_path) in paths.iter().enumerate() {
        tracks.push(parse_metadata(file_path));
        let _ = app_handle.emit("scan-progress", ScanProgress { current: i + 1, total });
    }

    Ok(tracks)
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
            greet,
            scan_directory,
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
