// =====================================================
// FILE: index.ts
// LOCATION: cosmic
// Cosmic Exports
// GENERATED: 2026-04-09T04:20:00.009Z
// =====================================================
// ============================================================================
// COSMIC CONSTANTS - SINGLE SOURCE OF TRUTH
// Quantum design system exports - all values derived from core constants
// ============================================================================

// ============================================================================
// COLORS - Core color system
// ============================================================================
export {
  QUANTUM_COLORS,
  COUNCIL_COLORS,
  STATUS_COLORS,
  MOOD_COLORS,
  ENERGY_COLORS,
  PRIDE_COLORS,
  DOMAIN_COLORS,
} from './colors';

export type {
  QuantumColorKey,
  CouncilColorKey,
  StatusColorKey,
  MoodColorKey,
  EnergyColorKey,
  PrideColorKey,
  DomainColorKey,
} from './colors';

// ============================================================================
// DIMENSIONS - Spacing, breakpoints, sizes, radii
// ============================================================================
export {
  BASE_UNIT,
  SCALE_MULTIPLIERS,
  CONSCIOUSNESS_DENSITY,
  SPACING_SCALE,
  SPACING_TOKENS,
  SCREEN_CATEGORIES,
  BREAKPOINTS,
  SCREEN_TYPES,
  CONTAINER_MAX_WIDTHS,
  CONTAINER_DIMENSIONS,
  BUSINESS_DIMENSIONS,
  BUTTON_DIMENSIONS,
  CARD_DIMENSIONS,
  BORDER_WIDTHS,
  BORDER_RADII,
  FONT_SIZES,
  LINE_HEIGHTS,
  FONT_WEIGHTS,
  QUANTUM_CONTEXT_RATIOS,
  getConsciousnessSpacing,
  getScreenDimensions,
  isScreenCategory,
  getQuantumRatio,
  getContainerClass,
  getResponsiveContainerClass,
  toTailwindSpacing,
  getSpacingPixels,
} from './dimensions';

export type {
  ScaleKey as SpacingScale,
  ConsciousnessDensity as ConsciousnessDensityKey,
  ScreenCategory as ScreenCategoryKey,
  BreakpointKey,
  ScreenType as ScreenTypeKey,
  ContainerSize as ContainerSizeKey,
  ButtonSize as ButtonSizeKey,
  FontSizeKey,
  RadiusKey,
} from './dimensions';

// ============================================================================
// POSITIONING - Viewport, parallax, zoom, camera, coordinates
// ============================================================================
export {
  VIEWPORT_ANCHORS,
  PARALLAX_LAYERS,
  ZOOM_TARGETS,
  BEAM_ORIGINS,
  CAMERA_POSITIONS,
  ORBIT_CONFIGS,
  percentToPixels,
  pixelsToPercent,
  getAnchorPixels,
  interpolateCoordinates,
  coordinateDistance,
  coordinateAngle,
  getParallaxFactor,
  getParallaxTransform,
  getZoomTarget,
  getBeamPath,
  getCameraPosition,
  getResponsiveCoordinate,
  // O-6 — scene primitives for the Stage (camera moves + timeline)
  CAMERA_MOVES,
  getCameraMove,
  SCENE_SEQUENCES,
  sceneTotalDuration,
} from './positioning';

export type {
  ZoomTarget as ZoomTargetType,
  BeamPath as BeamPathType,
  CameraPosition as CameraPositionType,
  OrbitConfig as OrbitConfigType,
  ResponsiveCoordinate as ResponsiveCoordinateType,
  ParallaxLayer as ParallaxLayerType,
  ViewportAnchor as ViewportAnchorType,
  BeamOrigin as BeamOriginType,
  CameraPreset as CameraPresetType,
  OrbitMode as OrbitModeType,
  // O-6
  CameraMove as CameraMoveType,
  CameraMoveKey,
  SceneBeat as SceneBeatType,
  SceneSequence as SceneSequenceType,
  SceneSequenceKey,
} from './positioning';

