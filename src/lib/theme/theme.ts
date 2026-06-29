import type { ThemeConfig } from '$lib/types/types';
import { QUANTUM_COLORS, MOOD_COLORS, ENERGY_COLORS } from '$lib/cosmic';

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  dark: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['quantum.purple'],
    presetName: 'Dark',
    fontSize: 'medium',
  },
  warm: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['hearth.gold'],
    presetName: 'Warm',
    fontSize: 'medium',
  },
  ocean: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['cosmic.blue'],
    presetName: 'Ocean',
    fontSize: 'medium',
  },
  forest: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['sanctuary.green'],
    presetName: 'Forest',
    fontSize: 'medium',
  },
  sunset: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['fire.base'],
    presetName: 'Sunset',
    fontSize: 'medium',
  },
  amoled: {
    mode: 'amoled',
    accentColor: QUANTUM_COLORS['quantum.purple'],
    presetName: 'AMOLED Black',
    fontSize: 'medium',
  },
};

export const getThemeColors = (config: ThemeConfig) => {
  const isLight = config.mode === 'light';
  const isAmoled = config.mode === 'amoled';

  return {
    background: isAmoled ? '#000000' : isLight ? '#f5f5f5' : QUANTUM_COLORS['deepSpace'],
    surface: isAmoled ? '#0a0a0a' : isLight ? '#ffffff' : QUANTUM_COLORS['surface'],
    surfaceLight: isAmoled ? '#111111' : isLight ? '#e8e8e8' : '#2a2a5a',
    accent: config.accentColor,
    accentPulse: config.accentColor + 'CC',
    text: isLight ? '#1a1a1a' : QUANTUM_COLORS['starDust'],
    textSecondary: isLight ? '#555555' : '#999999',
    textMuted: isLight ? '#888888' : '#666666',
    border: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(99, 110, 114, 0.3)',
    heart: QUANTUM_COLORS['error'],
    success: QUANTUM_COLORS['success'],
    warning: QUANTUM_COLORS['warning'],
  };
};