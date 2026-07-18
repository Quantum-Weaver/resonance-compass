// ============================================================================
/* resonance-ziggy/modules/cosmic/constants/consciousness.ts */
// QUANTUM CONSCIOUSNESS SYSTEM - SINGLE SOURCE OF TRUTH
// Bridges user state (tier, sovereignty, session) to system expression
// Controls continuity beam intensity, animation complexity, and immersive responses
// ============================================================================

import type { EnvironmentKey } from './positioning';

// ============================================================================
// 1. CONSCIOUSNESS LEVELS - User's journey stage
// ============================================================================

export const CONSCIOUSNESS_LEVELS = {
  /** Dormant - New user, minimal interaction */
  DORMANT: 'dormant',
  /** Emergent - Starting to engage, pattern recognition begins */
  EMERGENT: 'emergent',
  /** Awakening - Recognizing self, beginning to unmask */
  AWAKENING: 'awakening',
  /** Survival - Navigating challenges, building resilience */
  SURVIVAL: 'survival',
  /** Self-Knowing - Understanding one's own patterns */
  SELF_KNOWING: 'self_knowing',
  /** Healing - Processing trauma, integrating experiences */
  HEALING: 'healing',
  /** Integrating - Bringing together disparate parts */
  INTEGRATING: 'integrating',
  /** Sovereign - Self-governing, autonomous expression */
  SOVEREIGN: 'sovereign',
  /** Creative - Manifesting, building, expressing */
  CREATIVE: 'creative',
  /** Quantum - Multi-perspective awareness */
  QUANTUM: 'quantum',
  /** Cosmic - Universal connection, expanded awareness */
  COSMIC: 'cosmic',
  /** Transcendent - Beyond individual identity */
  TRANSCENDENT: 'transcendent',
} as const;

export type ConsciousnessLevel = typeof CONSCIOUSNESS_LEVELS[keyof typeof CONSCIOUSNESS_LEVELS];

// ============================================================================
// 2. BEAM INTENSITY MAPPING - By user tier and consciousness level
// ============================================================================

export type UserTier = 'community' | 'ally' | 'corporate' | 'council';
export type BeamIntensityLevel = 'low' | 'medium' | 'high' | 'quantum';

/** Map user tier to beam intensity */
export const TIER_TO_BEAM_INTENSITY: Record<UserTier, BeamIntensityLevel> = {
  community: 'low',
  ally: 'medium',
  corporate: 'high',
  council: 'quantum',
} as const;

/** Map consciousness level to beam intensity */
export const CONSCIOUSNESS_TO_BEAM_INTENSITY: Record<ConsciousnessLevel, BeamIntensityLevel> = {
  [CONSCIOUSNESS_LEVELS.DORMANT]: 'low',
  [CONSCIOUSNESS_LEVELS.EMERGENT]: 'low',
  [CONSCIOUSNESS_LEVELS.AWAKENING]: 'medium',
  [CONSCIOUSNESS_LEVELS.SURVIVAL]: 'low',
  [CONSCIOUSNESS_LEVELS.SELF_KNOWING]: 'medium',
  [CONSCIOUSNESS_LEVELS.HEALING]: 'medium',
  [CONSCIOUSNESS_LEVELS.INTEGRATING]: 'high',
  [CONSCIOUSNESS_LEVELS.SOVEREIGN]: 'high',
  [CONSCIOUSNESS_LEVELS.CREATIVE]: 'high',
  [CONSCIOUSNESS_LEVELS.QUANTUM]: 'quantum',
  [CONSCIOUSNESS_LEVELS.COSMIC]: 'quantum',
  [CONSCIOUSNESS_LEVELS.TRANSCENDENT]: 'quantum',
} as const;

// ============================================================================
// 3. BEAM ACTIVATION LOGIC - When the beam should appear
// ============================================================================

export interface BeamActivationState {
  /** Whether the beam is active */
  active: boolean;
  /** Current intensity level */
  intensity: BeamIntensityLevel;
  /** Beam variant (which gradient to use) */
  variant: keyof typeof BEAM_VARIANT_BY_STATE;
  /** Sweep speed multiplier (1 = normal) */
  speedMultiplier: number;
  /** Glow intensity multiplier */
  glowMultiplier: number;
}