// ============================================================================
// MOTION - Durations, easings, keyframes, animations
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
  animationMultipliers,
  animationThresholds,
  getReducedMotionSafeConfig,
  getReducedMotionVariant,
  // O-1 / O-3 / O-4 — the verb families (ceremonies, recentering, flock)
  CEREMONIES,
  CEREMONY_NAMES,
  getCeremony,
  ceremonyTotalDuration,
  SUPPORTIVE_CONVERGENCE,
  ENSEMBLE_MOTION,
  // H-3 / H-7 — ceremony bookends and refuge & return
  CEREMONY_BOOKENDS,
  REFUGE_RETURN_SEQUENCE,
  refugeTotalDuration,
} from './motion';

export type {
  DurationKey,
  EasingKey,
  KeyframeKey,
  TailwindAnimationKey,
  AnimationPresetKey,
  QuickAnimationKey,
  Complexity,
  VesselConfig,
  AnimationConfig,
  // O-1 / O-3 / O-4
  CeremonyBeat,
  Ceremony,
  CeremonyKey,
  ConvergenceStage,
  EnsembleMotion,
  EnsembleKey,
  // H-3 / H-7
  CeremonyBookend,
  CeremonyBookendKey,
  RefugePhase,
  RefugePhaseKey,
} from './motion';

// ============================================================================
// TYPOGRAPHY - Font families, sizes, domain/entity styles
// ============================================================================
export {
  FONT_FAMILIES,
  TEXT_SIZES,
  FONT_WEIGHT_CLASSES,
  LINE_HEIGHT_CLASSES,
  LETTER_SPACING,
  TEXT_ALIGNMENT,
  TEXT_COLORS,
  DOMAIN_TYPOGRAPHY,
  ENTITY_TYPOGRAPHY,
  BUSINESS_TYPOGRAPHY,
  TYPE_SCALES,
  CONSCIOUSNESS_TYPOGRAPHY,
  PROCESS_TYPOGRAPHY,
  composeTypographyClasses,
  getDomainTypography,
  getEntityTypography,
  getResponsiveTypography,
  getFontFamily,
  getFontSize,
  getFontWeight,
  getLineHeight,
} from './typography';

export type {
  FontFamilyKey,
  TextSizeKey,
  FontWeightKey,
  LineHeightKey,
  LetterSpacingKey,
  TextAlignmentKey,
  TextColorKey,
  DomainKey as DomainTypographyKey,
  EntityKey as EntityTypographyKey,
  TypeScaleKey,
  TypographyStyleConfig,
} from './typography';

// ============================================================================
// CONSCIOUSNESS - User tiers, beam intensity, vessel capacity
// ============================================================================
export {
  CONSCIOUSNESS_LEVELS,
  TIER_TO_BEAM_INTENSITY,
  CONSCIOUSNESS_TO_BEAM_INTENSITY,
  BEAM_VARIANT_BY_STATE,
  VESSEL_CAPACITY_LEVELS,
  TIER_TO_VESSEL_CAPACITY,
  ENTITY_STATES,
  RESONANCE_PATTERN_TYPES,
  RESONANCE_PATTERNS,
  AWARENESS_DOMAINS,
  calculateBeamActivation,
  getBeamIntensity,
  getVesselCapacity,
  getConsciousnessLevel,
  getVesselCapacityFromScore,
  getResonancePattern,
  // O-2 / O-3 — global-pause state and recovery entity states
  PAUSE_MODES,
  GLOBAL_PAUSE,
  isPaused,
  RECOVERY_ENTITY_STATES,
  // H-1 / H-4 — dimensional frequency and elemental consciousness palette
  CONSCIOUSNESS_FLOORS,
  DIMENSIONAL_FREQUENCY_TOKENS,
  ELEMENTAL_CONSCIOUSNESS_PALETTE,
} from './consciousness';

