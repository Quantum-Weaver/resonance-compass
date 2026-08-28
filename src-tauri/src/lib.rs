use base64::prelude::*;
use lofty::file::AudioFile;
use lofty::file::TaggedFileExt;
use lofty::tag::Accessor;
use lofty::tag::ItemKey;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
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
mod media_session;
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
    /// Kept for the wire's shape and for anything still restoring an old
    /// backup — the scan itself no longer fills it. Art rides on `cover_path`
    /// now (KP ⚛ 2026-08-22); see the album-art section below.
    #[serde(rename = "coverArt")]
    pub cover_art: Option<String>,
    /// Path to the ONE cover file that serves this song's album folder.
    #[serde(rename = "coverPath")]
    pub cover_path: Option<String>,
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

/// One embedded picture lifted out of a file's tags — raw bytes, never base64.
/// It exists only long enough to become a cover file in the album's folder.
struct EmbeddedArt {
    data: Vec<u8>,
    ext: &'static str,
}

/// `want_picture` is false once the folder already has its cover: the tags are
/// still read for everything else, but the 100-500 KB picture is not copied out
/// of them eleven more times for the rest of the album.
fn parse_metadata(
    app_handle: &tauri::AppHandle,
    uri: &str,
    want_picture: bool,
) -> (TrackInfo, Option<EmbeddedArt>) {
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
    let mut embedded: Option<EmbeddedArt> = None;
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

                if want_picture {
                    if let Some(pic) = tag.pictures().first() {
                        let ext = match pic.mime_type() {
                            Some(lofty::picture::MimeType::Png) => "png",
                            Some(lofty::picture::MimeType::Gif) => "gif",
                            Some(lofty::picture::MimeType::Tiff) => "tiff",
                            Some(lofty::picture::MimeType::Bmp) => "bmp",
                            _ => "jpg",
                        };
                        embedded = Some(EmbeddedArt { data: pic.data().to_vec(), ext });
                    }
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

    (
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
            cover_art: None,
            cover_path: None,
            lyrics,
            date_added,
        },
        embedded,
    )
}

// ── Album art lives with the ALBUM ──────────────────────────────────────────
// KP's ⚛ word, 2026-08-22, verbatim: "album art should be stored in the album
// folders and songs should derive the art from the album, not each song needing
// the art separately fetched."
//
// So the scan no longer base64s a picture into every TrackInfo — 100-500 KB per
// song, twelve near-identical copies per album, all of it landing in compass.db.
// It resolves each file's FOLDER once, finds or writes ONE cover file there, and
// hands back that path. Every song in the folder derives its art from that file.

/// Cover file stems recognised in an album folder, case-insensitively, in
/// preference order.
const COVER_STEMS: &[&str] = &["cover", "folder", "front", "album", "albumart", "artwork"];

/// Image extensions recognised in an album folder, case-insensitively.
const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif"];

fn split_name(name: &str) -> Option<(String, String)> {
    let (stem, ext) = name.rsplit_once('.')?;
    Some((stem.to_lowercase(), ext.to_lowercase()))
}

/// Chooses a folder's cover from a plain directory listing — pure, so the rule
/// itself is testable without touching a disk. A named cover wins in
/// COVER_STEMS order; failing that, a folder holding EXACTLY ONE image is read
/// as an album folder with its art in it. Two unnamed images are ambiguous, and
/// an ambiguous folder is left alone rather than guessed at.
fn pick_cover_name(names: &[String]) -> Option<String> {
    let images: Vec<(&String, String)> = names
        .iter()
        .filter_map(|n| {
            let (stem, ext) = split_name(n)?;
            IMAGE_EXTENSIONS.contains(&ext.as_str()).then_some((n, stem))
        })
        .collect();

    for want in COVER_STEMS {
        if let Some((name, _)) = images.iter().find(|(_, stem)| stem.as_str() == *want) {
            return Some(name.to_string());
        }
    }
    if images.len() == 1 {
        return Some(images[0].0.clone());
    }
    None
}

fn find_folder_cover(dir: &Path) -> Option<String> {
    let names: Vec<String> = fs::read_dir(dir)
        .ok()?
        .flatten()
        .filter(|e| e.path().is_file())
        .filter_map(|e| e.file_name().to_str().map(str::to_string))
        .collect();
    let picked = pick_cover_name(&names)?;
    Some(dir.join(picked).to_string_lossy().to_string())
}

