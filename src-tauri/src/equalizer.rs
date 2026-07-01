// equalizer.rs — 10-band parametric EQ, biquad peaking filters (Audio EQ Cookbook)

use crate::audio::AudioState;
use rodio::Source;
use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::time::Duration;

// ── Constants ────────────────────────────────────────────────────────────────

const BAND_FREQS: [f32; 10] = [32.0, 64.0, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0];
const BAND_LABELS: [&str; 10] = ["32", "64", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"];
const Q: f32 = 1.4;
// Check state every 256 output samples (~5.8ms at 44100 Hz) — never on every sample.
const UPDATE_INTERVAL: u32 = 256;
// Delay line slots: support up to 8 channels (covers mono, stereo, 5.1, 7.1).
const MAX_CHANNELS: usize = 8;

// ── EqState (shared between audio thread and command handlers) ───────────────

pub struct EqState {
    pub enabled: bool,
    pub bands: [f32; 10], // dB gain per band, clamped -12..+12
    pub preamp: f32,      // dB gain applied after all bands when enabled
}

impl Default for EqState {
    fn default() -> Self {
        EqState { enabled: false, bands: [0.0; 10], preamp: 0.0 }
    }
}

// ── EqStateResponse (serialised to frontend) ──────────────────────────────────

#[derive(Serialize)]
pub struct EqStateResponse {
    pub enabled: bool,
    pub bands: Vec<f32>,
    pub preamp: f32,
    pub labels: Vec<&'static str>,
}

impl EqStateResponse {
    pub fn from_state(s: &EqState) -> Self {
        EqStateResponse {
            enabled: s.enabled,
            bands: s.bands.to_vec(),
            preamp: s.preamp,
            labels: BAND_LABELS.to_vec(),
        }
    }
}

// ── Presets ────────────────────────────────────────────────────────────────

pub fn preset_bands(name: &str) -> Option<[f32; 10]> {
    match name {
        "flat" => Some([0.0; 10]),
        "rock" => Some([4.0, 2.0, 0.0, -1.0, -2.0, 0.0, 1.0, 2.0, 3.0, 4.0]),
        "jazz" => Some([3.0, 2.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 2.0, 3.0]),
        "classical" => Some([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 2.0, 3.0, 3.0]),
        "vocal" => Some([-2.0, -1.0, 0.0, 2.0, 4.0, 4.0, 3.0, 2.0, 1.0, 0.0]),
        "bass_boost" => Some([6.0, 5.0, 4.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        _ => None,
    }
}

// ── Biquad coefficient calculation ────────────────────────────────────────────
//
// Peaking EQ filter from the Audio EQ Cookbook (R. Bristow-Johnson):
//
//   H(z) = (b0 + b1*z^-1 + b2*z^-2) / (a0 + a1*z^-1 + a2*z^-2)
//
//   w0    = 2*pi*f0/Fs
//   A     = 10^(dBgain/40)          — amplitude (not power) ratio
//   alpha = sin(w0)/(2*Q)
//
//   b0 =  1 + alpha*A     a0 =  1 + alpha/A
//   b1 = -2*cos(w0)       a1 = -2*cos(w0)
//   b2 =  1 - alpha*A     a2 =  1 - alpha/A
//
// We store normalised coefficients [b0/a0, b1/a0, b2/a0, a1/a0, a2/a0].
// At gain_db = 0 -> A = 1 -> b_k = a_k -> H(z) = 1 (identity).

fn calc_peaking_coeffs(freq: f32, sample_rate: u32, gain_db: f32) -> [f32; 5] {
    let w0 = 2.0 * std::f32::consts::PI * freq / sample_rate as f32;
    let a = 10.0_f32.powf(gain_db / 40.0);
    let alpha = w0.sin() / (2.0 * Q);
    let cos_w0 = w0.cos();

    let b0 = 1.0 + alpha * a;
    let b1 = -2.0 * cos_w0;
    let b2 = 1.0 - alpha * a;
    let a0 = 1.0 + alpha / a;
    let a1 = -2.0 * cos_w0;
    let a2 = 1.0 - alpha / a;

    [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0]
}

#[inline]
fn db_to_linear(db: f32) -> f32 {
    10.0_f32.powf(db / 20.0)
}

// ── EqFilter<S> ────────────────────────────────────────────────────────────
//
// Wraps any rodio Source<Item = f32> and applies 10 biquad filters in series.
//
// Design notes:
// - try_lock() is used every UPDATE_INTERVAL samples — never blocks audio.
// - Delay lines (x[n-1], x[n-2], y[n-1], y[n-2]) are PRESERVED across coefficient
//   updates, avoiding the click/pop that a hard reset would cause.
// - Stereo interleaving: samples cycle channel_pos 0..num_channels-1; each
//   channel has its own delay line set so L/R are processed independently.

// Per-channel biquad delay line: [x[n-1], x[n-2], y[n-1], y[n-2]]
type DelayLine = [f32; 4];

pub struct EqFilter<S: Source<Item = f32>> {
    source: S,
    eq_state: Arc<Mutex<EqState>>,
    coeffs: [[f32; 5]; 10],                   // normalised biquad coeffs per band
    delays: [[DelayLine; MAX_CHANNELS]; 10],  // delay lines [band][ch]
    update_counter: u32,
    enabled: bool,
    preamp_gain: f32, // linear gain from preamp dB (cached)
    channel_pos: u16,
    num_channels: u16,
    sample_rate: u32,
}

impl<S: Source<Item = f32>> EqFilter<S> {
    pub fn new(source: S, eq_state: Arc<Mutex<EqState>>) -> Self {
        let sample_rate = source.sample_rate();
        let num_channels = source.channels();

        let mut filter = EqFilter {
            source,
            eq_state,
            // Identity at startup; try_update_state() below fills real values.
            coeffs: [[1.0, 0.0, 0.0, 0.0, 0.0]; 10],
            delays: [[[0.0; 4]; MAX_CHANNELS]; 10],
            update_counter: UPDATE_INTERVAL, // force refresh on first sample
            enabled: false,
            preamp_gain: 1.0,
            channel_pos: 0,
            num_channels,
            sample_rate,
        };
        filter.try_update_state();
        filter
    }

    fn compute_all_coeffs(bands: &[f32; 10], sr: u32) -> [[f32; 5]; 10] {
        let mut out = [[0.0f32; 5]; 10];
        for (i, &gain_db) in bands.iter().enumerate() {
            out[i] = calc_peaking_coeffs(BAND_FREQS[i], sr, gain_db);
        }
        out
    }

    fn try_update_state(&mut self) {
        if let Ok(state) = self.eq_state.try_lock() {
            self.enabled = state.enabled;
            self.preamp_gain = db_to_linear(state.preamp);
            // Only recompute coefficients when EQ is on — no point burning CPU otherwise.
            if self.enabled {
                self.coeffs = Self::compute_all_coeffs(&state.bands, self.sample_rate);
            }
        }
        // try_lock() failure is silently ignored; coefficients update on the next cycle.
    }

    #[inline]
    fn apply_biquads(&mut self, sample: f32, ch: usize) -> f32 {
        let mut y = sample;
        for band in 0..10 {
            let d = &mut self.delays[band][ch];
            let [b0, b1, b2, a1, a2] = self.coeffs[band];
            // Direct Form I difference equation:
            // y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
            let out = b0 * y + b1 * d[0] + b2 * d[1] - a1 * d[2] - a2 * d[3];
            // Shift delay lines (order matters: shift before overwrite)
            d[1] = d[0]; // x[n-2] <- x[n-1]
            d[0] = y;    // x[n-1] <- x[n]
            d[3] = d[2]; // y[n-2] <- y[n-1]
            d[2] = out;  // y[n-1] <- y[n]
            y = out;
        }
        y * self.preamp_gain
    }
}

impl<S: Source<Item = f32>> Iterator for EqFilter<S> {
    type Item = f32;

    fn next(&mut self) -> Option<f32> {
        let sample = self.source.next()?;

        self.update_counter += 1;
        if self.update_counter >= UPDATE_INTERVAL {
            self.update_counter = 0;
            self.try_update_state();
        }

        // Track which channel this sample belongs to for independent delay lines.
        let ch = (self.channel_pos as usize) % MAX_CHANNELS;
        self.channel_pos = (self.channel_pos + 1) % self.num_channels.max(1);

        if !self.enabled {
            return Some(sample);
        }

        Some(self.apply_biquads(sample, ch).clamp(-1.0, 1.0))
    }
}

impl<S: Source<Item = f32>> Source for EqFilter<S> {
    fn current_frame_len(&self) -> Option<usize> {
        self.source.current_frame_len()
    }
    fn channels(&self) -> u16 {
        self.source.channels()
    }
    fn sample_rate(&self) -> u32 {
        self.source.sample_rate()
    }
    fn total_duration(&self) -> Option<Duration> {
        self.source.total_duration()
    }
}

// ── Tauri commands ────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_eq_state(state: tauri::State<AudioState>) -> Result<EqStateResponse, String> {
    let eq = state.eq.lock().map_err(|e| e.to_string())?;
    Ok(EqStateResponse::from_state(&eq))
}

#[tauri::command]
pub fn set_eq_band(state: tauri::State<AudioState>, band: usize, gain_db: f32) -> Result<(), String> {
    if band >= 10 {
        return Err(format!("band index {band} out of range 0-9"));
    }
    let mut eq = state.eq.lock().map_err(|e| e.to_string())?;
    eq.bands[band] = gain_db.clamp(-12.0, 12.0);
    Ok(())
}

#[tauri::command]
pub fn set_eq_preamp(state: tauri::State<AudioState>, gain_db: f32) -> Result<(), String> {
    let mut eq = state.eq.lock().map_err(|e| e.to_string())?;
    eq.preamp = gain_db.clamp(-12.0, 12.0);
    Ok(())
}

#[tauri::command]
pub fn toggle_eq(state: tauri::State<AudioState>, enabled: bool) -> Result<(), String> {
    let mut eq = state.eq.lock().map_err(|e| e.to_string())?;
    eq.enabled = enabled;
    Ok(())
}

#[tauri::command]
pub fn set_eq_preset(state: tauri::State<AudioState>, preset: String) -> Result<(), String> {
    let bands = preset_bands(&preset).ok_or_else(|| format!("unknown preset: {preset}"))?;
    let mut eq = state.eq.lock().map_err(|e| e.to_string())?;
    eq.bands = bands;
    Ok(())
}
