// equalizer.rs — the DSP body is the spring's (the-equalizer, consumed
// 2026-08-08, the standalone-waters season): the Audio EQ Cookbook peaking
// filters, the click-free delay-line preservation, the never-block-audio
// try_lock law — re-homed 2026-07-30 and carried back as a path crate WITH
// its own test suite. The tauri command tail below stays app-side, exactly
// as the re-homing designed. Re-exports keep every `crate::equalizer::*`
// consumer (audio.rs, lib.rs) unchanged.

use crate::audio::AudioState;
pub use the_equalizer::{preset_bands, EqFilter, EqState, EqStateResponse};

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
