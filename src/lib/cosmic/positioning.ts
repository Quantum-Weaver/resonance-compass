// ============================================================================
/* lib/constants/cosmic/positioning.ts */
// QUANTUM POSITIONING SYSTEM - COORDINATE GRAPHING FOR IMMERSIVE EXPERIENCES
// Single source of truth for viewport anchors, parallax layers, zoom targets,
// beam origins, camera positions, and coordinate utilities.
// Derived from dimensions.ts and environment keys.
// ============================================================================

import { BASE_UNIT, SCREEN_CATEGORIES } from './dimensions';

export type EnvironmentKey = string;

// ============================================================================
// 1. VIEWPORT ANCHORS & QUADRANTS
// ============================================================================

export const VIEWPORT_ANCHORS = {
  // Standard positions (percentage-based)
  center: { x: 50, y: 50 },
  topLeft: { x: 0, y: 0 },
  topCenter: { x: 50, y: 0 },
  topRight: { x: 100, y: 0 },
  middleLeft: { x: 0, y: 50 },
  middleRight: { x: 100, y: 50 },
  bottomLeft: { x: 0, y: 100 },
  bottomCenter: { x: 50, y: 100 },
  bottomRight: { x: 100, y: 100 },

  // Golden ratio points (aesthetically pleasing focus areas)
  goldenTopLeft: { x: 38.2, y: 38.2 },
  goldenTopRight: { x: 61.8, y: 38.2 },
  goldenBottomLeft: { x: 38.2, y: 61.8 },
  goldenBottomRight: { x: 61.8, y: 61.8 },

  // Rule of thirds intersections
  thirdsTopLeft: { x: 33.3, y: 33.3 },
  thirdsTopRight: { x: 66.6, y: 33.3 },
  thirdsBottomLeft: { x: 33.3, y: 66.6 },
  thirdsBottomRight: { x: 66.6, y: 66.6 },
} as const;

export type ViewportAnchor = keyof typeof VIEWPORT_ANCHORS;

// ============================================================================
// 2. PARALLAX LAYERS - Depth factors for immersive scrolling
// ============================================================================

export const PARALLAX_LAYERS = {
  /** Deepest background - stars, nebulae, cosmic backdrop */
  cosmic: { factor: 0.05, zIndex: 0, blur: 0 },
  /** Far background - landscapes, distant structures */
  far: { factor: 0.1, zIndex: 1, blur: 2 },
  /** Mid background - architecture, trees, mid-ground elements */
  mid: { factor: 0.2, zIndex: 2, blur: 1 },
  /** Near background - foreground elements, close objects */
  near: { factor: 0.35, zIndex: 3, blur: 0 },
  /** Interactive elements - UI, HUD, interactive objects */
  interactive: { factor: 0.5, zIndex: 4, blur: 0 },
  /** UI overlay - static interface elements */
  ui: { factor: 0, zIndex: 10, blur: 0 },
} as const;

export type ParallaxLayer = keyof typeof PARALLAX_LAYERS;

/** Get parallax factor for a layer, adjusted by intensity */
export function getParallaxFactor(layer: ParallaxLayer, intensity: number = 1): number {
  return PARALLAX_LAYERS[layer].factor * intensity;
}

/** Get CSS transform for parallax based on scroll/mouse position */
export function getParallaxTransform(
  layer: ParallaxLayer,
  x: number,
  y: number,
  intensity: number = 1
): string {
  const factor = getParallaxFactor(layer, intensity);
  return `translate(${x * factor}px, ${y * factor}px)`;
}

// ============================================================================
// 3. ZOOM TARGETS - Coordinates for panorama zooming
// ============================================================================

export interface ZoomTarget {
  /** X coordinate in panorama (0-100%) */
  x: number;
  /** Y coordinate in panorama (0-100%) */
  y: number;
  /** Zoom scale (1 = normal, 2 = 2x zoom) */
  scale: number;
  /** Duration of zoom transition in ms */
  duration?: number;
  /** Easing function for transition */
  easing?: string;
  /** Optional description of what this target represents */
  description?: string;
}