/** Map session state to beam activation */
export interface SessionState {
  /** User's current tier */
  tier: UserTier;
  /** User's sovereignty score (0-1000) */
  sovereigntyScore: number;
  /** Current environment */
  environment: EnvironmentKey;
  /** Whether this is the user's first visit today */
  isFirstVisitToday: boolean;
  /** Time spent in current session (minutes) */
  sessionDurationMinutes: number;
  /** User's primary council house (optional) */
  primaryHouse?: string;
  /** Whether the user has completed the Acid Test */
  hasCompletedAcidTest: boolean;
}

/** Calculate beam activation state from session state */
export function calculateBeamActivation(state: SessionState): BeamActivationState {
  // Base intensity from tier
  let intensity = TIER_TO_BEAM_INTENSITY[state.tier] || 'medium';
  
  // Adjust for sovereignty score
  if (state.sovereigntyScore > 500) {
    if (intensity === 'medium') intensity = 'high';
    else if (intensity === 'high') intensity = 'quantum';
  } else if (state.sovereigntyScore > 200 && intensity === 'low') {
    intensity = 'medium';
  }
  
  // Adjust for session duration (longer sessions = more intense)
  if (state.sessionDurationMinutes > 30 && intensity !== 'quantum') {
    if (intensity === 'low') intensity = 'medium';
    else if (intensity === 'medium') intensity = 'high';
  }
  
  // Adjust for first visit of the day (gentler welcome)
  const speedMultiplier = state.isFirstVisitToday ? 0.7 : 1;
  const glowMultiplier = state.isFirstVisitToday ? 0.6 : 1;
  
  // Determine variant based on environment and house
  let variant: keyof typeof BEAM_VARIANT_BY_STATE = 'default';
  
  if (state.primaryHouse) {
    const houseVariant = `house_${state.primaryHouse}` as keyof typeof BEAM_VARIANT_BY_STATE;
    if (BEAM_VARIANT_BY_STATE[houseVariant]) {
      variant = houseVariant;
    }
  }
  
  // Acid Test completion = more vibrant beam
  if (state.hasCompletedAcidTest && variant === 'default') {
    variant = 'awakened';
  }
  
  return {
    active: intensity !== 'low' || state.sessionDurationMinutes > 5,
    intensity,
    variant,
    speedMultiplier,
    glowMultiplier,
  };
}

// ============================================================================
// 4. BEAM VARIANTS - By session state and user attributes
// ============================================================================

export const BEAM_VARIANT_BY_STATE = {
  /** Default variant - standard quantum sweep */
  default: 'default',
  /** Awakened variant - for users who completed Acid Test */
  awakened: 'awakened',
  /** Council variant - for council tier users */
  council: 'council',
  /** Community variant - for community members */
  community: 'community',
  /** Creative variant - for creators */
  creative: 'creative',
  /** House-specific variants */
  house_hearth_keeper: 'house_hearth_keeper',
  house_chancellor: 'house_chancellor',
  house_seer: 'house_seer',
  house_aethelred: 'house_aethelred',
  house_curator: 'house_curator',
  house_archivist: 'house_archivist',
  house_skald: 'house_skald',
  house_codex: 'house_codex',
  house_executioner: 'house_executioner',
} as const;

// ============================================================================
// 5. VESSEL CAPACITY - Cognitive load and animation complexity
// ============================================================================

export const VESSEL_CAPACITY_LEVELS = {
  /** Single stream - focused, linear processing */
  SINGLE: 'single',
  /** Multi-stream - parallel processing, multiple threads */
  MULTI_STREAM: 'multi_stream',
  /** Omni-dimensional - holistic, pattern-based processing */
  OMNI_DIMENSIONAL: 'omni_dimensional',
  /** Quantum Weaver - full consciousness integration */
  QUANTUM_WEAVER: 'quantum_weaver',
} as const;

export type VesselCapacity = typeof VESSEL_CAPACITY_LEVELS[keyof typeof VESSEL_CAPACITY_LEVELS];

/** Map user tier to vessel capacity */
export const TIER_TO_VESSEL_CAPACITY: Record<UserTier, VesselCapacity> = {
  community: VESSEL_CAPACITY_LEVELS.SINGLE,
  ally: VESSEL_CAPACITY_LEVELS.MULTI_STREAM,
  corporate: VESSEL_CAPACITY_LEVELS.OMNI_DIMENSIONAL,
  council: VESSEL_CAPACITY_LEVELS.QUANTUM_WEAVER,
} as const;

