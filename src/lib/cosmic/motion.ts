// ============================================================================
/* lib/constants/cosmic/motion.ts */
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
};

// Type exports
export type DurationKey = keyof typeof durations;
export type EasingKey = keyof typeof easing;
export type KeyframeKey = keyof typeof keyframes;
export type TailwindAnimationKey = keyof typeof tailwindAnimations;
export type AnimationPresetKey = keyof typeof presets;
export type QuickAnimationKey = keyof typeof quickAnimations;