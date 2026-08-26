// the-timer — the sensory-first countdown's core, framework-free.

export type TimerMode =
  | 'sand'
  | 'breathing'
  | 'dissolve'
  | 'flower'
  | 'metatron'
  | 'cycle'
  | 'numeric';

export const MODE_ORDER: TimerMode[] = [
  'sand',
  'breathing',
  'dissolve',
  'flower',
  'metatron',
  'cycle',
  'numeric',
];

/** Locks to numeric and hides the cycle control when the OS prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Chime options. All synthesized — no audio assets, nothing fetched —
// gentle attack, long decay, never a buzzer.
export type ChimeId = 'rise' | 'bell' | 'drop' | 'pulse';
type ChimeNote = { freq: number; at: number; peak: number; decay: number };
export const CHIME_DEFS: Record<ChimeId, ChimeNote[]> = {
  // A three-note rise (C5–E5–G5) — the default.
  rise: [
    { freq: 523.25, at: 0, peak: 0.18, decay: 1.4 },
    { freq: 659.25, at: 0.35, peak: 0.18, decay: 1.4 },
    { freq: 783.99, at: 0.7, peak: 0.18, decay: 1.4 },
  ],
  // One deep bell strike (E4 + its octave harmonic), long settle.
  bell: [
    { freq: 329.63, at: 0, peak: 0.22, decay: 2.2 },
    { freq: 659.25, at: 0, peak: 0.06, decay: 1.6 },
  ],
  // A soft descent (G5→C5) — arrival rather than alert.
  drop: [
    { freq: 783.99, at: 0, peak: 0.16, decay: 1.6 },
    { freq: 523.25, at: 0.4, peak: 0.16, decay: 1.8 },
  ],
  // Two quiet A4 taps — the heartbeat shape.
  pulse: [
    { freq: 440, at: 0, peak: 0.15, decay: 0.9 },
    { freq: 440, at: 0.5, peak: 0.15, decay: 0.9 },
  ],
};

export interface TimerStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface TimerOptions {
  /** Where sound/chime/volume preferences persist. Default: localStorage when present, else nothing. */
  storage?: TimerStorage | null;
  /** Key prefix for stored preferences. Default: 'the-timer'. */
  storagePrefix?: string;
  /** Called each tick with seconds remaining — Compass's music-fade organ attaches here. */
  onTick?: (remainingSecs: number, totalSecs: number) => void;
  /** Called once at completion, before the ring loop — the pause-the-music hook. */
  onComplete?: () => void;
  /** Ring the chime this many times at completion, 4s apart. Default 5, as shipped. */
  ringCount?: number;
}

export interface TimerState {
  totalSecs: number;
  remainingSecs: number;
  isRunning: boolean;
  isPaused: boolean;
  completed: boolean;
  soundOn: boolean;
  chime: ChimeId;
  chimeVolume: number;
  mode: TimerMode;
}