/// The directory a track lives in. Anything wearing a scheme (content:// from
/// the retired Android file-picker build) answers to a ContentResolver, not to
/// a filesystem — it has no folder we may write into, so it gets none.
fn folder_of(uri: &str) -> Option<String> {
    if uri.contains("://") {
        return None;
    }
    Path::new(uri)
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .filter(|s| !s.is_empty())
}

fn ext_for_mime(mime: &str) -> &'static str {
    match mime {
        "image/png" => "png",
        "image/webp" => "webp",
        "image/gif" => "gif",
        "image/bmp" => "bmp",
        "image/tiff" => "tiff",
        _ => "jpg",
    }
}

fn mime_for_ext(ext: &str) -> &'static str {
    match ext {
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "tif" | "tiff" => "image/tiff",
        _ => "image/jpeg",
    }
}

/// FNV-1a, 64-bit. A stable name for a folder whose own directory refused the
/// write. Stdlib-only on purpose: no new crate earns its keep for a filename.
fn folder_hash(folder: &str) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in folder.as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    hash
}

fn app_data_cover_name(folder: &str, ext: &str) -> String {
    format!("{:016x}.{}", folder_hash(folder), ext)
}

/// First choice, always: the album's own folder — the art belongs with the
/// music. Android 11+ scoped storage refuses that write (so does any read-only
/// mount), and there the art still lands ONCE per album, just in the app's own
/// data dir under a stable name derived from the folder path.
fn write_cover_bytes(
    app_handle: &tauri::AppHandle,
    folder: &str,
    data: &[u8],
    ext: &str,
) -> Result<String, String> {
    let in_folder = Path::new(folder).join(format!("cover.{ext}"));
    if fs::write(&in_folder, data).is_ok() {
        return Ok(in_folder.to_string_lossy().to_string());
    }

    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("covers");
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create covers dir: {e}"))?;
    let fallback = dir.join(app_data_cover_name(folder, ext));
    fs::write(&fallback, data).map_err(|e| format!("Cannot write cover: {e}"))?;
    Ok(fallback.to_string_lossy().to_string())
}

/// "data:image/png;base64,AAAA" → ("png", bytes). Anything else is refused
/// rather than guessed at.
fn decode_data_uri(data_uri: &str) -> Result<(&'static str, Vec<u8>), String> {
    let rest = data_uri
        .strip_prefix("data:")
        .ok_or_else(|| "Not a data: URI".to_string())?;
    let (meta, payload) = rest
        .split_once(',')
        .ok_or_else(|| "Malformed data: URI (no comma)".to_string())?;
    let meta_lower = meta.to_ascii_lowercase();
    if !meta_lower.contains(";base64") {
        return Err("Only base64 data: URIs are supported".to_string());
    }
    let mime = meta_lower.split(';').next().unwrap_or("").trim().to_string();
    let bytes = BASE64_STANDARD
        .decode(payload.trim())
        .map_err(|e| format!("Bad base64 in data URI: {e}"))?;
    Ok((ext_for_mime(&mime), bytes))
}

/// One read per album folder, not one per song: the frontend caches the answer
/// against the folder and hands the same string to every track in it.
#[tauri::command]
fn read_cover(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| format!("Cannot read cover {path}: {e}"))?;
    let ext = Path::new(&path)
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();
    Ok(format!(
        "data:{};base64,{}",
        mime_for_ext(&ext),
        BASE64_STANDARD.encode(bytes)
    ))
}

/// Lands art the vessel chose (a Cover Art Archive fetch, or the one-time sweep
/// of art already sitting in compass.db) into the album's folder as a file.
#[tauri::command]
fn save_album_cover(
    app_handle: tauri::AppHandle,
    folder: String,
    data_uri: String,
) -> Result<String, String> {
    if folder.is_empty() {
        return Err("No album folder to save into".to_string());
    }
    let (ext, bytes) = decode_data_uri(&data_uri)?;
    write_cover_bytes(&app_handle, &folder, &bytes, ext)
}

