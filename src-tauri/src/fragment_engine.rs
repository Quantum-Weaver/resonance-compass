// ── THE NATIVE AUDIO ENGINE ──────────────────────────────────────────────────
// v3 Phase 1, the keel (commissioned 2026-07-18; built 2026-07-19).
//
// Replaces the ffmpeg shell-outs behind create_fragment / export_mix with
// the decode machinery this app already trusts: rodio (symphonia inside)
// for decoding — the same path every played track takes — and hound for
// WAV encoding. No external binaries: Fragments now works everywhere the
// player works, phones included.
//
// Contract carried over from the ffmpeg chains, deliberately:
//   - everything is resampled to 44.1 kHz stereo (aresample + aformat)
//   - fades are linear, fade-out anchored to the END of the audio
//   - volume clamps 0..2, pan is the same stereo law
//     (left = 1 or 1-pan, right = 1 or 1+pan)
//   - layers are summed without normalization (amix normalize=0);
//     the WAV writer clamps, exactly as pcm_s16le did
// One honest improvement over the old chain: fade-out anchors to the
// layer's TRUE decoded length, not the metadata duration the UI carried.

use rodio::{Decoder, Source};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::time::Duration;

pub const SAMPLE_RATE: u32 = 44_100;
pub const CHANNELS: u16 = 2;

pub struct LayerSpec {
    pub path: String,
    pub offset_secs: f64,
    pub volume: f64,
    pub pan: f64,
    pub fade_in: f64,
    pub fade_out: f64,
}

fn open_decoder(path: &str) -> Result<Decoder<BufReader<File>>, String> {
    let file = File::open(path).map_err(|e| format!("open '{path}': {e}"))?;
    Decoder::new(BufReader::new(file)).map_err(|e| format!("decode '{path}': {e}"))
}

/// Decode `path` into interleaved stereo f32 at 44.1 kHz.
/// `start_secs`..`end_secs` selects a window; `end_secs <= start_secs`
/// means "to the end of the file".
///
/// Channel fold and resample are done by hand after collection —
/// rodio's UniformSourceIterator panics on exhausted inner sources, and
/// the linear resample here is the same job ffmpeg's aresample did.
pub fn decode_window(path: &str, start_secs: f64, end_secs: f64) -> Result<Vec<f32>, String> {
    let mut decoder = open_decoder(path)?;
    let in_rate = decoder.sample_rate().max(1);
    let in_channels = decoder.channels().max(1) as usize;
    let start = Duration::from_secs_f64(start_secs.max(0.0));

    // Fast in-format seek where symphonia supports it; decode-and-discard
    // where it doesn't (same accuracy, more CPU — never wrong output).
    let seeked = start > Duration::ZERO && decoder.try_seek(start).is_ok();
    let base: Box<dyn Source<Item = f32> + Send> = if seeked || start == Duration::ZERO {
        Box::new(decoder.convert_samples::<f32>())
    } else {
        Box::new(decoder.convert_samples::<f32>().skip_duration(start))
    };

    let windowed: Box<dyn Source<Item = f32> + Send> = if end_secs > start_secs {
        Box::new(base.take_duration(Duration::from_secs_f64(end_secs - start_secs)))
    } else {
        base
    };

    // Collect at native rate/channels (assumed stable across the window).
    let raw: Vec<f32> = windowed.collect();
    let frames_in = raw.len() / in_channels;
    if frames_in == 0 {
        return Err(format!("no audio decoded from '{path}' in the requested window"));
    }

    // Fold to stereo: mono duplicates; >2 channels take the first pair.
    let mut stereo = Vec::with_capacity(frames_in * 2);
    for f in 0..frames_in {
        let base_i = f * in_channels;
        let l = raw[base_i];
        let r = if in_channels >= 2 { raw[base_i + 1] } else { l };
        stereo.push(l);
        stereo.push(r);
    }

    Ok(resample_stereo(&stereo, in_rate, SAMPLE_RATE))
}

/// Linear-interpolation resample of interleaved stereo (ffmpeg-aresample's
/// role at parity; a windowed-sinc upgrade is a later nicety, not a need).
fn resample_stereo(input: &[f32], from: u32, to: u32) -> Vec<f32> {
    if from == to {
        return input.to_vec();
    }
    let in_frames = input.len() / 2;
    if in_frames == 0 {
        return Vec::new();
    }
    let out_frames = ((in_frames as u64 * to as u64) / from as u64) as usize;
    let ratio = from as f64 / to as f64;
    let mut out = Vec::with_capacity(out_frames * 2);
    for of in 0..out_frames {
        let pos = of as f64 * ratio;
        let i0 = (pos.floor() as usize).min(in_frames - 1);
        let i1 = (i0 + 1).min(in_frames - 1);
        let frac = (pos - i0 as f64) as f32;
        for c in 0..2 {
            let a = input[i0 * 2 + c];
            let b = input[i1 * 2 + c];
            out.push(a + (b - a) * frac);
        }
    }
    out
}

