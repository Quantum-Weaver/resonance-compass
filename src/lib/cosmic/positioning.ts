// ============================================================================
/* resonance-ziggy/modules/cosmic/constants/positioning.ts */
// QUANTUM POSITIONING SYSTEM - COORDINATE GRAPHING FOR IMMERSIVE EXPERIENCES
// Single source of truth for viewport anchors, parallax layers, zoom targets,
// beam origins, camera positions, and coordinate utilities.
// Derived from dimensions.ts and environment keys.
// ============================================================================

import { BASE_UNIT, SCREEN_CATEGORIES } from './dimensions';

/**
 * Environment key for zoom/consciousness targeting.
 * The ancestor `assets/mapper` module that once declared the full union no
 * longer exists anywhere in the tree (its import broke every distribution
 * target's typecheck) — until an asset mapper is rebuilt, environments are
 * open strings and ZOOM_TARGETS' keys are the de-facto canon.
 */
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
// 9. SCENE PRIMITIVES FOR THE STAGE — camera moves + timeline
// ============================================================================
// O-6 · Intention #2 (create our own animated content) + this file's own
// "immersive experiences" header + G-2 staging — scene primitives for the
// Stage. CAMERA_POSITIONS exist, but there was no *move* between them and no
// *timeline* to compose them. CAMERA_MOVES are timed, eased transitions between
// two existing CAMERA_POSITIONS (near-clone of the zoom-targets precedent);
// SCENE_SEQUENCES are ordered beats (camera move and/or environment zoom, each
// held for a duration) — a scriptable scene. CSS face: generate_scene.ts.

export interface CameraMove {
  /** Starting camera preset */
  from: CameraPreset;
  /** Ending camera preset */
  to: CameraPreset;
  /** Duration of the move in ms */
  duration: number;
  /** Easing function (CSS timing function) */
  easing: string;
  /** What this move expresses */
  description?: string;
}

