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
  CAMERA_MOVES,
  getCameraMove,
  SCENE_SEQUENCES,
  sceneTotalDuration,
  LIGHT_VECTOR,
  SURFACE_LIGHTING,
  PROJECTION_FOCAL,
  rotate3,
  project,
  faceIsFacing,
  painterSort,
  diffuse,
  specular,
  orientationFacing,
  FIRST_PERSON_TABLE,
  glanceToward,
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
  CEREMONIES,
  CEREMONY_NAMES,
  getCeremony,
  ceremonyTotalDuration,
  SUPPORTIVE_CONVERGENCE,
  ENSEMBLE_MOTION,
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
  CeremonyBeat,
  Ceremony,
  CeremonyKey,
  ConvergenceStage,
  EnsembleMotion,
  EnsembleKey,
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
  PAUSE_MODES,
  GLOBAL_PAUSE,
  isPaused,
  RECOVERY_ENTITY_STATES,
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
  PauseMode as PauseModeType,
  GlobalPauseConfig as GlobalPauseConfigType,
  RecoveryEntityState as RecoveryEntityStateType,
  ConsciousnessFloor as ConsciousnessFloorType,
  DimensionalFrequencyToken as DimensionalFrequencyTokenType,
  ElementalConsciousnessKey as ElementalConsciousnessKeyType,
} from './consciousness';

// ============================================================================
// ATTENTION — the Bird-Wisdom Spectrum
// ============================================================================
export {
  ATTENTION_MODES,
  ATTENTION_MODE_NAMES,
  DEFAULT_ATTENTION_MODE,
  getAttentionMode,
  ATTENTION_MODE_SELECTOR,
  DEITY_VOICE_BUNDLES,
  DEITY_VOICE_NAMES,
  getDeityVoiceBundle,
} from './attention';

export type {
  AttentionMode as AttentionModeType,
  AttentionModeKey,
  AttentionDensity as AttentionDensityType,
  AttentionModeSelectorConfigType,
  DeityVoiceBundle as DeityVoiceBundleType,
  DeityVoiceKey as DeityVoiceKeyType,
} from './attention';

// ============================================================================
// INTERACTIVITY — the user's own hand
// ============================================================================
export {
  SELF_PAUSE_TRIGGER,
  ESCORT_TRANSITION,
  SUPPORTIVE_ROLE_AFFORDANCES,
  INVITATION_GATE,
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
  PRESENCE_FIELD,
  DOMAIN_GLOW_MODULATION,
  DOMAIN_GLOW_MODULATION_DEFAULT,
  getModulatedGlow,
  ETERNAL_WITNESS_STATE,
  TRANSCENDENCE_STATE_SEQUENCE,
  MARBLE_RECIPES,
  STONE_GROUND,
  STONE_PALETTES,
  BEVEL_RELIEF,
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
  PresenceFieldKey,
  PresenceField,
  DomainGlowKey,
  EternalWitnessState,
  EternalWitnessStateKey,
  TranscendenceShift,
  TranscendenceShiftKey,
  MarbleRecipe,
  MarbleParam,
  MarbleRecipeKey,
  StonePaletteKey,
} from './effects';

// ============================================================================
// SOLIDS — the dimensional vocabulary
// ============================================================================
// Polyhedra as vertices and faces, and the honest answer to a side count that
// no fair solid can carry.

export {
  PLATONIC_SOLIDS,
  FAIR_SOLID_BY_SIDES,
  solidForSides,
  trapezohedron,
  barrel,
  disc,
  faceNormal,
  faceCentroid,
  verifySolids,
  vecAdd,
  vecSub,
  vecScale,
  vecDot,
  vecCross,
  vecLength,
  vecNormalize,
} from './solids';

export type {
  Vec3,
  Solid,
  PlatonicKey,
} from './solids';