/// Write interleaved stereo f32 samples as 16-bit PCM WAV (clamped).
pub fn write_wav(path: &Path, samples: &[f32]) -> Result<(), String> {
    let spec = hound::WavSpec {
        channels: CHANNELS,
        sample_rate: SAMPLE_RATE,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };
    let mut writer = hound::WavWriter::create(path, spec).map_err(|e| format!("create wav: {e}"))?;
    for &s in samples {
        let v = (s.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;
        writer.write_sample(v).map_err(|e| format!("write wav: {e}"))?;
    }
    writer.finalize().map_err(|e| format!("finalize wav: {e}"))
}

/// Mix layers into one interleaved stereo buffer — the Fragment Studio's
/// engine. Sum without normalization; clamping happens at the WAV writer.
pub fn mix_layers(layers: &[LayerSpec]) -> Result<Vec<f32>, String> {
    let sr = SAMPLE_RATE as f64;
    let ch = CHANNELS as usize;
    let mut master: Vec<f32> = Vec::new();

    for layer in layers {
        let mut samples = decode_window(&layer.path, 0.0, 0.0)?;
        let frames = samples.len() / ch;

        let fade_in_frames = (layer.fade_in.max(0.0) * sr) as usize;
        let fade_out_frames = ((layer.fade_out.max(0.0) * sr) as usize).min(frames);
        let fade_out_start = frames.saturating_sub(fade_out_frames);
        for f in 0..frames {
            let mut g = 1.0f32;
            if fade_in_frames > 0 && f < fade_in_frames {
                g *= f as f32 / fade_in_frames as f32;
            }
            if fade_out_frames > 0 && f >= fade_out_start {
                g *= 1.0 - ((f - fade_out_start) as f32 / fade_out_frames as f32);
            }
            if g < 1.0 {
                samples[f * ch] *= g;
                samples[f * ch + 1] *= g;
            }
        }

        let vol = layer.volume.clamp(0.0, 2.0) as f32;
        let pan = layer.pan.clamp(-1.0, 1.0) as f32;
        let l_gain = (if pan <= 0.0 { 1.0 } else { 1.0 - pan }) * vol;
        let r_gain = (if pan >= 0.0 { 1.0 } else { 1.0 + pan }) * vol;

        let offset_frames = (layer.offset_secs.max(0.0) * sr).round() as usize;
        let needed = (offset_frames + frames) * ch;
        if master.len() < needed {
            master.resize(needed, 0.0);
        }
        for f in 0..frames {
            let m = (offset_frames + f) * ch;
            master[m] += samples[f * ch] * l_gain;
            master[m + 1] += samples[f * ch + 1] * r_gain;
        }
    }

    if master.is_empty() {
        return Err("mix produced no audio".to_string());
    }
    Ok(master)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_sine(path: &Path, secs: f64, freq: f64) {
        let spec = hound::WavSpec {
            channels: 2,
            sample_rate: SAMPLE_RATE,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };
        let mut w = hound::WavWriter::create(path, spec).unwrap();
        let frames = (secs * SAMPLE_RATE as f64) as usize;
        for f in 0..frames {
            let t = f as f64 / SAMPLE_RATE as f64;
            let v = ((t * freq * std::f64::consts::TAU).sin() * 0.5 * i16::MAX as f64) as i16;
            w.write_sample(v).unwrap();
            w.write_sample(v).unwrap();
        }
        w.finalize().unwrap();
    }

    #[test]
    fn fragment_window_and_mix_hold_their_shape() {
        let dir = std::env::temp_dir().join("compass-engine-test");
        std::fs::create_dir_all(&dir).unwrap();
        let src = dir.join("tone.wav");
        write_sine(&src, 3.0, 440.0);
        let src_str = src.to_string_lossy().to_string();

        // A 1s window out of the middle: expect ~1s of stereo frames.
        let window = decode_window(&src_str, 1.0, 2.0).unwrap();
        let frames = window.len() / CHANNELS as usize;
        let expect = SAMPLE_RATE as usize;
        assert!(
            (frames as i64 - expect as i64).unsigned_abs() < 2048,
            "window frames {frames} vs expected ~{expect}"
        );
        assert!(window.iter().any(|s| s.abs() > 0.1), "window is silent");

        // Write it and decode it back — the WAV must survive the round trip.
        let frag = dir.join("frag.wav");
        write_wav(&frag, &window).unwrap();
        let back = decode_window(&frag.to_string_lossy(), 0.0, 0.0).unwrap();
        assert!(
            (back.len() as i64 - window.len() as i64).unsigned_abs() < 4096,
            "round trip length drifted: {} vs {}",
            back.len(),
            window.len()
        );

        // Two layers, second offset 0.5s: mix length ≈ 3.5s of frames.
        let mix = mix_layers(&[
            LayerSpec { path: src_str.clone(), offset_secs: 0.0, volume: 1.0, pan: -0.5, fade_in: 0.25, fade_out: 0.25 },
            LayerSpec { path: src_str.clone(), offset_secs: 0.5, volume: 0.8, pan: 0.5, fade_in: 0.0, fade_out: 0.5 },
        ])
        .unwrap();
        let mix_frames = mix.len() / CHANNELS as usize;
        let expect_mix = (3.5 * SAMPLE_RATE as f64) as usize;
        assert!(
            (mix_frames as i64 - expect_mix as i64).unsigned_abs() < 4096,
            "mix frames {mix_frames} vs expected ~{expect_mix}"
        );
        // Fade-in law: the very first frames of the mix must be near-silent.
        assert!(mix[..64].iter().all(|s| s.abs() < 0.05), "fade-in not applied");
        assert!(mix.iter().any(|s| s.abs() > 0.2), "mix is silent");
    }
}