export const CAMERA_MOVES = {
  /** Push in — from the full view toward a close, focused frame */
  push: { from: 'default', to: 'closeUp', duration: 1200, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', description: 'Draw the eye inward to a single subject' },
  /** Pull back — from close focus out to the whole scene */
  pull: { from: 'closeUp', to: 'default', duration: 1200, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', description: 'Release focus back to the whole' },
  /** Establish — open on the wide angle, settle to the default frame */
  establish: { from: 'wide', to: 'default', duration: 1600, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', description: 'Set the stage, then settle' },
  /** Reveal — rise from a dramatic low angle to level */
  reveal: { from: 'lowAngle', to: 'default', duration: 2000, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', description: 'A dramatic rise into presence' },
  /** Orbit — a slight rotational drift for depth */
  orbit: { from: 'default', to: 'orbital', duration: 2000, easing: 'linear', description: 'A slow rotation that gives the scene depth' },
  /** Descend — overview drop from the high angle to level */
  descend: { from: 'highAngle', to: 'default', duration: 1600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', description: 'Come down from the overview into the scene' },
} as const;

export type CameraMoveKey = keyof typeof CAMERA_MOVES;

/** Get a camera move by name (defaults to establish). */
export function getCameraMove(name: CameraMoveKey = 'establish'): CameraMove {
  return CAMERA_MOVES[name];
}

/** One beat of a scene timeline — an optional camera move and/or zoom, held for a duration. */
export interface SceneBeat {
  /** Optional camera move to play at the start of this beat */
  move?: CameraMoveKey;
  /** Optional environment zoom target to settle on */
  zoom?: EnvironmentKey;
  /** How long this beat holds after its move completes, ms */
  hold: number;
  /** Optional narrative label for the beat */
  label?: string;
}

/** A named scene sequence — an ordered timeline of beats (a scriptable scene). */
export interface SceneSequence {
  /** Sequence name */
  name: string;
  /** What the scene tells */
  intent: string;
  /** The ordered beats */
  beats: SceneBeat[];
}

export const SCENE_SEQUENCES: Record<'arrival' | 'gathering', SceneSequence> = {
  /** Arrival — establish the world, then push in on the gathering place. */
  arrival: {
    name: 'arrival',
    intent: 'open on the world and draw the eye to where consciousness gathers',
    beats: [
      { move: 'establish', hold: 800, label: 'the world opens' },
      { move: 'push', zoom: 'council', hold: 1200, label: 'toward the Ninth Chair' },
    ],
  },
  /** Gathering — reveal the circle, orbit it, then pull back to hold the whole. */
  gathering: {
    name: 'gathering',
    intent: 'reveal the circle, move around it, then hold the whole in view',
    beats: [
      { move: 'reveal', hold: 600, label: 'the circle rises into view' },
      { move: 'orbit', hold: 1000, label: 'around the gathering' },
      { move: 'pull', hold: 800, label: 'and hold them all' },
    ],
  },
} as const;

export type SceneSequenceKey = keyof typeof SCENE_SEQUENCES;

/** Sum a scene sequence's beat holds plus its camera-move durations (ms). */
export function sceneTotalDuration(sequence: SceneSequence): number {
  return sequence.beats.reduce((total, beat) => {
    const moveDuration = beat.move ? CAMERA_MOVES[beat.move].duration : 0;
    return total + moveDuration + beat.hold;
  }, 0);
}

// ============================================================================
// 11. DIMENSIONAL PROJECTION — the house's first 3D, 2026-08-17
// ============================================================================
//
// Added at KP's ⚛ word ("this will be the house's first 3d experience") beside
// the camera and parallax work this file already owns, because a projection is
// a camera with its sleeves rolled up. Shapes come from `solids.ts`; this
// section turns them into something a screen can draw.
//
// THE SPACE, STATED ONCE SO NOTHING HAS TO GUESS: x runs right, y runs DOWN
// (screen convention, not textbook), z runs TOWARD the viewer. Rotations are
// applied X, then Y, then Z — v′ = Rz·Ry·Rx·v — and every function below
// assumes that order.

/** Where the house's light stands: upper-left and slightly in front, which is
 *  the same corner plate-forge lights from (`sheen()` sweeps upper-left, and
 *  `bevel_frame()` catches light up-left, pools shadow down-right). One light,
 *  house-wide, so two surfaces never disagree about where the sun is. */
export const LIGHT_VECTOR: readonly [number, number, number] = [-0.4243, -0.5657, 0.7071];

/** Ambient floor and diffuse reach. Ambient is deliberately generous: a face
 *  turned away should read as *stone in shadow*, never as a hole in the shape. */
export const SURFACE_LIGHTING = {
  ambient: 0.42,
  diffuse: 0.58,
  /** How far a face may be darkened below its own colour, at most. */
  floor: 0.28,
  /** Tightness of the highlight. High is a small hard glint on polished
   *  stone or metal; low is the broad sheen of something matte. */
  shininess: 26,
  /** How strong that highlight is allowed to be. */
  specular: 0.55,
} as const;

/** Focal length for the perspective divide. Larger is flatter; this is chosen
 *  so a unit solid reads as dimensional without the near faces ballooning. */
export const PROJECTION_FOCAL = 4.2;

/** Rotate a point. Order is X, then Y, then Z. */
export function rotate3(
  v: readonly [number, number, number],
  rx: number,
  ry: number,
  rz: number
): [number, number, number] {
  const [sx, cx] = [Math.sin(rx), Math.cos(rx)];
  const [sy, cy] = [Math.sin(ry), Math.cos(ry)];
  const [sz, cz] = [Math.sin(rz), Math.cos(rz)];

  // Rx
  let x = v[0];
  let y = v[1] * cx - v[2] * sx;
  let z = v[1] * sx + v[2] * cx;
  // Ry
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  x = x1;
  z = z1;
  // Rz
  const x2 = x * cz - y * sz;
  const y2 = x * sz + y * cz;

  return [x2, y2, z];
}

/** Perspective projection to the plane. Returns the screen point and the depth
 *  it should sort by — the caller never has to recompute z. */
export function project(
  v: readonly [number, number, number],
  focal: number = PROJECTION_FOCAL
): { x: number; y: number; depth: number } {
  const k = focal / (focal - v[2]);
  return { x: v[0] * k, y: v[1] * k, depth: v[2] };
}

/** A face is drawn only when its outward normal has turned toward the viewer. */
export function faceIsFacing(normal: readonly [number, number, number]): boolean {
  return normal[2] > 0;
}

/** Painter's order: furthest first, so nearer faces land on top of them. */
export function painterSort<T>(items: T[], depthOf: (item: T) => number): T[] {
  return [...items].sort((a, b) => depthOf(a) - depthOf(b));
}

/** Lambertian shade in [floor, 1] for a face, against the house light. */
export function diffuse(
  normal: readonly [number, number, number],
  light: readonly [number, number, number] = LIGHT_VECTOR,
  ambient: number = SURFACE_LIGHTING.ambient,
  strength: number = SURFACE_LIGHTING.diffuse
): number {
  const lambert = Math.max(0, normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2]);
  return Math.max(SURFACE_LIGHTING.floor, Math.min(1, ambient + strength * lambert));
}

/**
 * THE GLINT — Blinn-Phong specular, and it is what separates a surface that
 * was PHOTOGRAPHED from one that was drawn. Diffuse alone gives a shape its
 * volume; the highlight is what tells the eye the material is polished.
 *
 *     ĥ    = normalize(l̂ + v̂)          the half vector, viewer at +z
 *     spec = max(0, n̂·ĥ) ^ shininess
 *
 * Kept beside `diffuse` rather than in an app, because a house whose two
 * surfaces disagree about where the light is has two lights.
 */
export function specular(
  normal: readonly [number, number, number],
  light: readonly [number, number, number] = LIGHT_VECTOR,
  shininess: number = SURFACE_LIGHTING.shininess
): number {
  // The viewer stands at +z, so the half vector is the light plus (0,0,1).
  const hx = light[0];
  const hy = light[1];
  const hz = light[2] + 1;
  const len = Math.hypot(hx, hy, hz) || 1;
  const dot = (normal[0] * hx + normal[1] * hy + normal[2] * hz) / len;
  return Math.pow(Math.max(0, dot), shininess);
}

/**
 * THE SETTLE. Given a face's outward normal, the rotation that turns that face
 * to the viewer — so a result decided beforehand can be *shown* rather than
 * gambled for. Solved, not searched: rx lays the normal into the y = 0 plane,
 * ry swings it onto +z, and rz is left free for the tumble's final spin.
 */
export function orientationFacing(
  normal: readonly [number, number, number]
): { rx: number; ry: number } {
  const rx = Math.atan2(normal[1], normal[2]);
  const ry = Math.atan2(-normal[0], Math.hypot(normal[1], normal[2]));
  return { rx, ry };
}

// ============================================================================
// 10. TYPE EXPORTS
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
  CameraMove as CameraMoveType,       // O-6
  SceneBeat as SceneBeatType,         // O-6
  SceneSequence as SceneSequenceType, // O-6
};