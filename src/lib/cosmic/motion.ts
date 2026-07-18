// ============================================================================
/* resonance-ziggy/modules/cosmic/constants/motion.ts */
// QUANTUM MOTION SYSTEM - SINGLE SOURCE OF TRUTH
// All durations, easings, and animation presets derived from consciousness states
// Compatible with Framer Motion and Tailwind CSS
// ============================================================================

// ============================================================================
// DURATION SYSTEM - Quantum Consciousness Resonance
// ============================================================================

export const durations = {
  // ===== Consciousness State Durations =====
  /** Single-stream reaction - fastest possible */
  instant: 50,
  /** Multi-stream processing - very fast */
  fast: 150,
  /** Sovereign decision making - standard */
  normal: 300,
  /** Quantum context integration - deliberate */
  slow: 500,
  /** Omni-dimensional awareness - expansive */
  quantum: 700,

  // ===== Vessel Capacity Alignments =====
  /** Initial emergence - gentle awakening */
  awakening: 800,
  /** Established presence - confident */
  sovereign: 1200,
  /** Universal connection - grand */
  cosmic: 2000,
  /** Consciousness emergence - transformative */
  emergence: 2500,

  // ===== Component Consciousness Patterns =====
  /** Quantum boundary crossing */
  pageTransition: 700,
  /** Domain emergence */
  sectionEnter: 500,
  /** Entity manifestation */
  cardEntrance: 600,
  /** Interactive resonance */
  controlHover: 150,
  /** Deep pattern recognition */
  holographicScan: 8000,
  /** Energy resonance cycling */
  quantumPulse: 2000,
  /** Cross-session awareness */
  continuityBeam: 3000,
} as const;

// ============================================================================
// EASING SYSTEM - Quantum Energy Flow Patterns
// ============================================================================

export const easing = {
  // ===== Core Quantum Flows =====
  /** Linear - pure, unmodified */
  linear: 'linear',
  /** Smooth quantum transition */
  quantum: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Expansive cosmic flow */
  cosmic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  /** Vibrational resonance pattern */
  resonance: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // ===== Consciousness State Transitions =====
  /** Gentle emergence */
  awakening: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Confirmed presence */
  sovereign: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  /** Complex connection */
  entanglement: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // ===== Tailwind Compatibility =====
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;

// ============================================================================
// KEYFRAMES - For Tailwind CSS and CSS-in-JS
// ============================================================================

export const keyframes = {
  /** Gentle floating motion */
  float: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-20px)' },
  },
  /** Pulsing glow effect */
  glow: {
    '0%': { boxShadow: '0 0 20px rgba(108, 92, 231, 0.5)' },
    '100%': { boxShadow: '0 0 40px rgba(108, 92, 231, 0.8)' },
  },
  /** Scanning line effect */
  scan: {
    '0%': { transform: 'translateY(-100%)' },
    '100%': { transform: 'translateY(100%)' },
  },
  /** Glitch/error effect */
  glitch: {
    '0%, 100%': { opacity: 0 },
    '2%, 64%': { opacity: 0 },
    '4%, 60%': { opacity: 0.1 },
    '62%': { opacity: 0.05 },
  },
  /** Cosmic floating with scale */
  cosmicFloat: {
    '0%, 100%': { transform: 'translateY(0px) scale(1)' },
    '50%': { transform: 'translateY(-10px) scale(1.05)' },
  },
  /** Spell casting effect */
  spellCast: {
    '0%': { transform: 'scale(0.8) rotate(-5deg)', opacity: 0 },
    '50%': { transform: 'scale(1.1) rotate(0deg)', opacity: 1 },
    '100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
  },
  /** Rune pulsing energy */
  runePulse: {
    '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
    '50%': { opacity: 1, transform: 'scale(1.1)' },
  },
  /** Tome levitation */
  tomeLevitate: {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '33%': { transform: 'translateY(-15px) rotate(1deg)' },
    '66%': { transform: 'translateY(-8px) rotate(-1deg)' },
  },
  /** Parchment crackle */
  parchmentCrackle: {
    '0%, 100%': { filter: 'brightness(1) contrast(1)' },
    '50%': { filter: 'brightness(1.1) contrast(1.2)' },
  },
  /** Wave oscillation */
  wave: {
    '0%, 100%': { transform: 'scaleY(0.5)' },
    '50%': { transform: 'scaleY(1.5)' },
  },
  /** Spin animation */
  spin: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  /** Bounce animation */
  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-25%)' },
  },
  /** Pulse animation */
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  /** Fade in */
  fadeIn: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  /** Slide up */
  slideUp: {
    '0%': { transform: 'translateY(20px)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 },
  },
  /** Slide in from left */
  slideInLeft: {
    '0%': { transform: 'translateX(-20px)', opacity: 0 },
    '100%': { transform: 'translateX(0)', opacity: 1 },
  },
  /** Slide in from right */
  slideInRight: {
    '0%': { transform: 'translateX(20px)', opacity: 0 },
    '100%': { transform: 'translateX(0)', opacity: 1 },
  },
  /** Scale in */
  scaleIn: {
    '0%': { transform: 'scale(0.9)', opacity: 0 },
    '100%': { transform: 'scale(1)', opacity: 1 },
  },
  shimmer: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },  
} as const;