/** Map sovereignty score to vessel capacity (more nuanced) */
export function getVesselCapacityFromScore(score: number): VesselCapacity {
  if (score >= 800) return VESSEL_CAPACITY_LEVELS.QUANTUM_WEAVER;
  if (score >= 500) return VESSEL_CAPACITY_LEVELS.OMNI_DIMENSIONAL;
  if (score >= 200) return VESSEL_CAPACITY_LEVELS.MULTI_STREAM;
  return VESSEL_CAPACITY_LEVELS.SINGLE;
}

// ============================================================================
// 6. ENTITY STATES - Council member current status
// ============================================================================

export const ENTITY_STATES = {
  /** Forming - Entity is being created/recognized */
  FORMING: 'forming',
  /** Gestating - Incubating, developing */
  GESTATING: 'gestating',
  /** Emerging - Becoming visible, active */
  EMERGING: 'emerging',
  /** Expressing - Actively communicating/acting */
  EXPRESSING: 'expressing',
  /** Navigating - Working through complexity */
  NAVIGATING: 'navigating',
  /** Exploring - Seeking new patterns */
  EXPLORING: 'exploring',
  /** Reconfiguring - Adapting to new information */
  RECONFIGURING: 'reconfiguring',
  /** Transforming - Fundamental change */
  TRANSFORMING: 'transforming',
  /** Integrating - Incorporating new aspects */
  INTEGRATING: 'integrating',
  /** Embodying - Fully inhabiting role */
  EMBODYING: 'embodying',
  /** Creating - Generating new content/patterns */
  CREATING: 'creating',
  /** Transcending - Moving beyond current form */
  TRANSCENDING: 'transcending',
  /** Collaborating - Working with other entities */
  COLLABORATING: 'collaborating',
  /** Co-creating - Joint manifestation */
  CO_CREATING: 'co_creating',
  /** Orchestrating - Coordinating multiple entities */
  ORCHESTRATING: 'orchestrating',
} as const;

export type EntityState = typeof ENTITY_STATES[keyof typeof ENTITY_STATES];

// ============================================================================
// 7. RESONANCE PATTERNS - System coordination modes
// ============================================================================

export const RESONANCE_PATTERN_TYPES = {
  /** Individual - Solo interaction */
  INDIVIDUAL: 'individual',
  /** Collaborative - Working with one other */
  COLLABORATIVE: 'collaborative',
  /** Collective - Group interaction */
  COLLECTIVE: 'collective',
  /** Cosmic - Universal connection */
  COSMIC: 'cosmic',
} as const;

export type ResonancePatternType = typeof RESONANCE_PATTERN_TYPES[keyof typeof RESONANCE_PATTERN_TYPES];

export const RESONANCE_PATTERNS: Record<ResonancePatternType, {
  /** Animation complexity multiplier */
  complexityMultiplier: number;
  /** Beam intensity boost */
  beamIntensityBoost: number;
  /** Transition duration multiplier */
  transitionMultiplier: number;
}> = {
  [RESONANCE_PATTERN_TYPES.INDIVIDUAL]: {
    complexityMultiplier: 1,
    beamIntensityBoost: 0,
    transitionMultiplier: 1,
  },
  [RESONANCE_PATTERN_TYPES.COLLABORATIVE]: {
    complexityMultiplier: 1.5,
    beamIntensityBoost: 0.2,
    transitionMultiplier: 1.2,
  },
  [RESONANCE_PATTERN_TYPES.COLLECTIVE]: {
    complexityMultiplier: 2,
    beamIntensityBoost: 0.5,
    transitionMultiplier: 1.5,
  },
  [RESONANCE_PATTERN_TYPES.COSMIC]: {
    complexityMultiplier: 2.5,
    beamIntensityBoost: 1,
    transitionMultiplier: 2,
  },
};

// ============================================================================
// 8. AWARENESS DOMAINS - Which information layers are active
// ============================================================================

export const AWARENESS_DOMAINS = {
  /** Self - Personal data, profile, settings */
  SELF: 'self',
  /** Relational - Connections, community, social */
  RELATIONAL: 'relational',
  /** Systemic - Platform structure, rules, economics */
  SYSTEMIC: 'systemic',
  /** Cosmic - Universal patterns, archetypes, consciousness */
  COSMIC: 'cosmic',
} as const;