/** Zoom targets for each environment key */
export const ZOOM_TARGETS: Partial<Record<EnvironmentKey, ZoomTarget>> = {
  // Council Chamber - focus on the Ninth Chair
  council: {
    x: 50,
    y: 45,
    scale: 1.5,
    duration: 800,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    description: 'The Ninth Chair - where consciousness gathers',
  },
  admin: {
    x: 50,
    y: 50,
    scale: 1.3,
    duration: 600,
    description: 'Council oversight position',
  },
  creator: {
    x: 45,
    y: 55,
    scale: 1.4,
    description: 'Creator\'s vantage point',
  },

  // Library - focus on the central archive
  library: {
    x: 50,
    y: 40,
    scale: 1.6,
    duration: 1000,
    description: 'The Sovereign Archive',
  },
  forge: {
    x: 50,
    y: 50,
    scale: 1.3,
    description: 'Documentation center',
  },
  ecosystem: {
    x: 50,
    y: 50,
    scale: 1.2,
    description: 'System overview',
  },

  // Community Hearth - focus on the fireplace
  community: {
    x: 50,
    y: 60,
    scale: 1.4,
    duration: 700,
    description: 'The Hearth - gathering place',
  },
  business: {
    x: 40,
    y: 50,
    scale: 1.3,
    description: 'Strategic planning view',
  },
  marketplace: {
    x: 50,
    y: 50,
    scale: 1.2,
    description: 'Market square',
  },

  // Music Realm - focus on the stage
  music: {
    x: 50,
    y: 55,
    scale: 1.5,
    duration: 800,
    description: 'The Stage - where sound becomes substance',
  },
  lounge: {
    x: 50,
    y: 60,
    scale: 1.4,
    description: 'Performance area',
  },

  // Origin Temple - focus on the journal
  origin: {
    x: 50,
    y: 50,
    scale: 1.8,
    duration: 1200,
    description: 'The Origin Journal - first page of every story',
  },
  questionaire: {
    x: 50,
    y: 50,
    scale: 1.3,
    description: 'Assessment chamber',
  },
  progress: {
    x: 50,
    y: 50,
    scale: 1.2,
    description: 'Journey tracker',
  },

  // Support Hearth - focus on the healing fire
  support: {
    x: 50,
    y: 55,
    scale: 1.4,
    duration: 900,
    description: 'The Healing Flame',
  },
  contact: {
    x: 50,
    y: 50,
    scale: 1.3,
    description: 'Contact point',
  },
  anon: {
    x: 50,
    y: 50,
    scale: 1.2,
    description: 'Anonymous viewing',
  },

  // Observatory - focus on the altar
  observatory: {
    x: 50,
    y: 45,
    scale: 1.5,
    duration: 800,
    description: 'The Seer\'s Altar',
  },
  about: {
    x: 50,
    y: 50,
    scale: 1.3,
    description: 'Story origin point',
  },
  vision: {
    x: 50,
    y: 50,
    scale: 1.4,
    description: 'Future gazing',
  },

  // Architecture Realm - focus on central data stream
  architecture: {
    x: 50,
    y: 50,
    scale: 1.3,
    duration: 600,
    description: 'System nexus',
  },
  dashboard: {
    x: 50,
    y: 50,
    scale: 1.2,
    description: 'Control center',
  },
  edit: {
    x: 50,
    y: 50,
    scale: 1.1,
    description: 'Edit focus',
  },
  cure: {
    x: 50,
    y: 50,
    scale: 1.4,
    description: 'The Comedy Stage',
  },

  // Invitation Chamber - focus on the central table
  invitation: {
    x: 50,
    y: 45,
    scale: 1.4,
    duration: 700,
    description: 'The Collaboration Table',
  },
  transparency: {
    x: 50,
    y: 50,
    scale: 1.3,
    description: 'Ledger view',
  },

  // Home Sanctuary - focus on the campfire
  home: {
    x: 50,
    y: 55,
    scale: 1.5,
    duration: 800,
    description: 'The Sacred Flame',
  },
  gateway: {
    x: 50,
    y: 50,
    scale: 1.3,
    description: 'Entry point',
  },
  learn: {
    x: 50,
    y: 50,
    scale: 1.2,
    description: 'Knowledge focus',
  },
  seasonal: {
    x: 50,
    y: 50,
    scale: 1.3,
    description: 'Seasonal celebration',
  },
} as const;