export function createTimer(options: TimerOptions = {}) {
  const storage: TimerStorage | null =
    options.storage !== undefined
      ? options.storage
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;
  const prefix = options.storagePrefix ?? 'the-timer';
  const KEYS = {
    sound: `${prefix}-sound`,
    chime: `${prefix}-chime`,
    volume: `${prefix}-volume`,
  };
  const RING_COUNT = options.ringCount ?? 5;

  function loadChime(): ChimeId {
    const v = storage?.getItem(KEYS.chime);
    return v === 'bell' || v === 'drop' || v === 'pulse' ? v : 'rise';
  }
  function loadVolume(): number {
    const v = Number(storage?.getItem(KEYS.volume));
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 1;
  }

  const state: TimerState = {
    totalSecs: 0,
    remainingSecs: 0,
    isRunning: false,
    isPaused: false,
    completed: false,
    soundOn: storage ? storage.getItem(KEYS.sound) !== 'off' : true,
    chime: loadChime(),
    chimeVolume: loadVolume(),
    mode: prefersReducedMotion() ? 'numeric' : 'sand',
  };

  const listeners = new Set<(s: Readonly<TimerState>) => void>();
  function notify() {
    for (const fn of listeners) fn(state);
  }

  // Keep ONE instance at module scope, never component-local: a remount
  // orphans a running interval instead of stopping it.
  let tickInterval: ReturnType<typeof setInterval> | null = null;
  let chimeTimeout: ReturnType<typeof setTimeout> | null = null;
  let chimeCount = 0;
  let audioCtx: AudioContext | null = null;

  // Created/resumed inside start() — a user gesture — or the Android WebView
  // refuses playback when the timer completes unattended.
  function ensureAudio(): AudioContext | null {
    if (typeof AudioContext === 'undefined' || !state.soundOn) return null;
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') void audioCtx.resume();
      return audioCtx;
    } catch {
      return null; // no audio available — the visual completion state still shows
    }
  }

  // Plays the selected chime at the selected volume; each note is a sine
  // bell with a gentle attack and long decay.
  function playChime() {
    if (state.chimeVolume <= 0) return; // volume zero is a chosen silence
    const ctx = ensureAudio();
    if (!ctx) return;
    for (const n of CHIME_DEFS[state.chime]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = n.freq;
      const t = ctx.currentTime + n.at;
      const peak = Math.max(0.0005, n.peak * state.chimeVolume);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.decay);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + n.decay + 0.1);
    }
  }

  function ringLoop() {
    if (!state.completed || !state.soundOn) return;
    chimeCount += 1;
    playChime();
    if (chimeCount < RING_COUNT) {
      chimeTimeout = setTimeout(ringLoop, 4000);
    }
  }

  function stopChime() {
    if (chimeTimeout) clearTimeout(chimeTimeout);
    chimeTimeout = null;
    chimeCount = 0;
  }

  function startTick() {
    tickInterval = setInterval(() => {
      state.remainingSecs -= 1;
      options.onTick?.(state.remainingSecs, state.totalSecs);
      if (state.remainingSecs <= 0) {
        state.isRunning = false;
        state.isPaused = false;
        if (tickInterval) clearInterval(tickInterval);
        tickInterval = null;
        state.totalSecs = 0;
        state.remainingSecs = 0;
        state.completed = true;
        options.onComplete?.();
        ringLoop();
      }
      notify();
    }, 1000);
  }

  function start(minutes: number) {
    cancel(); // replace rather than stack if one's already running
    ensureAudio(); // unlock audio inside the tap that starts the timer
    state.totalSecs = Math.round(minutes * 60);
    state.remainingSecs = state.totalSecs;
    state.isRunning = true;
    state.isPaused = false;
    startTick();
    notify();
  }

  function pause() {
    if (!state.isRunning || state.isPaused) return;
    state.isPaused = true;
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    notify();
  }

  function resume() {
    if (!state.isRunning || !state.isPaused) return;
    state.isPaused = false;
    ensureAudio(); // resume is a user gesture too — re-unlock for the WebView
    startTick();
    notify();
  }

  function dismiss() {
    state.completed = false;
    stopChime();
    notify();
  }

  function cancel() {
    state.isRunning = false;
    state.isPaused = false;
    state.completed = false;
    state.totalSecs = 0;
    state.remainingSecs = 0;
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = null;
    stopChime();
    notify();
  }

  function setSoundOn(v: boolean) {
    state.soundOn = v;
    storage?.setItem(KEYS.sound, v ? 'on' : 'off');
    if (!v) stopChime();
    notify();
  }

  function setChime(id: ChimeId) {
    state.chime = id;
    storage?.setItem(KEYS.chime, id);
    playChime(); // preview inside the tap that chose it — hear before trusting
    notify();
  }

  function setChimeVolume(v: number) {
    state.chimeVolume = Math.min(1, Math.max(0, v));
    storage?.setItem(KEYS.volume, String(state.chimeVolume));
    notify();
  }

  function previewChime() {
    playChime();
  }

  function cycleMode() {
    if (prefersReducedMotion()) return;
    const idx = MODE_ORDER.indexOf(state.mode);
    state.mode = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
    notify();
  }

  return {
    get state(): Readonly<TimerState> {
      return state;
    },
    subscribe(fn: (s: Readonly<TimerState>) => void): () => void {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    start,
    pause,
    resume,
    dismiss,
    cancel,
    setSoundOn,
    setChime,
    setChimeVolume,
    previewChime,
    cycleMode,
  };
}
