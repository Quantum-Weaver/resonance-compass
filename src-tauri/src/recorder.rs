// recorder.rs — the recording room's engine tail (v3 Phase 2, 2026-08-09).
// The record verb is the spring's (the-recorder — its session API grown at
// this consumption: start/stop at the musician's own word); this module is
// the tauri harness only: managed state, the takes shelf in app-data (KP's
// ⚛ storage ruling: "storage is in app, with sovereign exports available"),
// and honest reports to the room. Opt-in by nature — every command below
// fires from the user's own tap, never on a schedule.

use serde::Serialize;
use std::fs;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::Manager;
use the_recorder::{list_inputs, start_session, Level, RecordingSession};

pub struct RecorderState {
    session: Mutex<Option<RecordingSession>>,
    // One Level per take (created at start) so clip counts never bleed
    // between takes.
    level: Mutex<Option<Arc<Level>>>,
    started_at: Mutex<Option<Instant>>,
}

impl Default for RecorderState {
    fn default() -> Self {
        RecorderState {
            session: Mutex::new(None),
            level: Mutex::new(None),
            started_at: Mutex::new(None),
        }
    }
}

#[derive(Serialize)]
pub struct InputDeviceInfo {
    pub name: String,
    pub config: String,
    pub is_default: bool,
}

#[derive(Serialize)]
pub struct RecordingStatus {
    pub recording: bool,
    pub device: Option<String>,
    pub sample_rate: Option<u32>,
    pub channels: Option<u16>,
    pub elapsed_secs: f64,
    pub peak: f32,
    pub clipped: usize,
}

#[derive(Serialize)]
pub struct TakeInfo {
    pub file_name: String,
    pub path: String,
    pub seconds: f64,
    pub sample_rate: u32,
    pub channels: u16,
    pub created_at: u64,
}

fn takes_dir(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("takes");
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create takes dir: {e}"))?;
    Ok(dir)
}

// The fragments' safe-name discipline, carried exactly.
fn safe_name(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' { c } else { '_' })
        .collect::<String>()
        .trim()
        .to_string()
}

#[tauri::command]
pub async fn list_input_devices() -> Result<Vec<InputDeviceInfo>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        Ok(list_inputs()?
            .into_iter()
            .map(|d| InputDeviceInfo {
                name: d.name,
                config: d.default_config,
                is_default: d.is_default,
            })
            .collect())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn start_recording(
    state: tauri::State<'_, RecorderState>,
    device: Option<String>,
) -> Result<RecordingStatus, String> {
    // Refuse rather than replace: an accidental restart would destroy a
    // running take, and takes are the musician's — never silently lost.
    {
        let session_slot = state.session.lock().map_err(|e| e.to_string())?;
        if session_slot.is_some() {
            return Err("already recording — stop or discard the running take first".into());
        }
    }

    // The stream open can be slow on a phone (AAudio, and slower still on a
    // re-open) — so it runs OFF the main thread and UNDER NO LOCK. Holding
    // the session lock across a slow open froze the whole app on Android:
    // the status poll queued behind the lock on the main thread. Desktop
    // never felt it because WASAPI opens in milliseconds.
    let level = Arc::new(Level::new());
    let level_for_open = Arc::clone(&level);
    let session = tauri::async_runtime::spawn_blocking(move || {
        start_session(device.as_deref(), level_for_open)
    })
    .await
    .map_err(|e| e.to_string())??;

    let status = RecordingStatus {
        recording: true,
        device: Some(session.info.device.clone()),
        sample_rate: Some(session.info.sample_rate),
        channels: Some(session.info.channels),
        elapsed_secs: 0.0,
        peak: 0.0,
        clipped: 0,
    };

    {
        let mut session_slot = state.session.lock().map_err(|e| e.to_string())?;
        if session_slot.is_some() {
            // A second start slipped in while ours was opening — theirs
            // holds the room; ours ends plainly, nothing written.
            drop(session_slot);
            session.discard();
            return Err("already recording — stop or discard the running take first".into());
        }
        *session_slot = Some(session);
    }
    *state.level.lock().map_err(|e| e.to_string())? = Some(level);
    *state.started_at.lock().map_err(|e| e.to_string())? = Some(Instant::now());
    Ok(status)
}