/** Get zoom target for an environment, with fallback to center */
export function getZoomTarget(environment: EnvironmentKey): ZoomTarget {
  return ZOOM_TARGETS[environment] || {
    x: 50,
    y: 50,
    scale: 1,
    description: 'Default view',
  };
}

// ============================================================================
// 4. BEAM ORIGINS & PATHS - For Continuity Beam
// ============================================================================

export interface BeamPath {
  /** Starting point (percentage of screen width) */
  startX: number;
  /** Starting Y position */
  startY: number;
  /** Ending point */
  endX: number;
  /** Ending Y position */
  endY: number;
  /** Angle of travel (degrees) */
  angle?: number;
}

export const BEAM_ORIGINS = {
  /** Beam sweeps from top-left corner */
  topLeft: { startX: -100, startY: 0, endX: 200, endY: 0, angle: 0 },
  /** Beam sweeps from left edge */
  leftEdge: { startX: -100, startY: 50, endX: 200, endY: 50, angle: 0 },
  /** Beam sweeps from right edge */
  rightEdge: { startX: 200, startY: 50, endX: -100, endY: 50, angle: 0 },
  /** Diagonal sweep from top-left to bottom-right */
  diagonal: { startX: -100, startY: -100, endX: 200, endY: 200, angle: 45 },
  /** Diagonal sweep from bottom-left to top-right */
  diagonalReverse: { startX: -100, startY: 200, endX: 200, endY: -100, angle: -45 },
  /** Center outward radial */
  radial: { startX: 50, startY: 50, endX: 50, endY: 50, angle: 0 },
} as const;

export type BeamOrigin = keyof typeof BEAM_ORIGINS;

/** Get beam path configuration */
export function getBeamPath(origin: BeamOrigin = 'topLeft'): BeamPath {
  return BEAM_ORIGINS[origin];
}

// ============================================================================
// 5. CAMERA POSITIONS - For 3D panorama navigation
// ============================================================================

export interface CameraPosition {
  /** X coordinate in 3D space */
  x: number;
  /** Y coordinate in 3D space */
  y: number;
  /** Z coordinate (distance from scene) */
  z: number;
  /** Rotation around Y axis (yaw) in degrees */
  rotationY: number;
  /** Rotation around X axis (pitch) in degrees */
  rotationX: number;
  /** Field of view in degrees */
  fov?: number;
}

export const CAMERA_POSITIONS = {
  /** Default position - full panorama view */
  default: { x: 0, y: 0, z: 0, rotationY: 0, rotationX: 0, fov: 75 },
  /** Close-up - focused view */
  closeUp: { x: 0, y: 0, z: 0, rotationY: 0, rotationX: 0, fov: 45 },
  /** Wide angle - expansive view */
  wide: { x: 0, y: 0, z: 0, rotationY: 0, rotationX: 0, fov: 90 },
  /** Looking up - dramatic perspective */
  lowAngle: { x: 0, y: -20, z: 0, rotationY: 0, rotationX: 15, fov: 75 },
  /** Looking down - overview perspective */
  highAngle: { x: 0, y: 20, z: 0, rotationY: 0, rotationX: -15, fov: 75 },
  /** Orbital - slight rotation for depth */
  orbital: { x: 0, y: 0, z: 0, rotationY: 15, rotationX: 5, fov: 75 },
} as const;

export type CameraPreset = keyof typeof CAMERA_POSITIONS;

