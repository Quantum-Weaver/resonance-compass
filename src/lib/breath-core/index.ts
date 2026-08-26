// the-breath — the regulation door's engine, framework-free.

export type BreathDuration = '4-4' | '4-6' | '4-8' | '5-5';

/** [inhale ms, exhale ms]. */
export const BREATH_DURATIONS: Record<BreathDuration, [number, number]> = {
  '4-4': [8000, 8000],
  '4-6': [8000, 12000],
  '4-8': [8000, 16000],
  '5-5': [10000, 10000],
};

/** [inhale color, exhale color] — warm amber in, deep violet out. */
export const PHASE_COLORS: [string, string] = ['#FDCB6E', '#6C5CE7'];

export interface BreathSample {
  /** 0 = inhale, 1 = exhale. */
  phaseIdx: 0 | 1;
  phase: 'in' | 'out';
  /** Progress through the current phase, 0..1. */
  t: number;
  /** The spoken count, 1..4, rising through the phase. */
  count: number;
  /** The count's gentle presence: 0.04 → 0.21 by t=0.75, falling home after. */
  countOpacity: number;
  /** The border's breathing glow: 0.09 + sin(tπ) · 0.09 — peaks mid-phase. */
  borderAlpha: number;
  /** The current phase's color. */
  color: string;
}

/**
 * The pacer: give it a duration name and feed it time; it tells you where the
 * breath stands. Pure — no timers of its own, so any loop drives it.
 */
export function createBreath(duration: BreathDuration = '4-4') {
  const durations = BREATH_DURATIONS[duration] ?? BREATH_DURATIONS['4-4'];
  let phaseIdx: 0 | 1 = 0;
  let phaseStartTime = 0;
  // Any clock may drive this, including one that starts at 0, so "unstarted"
  // needs its own flag rather than a zero phaseStartTime.
  let started = false;

  function sample(nowMs: number): BreathSample {
    if (!started) {
      phaseStartTime = nowMs;
      started = true;
    }
    const phaseDur = durations[phaseIdx];
    const elapsed = nowMs - phaseStartTime;
    const t = Math.min(1, elapsed / phaseDur);

    const count = Math.min(4, Math.floor(t * 4) + 1);

    let countOpacity: number;
    if (t < 0.75) {
      countOpacity = 0.04 + (t / 0.75) * 0.17;
    } else {
      const ft = (t - 0.75) / 0.25;
      countOpacity = 0.21 - ft * 0.17;
    }

    const borderAlpha = 0.09 + Math.sin(t * Math.PI) * 0.09;

    const result: BreathSample = {
      phaseIdx,
      phase: phaseIdx === 0 ? 'in' : 'out',
      t,
      count,
      countOpacity,
      borderAlpha,
      color: PHASE_COLORS[phaseIdx],
    };

    if (t >= 1) {
      phaseIdx = phaseIdx === 0 ? 1 : 0;
      phaseStartTime = nowMs;
    }

    return result;
  }

  function reset() {
    phaseIdx = 0;
    phaseStartTime = 0;
    started = false;
  }

  return { sample, reset };
}

/**
 * The border glow — a rounded square that breathes. Plain canvas 2D; draw it
 * each frame with the sample's color and borderAlpha. The caller gates on
 * prefers-reduced-motion before animating.
 */
type RoundRectCtx = CanvasRenderingContext2D & {
  roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

export function drawSquarePulse(canvas: HTMLCanvasElement, color: string, alpha: number) {
  const ctx = canvas.getContext('2d') as RoundRectCtx | null;
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (alpha <= 0) return;

  const dim = Math.min(W, H);
  const sqSz = dim * 0.6;
  const x = (W - sqSz) / 2;
  const y = (H - sqSz) / 2;
  const cr = 10;

  const [r, g, b] = hexToRgb(color);

  ctx.save();

  ctx.shadowBlur = 36;
  ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 0.6})`;

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, sqSz, sqSz, cr);
  } else {
    ctx.rect(x, y, sqSz, sqSz);
  }
  ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.45})`;
  ctx.lineWidth = 6 + alpha * 6;
  ctx.stroke();

  ctx.shadowBlur = 14;
  ctx.shadowColor = `rgba(${r},${g},${b},${alpha})`;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, sqSz, sqSz, cr);
  } else {
    ctx.rect(x, y, sqSz, sqSz);
  }
  ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.85})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = alpha * 0.04;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fill();

  ctx.restore();
}