/// The one-time sweep's door, and it is deliberately gentler than
/// `save_album_cover`: a folder that ALREADY holds a cover file keeps it. Art
/// the vessel put there with their own hands is never overwritten by a picture
/// lifted out of a song's tags — only a folder with no cover of its own gets
/// the embedded one written in.
#[tauri::command]
fn adopt_album_cover(
    app_handle: tauri::AppHandle,
    folder: String,
    data_uri: String,
) -> Result<String, String> {
    if folder.is_empty() {
        return Err("No album folder to adopt art into".to_string());
    }
    if let Some(existing) = find_folder_cover(Path::new(&folder)) {
        return Ok(existing);
    }
    let (ext, bytes) = decode_data_uri(&data_uri)?;
    write_cover_bytes(&app_handle, &folder, &bytes, ext)
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

    // folder → its cover file, resolved ONCE per folder. A key present with a
    // None value means "this directory has been listed and holds no cover file
    // yet" — later tracks in it may still carry an embedded picture worth
    // writing, so those keep offering theirs until one lands.
    let mut folder_covers: HashMap<String, Option<String>> = HashMap::new();

    for (i, uri) in files.iter().enumerate() {
        let folder = folder_of(uri);

        if let Some(dir) = &folder {
            if !folder_covers.contains_key(dir) {
                folder_covers.insert(dir.clone(), find_folder_cover(Path::new(dir)));
            }
        }

        let want_picture = match &folder {
            Some(dir) => folder_covers.get(dir).map(Option::is_none).unwrap_or(false),
            None => false,
        };

        let (mut info, embedded) = parse_metadata(&app_handle, uri, want_picture);

        if let (Some(dir), Some(art)) = (&folder, embedded) {
            match write_cover_bytes(&app_handle, dir, &art.data, art.ext) {
                Ok(path) => {
                    folder_covers.insert(dir.clone(), Some(path));
                }
                Err(e) => eprintln!("[scan_paths] cover write failed for {dir}: {e}"),
            }
        }

        info.cover_path = folder
            .as_ref()
            .and_then(|dir| folder_covers.get(dir))
            .cloned()
            .flatten();

        tracks.push(info);
        let _ = app_handle.emit("scan-progress", ScanProgress { current: i + 1, total });
    }
    Ok(tracks)
}