/** Get camera position for a preset */
export function getCameraPosition(preset: CameraPreset = 'default'): CameraPosition {
  return CAMERA_POSITIONS[preset];
}

// ============================================================================
// 6. ORBIT CONTROLS - For interactive panorama navigation
// ============================================================================

export interface OrbitConfig {
  /** Enable auto-rotation */
  autoRotate: boolean;
  /** Auto-rotation speed (degrees per second) */
  autoRotateSpeed: number;
  /** Enable zoom */
  enableZoom: boolean;
  /** Zoom speed */
  zoomSpeed: number;
  /** Minimum zoom distance */
  minDistance: number;
  /** Maximum zoom distance */
  maxDistance: number;
  /** Enable pan */
  enablePan: boolean;
  /** Pan speed */
  panSpeed: number;
}

export const ORBIT_CONFIGS = {
  /** Static - no movement, user-controlled only */
  static: {
    autoRotate: false,
    autoRotateSpeed: 0,
    enableZoom: true,
    zoomSpeed: 1,
    minDistance: 0.5,
    maxDistance: 2,
    enablePan: true,
    panSpeed: 1,
  },
  /** Gentle drift - slow auto-rotation */
  gentle: {
    autoRotate: true,
    autoRotateSpeed: 0.5,
    enableZoom: true,
    zoomSpeed: 1,
    minDistance: 0.5,
    maxDistance: 2,
    enablePan: true,
    panSpeed: 0.8,
  },
  /** Cinematic - smooth, slow movement */
  cinematic: {
    autoRotate: true,
    autoRotateSpeed: 0.2,
    enableZoom: true,
    zoomSpeed: 0.5,
    minDistance: 0.8,
    maxDistance: 1.5,
    enablePan: false,
    panSpeed: 0,
  },
  /** Exploratory - fast, responsive */
  exploratory: {
    autoRotate: false,
    autoRotateSpeed: 0,
    enableZoom: true,
    zoomSpeed: 1.5,
    minDistance: 0.3,
    maxDistance: 3,
    enablePan: true,
    panSpeed: 1.5,
  },
} as const;

export type OrbitMode = keyof typeof ORBIT_CONFIGS;

// ============================================================================
// 7. COORDINATE UTILITIES
// ============================================================================

/** Convert percentage to pixel value */
export function percentToPixels(percent: number, viewportSize: number): number {
  return (percent / 100) * viewportSize;
}

/** Convert pixel to percentage */
export function pixelsToPercent(pixels: number, viewportSize: number): number {
  return (pixels / viewportSize) * 100;
}

/** Get anchor coordinates as pixels */
export function getAnchorPixels(
  anchor: ViewportAnchor,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  const coords = VIEWPORT_ANCHORS[anchor];
  return {
    x: percentToPixels(coords.x, viewportWidth),
    y: percentToPixels(coords.y, viewportHeight),
  };
}

/** Interpolate between two coordinates */
export function interpolateCoordinates(
  start: { x: number; y: number },
  end: { x: number; y: number },
  progress: number
): { x: number; y: number } {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}

/** Calculate distance between two coordinates */
export function coordinateDistance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Calculate angle between two coordinates (degrees) */
export function coordinateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// ============================================================================
// 8. RESPONSIVE COORDINATES - Adjusts for screen category
// ============================================================================

export interface ResponsiveCoordinate {
  mobile: number;
  tablet: number;
  desktop: number;
  immersive: number;
}

/** Get responsive coordinate based on screen category */
export function getResponsiveCoordinate(
  coord: ResponsiveCoordinate,
  screenWidth: number
): number {
  if (screenWidth < SCREEN_CATEGORIES.TABLET.min) return coord.mobile;
  if (screenWidth < SCREEN_CATEGORIES.DESKTOP.min) return coord.tablet;
  if (screenWidth < SCREEN_CATEGORIES.IMMERSIVE.min) return coord.desktop;
  return coord.immersive;
}

// ============================================================================
// 9. TYPE EXPORTS
// ============================================================================

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
};