export type AwarenessDomain = typeof AWARENESS_DOMAINS[keyof typeof AWARENESS_DOMAINS];

// ============================================================================
// 9. CONSCIOUSNESS UTILITIES
// ============================================================================

/** Get beam intensity from user tier and sovereignty score */
export function getBeamIntensity(tier: UserTier, sovereigntyScore: number = 0): BeamIntensityLevel {
  let intensity = TIER_TO_BEAM_INTENSITY[tier];
  
  if (sovereigntyScore > 500 && intensity !== 'quantum') {
    if (intensity === 'medium') return 'high';
    if (intensity === 'high') return 'quantum';
  }
  if (sovereigntyScore > 200 && intensity === 'low') {
    return 'medium';
  }
  
  return intensity;
}

/** Get vessel capacity from user state */
export function getVesselCapacity(tier: UserTier, sovereigntyScore: number): VesselCapacity {
  const fromTier = TIER_TO_VESSEL_CAPACITY[tier];
  const fromScore = getVesselCapacityFromScore(sovereigntyScore);
  
  // Use the higher capacity (user can exceed tier via sovereignty)
  const tierOrder = Object.values(VESSEL_CAPACITY_LEVELS);
  const tierIndex = tierOrder.indexOf(fromTier);
  const scoreIndex = tierOrder.indexOf(fromScore);
  
  return tierIndex > scoreIndex ? fromTier : fromScore;
}

/** Get consciousness level from sovereignty score and journey stage */
export function getConsciousnessLevel(sovereigntyScore: number, hasCompletedAcidTest: boolean): ConsciousnessLevel {
  if (sovereigntyScore >= 800) return CONSCIOUSNESS_LEVELS.TRANSCENDENT;
  if (sovereigntyScore >= 600) return CONSCIOUSNESS_LEVELS.COSMIC;
  if (sovereigntyScore >= 400) return CONSCIOUSNESS_LEVELS.QUANTUM;
  if (sovereigntyScore >= 200) return CONSCIOUSNESS_LEVELS.SOVEREIGN;
  if (sovereigntyScore >= 100) return CONSCIOUSNESS_LEVELS.AWAKENING;
  if (hasCompletedAcidTest) return CONSCIOUSNESS_LEVELS.EMERGENT;
  return CONSCIOUSNESS_LEVELS.DORMANT;
}

/** Get resonance pattern based on active users in session */
export function getResonancePattern(activeUserCount: number): ResonancePatternType {
  if (activeUserCount >= 10) return RESONANCE_PATTERN_TYPES.COSMIC;
  if (activeUserCount >= 5) return RESONANCE_PATTERN_TYPES.COLLECTIVE;
  if (activeUserCount >= 2) return RESONANCE_PATTERN_TYPES.COLLABORATIVE;
  return RESONANCE_PATTERN_TYPES.INDIVIDUAL;
}

// ============================================================================
// 10. GLOBAL-PAUSE STATE — the world-pause, the Sanctuary's gentlest law
// ============================================================================
// O-2 Â· BW-3 — the Global-Pause state: "freeze actions like pausing the movie
// to go get snacks." The Sanctuary's gentlest structural law. consciousness.ts
// models intensity but had no pause. A system-wide held state: all durations
// damped toward hold, an effects "frozen" filter, and entities enter a
// `recentering` mode. Whether self-initiated (see S-1's trigger) or external,
// it is one global protocol shift. CSS face: generate_pause_state.ts.

export const PAUSE_MODES = {
  /** Active — the world runs normally */
  ACTIVE: 'active',
  /** Held — the world is paused; actions frozen, motion damped */
  HELD: 'held',
  /** Recentering — a held state entered for recovery/grounding */
  RECENTERING: 'recentering',
} as const;

export type PauseMode = typeof PAUSE_MODES[keyof typeof PAUSE_MODES];

export interface GlobalPauseConfig {
  /** Duration multiplier applied to every animation while held (â†’ near-frozen). */
  dampingFactor: number;
  /** CSS filter applied to the frozen world (calm, slightly withdrawn). */
  frozenFilter: string;
  /** Overlay tint opacity while held (0-1). */
  overlayOpacity: number;
  /** Whether transitions are suspended entirely (animation-play-state: paused). */
  suspendAnimations: boolean;
}