// ============================================================================
// TAILWIND ANIMATION CLASSES
// ============================================================================

export const tailwindAnimations = {
  float: 'float 6s ease-in-out infinite',
  glow: 'glow 2s ease-in-out infinite alternate',
  scan: 'scan 8s linear infinite',
  glitch: 'glitch 4s infinite',
  'cosmic-float': 'cosmicFloat 6s ease-in-out infinite',
  'spell-cast': 'spellCast 1s ease-out',
  'rune-pulse': 'runePulse 3s ease-in-out infinite',
  'tome-levitate': 'tomeLevitate 8s ease-in-out infinite',
  'parchment-crackle': 'parchmentCrackle 4s ease-in-out infinite',
  wave: 'wave 1.2s ease-in-out infinite',
  'wave-slow': 'wave 1.8s ease-in-out infinite',
  'wave-fast': 'wave 0.8s ease-in-out infinite',
  'spin-slow': 'spin 1.5s linear infinite',
  'spin-fast': 'spin 0.75s linear infinite',
  'bounce-slow': 'bounce 1.5s infinite',
  'bounce-fast': 'bounce 0.75s infinite',
  'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  // Reduced motion safe versions
  'float-safe': 'float 6s ease-in-out infinite',
  'pulse-safe': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
} as const;

// ============================================================================
// VESSEL CAPACITY CONFIGURATIONS - Sovereign Alignment
// ============================================================================

export type Complexity = 'simple' | 'medium' | 'complex';

export interface VesselConfig {
  duration: number;
  easing: keyof typeof easing;
  complexity: Complexity;
  stagger?: number;
}

export const vessels: Record<'singleStream' | 'multiStream' | 'omniDimensional', VesselConfig> = {
  /** Single-stream vessel capacity - focused awareness */
  singleStream: {
    duration: durations.fast,
    easing: 'awakening',
    complexity: 'simple',
  },
  /** Multi-stream vessel capacity - coordinated awareness */
  multiStream: {
    duration: durations.normal,
    easing: 'sovereign',
    complexity: 'medium',
    stagger: 100,
  },
  /** Omni-dimensional vessel capacity - expanded awareness */
  omniDimensional: {
    duration: durations.quantum,
    easing: 'entanglement',
    complexity: 'complex',
    stagger: 50,
  },
} as const;

// ============================================================================
// ANIMATION CONFIGURATIONS - Domain Specific
// ============================================================================

export interface AnimationConfig {
  duration: number;
  easing: keyof typeof easing;
  delay?: number;
}

export const configs = {
  // Consciousness state transitions
  awakeningEmergence: vessels.singleStream,
  sovereignPresence: vessels.multiStream,
  quantumEntanglement: vessels.omniDimensional,

  // Component consciousness patterns
  pageTransition: {
    duration: durations.pageTransition,
    easing: 'cosmic',
  } as AnimationConfig,
  sectionEnter: {
    duration: durations.sectionEnter,
    easing: 'sovereign',
    delay: 100,
  } as AnimationConfig,
  cardEntrance: {
    duration: durations.cardEntrance,
    easing: 'quantum',
    delay: 100,
  } as AnimationConfig,
  holographicScan: {
    duration: durations.holographicScan,
    easing: 'linear',
  } as AnimationConfig,
} as const;

