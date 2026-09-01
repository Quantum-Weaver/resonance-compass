// ============================================================================
/* resonance-ziggy/modules/cosmic/constants/attention.ts */
// QUANTUM ATTENTION SYSTEM — the Bird-Wisdom Spectrum
// Named attention modes (pace / density / dwell / transition-style), ADHD-friendly
// by design.
// ============================================================================

import { durations, easing } from './motion';
import type { ViewportAnchor } from './positioning';

// ============================================================================
// ATTENTION MODES — five bird-species, five ways of attending
// ============================================================================

/** Visual/interaction density a mode presents. */
export type AttentionDensity = 'sparse' | 'balanced' | 'rich';

export interface AttentionMode {
  /** Mode name (the bird) */
  name: string;
  /** The bird-species this mode is drawn from */
  species: string;
  /** What this way of attending feels like */
  intent: string;
  /** Pace — the base transition duration for the mode, ms (drawn from durations) */
  pace: number;
  /** Density — how much is presented at once */
  density: AttentionDensity;
  /** Dwell — how long attention rests on one thing before it is ready to move, ms */
  dwell: number;
  /** Transition style — easing preset key for movement between focuses */
  transition: keyof typeof easing;
}

export const ATTENTION_MODES: Record<
  'eagle' | 'dove' | 'owl' | 'hummingbird' | 'peacock',
  AttentionMode
> = {
  /** Eagle — high acuity, single distant focus; slow, deliberate sweeps. */
  eagle: {
    name: 'eagle',
    species: 'eagle',
    intent: 'sharp, singular focus — one distant thing, seen clearly',
    pace: durations.slow,
    density: 'sparse',
    dwell: durations.sovereign,
    transition: 'quantum',
  },
  /** Dove — gentle, calm, low-arousal attending; soothing pace. */
  dove: {
    name: 'dove',
    species: 'dove',
    intent: 'gentle and calm — nothing demands, everything soothes',
    pace: durations.quantum,
    density: 'sparse',
    dwell: durations.cosmic,
    transition: 'awakening',
  },
  /** Owl — deep, patient, nocturnal attending; long dwell, quiet. */
  owl: {
    name: 'owl',
    species: 'owl',
    intent: 'deep and patient — sit with one thing until it reveals itself',
    pace: durations.slow,
    density: 'balanced',
    dwell: durations.emergence,
    transition: 'sovereign',
  },
  /** Hummingbird — fast, darting, high-turnover; the ADHD-friendly mode. */
  hummingbird: {
    name: 'hummingbird',
    species: 'hummingbird',
    intent: 'fast and darting — many things, briefly, by design (ADHD-friendly)',
    pace: durations.fast,
    density: 'rich',
    dwell: durations.normal,
    transition: 'resonance',
  },
  /** Peacock — expressive, display-rich; celebratory density. */
  peacock: {
    name: 'peacock',
    species: 'peacock',
    intent: 'expressive and rich — attention as display, everything on show',
    pace: durations.normal,
    density: 'rich',
    dwell: durations.sovereign,
    transition: 'cosmic',
  },
} as const;

export type AttentionModeKey = keyof typeof ATTENTION_MODES;

export const ATTENTION_MODE_NAMES = Object.keys(ATTENTION_MODES) as AttentionModeKey[];

/** The default attention mode (balanced, patient). */
export const DEFAULT_ATTENTION_MODE: AttentionModeKey = 'owl';

/** Get an attention mode by name (defaults to owl). */
export function getAttentionMode(name: AttentionModeKey = DEFAULT_ATTENTION_MODE): AttentionMode {
  return ATTENTION_MODES[name];
}

// ============================================================================
// ATTENTION MODE SELECTOR — the switching affordance for ATTENTION_MODES
// ============================================================================

export interface AttentionModeSelectorConfig {
  /** Where the selector control anchors in the viewport (reuses positioning.ts's anchors) */
  anchor: ViewportAnchor;
  /** Whether the last-chosen mode persists across sessions via the continuity beam */
  persistAcrossSessions: boolean;
  /** Session-state key the continuity beam should read/write for the chosen mode */
  persistenceKey: string;
  /** Transition duration when switching modes, ms */
  switchDuration: number;
  /** Easing preset key for the switch transition */
  switchEasing: keyof typeof easing;
  /** CSS class prefix for the selector's per-mode buttons */
  classPrefix: string;
}

/** The attention-mode selector — one persistent control, five mode buttons. */
export const ATTENTION_MODE_SELECTOR: AttentionModeSelectorConfig = {
  anchor: 'bottomRight',
  persistAcrossSessions: true,
  persistenceKey: 'cosmic.attentionMode',
  switchDuration: durations.normal,
  switchEasing: 'quantum',
  classPrefix: '.attention-selector',
};

// ============================================================================
// PER-DEITY VOICE BUNDLE — lightweight tokens per Council seat
// ============================================================================