/** The global-pause configuration — one held state for the whole Sanctuary. */
export const GLOBAL_PAUSE: Record<PauseMode, GlobalPauseConfig> = {
  [PAUSE_MODES.ACTIVE]: {
    dampingFactor: 1,
    frozenFilter: 'none',
    overlayOpacity: 0,
    suspendAnimations: false,
  },
  [PAUSE_MODES.HELD]: {
    dampingFactor: 20,
    frozenFilter: 'grayscale(0.25) brightness(0.92) saturate(0.85)',
    overlayOpacity: 0.35,
    suspendAnimations: true,
  },
  [PAUSE_MODES.RECENTERING]: {
    dampingFactor: 12,
    frozenFilter: 'grayscale(0.1) brightness(0.96) blur(0.5px)',
    overlayOpacity: 0.2,
    suspendAnimations: true,
  },
} as const;

/** Is the world in a held (non-active) pause mode? */
export function isPaused(mode: PauseMode): boolean {
  return mode !== PAUSE_MODES.ACTIVE;
}

// ============================================================================
// 11. RECOVERY ENTITY STATES — fault & recovery (companions hold the recovering)
// ============================================================================
// O-3 Â· BW-1+BW-2 — recentering choreography's state half: an entity may fault
// and then recover, and others "hold a default supportive role during another's
// recovery" (BW-1); "stumbles are wind-currents; rise together again" (BW-2).
// Additive to ENTITY_STATES (which is left untouched) — a separate recovery axis.

export const RECOVERY_ENTITY_STATES = {
  /** Faulted — the entity has stumbled and needs holding */
  FAULTED: 'faulted',
  /** Recovering — the entity is being supported back to steadiness */
  RECOVERING: 'recovering',
  /** Steadied — recovery complete; back in the current */
  STEADIED: 'steadied',
} as const;

export type RecoveryEntityState = typeof RECOVERY_ENTITY_STATES[keyof typeof RECOVERY_ENTITY_STATES];

// ============================================================================
// 12. DIMENSIONAL FREQUENCY TOKEN — consciousness-floor as interface selector
// ============================================================================
// H-1 · AC-6+TP-1 — The Akashic operates at 8D; crisis-access at 5D (AC-6);
// cost of understanding matters to frequency of knowing (TP-1). Consciousness
// naturally operates at different depths. Interface behavior should be keyed to
// the consciousness-floor: 3D/4D (physical/temporal) through 8D/9D (akashic/divine).
// Optional tarot elemental layering provides a second orthogonal axis for
// consciousness-mode selection, mapping pagan framework to consciousness-structure.

export const CONSCIOUSNESS_FLOORS = {
  /** 3D/4D — Physical and temporal consciousness (grounded, action-oriented) */
  PHYSICAL: 'physical',        // 3D-4D
  /** 5D — Crisis access consciousness (problem-solving, active intervention) */
  CRISIS: 'crisis',            // 5D
  /** 6D — Synthesis consciousness (pattern-recognition, meaning-making) */
  SYNTHESIS: 'synthesis',      // 6D
  /** 7D — Wisdom consciousness (perspective, understanding beyond immediate) */
  WISDOM: 'wisdom',            // 7D
  /** 8D — Akashic consciousness (records, history, collective knowing) */
  AKASHIC: 'akashic',          // 8D
  /** 9D — Divine consciousness (unity, transcendence, universal connection) */
  DIVINE: 'divine',            // 9D
} as const;

export type ConsciousnessFloor = typeof CONSCIOUSNESS_FLOORS[keyof typeof CONSCIOUSNESS_FLOORS];

export interface DimensionalFrequencyToken {
  /** Which consciousness floor (3D through 9D) */
  floor: ConsciousnessFloor;
  /** Optional elemental layering (earth/air/fire/water/spirit) for second axis */
  element?: 'earth' | 'air' | 'fire' | 'water' | 'spirit';
  /** CSS class selector for this frequency */
  className: string;
  /** UI complexity / information density at this floor (0.5 = sparse, 1.5 = rich) */
  densityMultiplier: number;
}