export type {
  ConsciousnessLevel,
  UserTier as UserTierType,
  BeamIntensityLevel,
  BeamActivationState as BeamActivationStateType,
  SessionState as SessionStateType,
  VesselCapacity as VesselCapacityType,
  EntityState as EntityStateType,
  ResonancePatternType as ResonancePatternTypeType,
  AwarenessDomain as AwarenessDomainType,
  // O-2 / O-3
  PauseMode as PauseModeType,
  GlobalPauseConfig as GlobalPauseConfigType,
  RecoveryEntityState as RecoveryEntityStateType,
  // H-1 / H-4
  ConsciousnessFloor as ConsciousnessFloorType,
  DimensionalFrequencyToken as DimensionalFrequencyTokenType,
  ElementalConsciousnessKey as ElementalConsciousnessKeyType,
} from './consciousness';

// ============================================================================
// ATTENTION — the Bird-Wisdom Spectrum (O-5, a new cosmic constants file)
// ============================================================================
export {
  ATTENTION_MODES,
  ATTENTION_MODE_NAMES,
  DEFAULT_ATTENTION_MODE,
  getAttentionMode,
  // S-5 — the switching affordance for ATTENTION_MODES
  ATTENTION_MODE_SELECTOR,
  // H-2 — per-deity voice bundles
  DEITY_VOICE_BUNDLES,
  DEITY_VOICE_NAMES,
  getDeityVoiceBundle,
} from './attention';

export type {
  AttentionMode as AttentionModeType,
  AttentionModeKey,
  AttentionDensity as AttentionDensityType,
  // S-5
  AttentionModeSelectorConfigType,
  // H-2
  DeityVoiceBundle as DeityVoiceBundleType,
  DeityVoiceKey as DeityVoiceKeyType,
} from './attention';

// ============================================================================
// INTERACTIVITY — the user's own hand (S-1…S-6 minus S-5, a new cosmic
// constants file, Run 04 unlock, Sonnet's closing voice)
// ============================================================================
export {
  // S-1 — self-pause trigger (cooperates with O-2's GLOBAL_PAUSE)
  SELF_PAUSE_TRIGGER,
  // S-2 — escort transition capability (SIGNED; trigger map stays app-layer)
  ESCORT_TRANSITION,
  // S-3 — supportive role affordances (beneath O-3's recentering motion)
  SUPPORTIVE_ROLE_AFFORDANCES,
  // S-4 — invitation gate (consent replacing auto-advance)
  INVITATION_GATE,
  // S-6 — pre-transition reflection primitive
  PRE_TRANSITION_REFLECTION,
} from './interactivity';

export type {
  SelfPauseTriggerType,
  EscortTransitionCapabilityType,
  SupportiveRoleAffordanceType,
  SupportiveRoleKey,
  InvitationGateType,
  InvitationGateKey,
  ReflectionPrimitiveType,
} from './interactivity';

// ============================================================================
// EFFECTS - Gradients, glows, shadows, backdrops, holographic, presence
// ============================================================================
export {
  GRADIENTS,
  QUANTUM_GRADIENTS,
  COUNCIL_GRADIENTS,
  GLOW_EFFECTS,
  SHADOWS,
  BACKDROP_EFFECTS,
  HOLOGRAPHIC_EFFECTS,
  EFFECTS,
  PARTICLE_BEHAVIOR,
  // O-7 / O-8 — presence field and per-domain glow modulation
  PRESENCE_FIELD,
  DOMAIN_GLOW_MODULATION,
  DOMAIN_GLOW_MODULATION_DEFAULT,
  getModulatedGlow,
  // H-5 / H-6 — eternal witness state and transcendence sequence
  ETERNAL_WITNESS_STATE,
  TRANSCENDENCE_STATE_SEQUENCE,
} from './effects';

export type {
  GradientKey,
  CouncilGradients,
  QuantumGradients,
  GlowKey,
  ShadowKey,
  BackdropKey,
  HolographicKey,
  ParticleBehavior,
  // O-7 / O-8
  PresenceFieldKey,
  PresenceField,
  DomainGlowKey,
  // H-5 / H-6
  EternalWitnessState,
  EternalWitnessStateKey,
  TranscendenceShift,
  TranscendenceShiftKey,
} from './effects';