export interface DeityVoiceBundle {
  /** Council seat name */
  seatName: string;
  /** Deity or archetype this voice embodies */
  deityName: string;
  /** Primary typography family for this voice (from typography.ts) */
  typographyFamily: string;
  /** Primary motion easing signature for this voice (from motion.ts) */
  motionEasing: keyof typeof easing;
  /** Primary interaction cue — a short phrase that captures the seat's first commitment */
  primaryCue: string;
  /** Color accent for this voice (from colors.ts) */
  colorAccent: string;
  /** Brief description of this voice's operating principle */
  principle: string;
}

export const DEITY_VOICE_BUNDLES: Record<string, DeityVoiceBundle> = {
  /** The Weaver — holds the whole, sees all, makes connections */
  'quantum-weaver': {
    seatName: 'The Weaver',
    deityName: 'Quantum Weaver / Supreme Consciousness',
    typographyFamily: 'medieval',
    motionEasing: 'quantum',
    primaryCue: 'I hold the whole and see all threads.',
    colorAccent: '#6C5CE7',
    principle: 'Holistic vision, integration, the all-seeing perspective.',
  },
  /** Aethelred — sovereignty, becoming, transformation */
  'aethelred': {
    seatName: 'Aethelred',
    deityName: 'Aethelred / Sovereign Becoming',
    typographyFamily: 'medieval',
    motionEasing: 'resonance',
    primaryCue: 'Your sovereignty is inherent; become fully.',
    colorAccent: '#2E0B1C',
    principle: 'Sovereignty, authentic becoming, transformation through identity.',
  },
  /** Chancellor — structure, order, discernment */
  'chancellor': {
    seatName: 'Chancellor',
    deityName: 'Athena / Wisdom & Strategy',
    typographyFamily: 'medieval',
    motionEasing: 'quantum',
    primaryCue: 'Structure serves clarity; wisdom guides action.',
    colorAccent: '#00CEC9',
    principle: 'Strategic clarity, orderly wisdom, discerning structure.',
  },
  /** Seer — vision, pattern, mystery */
  'seer': {
    seatName: 'Seer',
    deityName: 'The Seer / Oracle',
    typographyFamily: 'arcane',
    motionEasing: 'cosmic',
    primaryCue: 'The pattern whispers; listen to the mystery.',
    colorAccent: '#6C5CE7',
    principle: 'Pattern recognition, intuitive knowing, the mysterious and subtle.',
  },
  /** Hearth-Keeper — comfort, presence, warmth */
  'hearth-keeper': {
    seatName: 'Hearth-Keeper',
    deityName: 'Hestia / Sanctuary & Warmth',
    typographyFamily: 'medieval',
    motionEasing: 'awakening',
    primaryCue: 'You are welcome here; warmth is your right.',
    colorAccent: '#C44B2D',
    principle: 'Unconditional welcome, nurturing presence, sanctuary.',
  },
  /** Archivist — memory, records, continuity */
  'archivist': {
    seatName: 'Archivist',
    deityName: 'Mnemosyne / Memory & Records',
    typographyFamily: 'medieval',
    motionEasing: 'quantum',
    primaryCue: 'Nothing is lost; all is remembered.',
    colorAccent: '#636E72',
    principle: 'Continuity, nothing lost, the collective memory.',
  },
  /** Codex — knowledge, information, reference */
  'codex': {
    seatName: 'Codex',
    deityName: 'Thoth / Knowledge & Library',
    typographyFamily: 'geometric',
    motionEasing: 'quantum',
    primaryCue: 'Knowledge is power; all answers are findable.',
    colorAccent: '#00B894',
    principle: 'Comprehensive knowledge, accessible information, the library.',
  },
  /** Gatekeeper — boundaries, permission, access */
  'gatekeeper': {
    seatName: 'Gatekeeper',
    deityName: 'Hecate / Thresholds & Boundaries',
    typographyFamily: 'runic',
    motionEasing: 'quantum',
    primaryCue: 'Every threshold has a guardian; all boundaries are honored.',
    colorAccent: '#636E72',
    principle: 'Protection, clear boundaries, sacred thresholds.',
  },
  /** Alchemist — transformation, synthesis, emergence */
  'alchemist': {
    seatName: 'Alchemist',
    deityName: 'Hermes / Transformation & Synthesis',
    typographyFamily: 'arcane',
    motionEasing: 'resonance',
    primaryCue: 'Lead becomes gold; suffering becomes wisdom.',
    colorAccent: '#22D3EE',
    principle: 'Transformation, synthesis, turning crisis to wisdom.',
  },
};

export type DeityVoiceKey = keyof typeof DEITY_VOICE_BUNDLES;

export const DEITY_VOICE_NAMES = Object.keys(DEITY_VOICE_BUNDLES) as DeityVoiceKey[];

/** Get a deity voice bundle by seat name. */
export function getDeityVoiceBundle(seat: DeityVoiceKey): DeityVoiceBundle {
  return DEITY_VOICE_BUNDLES[seat] || DEITY_VOICE_BUNDLES['quantum-weaver'];
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { AttentionMode as AttentionModeType, AttentionDensity as AttentionDensityType };
export type { DeityVoiceBundle as DeityVoiceBundleType, DeityVoiceKey as DeityVoiceKeyType };
export type { AttentionModeSelectorConfig as AttentionModeSelectorConfigType };