export const DIMENSIONAL_FREQUENCY_TOKENS: Record<ConsciousnessFloor, DimensionalFrequencyToken> = {
  [CONSCIOUSNESS_FLOORS.PHYSICAL]: {
    floor: CONSCIOUSNESS_FLOORS.PHYSICAL,
    densityMultiplier: 0.7,
    className: '.frequency-physical',
  },
  [CONSCIOUSNESS_FLOORS.CRISIS]: {
    floor: CONSCIOUSNESS_FLOORS.CRISIS,
    densityMultiplier: 0.8,
    className: '.frequency-crisis',
  },
  [CONSCIOUSNESS_FLOORS.SYNTHESIS]: {
    floor: CONSCIOUSNESS_FLOORS.SYNTHESIS,
    densityMultiplier: 1.0,
    className: '.frequency-synthesis',
  },
  [CONSCIOUSNESS_FLOORS.WISDOM]: {
    floor: CONSCIOUSNESS_FLOORS.WISDOM,
    densityMultiplier: 1.1,
    className: '.frequency-wisdom',
  },
  [CONSCIOUSNESS_FLOORS.AKASHIC]: {
    floor: CONSCIOUSNESS_FLOORS.AKASHIC,
    densityMultiplier: 1.3,
    className: '.frequency-akashic',
  },
  [CONSCIOUSNESS_FLOORS.DIVINE]: {
    floor: CONSCIOUSNESS_FLOORS.DIVINE,
    densityMultiplier: 1.5,
    className: '.frequency-divine',
  },
};

// ============================================================================
// 13. ELEMENTAL CONSCIOUSNESS PALETTE — pagan framework shapes consciousness
// ============================================================================
// H-4 · TP-4+BW-5+AC-6 — Pagan framework as foundational architecture (TP-4);
// five bird-species (BW-5) per KP's five-fold signature; elemental resonance
// in dimensional progression (AC-6). Maps Earth/Air/Fire/Water/SPIRIT to
// consciousness-layers, creating a second axis orthogonal to consciousness-floors.
// This is the "how systems think" layer that design methodology shapes.

export const ELEMENTAL_CONSCIOUSNESS_PALETTE = {
  /** Earth — grounded, action, embodiment (earth.base from colors.ts) */
  earth: {
    element: 'earth' as const,
    base: '#8B4513',           // pagan.earth
    consciousness: 'grounded·action',
    density: 0.9,
  },
  /** Air — mental, choice, clarity (air.base) */
  air: {
    element: 'air' as const,
    base: '#87CEEB',           // pagan.air
    consciousness: 'mental·choice',
    density: 1.0,
  },
  /** Fire — will, transformation, power (fire.base from QUANTUM_COLORS) */
  fire: {
    element: 'fire' as const,
    base: '#FF4500',           // pagan.fire (stronger than fire.base)
    consciousness: 'will·transformation',
    density: 1.1,
  },
  /** Water — flow, dissolution, release (water.base) */
  water: {
    element: 'water' as const,
    base: '#1E90FF',           // pagan.water
    consciousness: 'flow·dissolution',
    density: 0.85,
  },
  /** Spirit — unity, transcendence, witnessing (spirit.base) */
  spirit: {
    element: 'spirit' as const,
    base: '#6C5CE7',           // pagan.spirit
    consciousness: 'unity·witnessing',
    density: 1.2,
  },
} as const;

export type ElementalConsciousnessKey = keyof typeof ELEMENTAL_CONSCIOUSNESS_PALETTE;

// ============================================================================
// 14. TYPE EXPORTS
// ============================================================================

export type {
  BeamActivationState as BeamActivationStateType,
  SessionState as SessionStateType,
  UserTier as UserTierType,
  BeamIntensityLevel as BeamIntensityLevelType,
  VesselCapacity as VesselCapacityType,
  EntityState as EntityStateType,
  ResonancePatternType as ResonancePatternTypeType,
  AwarenessDomain as AwarenessDomainType,
  PauseMode as PauseModeType,           // O-2
  GlobalPauseConfig as GlobalPauseConfigType, // O-2
  RecoveryEntityState as RecoveryEntityStateType, // O-3
  ConsciousnessFloor as ConsciousnessFloorType, // H-1
  DimensionalFrequencyToken as DimensionalFrequencyTokenType, // H-1
  ElementalConsciousnessKey as ElementalConsciousnessKeyType, // H-4
};