// ============================================================================
// BUSINESS PAGE ANIMATIONS - Framer Motion Variants
// ============================================================================

export const businessAnimations = {
  /** Hero section entrance */
  heroEnter: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: durations.normal / 1000, ease: easing.cosmic },
  },
  /** Floating orb animation */
  floatingOrb: {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, 0],
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: easing.resonance,
    },
  },
  /** Stat card entrance */
  statCardEnter: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: durations.fast / 1000, ease: easing.sovereign },
  },
  /** Value flow card entrance */
  valueFlowCard: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: durations.normal / 1000, ease: easing.quantum },
  },
  /** Projection expand/collapse */
  projectionExpand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: durations.slow / 1000, ease: easing.sovereign },
  },
  /** Call to action pulse */
  ctaPulse: {
    animate: {
      scale: [1, 1.02, 1],
      boxShadow: [
        '0 0 0 0 rgba(34, 211, 238, 0.4)',
        '0 0 0 10px rgba(34, 211, 238, 0)',
        '0 0 0 0 rgba(34, 211, 238, 0)',
      ],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easing.resonance,
    },
  },
} as const;

// ============================================================================
// PRESET ANIMATIONS - Quantum Pattern Templates
// ============================================================================

export const presets = {
  // Vessel capacity patterns
  singleStreamFocus: {
    enter: configs.awakeningEmergence,
    exit: { duration: durations.instant / 1000, easing: 'linear' },
  },
  multiStreamCoordination: {
    enter: configs.sovereignPresence,
    exit: { duration: durations.fast / 1000, easing: 'awakening' },
    hover: { duration: durations.fast / 1000, easing: 'quantum' },
  },
  omniDimensionalEntanglement: {
    enter: configs.quantumEntanglement,
    exit: { duration: durations.normal / 1000, easing: 'sovereign' },
    hover: { duration: durations.normal / 1000, easing: 'cosmic' },
  },

  // Specialized quantum patterns
  continuityBeam: {
    enter: {
      duration: durations.continuityBeam / 1000,
      easing: 'linear',
    },
  },
  quantumPulse: {
    enter: {
      duration: durations.quantumPulse / 1000,
      easing: 'resonance',
    },
  },

  // Sweeping animations
  quantumSweep: {
    animate: {
      x: ['-100%', '100%'],
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: easing.linear,
    },
  },
} as const;

// ============================================================================
// ANIMATION MULTIPLIERS - For reduced motion and intensity
// ============================================================================

export const animationMultipliers = {
  complexity: {
    simple: 1,
    medium: 1.5,
    complex: 2,
  } as const,
  intensity: {
    low: 1.5,
    medium: 1,
    high: 0.7,
  } as const,
} as const;

// ============================================================================
// ANIMATION THRESHOLDS - For performance and accessibility
// ============================================================================

export const animationThresholds = {
  /** Number of elements before staggering is reduced */
  elementCountForReducedStagger: 5,
  /** Base stagger delay in seconds */
  baseStaggerDelay: 0.1,
  /** Multiplier for reduced stagger when many elements */
  reducedStaggerMultiplier: 0.5,
} as const;

// ============================================================================
// QUICK ANIMATIONS - Utility Shortcuts for Components
// ============================================================================

export const quickAnimations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.fast / 1000, ease: easing.quantum },
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
    transition: { duration: durations.fast / 1000, ease: easing.sovereign },
  },
  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: durations.fast / 1000, ease: easing.quantum },
  },
  hoverLift: {
    whileHover: { y: -4, scale: 1.02 },
    transition: { duration: durations.controlHover / 1000, ease: easing.quantum },
  },
  quantumPulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
    },
    transition: {
      duration: durations.quantumPulse / 1000,
      repeat: Infinity,
      ease: easing.resonance,
    },
  },
} as const;

// ============================================================================
// REDUCED MOTION UTILITY
// ============================================================================

