// audio.rs — Resonance Compass audio engine
//
// OutputStream is !Send (WASAPI), so it must be created and kept alive on its own
// dedicated thread. The Sink itself is Send + Sync, so once built it lives in
// Arc<Mutex<CurrentPlayback>> and Tauri commands operate on it directly — no
// command channel needed.
//
// Events emitted to the frontend:
//   audio://position   — f64 secs, every ~500ms while a track is active
//   audio://duration   — f64 secs, once when a track loads (if known)
//   audio://track-end  — unit, when the sink drains naturally (not on explicit stop)

use std::fs::File;
use std::io::BufReader;
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

use crossbeam::channel::Sender as VisSender;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use tauri::{AppHandle, Emitter};
use tauri_plugin_fs::{FilePath, FsExt, OpenOptions};

use crate::equalizer::{EqFilter, EqState};
use crate::visualizer::{SampleTap, VisSample};

#[derive(Default)]
struct CurrentPlayback {
    sink: Option<Sink>,
    has_track: bool,
    end_sent: bool,
    stop_flag: bool,
}

pub struct AudioState {
    playback: Arc<Mutex<CurrentPlayback>>,
    // None when no output device could be opened. Android may refuse the device
    // at app launch, so init failure must not panic — play_track retries instead.
    stream_handle: Mutex<Option<OutputStreamHandle>>,
    vis_tx: VisSender<VisSample>,
    pub eq: Arc<Mutex<EqState>>,
}

impl AudioState {
    pub fn init(app: AppHandle, vis_tx: VisSender<VisSample>, eq: Arc<Mutex<EqState>>) -> Self {
        let playback = Arc::new(Mutex::new(CurrentPlayback::default()));

        let stream_handle = start_output(&playback, app);
        if stream_handle.is_none() {
            eprintln!("[audio] output unavailable at startup — will retry on first play");
        }

        AudioState { playback, stream_handle: Mutex::new(stream_handle), vis_tx, eq }
    }

    pub fn play_track(&self, path: &str, app: &AppHandle) -> Result<(), String> {
        let stream_handle = {
            let mut guard = self.stream_handle.lock().map_err(|_| "audio state lock poisoned")?;
            if guard.is_none() {
                *guard = start_output(&self.playback, app.clone());
            }
            guard.clone().ok_or("audio output unavailable")?
        };

        let file = open_audio_file(app, path).map_err(|e| format!("open '{path}': {e}"))?;
        let decoder = Decoder::new(BufReader::new(file)).map_err(|e| format!("decode '{path}': {e}"))?;

        // Prefer lofty's duration (accurate for VBR); fall back to the decoder's own estimate.
        // Opened separately from the decoder's handle since lofty needs its own seek position.
        let lofty_dur = open_audio_file(app, path)
            .ok()
            .and_then(|f| read_duration_lofty(f).ok())
            .filter(|&d| d > 0.0);
        let decoder_dur = decoder.total_duration().map(|d| d.as_secs_f64()).filter(|&d| d > 0.0);
        let dur_secs = lofty_dur.or(decoder_dur);

        let sink = Sink::try_new(&stream_handle).map_err(|e| format!("sink: {e}"))?;
        let converted = decoder.convert_samples::<f32>();
        // EQ runs before the visualizer tap so the FFT sees what's actually audible.
        let eq_applied = EqFilter::new(converted, Arc::clone(&self.eq));
        let tapped = SampleTap::new(eq_applied, self.vis_tx.clone());
        sink.append(tapped);
        sink.play();

        {
            let mut guard = self.playback.lock().map_err(|_| "playback lock poisoned")?;
            guard.sink = Some(sink);
            guard.has_track = true;
            guard.end_sent = false;
            guard.stop_flag = false;
        }

        if let Some(secs) = dur_secs {
            let _ = app.emit("audio://duration", secs);
        }
        Ok(())
    }

    pub fn pause(&self) {
        if let Ok(guard) = self.playback.lock() {
            if let Some(sink) = &guard.sink {
                sink.pause();
            }
        }
    }

    pub fn resume(&self) {
        if let Ok(guard) = self.playback.lock() {
            if let Some(sink) = &guard.sink {
                sink.play();
            }
        }
    }