#[tauri::command]
pub fn recording_status(state: tauri::State<RecorderState>) -> Result<RecordingStatus, String> {
    let session_slot = state.session.lock().map_err(|e| e.to_string())?;
    let level_slot = state.level.lock().map_err(|e| e.to_string())?;
    let started = state.started_at.lock().map_err(|e| e.to_string())?;
    match (session_slot.as_ref(), level_slot.as_ref()) {
        (Some(session), Some(level)) => Ok(RecordingStatus {
            recording: true,
            device: Some(session.info.device.clone()),
            sample_rate: Some(session.info.sample_rate),
            channels: Some(session.info.channels),
            elapsed_secs: started.map(|t| t.elapsed().as_secs_f64()).unwrap_or(0.0),
            peak: level.take_peak(),
            clipped: level.clipped(),
        }),
        _ => Ok(RecordingStatus {
            recording: false,
            device: None,
            sample_rate: None,
            channels: None,
            elapsed_secs: 0.0,
            peak: 0.0,
            clipped: 0,
        }),
    }
}

#[tauri::command]
pub async fn stop_recording(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, RecorderState>,
    keep: bool,
    name: Option<String>,
) -> Result<Option<TakeInfo>, String> {
    let session = state
        .session
        .lock()
        .map_err(|e| e.to_string())?
        .take()
        .ok_or("no take is running")?;
    let level = state.level.lock().map_err(|e| e.to_string())?.take();
    *state.started_at.lock().map_err(|e| e.to_string())? = None;

    if !keep {
        // The discard half: ended plainly, nothing written.
        tauri::async_runtime::spawn_blocking(move || session.discard())
            .await
            .map_err(|e| e.to_string())?;
        return Ok(None);
    }

    let clipped = level.map(|l| l.clipped()).unwrap_or(0);
    let dir = takes_dir(&app_handle)?;
    let base = name
        .map(|n| safe_name(&n))
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| {
            format!(
                "take-{}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0)
            )
        });
    let path = dir.join(format!("{base}.wav"));
    let path_str = path.to_string_lossy().to_string();

    let report = tauri::async_runtime::spawn_blocking(move || {
        session.stop_and_seal(&path_str, clipped)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(Some(TakeInfo {
        file_name: format!("{base}.wav"),
        path: report.path,
        seconds: report.seconds,
        sample_rate: report.sample_rate,
        channels: report.channels,
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0),
    }))
}

#[tauri::command]
pub fn list_takes(app_handle: tauri::AppHandle) -> Result<Vec<TakeInfo>, String> {
    let dir = takes_dir(&app_handle)?;
    let mut takes = Vec::new();
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("wav") {
            continue;
        }
        let Ok(reader) = hound::WavReader::open(&path) else { continue };
        let spec = reader.spec();
        let seconds = reader.len() as f64 / (spec.sample_rate as f64 * spec.channels as f64);
        let created_at = entry
            .metadata()
            .and_then(|m| m.modified())
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);
        takes.push(TakeInfo {
            file_name: entry.file_name().to_string_lossy().to_string(),
            path: path.to_string_lossy().to_string(),
            seconds,
            sample_rate: spec.sample_rate,
            channels: spec.channels,
            created_at,
        });
    }
    takes.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(takes)
}

fn take_path_guarded(app_handle: &tauri::AppHandle, file_name: &str) -> Result<std::path::PathBuf, String> {
    if file_name.contains('/') || file_name.contains('\\') || file_name.contains("..") {
        return Err("take names never carry paths".into());
    }
    Ok(takes_dir(app_handle)?.join(file_name))
}

#[tauri::command]
pub fn delete_take(app_handle: tauri::AppHandle, file_name: String) -> Result<(), String> {
    let path = take_path_guarded(&app_handle, &file_name)?;
    fs::remove_file(&path).map_err(|e| format!("Could not delete take: {e}"))
}

// The sovereign-export half of KP's ⚛ storage ruling: the take copied,
// whole, to wherever the user's own dialog chose. Never a move — the shelf
// keeps its copy until the user deletes or the purge runs.
#[tauri::command]
pub fn export_take(app_handle: tauri::AppHandle, file_name: String, dest: String) -> Result<(), String> {
    let src = take_path_guarded(&app_handle, &file_name)?;
    fs::copy(&src, &dest).map_err(|e| format!("Could not export take: {e}"))?;
    Ok(())
}
