// ── THE MIC SPIKE ────────────────────────────────────────────────────────────
// v3 Phase 2's opening question, answered before any recording UI exists:
// can cpal open a REAL microphone inside the Tauri process? (Android: the
// oboe/AAudio backend, riding the ndk-context the MediaPermissionPlugin
// already initializes for playback.) Captures ~2s, reports honest stats —
// peak/rms so a spoken word visibly registers. A spike answers a question;
// it does not build the room.

use serde::Serialize;

#[derive(Serialize)]
pub struct MicSpikeResult {
    pub host: String,
    pub device: String,
    pub sample_rate: u32,
    pub channels: u16,
    pub frames_captured: usize,
    pub peak: f32,
    pub rms: f32,
}

pub fn run_mic_spike(seconds: f32) -> Result<MicSpikeResult, String> {
    use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or("no default input device (no microphone visible to cpal)")?;
    let name = device.name().unwrap_or_else(|_| "unknown".into());
    let config = device
        .default_input_config()
        .map_err(|e| format!("input config: {e}"))?;
    let sample_rate = config.sample_rate().0;
    let channels = config.channels();

    let (tx, rx) = std::sync::mpsc::channel::<Vec<f32>>();
    let err_fn = |e| eprintln!("mic spike stream error: {e}");

    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => device.build_input_stream(
            &config.into(),
            move |data: &[f32], _: &_| {
                let _ = tx.send(data.to_vec());
            },
            err_fn,
            None,
        ),
        cpal::SampleFormat::I16 => device.build_input_stream(
            &config.into(),
            move |data: &[i16], _: &_| {
                let _ = tx.send(data.iter().map(|s| *s as f32 / i16::MAX as f32).collect());
            },
            err_fn,
            None,
        ),
        cpal::SampleFormat::U16 => device.build_input_stream(
            &config.into(),
            move |data: &[u16], _: &_| {
                let _ = tx.send(
                    data.iter()
                        .map(|s| (*s as f32 / u16::MAX as f32) * 2.0 - 1.0)
                        .collect(),
                );
            },
            err_fn,
            None,
        ),
        f => return Err(format!("unsupported input sample format {f:?}")),
    }
    .map_err(|e| format!("build input stream: {e}"))?;

    stream.play().map_err(|e| format!("stream play: {e}"))?;

    let deadline =
        std::time::Instant::now() + std::time::Duration::from_secs_f32(seconds.clamp(0.5, 10.0));
    let mut samples: Vec<f32> = Vec::new();
    while std::time::Instant::now() < deadline {
        if let Ok(chunk) = rx.recv_timeout(std::time::Duration::from_millis(200)) {
            samples.extend(chunk);
        }
    }
    drop(stream);

    if samples.is_empty() {
        return Err("stream opened but delivered no samples".into());
    }
    let peak = samples.iter().fold(0f32, |a, s| a.max(s.abs()));
    let rms = (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt();

    Ok(MicSpikeResult {
        host: format!("{:?}", host.id()),
        device: name,
        sample_rate,
        channels,
        frames_captured: samples.len() / channels.max(1) as usize,
        peak,
        rms,
    })
}