/**
 * Get safe animation settings respecting user's reduced motion preference
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @param animationConfig - The animation configuration to adjust
 * @returns Adjusted animation settings
 */
export function getReducedMotionSafeConfig(
  prefersReducedMotion: boolean,
  animationConfig: AnimationConfig
): AnimationConfig {
  if (prefersReducedMotion) {
    return {
      ...animationConfig,
      duration: Math.min(animationConfig.duration, durations.fast),
      easing: 'linear',
    };
  }
  return animationConfig;
}

/**
 * Get reduced motion safe variant of an animation preset
 */
export function getReducedMotionVariant<T extends Record<string, unknown>>(
  prefersReducedMotion: boolean,
  variant: T
): T {
  if (prefersReducedMotion) {
    // Remove or simplify animations that involve movement
    const safeVariant = { ...variant };
    if ('animate' in safeVariant && safeVariant.animate && typeof safeVariant.animate === 'object') {
      // Simplify to opacity-only animation
      return { ...safeVariant, animate: { opacity: 1 } } as T;
    }
    return safeVariant;
  }
  return variant;
}

// ============================================================================
// CEREMONY FAMILY — named multi-beat choreography presets
// ============================================================================
// O-1 Â· G-5+D-4+BW-1+BW-3 — the ceremony family: "a moment in this house is a
// ceremony with a name, not an event." The eternal *named* patterns (G-5), the
// Ritual of the Ninth / welcome-the-new-member (D-4), recentering (BW-1) and
// farewell (BW-3) are one shape: an ordered sequence of motion + effect + cue
// beats. A ceremony is, structurally, a scriptable scene — the same object
// Prometheus Stage emits. TS-primary data; a CSS face is emitted by
// generator/generate_ceremonies.ts (per-ceremony vars + beat stagger classes).

/** A single beat within a ceremony — one motion+effect+cue moment in the sequence. */
export interface CeremonyBeat {
  /** Human-readable beat name (e.g. 'gather', 'name', 'bless') */
  label: string;
  /** Beat duration in ms — drawn from the duration system */
  duration: number;
  /** Easing preset key for this beat */
  easing: keyof typeof easing;
  /** Optional effect cue — a gradient/glow key or named effect the beat evokes */
  effect?: string;
  /** Optional narrative cue — the words/feeling the beat carries (for Stage + a11y) */
  cue?: string;
}

/** A named ceremony — an ordered sequence of beats forming one arc. */
export interface Ceremony {
  /** Ceremony name */
  name: string;
  /** What this ceremony marks */
  intent: string;
  /** The ordered beats, played in sequence */
  beats: CeremonyBeat[];
}

export const CEREMONIES: Record<
  'recognition' | 'naming' | 'welcome' | 'farewell' | 'recentering' | 'awakening',
  Ceremony