// ── Library maintenance: the missing-track sweep ────────────────────────────
// v2 scans are additive upserts — multi-folder scanning requires it — so a file
// deleted from disk keeps its row forever. Named in the 2026-07-02 v1→v2 gap
// report as "the only data-correctness gap" and standing open since; built
// 2026-08-12 at KP's ⚛ word.
//
// THIS COMMAND ONLY REPORTS. Nothing is deleted here. Removal is a separate act
// the user confirms, per the house law: verify before any deletion, always, and
// KP deletes by signature.
//
// A URI we cannot verify is reported as PRESENT, never as missing. Anything
// wearing a scheme (content:// on Android) answers to a ContentResolver rather
// than to the filesystem, and lose-nothing means an unverifiable row is kept
// rather than swept on a guess.
#[tauri::command]
fn find_missing_tracks(uris: Vec<String>) -> Result<Vec<String>, String> {
    Ok(uris
        .into_iter()
        .filter(|uri| {
            if uri.contains("://") {
                return false; // unverifiable — kept
            }
            !Path::new(uri).exists()
        })
        .collect())
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
// The body is the spring's (the-art-finder, consumed 2026-08-08) — the tauri
// command tail stays app-side, wearing the app's own compliant User-Agent
// (version self-healing from Cargo). The water's walk-the-five-editions
// growth rides in: editions the Cover Art Archive lacks art for no longer
// end the search (the origin only ever tried the first of the five).

fn compass_user_agent() -> String {
    format!("ResonanceCompass/{} ( https://audhdities.com )", env!("CARGO_PKG_VERSION"))
}

#[tauri::command]
async fn fetch_cover_art(artist: String, album: String) -> Result<Option<String>, String> {
    the_art_finder::fetch_cover_art_as(&compass_user_agent(), artist, album).await
}

// ── fetch_lyrics (LRCLIB, opt-in, user-initiated only) ──────────────────────
// The body is the spring's (the-lyric-finder, consumed 2026-08-08); the wire
// shape to the frontend (syncedLyrics/plainLyrics) is the crate's own,
// carried from this very organ at the re-homing.

#[tauri::command]
async fn fetch_lyrics(
    artist: String,
    title: String,
) -> Result<Option<the_lyric_finder::LyricsResult>, String> {
    the_lyric_finder::fetch_lyrics_as(&compass_user_agent(), artist, title).await
}

// ── Mic spike (v3 Phase 2 gate) ───────────────────────────────────────────────

#[tauri::command]
async fn request_mic_permission(app_handle: tauri::AppHandle) -> Result<bool, String> {
    #[cfg(target_os = "android")]
    {
        // run_mobile_plugin blocks until the vessel answers the system dialog —
        // keep that wait off the async runtime's core threads.
        return tauri::async_runtime::spawn_blocking(move || {
            media_permission::mic_request(&app_handle)
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

// (The mic spike — Phase 2's device gate — retired 2026-08-09, exactly as it
// planned for itself: "the temporary spike surface leaves when the real
// recorder arrives." The spike's answer stands in the record: cpal opens a real
// mic inside the Tauri process, on-device, proven on the S25.
//
// THE RECORDER LEFT THIS HOUSE 2026-08-12, at KP's ⚛ ruling that the Compass is
// a media player for material the user holds the rights to, and that making NEW
// sound is a different instrument: resonance-sistrum. Recording, takes, and the
// four-track go there; fragments and the Fragment Studio STAY, because slicing
// what you already own is a DJ's work and this is still their room. The boundary
// is rights, not taste: does this create new sound, or work with sound you
// already hold?
//
// `request_mic_permission` above is deliberately left standing — it is Android
// permission infrastructure, not the recorder, and the plugin it speaks to has
// other uses.)

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
    for sub in ["fragments", "mixes", "takes"] {
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
        // The art moves out of the songs table and into the album folders
        // (KP ⚛ 2026-08-22). One row per folder, pointing at the ONE cover file
        // that serves every song in it. songs.cover_art is deliberately LEFT
        // STANDING and left populated until the one-time sweep clears it —
        // lose-nothing: nothing is dropped before its replacement is on disk.
        Migration {
            version: 6,
            description: "create_album_art_table",
            sql: "CREATE TABLE IF NOT EXISTS album_art (
                folder TEXT PRIMARY KEY,
                path TEXT NOT NULL,
                updated_at INTEGER
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
    let builder = builder
        .plugin(media_permission::init())
        .plugin(media_session::init());

    builder
        .invoke_handler(tauri::generate_handler![
            scan_paths,
            check_audio_permission,
            request_audio_permission,
            request_mic_permission,
            find_missing_tracks,
            fetch_cover_art,
            read_cover,
            save_album_cover,
            adopt_album_cover,
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
            audio::rebuild_audio_output,
            equalizer::get_eq_state,
            equalizer::set_eq_band,
            equalizer::set_eq_preamp,
            equalizer::toggle_eq,
            equalizer::set_eq_preset,
            media_session::media_update_metadata,
            media_session::media_update_playback,
            media_session::media_release,
            media_session::request_notification_permission,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Resonance Compass");
}

// ── Tests: the album-art rules ───────────────────────────────────────────────
// The cover logic is the only part of this file that can be proven without a
// running vessel, so it is proven here. Everything below is pure or touches
// nothing but a scratch directory of its own making.

#[cfg(test)]
mod tests {
    use super::*;

    fn names(list: &[&str]) -> Vec<String> {
        list.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn named_cover_is_found() {
        for stem in COVER_STEMS {
            let file = format!("{stem}.jpg");
            let listing = names(&["01 - track.mp3", &file, "notes.txt"]);
            assert_eq!(pick_cover_name(&listing).as_deref(), Some(file.as_str()));
        }
    }

    #[test]
    fn cover_name_match_is_case_insensitive() {
        let listing = names(&["Folder.JPG", "01.flac"]);
        assert_eq!(pick_cover_name(&listing).as_deref(), Some("Folder.JPG"));

        let listing = names(&["AlbumArt.PnG"]);
        assert_eq!(pick_cover_name(&listing).as_deref(), Some("AlbumArt.PnG"));
    }

    #[test]
    fn named_cover_beats_a_stray_image_and_follows_preference_order() {
        // A named cover wins even where another image is present...
        let listing = names(&["scan_back.png", "cover.jpg"]);
        assert_eq!(pick_cover_name(&listing).as_deref(), Some("cover.jpg"));
        // ...and among named covers, COVER_STEMS order decides.
        let listing = names(&["artwork.png", "front.jpg", "cover.webp"]);
        assert_eq!(pick_cover_name(&listing).as_deref(), Some("cover.webp"));
    }

    #[test]
    fn exactly_one_image_is_taken_as_the_cover() {
        let listing = names(&["01.mp3", "02.mp3", "sleeve.jpeg", "info.nfo"]);
        assert_eq!(pick_cover_name(&listing).as_deref(), Some("sleeve.jpeg"));
    }

    #[test]
    fn two_unnamed_images_are_ambiguous_and_neither_is_guessed() {
        let listing = names(&["scan_front.jpg", "scan_back.jpg"]);
        assert_eq!(pick_cover_name(&listing), None);
    }

    #[test]
    fn a_folder_with_no_image_has_no_cover() {
        let listing = names(&["01.mp3", "cover.txt", "cover", "album.mp3"]);
        assert_eq!(pick_cover_name(&listing), None);
    }

    #[test]
    fn find_folder_cover_returns_a_full_path() {
        let dir = std::env::temp_dir().join(format!("compass-cover-{:016x}", folder_hash("test")));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("01 - track.mp3"), b"not audio").unwrap();
        fs::write(dir.join("Cover.png"), b"not an image").unwrap();

        let found = find_folder_cover(&dir).expect("cover should be found");
        assert_eq!(found, dir.join("Cover.png").to_string_lossy().to_string());

        // Adding a second image does not unseat the NAMED cover.
        fs::write(dir.join("back.jpg"), b"not an image").unwrap();
        assert_eq!(
            find_folder_cover(&dir).as_deref(),
            Some(dir.join("Cover.png").to_string_lossy().to_string().as_str())
        );

        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn find_folder_cover_on_a_missing_directory_is_none() {
        let dir = std::env::temp_dir().join("compass-cover-no-such-directory-ever");
        let _ = fs::remove_dir_all(&dir);
        assert_eq!(find_folder_cover(&dir), None);
    }

    #[test]
    fn mime_and_extension_map_both_ways() {
        for (mime, ext) in [
            ("image/jpeg", "jpg"),
            ("image/png", "png"),
            ("image/webp", "webp"),
            ("image/gif", "gif"),
            ("image/bmp", "bmp"),
            ("image/tiff", "tiff"),
        ] {
            assert_eq!(ext_for_mime(mime), ext, "mime → ext for {mime}");
            assert_eq!(mime_for_ext(ext), mime, "ext → mime for {ext}");
        }
        // Unknown falls back to JPEG at both ends rather than erroring.
        assert_eq!(ext_for_mime("image/heic"), "jpg");
        assert_eq!(mime_for_ext("jpeg"), "image/jpeg");
        assert_eq!(mime_for_ext(""), "image/jpeg");
    }

    #[test]
    fn data_uri_decodes_to_extension_and_bytes() {
        // "hi" in base64 is "aGk=".
        let (ext, bytes) = decode_data_uri("data:image/png;base64,aGk=").unwrap();
        assert_eq!(ext, "png");
        assert_eq!(bytes, b"hi");

        let (ext, _) = decode_data_uri("data:IMAGE/WEBP;base64,aGk=").unwrap();
        assert_eq!(ext, "webp");
    }

    #[test]
    fn a_malformed_data_uri_is_refused_not_guessed() {
        assert!(decode_data_uri("https://example.invalid/art.jpg").is_err());
        assert!(decode_data_uri("data:image/png,not-base64-marked").is_err());
        assert!(decode_data_uri("data:image/png;base64").is_err());
        assert!(decode_data_uri("data:image/png;base64,!!!!").is_err());
    }

    #[test]
    fn app_data_cover_name_is_stable_and_distinct() {
        let a = app_data_cover_name("/storage/emulated/0/Music/Kid A", "jpg");
        let b = app_data_cover_name("/storage/emulated/0/Music/Kid A", "jpg");
        let c = app_data_cover_name("/storage/emulated/0/Music/Amnesiac", "jpg");

        assert_eq!(a, b, "the same folder always names the same file");
        assert_ne!(a, c, "different folders name different files");

        let (stem, ext) = a.rsplit_once('.').unwrap();
        assert_eq!(ext, "jpg");
        assert_eq!(stem.len(), 16, "16 hex characters: {a}");
        assert!(stem.chars().all(|ch| ch.is_ascii_hexdigit()));
        // No path separators — this is a filename, never a path.
        assert!(!a.contains('/') && !a.contains('\\'));
    }

    #[test]
    fn folder_of_takes_the_directory_and_refuses_a_scheme() {
        assert_eq!(
            folder_of("/storage/emulated/0/Music/Kid A/01.mp3").as_deref(),
            Some("/storage/emulated/0/Music/Kid A")
        );
        // content:// answers to a ContentResolver, not to a filesystem.
        assert_eq!(folder_of("content://com.android.providers/document/1"), None);
        assert_eq!(folder_of("bare-file.mp3"), None);
    }
}
