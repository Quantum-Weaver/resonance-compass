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
// EFFECTS - Gradients, glows, shadows, backdrops, holographic
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
} from './effects';

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
} from './consciousness';