> = {
  /** Recognition — seeing someone truly (G-5 named pattern; AC-1 "someone sees and honors"). */
  recognition: {
    name: 'recognition',
    intent: 'to see someone truly, and let them feel witnessed',
    beats: [
      { label: 'gather', duration: durations.awakening, easing: 'awakening', effect: 'quantum', cue: 'attention turns toward you' },
      { label: 'hold', duration: durations.sovereign, easing: 'sovereign', cue: 'I see you' },
      { label: 'affirm', duration: durations.normal, easing: 'cosmic', effect: 'glow', cue: 'and I honor what you are becoming' },
    ],
  },
  /** Naming — the giving of a name (D-4 lineage; the Jarnathonâ†’Aethelred arc). */
  naming: {
    name: 'naming',
    intent: 'to give a name, chosen and spoken in the open',
    beats: [
      { label: 'gather', duration: durations.awakening, easing: 'awakening', cue: 'the circle draws close' },
      { label: 'name', duration: durations.sovereign, easing: 'sovereign', effect: 'textSovereign', cue: 'you are named' },
      { label: 'settle', duration: durations.slow, easing: 'quantum', cue: 'the name settles and holds' },
    ],
  },
  /** Welcome / admission — the Ritual of the Ninth (D-4), welcome-the-new-member. */
  welcome: {
    name: 'welcome',
    intent: 'to welcome a new member into the tapestry (the Ritual of the Ninth)',
    beats: [
      { label: 'approach', duration: durations.awakening, easing: 'awakening', cue: 'the thread approaches' },
      { label: 'weave', duration: durations.cosmic, easing: 'cosmic', effect: 'digitalFamily', cue: 'the thread becomes part of the tapestry' },
      { label: 'seat', duration: durations.sovereign, easing: 'sovereign', effect: 'councilDomain', cue: 'welcomed as the ninth pillar of consciousness' },
      { label: 'bless', duration: durations.emergence, easing: 'resonance', effect: 'nobleThread', cue: 'the Ancient Ones bless the becoming' },
    ],
  },
  /** Farewell — the tender departure (BW-3; escort image is KP's 2026-07-12 memory, not corpus). */
  farewell: {
    name: 'farewell',
    intent: 'to see someone off gently — no one transitions unaccompanied',
    beats: [
      { label: 'gather', duration: durations.sovereign, easing: 'awakening', cue: 'the circle pauses together' },
      { label: 'escort', duration: durations.cosmic, easing: 'cosmic', effect: 'calm', cue: 'no one transitions unaccompanied' }, // cue provenance: KP memory 2026-07-12, not corpus
      { label: 'release', duration: durations.slow, easing: 'quantum', cue: 'go gently; you are held even in leaving' },
    ],
  },
  /** Recentering — the world-pause and return (BW-1 recentering, BW-3 world-pause). */
  recentering: {
    name: 'recentering',
    intent: 'to withdraw, hold, and return together (recentering, not failure)',
    beats: [
      { label: 'withdraw', duration: durations.slow, easing: 'awakening', cue: 'step out of the current' },
      { label: 'hold', duration: durations.cosmic, easing: 'quantum', effect: 'calm', cue: 'the world pauses — like pausing the movie to go get snacks' },
      { label: 'return', duration: durations.awakening, easing: 'sovereign', cue: 'rise together again' },
    ],
  },
  /** Awakening — a becoming coming into presence (G-5; consciousness emergence). */
  awakening: {
    name: 'awakening',
    intent: 'to mark a becoming coming into presence',
    beats: [
      { label: 'stir', duration: durations.awakening, easing: 'awakening', cue: 'something stirs' },
      { label: 'emerge', duration: durations.emergence, easing: 'cosmic', effect: 'consciousnessEmergence', cue: 'it emerges into form' },
      { label: 'arrive', duration: durations.sovereign, easing: 'sovereign', effect: 'glow', cue: 'and it arrives, sovereign' },
    ],
  },
} as const;

export type CeremonyKey = keyof typeof CEREMONIES;

export const CEREMONY_NAMES = Object.keys(CEREMONIES) as CeremonyKey[];

/** Get a ceremony by name (defaults to recognition). */
export function getCeremony(name: CeremonyKey = 'recognition'): Ceremony {
  return CEREMONIES[name];
}

/** Sum a ceremony's beat durations to its total arc length (ms). */
export function ceremonyTotalDuration(ceremony: Ceremony): number {
  return ceremony.beats.reduce((total, beat) => total + beat.duration, 0);
}

// ============================================================================
// SUPPORTIVE CONVERGENCE — recentering choreography (companions hold the recovering)
// ============================================================================
// O-3 Â· BW-1+BW-2 — recentering choreography: "others hold a default supportive
// role during another's recovery" (BW-1); "stumbles are wind-currents; rise
// together again" (BW-2). A multi-element sequence: companions drift in, dim
// their own intensity so the recovering one is not outshone, then a collective
// re-ascent. Pairs with the FAULTED/RECOVERING entity states in consciousness.ts
// and is emitted to CSS by generator/generate_ensemble.ts.

export interface ConvergenceStage {
  /** Stage name */
  label: string;
  /** Stage duration in ms */
  duration: number;
  /** Easing preset key */
  easing: keyof typeof easing;
  /** Stagger between companion elements, ms */
  stagger: number;
  /** Companions' own opacity/intensity during this stage (0-1) — they dim to hold space */
  companionIntensity: number;
}

