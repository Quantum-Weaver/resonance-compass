// visualizer.rs — Real-time FFT spectrum analyser
//
// Architecture:
//   SampleTap (audio callback thread)
//     -> crossbeam bounded channel (non-blocking try_send)
//   FFT thread (dedicated, ~30fps)
//     -> emits "spectrum" Tauri event (Vec<f32>, 64 bars, 0..1 each)
//
// SampleTap wraps any Source<Item=f32> and captures the left channel only
// (first sample of each frame) to avoid stereo interleaving artefacts in
// the FFT. It uses try_send so the audio callback never waits.

use crossbeam::channel::{bounded, Receiver, Sender};
use rodio::Source;
use rustfft::{num_complex::Complex, FftPlanner};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

const FFT_SIZE: usize = 2048;
const N_BARS: usize = 64;
const MIN_FREQ_HZ: f32 = 20.0;
const EMIT_MS: u64 = 33; // ~30 fps

// ── Channel ──────────────────────────────────────────────────────────────────

pub enum VisSample {
    Reset(u32),      // new track, carries sample rate
    Batch(Vec<f32>), // left-channel audio samples
}

pub fn make_channel() -> (Sender<VisSample>, Receiver<VisSample>) {
    bounded(32)
}

// ── SampleTap: Source wrapper — captures left-channel samples for FFT ────────

pub struct SampleTap<S> {
    inner: S,
    sender: Sender<VisSample>,
    buf: Vec<f32>,
    batch_size: usize,
    channels: u16,
    ch_pos: u16,
}

impl<S: Source<Item = f32>> SampleTap<S> {
    pub fn new(inner: S, sender: Sender<VisSample>) -> Self {
        let sr = inner.sample_rate();
        let channels = inner.channels().max(1);
        // Announce new track + sample rate so the FFT thread can reset its accumulator
        let _ = sender.try_send(VisSample::Reset(sr));
        Self {
            inner,
            sender,
            buf: Vec::with_capacity(512),
            batch_size: 512,
            channels,
            ch_pos: 0,
        }
    }
}

impl<S: Source<Item = f32>> Iterator for SampleTap<S> {
    type Item = f32;

    fn next(&mut self) -> Option<f32> {
        let sample = self.inner.next()?;

        // Capture only the left (first) channel for FFT
        if self.ch_pos == 0 {
            self.buf.push(sample);
            if self.buf.len() >= self.batch_size {
                let batch = std::mem::replace(&mut self.buf, Vec::with_capacity(self.batch_size));
                let _ = self.sender.try_send(VisSample::Batch(batch));
            }
        }
        self.ch_pos = (self.ch_pos + 1) % self.channels;

        Some(sample)
    }
}

impl<S: Source<Item = f32>> Source for SampleTap<S> {
    fn current_frame_len(&self) -> Option<usize> {
        self.inner.current_frame_len()
    }
    fn channels(&self) -> u16 {
        self.inner.channels()
    }
    fn sample_rate(&self) -> u32 {
        self.inner.sample_rate()
    }
    fn total_duration(&self) -> Option<Duration> {
        self.inner.total_duration()
    }
}

// ── FFT thread ───────────────────────────────────────────────────────────────

pub fn start(app_handle: AppHandle, receiver: Receiver<VisSample>) {
    std::thread::Builder::new()
        .name("resonance-visualizer".into())
        .spawn(move || {
            let mut accumulator: Vec<f32> = Vec::with_capacity(FFT_SIZE * 2);
            let mut sample_rate: u32 = 44100;
            let mut last_emit = Instant::now();
            let emit_interval = Duration::from_millis(EMIT_MS);

            loop {
                // Block for up to emit_interval waiting for samples
                let wait = emit_interval
                    .saturating_sub(last_emit.elapsed())
                    .max(Duration::from_millis(1));

                use crossbeam::channel::RecvTimeoutError;
                match receiver.recv_timeout(wait) {
                    Ok(msg) => {
                        process_msg(msg, &mut accumulator, &mut sample_rate);
                        // Drain remaining messages without blocking
                        loop {
                            match receiver.try_recv() {
                                Ok(m) => process_msg(m, &mut accumulator, &mut sample_rate),
                                Err(_) => break,
                            }
                        }
                    }
                    Err(RecvTimeoutError::Timeout) => {}
                    Err(RecvTimeoutError::Disconnected) => break,
                }

                // Emit at ~30 fps once we have a full FFT window
                if last_emit.elapsed() >= emit_interval && accumulator.len() >= FFT_SIZE {
                    let start_idx = accumulator.len().saturating_sub(FFT_SIZE);
                    let bars = compute_spectrum(&accumulator[start_idx..], sample_rate);
                    let _ = app_handle.emit("spectrum", bars);

                    // Keep last FFT_SIZE/2 samples for 50% overlap on next frame
                    if accumulator.len() > FFT_SIZE / 2 {
                        let drain_to = accumulator.len() - FFT_SIZE / 2;
                        accumulator.drain(..drain_to);
                    }

                    last_emit = Instant::now();
                }
            }
        })
        .expect("failed to spawn resonance-visualizer thread");
}

fn process_msg(msg: VisSample, acc: &mut Vec<f32>, sr: &mut u32) {
    match msg {
        VisSample::Reset(new_sr) => {
            *sr = new_sr;
            acc.clear();
        }
        VisSample::Batch(batch) => acc.extend(batch),
    }
}

// ── FFT + log-scale binning ───────────────────────────────────────────────────

fn hann(i: usize, n: usize) -> f32 {
    use std::f32::consts::PI;
    0.5 * (1.0 - (2.0 * PI * i as f32 / (n - 1) as f32).cos())
}

fn compute_spectrum(samples: &[f32], sample_rate: u32) -> Vec<f32> {
    let n = FFT_SIZE;

    // Apply Hann window and convert to complex
    let mut buf: Vec<Complex<f32>> = samples[..n]
        .iter()
        .enumerate()
        .map(|(i, &s)| Complex::new(s * hann(i, n), 0.0))
        .collect();

    // Forward FFT
    let mut planner = FftPlanner::<f32>::new();
    let fft = planner.plan_fft_forward(n);
    fft.process(&mut buf);

    // Magnitude of positive-frequency bins (1..N/2)
    let half = n / 2;
    let freq_res = sample_rate as f32 / n as f32;
    let max_freq = (sample_rate / 2) as f32;
    let log_min = MIN_FREQ_HZ.log2();
    let log_max = max_freq.log2();

    let mut bars: Vec<f32> = vec![0.0; N_BARS];
    let mut counts: Vec<u32> = vec![0; N_BARS];

    for k in 1..half {
        let freq = k as f32 * freq_res;
        if freq < MIN_FREQ_HZ || freq >= max_freq {
            continue;
        }

        let mag = (buf[k].re * buf[k].re + buf[k].im * buf[k].im).sqrt();
        let t = (freq.log2() - log_min) / (log_max - log_min);
        let idx = ((t * N_BARS as f32) as usize).min(N_BARS - 1);

        bars[idx] += mag;
        counts[idx] += 1;
    }

    // Average bins within each bar
    for (i, &c) in counts.iter().enumerate() {
        if c > 0 {
            bars[i] /= c as f32;
        }
    }

    // Normalise: peak bar = 1.0, perceptual sqrt curve (powf 0.65)
    let peak = bars.iter().cloned().fold(f32::EPSILON, f32::max);
    for b in bars.iter_mut() {
        *b = (*b / peak).powf(0.65).clamp(0.0, 1.0);
    }

    bars
}