    pub fn seek(&self, position_secs: f64) {
        if let Ok(guard) = self.playback.lock() {
            if let Some(sink) = &guard.sink {
                let _ = sink.try_seek(Duration::from_secs_f64(position_secs.max(0.0)));
            }
        }
    }

    pub fn set_volume(&self, vol: f32) {
        if let Ok(guard) = self.playback.lock() {
            if let Some(sink) = &guard.sink {
                sink.set_volume(vol.clamp(0.0, 1.0));
            }
        }
    }

    pub fn stop(&self) {
        if let Ok(mut guard) = self.playback.lock() {
            if let Some(sink) = &guard.sink {
                sink.stop();
            }
            guard.sink = None;
            guard.has_track = false;
            guard.end_sent = true;
            guard.stop_flag = true;
        }
    }
}

/// Spawns the audio thread and waits for its OutputStreamHandle. Returns None
/// when no output device could be opened; safe to call again later to retry.
fn start_output(playback: &Arc<Mutex<CurrentPlayback>>, app: AppHandle) -> Option<OutputStreamHandle> {
    let (ready_tx, ready_rx) = mpsc::sync_channel::<OutputStreamHandle>(1);
    let playback_thread = Arc::clone(playback);
    thread::spawn(move || audio_thread(playback_thread, app, ready_tx));
    ready_rx.recv().ok()
}

/// Owns the audio output device for its entire lifetime and emits position /
/// track-end events every ~500ms. Runs until the process exits.
fn audio_thread(
    playback: Arc<Mutex<CurrentPlayback>>,
    app: AppHandle,
    ready_tx: mpsc::SyncSender<OutputStreamHandle>,
) {
    let (stream, stream_handle) = match OutputStream::try_default() {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[audio] output device unavailable: {e}");
            return;
        }
    };

    if ready_tx.send(stream_handle).is_err() {
        return;
    }
    let _stream = stream; // kept alive for the life of this thread — dropping it ends playback

    let mut next_pos = Instant::now();
    loop {
        thread::sleep(Duration::from_millis(50));
        if next_pos.elapsed() < Duration::from_millis(500) {
            continue;
        }
        next_pos = Instant::now();

        let (pos, ended) = {
            let guard = match playback.lock() {
                Ok(g) => g,
                Err(_) => continue,
            };
            if guard.stop_flag || !guard.has_track {
                continue;
            }
            match &guard.sink {
                Some(sink) => (sink.get_pos().as_secs_f64(), !guard.end_sent && sink.empty()),
                None => continue,
            }
        };

        let _ = app.emit("audio://position", pos);

        if ended {
            if let Ok(mut guard) = playback.lock() {
                guard.end_sent = true;
                guard.has_track = false;
            }
            let _ = app.emit("audio://track-end", ());
        }
    }
}

// Bridged through tauri-plugin-fs so this resolves both plain desktop paths
// and Android content:// URIs (via ContentResolver) to the same std::fs::File
// — required since raw std::fs can't open a content:// URI.
fn open_audio_file(app: &AppHandle, path: &str) -> std::io::Result<File> {
    let file_path: FilePath = path.parse().unwrap();
    let mut opts = OpenOptions::new();
    opts.read(true);
    app.fs().open(file_path, opts)
}

fn read_duration_lofty(mut file: File) -> Result<f64, Box<dyn std::error::Error + Send + Sync>> {
    use lofty::file::AudioFile;
    let tagged = lofty::read_from(&mut file)?;
    Ok(tagged.properties().duration().as_secs_f64())
}

// ── Tauri commands ──────────────────────────────────────────────────────────

#[tauri::command]
pub fn play_track(path: String, state: tauri::State<AudioState>, app: AppHandle) -> Result<(), String> {
    state.play_track(&path, &app)
}

#[tauri::command]
pub fn pause(state: tauri::State<AudioState>) {
    state.pause();
}

#[tauri::command]
pub fn resume(state: tauri::State<AudioState>) {
    state.resume();
}

#[tauri::command]
pub fn seek(position_secs: f64, state: tauri::State<AudioState>) {
    state.seek(position_secs);
}

#[tauri::command]
pub fn set_volume(vol: f32, state: tauri::State<AudioState>) {
    state.set_volume(vol);
}

#[tauri::command]
pub fn stop(state: tauri::State<AudioState>) {
    state.stop();
}