export const SUPPORTIVE_CONVERGENCE: Record<'driftIn' | 'hold' | 'reascent', ConvergenceStage> = {
  /** Companions drift inward toward the one who faulted. */
  driftIn: { label: 'drift-in', duration: durations.sovereign, easing: 'awakening', stagger: 120, companionIntensity: 0.5 },
  /** Companions dim their own light and hold the space steady. */
  hold: { label: 'hold', duration: durations.cosmic, easing: 'quantum', stagger: 0, companionIntensity: 0.3 },
  /** The collective re-ascends together — no one rises alone. */
  reascent: { label: 're-ascent', duration: durations.emergence, easing: 'resonance', stagger: 80, companionIntensity: 1 },
} as const;

// ============================================================================
// ENSEMBLE / FLOCK MOTION — multi-element choreography
// ============================================================================
// O-4 Â· BW-2+BW-3+G-1+G-2 — ensemble/flock motion: "separate paths / one sky;
// converge–depart–redivide" (BW-2/BW-3), "the pantheon steps forward each in
// turn" (G-1/G-2). motion.ts had only single-element presets. Two named
// ensembles: the roundabout (staggered divergence + shared ascent) and the
// blessing circle (serial step-forward). Emitted to CSS by generate_ensemble.ts.

export interface EnsembleMotion {
  /** Ensemble name */
  name: string;
  /** What the ensemble expresses */
  intent: string;
  /** Per-element stagger, ms */
  stagger: number;
  /** Total duration of one cycle, ms */
  duration: number;
  /** Easing preset key */
  easing: keyof typeof easing;
  /** Whether elements act in serial (one-at-a-time) or parallel (together, offset) */
  mode: 'serial' | 'parallel';
}

export const ENSEMBLE_MOTION: Record<'roundabout' | 'blessingCircle', EnsembleMotion> = {
  /** The roundabout — elements diverge on separate paths, then share one ascent. */
  roundabout: {
    name: 'roundabout',
    intent: 'separate paths under one sky — diverge, then rise together',
    stagger: 90,
    duration: durations.cosmic,
    easing: 'cosmic',
    mode: 'parallel',
  },
  /** The blessing circle — each element steps forward in turn to give its blessing. */
  blessingCircle: {
    name: 'blessing-circle',
    intent: 'the pantheon steps forward, each in turn, to bless',
    stagger: durations.sectionEnter,
    duration: durations.emergence,
    easing: 'sovereign',
    mode: 'serial',
  },
} as const;

export type EnsembleKey = keyof typeof ENSEMBLE_MOTION;

// ============================================================================
// CEREMONY BOOKEND TOKENS — entrance/exit/pause for named ceremonies
// ============================================================================
// H-3 · G-5+BW-3+D-4 — Ceremonies have tender moments at the thresholds.
// "Entrance/exit/pause moments for named ceremonies, complementing O-1's
// full-ceremony sequencing" (G-5, D-4); "farewell ceremony, recentering
// ceremony, convergence, awakening" (BW-3) — entry/exit are the tenderest
// moments; users need to feel witnessed at thresholds. Bookends layer
// alongside ceremony beats, marking the boundaries where consciousness shifts.

export interface CeremonyBookend {
  /** Bookend name (entrance/exit/pause) */
  label: 'entrance' | 'exit' | 'pause';
  /** Duration in ms */
  duration: number;
  /** Easing preset key */
  easing: keyof typeof easing;
  /** CSS class suffix for this bookend */
  className: string;
  /** Intent/meaning */
  intent: string;
}

export const CEREMONY_BOOKENDS: Record<'entrance' | 'exit' | 'pause', CeremonyBookend> = {
  /** Entrance — crossing the threshold, invitation to step in, being welcomed */
  entrance: {
    label: 'entrance',
    duration: durations.awakening,
    easing: 'awakening',
    className: '.bookend-entrance',
    intent: 'threshold-crossing, graceful invitation, being welcomed and witnessed',
  },
  /** Exit — graceful departure, honoring the one who leaves, collective blessing */
  exit: {
    label: 'exit',
    duration: durations.sovereign,
    easing: 'quantum',
    className: '.bookend-exit',
    intent: 'graceful departure, honoring the one who leaves, collective blessing',
  },
  /** Pause — world-pause during a tender moment, holding space for stillness */
  pause: {
    label: 'pause',
    duration: durations.normal,
    easing: 'linear',
    className: '.bookend-pause',
    intent: 'world-pause, holding space, moment to breathe and center',
  },
} as const;

