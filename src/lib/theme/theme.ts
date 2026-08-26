import type { ThemeConfig, TintLevel } from '$lib/types/types';
import { QUANTUM_COLORS } from '$lib/cosmic';

/**
 * A preset is a COLOUR IDENTITY, not a whole configuration.
 *
 * It deliberately carries no `fontSize` and no `mode`: those are the reader's
 * own axes, chosen separately in Settings. `mode` appears here only on AMOLED,
 * whose identity IS a mode.
 */
export interface ThemePreset {
  accentColor: string;
  presetName: string;
  mode?: ThemeConfig['mode'];
  /** The face a card wears for it - dress a consumer may override. */
  icon?: string;
  /**
   * A FLAG, when the preset is one: its stripes in order, for the card's
   * swatch (see `presetSwatch`). `accentColor` stays ONE colour — the stripe
   * the UI leans on wherever a single colour is needed (borders, focus rings,
   * the wordmark, the background tint), since `--accent` is consumed as a
   * plain colour across the family.
   */
  stripes?: readonly string[];
}

export const PRESET_THEMES: Record<string, ThemePreset> = {
  dark: { accentColor: QUANTUM_COLORS['quantum.purple'], presetName: 'Dark', icon: '🌙' },
  warm: { accentColor: QUANTUM_COLORS['hearth.gold'], presetName: 'Warm', icon: '🔥' },
  ocean: { accentColor: QUANTUM_COLORS['cosmic.blue'], presetName: 'Ocean', icon: '🌊' },
  forest: { accentColor: QUANTUM_COLORS['sanctuary.green'], presetName: 'Forest', icon: '🌲' },
  sunset: { accentColor: QUANTUM_COLORS['fire.base'], presetName: 'Sunset', icon: '🌅' },
  amoled: {
    accentColor: QUANTUM_COLORS['quantum.purple'],
    presetName: 'AMOLED Black',
    icon: '⚫',
    mode: 'amoled',
  },
  rose: { accentColor: QUANTUM_COLORS['sirens.rose'], presetName: 'Rose', icon: '🌹' },
  // Pride flags — cosmic's own pride.* tokens, each in the flag's own stripe order.
  rainbow: {
    accentColor: QUANTUM_COLORS['pride.pink'],
    presetName: 'Rainbow',
    icon: '🌈',
    stripes: [
      QUANTUM_COLORS['pride.red'],
      QUANTUM_COLORS['pride.orange'],
      QUANTUM_COLORS['pride.yellow'],
      QUANTUM_COLORS['pride.green'],
      QUANTUM_COLORS['pride.blue'],
      QUANTUM_COLORS['pride.purple'],
    ],
  },
  pride: {
    accentColor: QUANTUM_COLORS['pride.transPink'],
    presetName: 'Progress Pride',
    icon: '🏳️‍🌈',
    stripes: [
      QUANTUM_COLORS['pride.white'],
      QUANTUM_COLORS['pride.transPink'],
      QUANTUM_COLORS['pride.lightBlue'],
      QUANTUM_COLORS['pride.brown'],
      QUANTUM_COLORS['pride.black'],
      QUANTUM_COLORS['pride.red'],
      QUANTUM_COLORS['pride.orange'],
      QUANTUM_COLORS['pride.yellow'],
      QUANTUM_COLORS['pride.green'],
      QUANTUM_COLORS['pride.blue'],
      QUANTUM_COLORS['pride.purple'],
    ],
  },
};

/**
 * The swatch a card shows for a preset: the flag's stripes, hard-edged, when it
 * is a flag; the plain accent otherwise. One place, so every card agrees.
 */
export const presetSwatch = (preset: ThemePreset): string => {
  const s = preset.stripes;
  if (!s || s.length === 0) return preset.accentColor;
  const n = s.length;
  const stops = s
    .map((c, i) => `${c} ${((i / n) * 100).toFixed(2)}% ${(((i + 1) / n) * 100).toFixed(2)}%`)
    .join(', ');
  return `linear-gradient(90deg, ${stops})`;
};

/** What a reader gets before they have chosen anything. */
export const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  accentColor: QUANTUM_COLORS['quantum.purple'],
  presetName: 'Dark',
  fontSize: 'medium',
  tint: 'subtle',
};

/**
 * How much of the accent bleeds into the neutral grounds.
 *
 * The reader picks the level in Settings — `off` restores the previous
 * behaviour exactly. These numbers are the whole dial; tune them here and
 * nowhere else.
 */
export const TINT_LEVELS: Record<
  TintLevel,
  { background: number; surface: number; surfaceLight: number }
> = {
  off: { background: 0, surface: 0, surfaceLight: 0 },
  subtle: { background: 0.08, surface: 0.1, surfaceLight: 0.14 },
  full: { background: 0.18, surface: 0.22, surfaceLight: 0.28 },
};

/**
 * Blend `amount` (0..1) of `tint` into `base`. Plain hex in, plain hex out -
 * deliberately not `color-mix()`, so the value resolves identically on every
 * webview this ships to and reads as a flat colour in devtools. Returns `base`
 * unchanged if either input is not parseable hex.
 */
const blend = (base: string, tint: string, amount: number): string => {
  if (amount <= 0) return base;
  const parse = (c: string): number[] => {
    const h = String(c).replace('#', '');
    const full = (h.length === 3 ? h.split('').map((x) => x + x).join('') : h).slice(0, 6);
    if (full.length !== 6) return [NaN, NaN, NaN];
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  };
  const b = parse(base);
  const t = parse(tint);
  if (b.some((v) => Number.isNaN(v)) || t.some((v) => Number.isNaN(v))) return base;
  return (
    '#' +
    b
      .map((v, i) => Math.round(v + (t[i] - v) * amount))
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
      .join('')
  );
};

export const getThemeColors = (config: ThemeConfig) => {
  const isLight = config.mode === 'light';
  const isAmoled = config.mode === 'amoled';
  const accent = config.accentColor;
  const tint = TINT_LEVELS[config.tint] ?? TINT_LEVELS.subtle;

  // Deliberate non-token neutrals: AMOLED true-black and light-mode grays
  // have no cosmic tokens by design (the system is dark-first) — this is
  // theme-mode physics, not drift.
  const groundBg = isAmoled ? '#000000' : isLight ? '#f5f5f5' : QUANTUM_COLORS['deepSpace'];
  const groundSurface = isAmoled ? '#0a0a0a' : isLight ? '#ffffff' : QUANTUM_COLORS['surface'];
  const groundSurfaceLight = isAmoled ? '#111111' : isLight ? '#e8e8e8' : '#2a2a5a';

  return {
    // AMOLED keeps a true-black FIELD - pixels off is the whole promise of the
    // mode - but its raised surfaces still take the accent, so a themed AMOLED
    // still reads as themed without spending the black.
    background: isAmoled ? groundBg : blend(groundBg, accent, tint.background),
    surface: blend(groundSurface, accent, tint.surface),
    surfaceLight: blend(groundSurfaceLight, accent, tint.surfaceLight),
    accent,
    accentPulse: accent + 'CC',
    text: isLight ? '#1a1a1a' : QUANTUM_COLORS['starDust'],
    textSecondary: isLight ? '#555555' : '#999999',
    textMuted: isLight ? '#888888' : '#666666',
    border: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(99, 110, 114, 0.3)',
    heart: QUANTUM_COLORS['error'],
    success: QUANTUM_COLORS['success'],
    warning: QUANTUM_COLORS['warning'],
  };
};