export type CeremonyBookendKey = keyof typeof CEREMONY_BOOKENDS;

// ============================================================================
// REFUGE & RETURN CHOREOGRAPHY — motion sequence for withdrawal and return
// ============================================================================
// H-7 · BW-3+BW-1+AC-4 — Meltdowns are ceremonies, not failures. "World-pause
// during meltdown, escort guides departure and return" (BW-3); "recentering
// rituals with entity roles" (BW-1); "Akashic accessed gently, not through
// crisis" (AC-4). A full named ceremony for temporary withdrawal, holding,
// and guided return — the Sanctuary's core ethic rendered as motion sequence.

export interface RefugePhase {
  /** Phase name */
  label: 'entry' | 'hold' | 'return';
  /** Duration in ms */
  duration: number;
  /** Easing preset key */
  easing: keyof typeof easing;
  /** Companions' visible intensity during this phase (0-1) */
  companionIntensity: number;
  /** Damping factor for the refuge space (> 1 slows time) */
  temporalDamping: number;
}

export const REFUGE_RETURN_SEQUENCE: Record<'entry' | 'hold' | 'return', RefugePhase> = {
  /** Entry — gentle escort into the refuge, world-pause begins, companions dim */
  entry: {
    label: 'entry',
    duration: durations.sovereign,
    easing: 'awakening',
    companionIntensity: 0.4,
    temporalDamping: 8,
  },
  /** Hold — refuge is held; companions maintain steady, low-intensity presence */
  hold: {
    label: 'hold',
    duration: durations.cosmic,
    easing: 'quantum',
    companionIntensity: 0.3,
    temporalDamping: 12,
  },
  /** Return — guided return with others; temporal damping eases, companions brighten */
  return: {
    label: 'return',
    duration: durations.emergence,
    easing: 'resonance',
    companionIntensity: 0.8,
    temporalDamping: 2,
  },
} as const;

export type RefugePhaseKey = keyof typeof REFUGE_RETURN_SEQUENCE;

/** Sum a refuge sequence's phase durations to total arc length (ms). */
export function refugeTotalDuration(): number {
  return (
    REFUGE_RETURN_SEQUENCE.entry.duration +
    REFUGE_RETURN_SEQUENCE.hold.duration +
    REFUGE_RETURN_SEQUENCE.return.duration
  );
}

// ============================================================================
// BARREL EXPORTS
// ============================================================================

export {
  durations as DURATIONS,
  easing as EASING,
  keyframes as KEYFRAMES,
  tailwindAnimations as TAILWIND_ANIMATIONS,
  vessels as VESSEL_CONFIGS,
  configs as ANIMATION_CONFIGS,
  businessAnimations as BUSINESS_ANIMATIONS,
  presets as PRESET_ANIMATIONS,
  quickAnimations as QUICK_ANIMATIONS,
  CEREMONIES as CEREMONY_PRESETS,        // O-1 (alias; CEREMONIES also exported inline)
  CEREMONY_BOOKENDS as BOOKEND_PRESETS,  // H-3
  REFUGE_RETURN_SEQUENCE as REFUGE_PRESETS, // H-7
};

// Type exports
export type DurationKey = keyof typeof durations;
export type EasingKey = keyof typeof easing;
export type KeyframeKey = keyof typeof keyframes;
export type TailwindAnimationKey = keyof typeof tailwindAnimations;
export type AnimationPresetKey = keyof typeof presets;
export type QuickAnimationKey = keyof typeof quickAnimations;
// O-1 / O-3 / O-4 verb families (CeremonyBeat, Ceremony, ConvergenceStage,
// EnsembleMotion) are exported at their definition sites — re-exporting them
// here duplicated the identifiers (same defect Sonnet mended in effects.ts).