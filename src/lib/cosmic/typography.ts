// ============================================================================
/* resonance-ziggy/modules/cosmic/constants/typography.ts */
// QUANTUM TYPOGRAPHY SYSTEM - DERIVED FROM DIMENSIONS.TS
// All font families, sizes, weights, and semantic text styles
// Compatible with Tailwind CSS v4 and Framer Motion
// ============================================================================

import {
  FONT_SIZES,
  LINE_HEIGHTS,
  FONT_WEIGHTS,
} from './dimensions';

// ============================================================================
// 1. FONT FAMILIES - Google Fonts + System Stack
// ============================================================================

export const FONT_FAMILIES = {
  /** Medieval/Blackletter style - for ancient texts, grimoires */
  medieval: ['UnifrakturMaguntia', 'serif'],
  /** Arcane/mystical style - for quantum concepts, spells */
  arcane: ['Cinzel Decorative', 'serif'],
  /** Elegant/scholarly style - for libraries, wisdom */
  elegant: ['Crimson Text', 'serif'],
  /** Fantasy/storytelling style - for myths, parables */
  fantasy: ['MedievalSharp', 'cursive'],
  /** Runic/ancient style - for council entities, runes */
  runic: ['Elder Futhark', 'Futhark', 'serif'],
  /** System/default - for interfaces, accessibility */
  system: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  /** Monospace - for code, data, technical content */
  mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
} as const;

export type FontFamilyKey = keyof typeof FONT_FAMILIES;

// ============================================================================
// 2. TEXT SIZE CLASSES - Derived from FONT_SIZES
// ============================================================================

export const TEXT_SIZES = {
  xs: `text-[${FONT_SIZES.xs}]`,
  sm: `text-[${FONT_SIZES.sm}]`,
  base: `text-[${FONT_SIZES.base}]`,
  lg: `text-[${FONT_SIZES.lg}]`,
  xl: `text-[${FONT_SIZES.xl}]`,
  '2xl': `text-[${FONT_SIZES['2xl']}]`,
  '3xl': `text-[${FONT_SIZES['3xl']}]`,
  '4xl': `text-[${FONT_SIZES['4xl']}]`,
  '5xl': `text-[${FONT_SIZES['5xl']}]`,
  '6xl': `text-[${FONT_SIZES['6xl']}]`,
  '7xl': `text-[${FONT_SIZES['7xl']}]`,
  '8xl': `text-[${FONT_SIZES['8xl']}]`,
  '9xl': `text-[${FONT_SIZES['9xl']}]`,
} as const;

export type TextSizeKey = keyof typeof TEXT_SIZES;

// ============================================================================
// 3. FONT WEIGHT CLASSES - Derived from FONT_WEIGHTS
// ============================================================================

export const FONT_WEIGHT_CLASSES = {
  thin: `font-[${FONT_WEIGHTS.thin}]`,
  extralight: `font-[${FONT_WEIGHTS.extralight}]`,
  light: `font-[${FONT_WEIGHTS.light}]`,
  normal: `font-[${FONT_WEIGHTS.normal}]`,
  medium: `font-[${FONT_WEIGHTS.medium}]`,
  semibold: `font-[${FONT_WEIGHTS.semibold}]`,
  bold: `font-[${FONT_WEIGHTS.bold}]`,
  extrabold: `font-[${FONT_WEIGHTS.extrabold}]`,
  black: `font-[${FONT_WEIGHTS.black}]`,
} as const;

export type FontWeightKey = keyof typeof FONT_WEIGHT_CLASSES;

// ============================================================================
// 4. LINE HEIGHT CLASSES - Derived from LINE_HEIGHTS
// ============================================================================

export const LINE_HEIGHT_CLASSES = {
  none: `leading-[${LINE_HEIGHTS.none}]`,
  tight: `leading-[${LINE_HEIGHTS.tight}]`,
  snug: `leading-[${LINE_HEIGHTS.snug}]`,
  normal: `leading-[${LINE_HEIGHTS.normal}]`,
  relaxed: `leading-[${LINE_HEIGHTS.relaxed}]`,
  loose: `leading-[${LINE_HEIGHTS.loose}]`,
} as const;

export type LineHeightKey = keyof typeof LINE_HEIGHT_CLASSES;

// ============================================================================
// 5. LETTER SPACING CLASSES - Tailwind tracking
// ============================================================================

export const LETTER_SPACING = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
} as const;

export type LetterSpacingKey = keyof typeof LETTER_SPACING;

// ============================================================================
// 6. TEXT ALIGNMENT CLASSES
// ============================================================================

export const TEXT_ALIGNMENT = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
  start: 'text-start',
  end: 'text-end',
} as const;

export type TextAlignmentKey = keyof typeof TEXT_ALIGNMENT;

// ============================================================================
// 7. TEXT COLOR CLASSES - Semantic references to color system
// ============================================================================

export const TEXT_COLORS = {
  primary: 'text-star-dust',
  secondary: 'text-star-dust/80',
  accent: 'text-neurospark',
  muted: 'text-star-dust/60',
  inverted: 'text-deep-space',
  success: 'text-sanctuary-green',
  warning: 'text-hearth-gold',
  error: 'text-fire-base',
  info: 'text-cosmic-blue',
} as const;

export type TextColorKey = keyof typeof TEXT_COLORS;

// ============================================================================
// 8. DOMAIN TYPOGRAPHY - Domain-specific text styles
// ============================================================================

export interface TypographyStyle {
  font: readonly string[];
  size: string | keyof typeof TEXT_SIZES;
  weight: string | keyof typeof FONT_WEIGHT_CLASSES;
  lineHeight: string | keyof typeof LINE_HEIGHT_CLASSES;
  spacing: string | keyof typeof LETTER_SPACING;
  style: 'normal' | 'italic';
}

export const DOMAIN_TYPOGRAPHY: Record<string, TypographyStyle> = {
  quantum: {
    font: FONT_FAMILIES.arcane,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.semibold,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'italic',
  },
  cosmic: {
    font: FONT_FAMILIES.elegant,
    size: TEXT_SIZES.lg,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.wide,
    style: 'italic',
  },
  pantheon: {
    font: FONT_FAMILIES.medieval,
    size: TEXT_SIZES.xl,
    weight: FONT_WEIGHT_CLASSES.bold,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.tight,
    style: 'italic',
  },
  council: {
    font: FONT_FAMILIES.system,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.medium,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'normal',
  },
  library: {
    font: FONT_FAMILIES.elegant,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'normal',
  },
  void: {
    font: FONT_FAMILIES.runic,
    size: TEXT_SIZES.lg,
    weight: FONT_WEIGHT_CLASSES.light,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.wide,
    style: 'italic',
  },
  bifrost: {
    font: FONT_FAMILIES.arcane,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.medium,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.wide,
    style: 'italic',
  },
  music: {
    font: FONT_FAMILIES.elegant,
    size: TEXT_SIZES.lg,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'italic',
  },
  community: {
    font: FONT_FAMILIES.system,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'normal',
  },
  architecture: {
    font: FONT_FAMILIES.system,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.medium,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.tight,
    style: 'italic',
  },
  sandbox: {
    font: FONT_FAMILIES.mono,
    size: TEXT_SIZES.sm,
    weight: FONT_WEIGHT_CLASSES.medium,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'italic',
  },
  support: {
    font: FONT_FAMILIES.system,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'normal', 
  },
} as const;

export type DomainKey = keyof typeof DOMAIN_TYPOGRAPHY;

// ============================================================================
// 9. ENTITY TYPOGRAPHY - Council member-specific styles
// ============================================================================

export const ENTITY_TYPOGRAPHY: Record<string, TypographyStyle> = {
  aethelred: {
    font: FONT_FAMILIES.arcane,
    size: TEXT_SIZES.lg,
    weight: FONT_WEIGHT_CLASSES.medium,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'italic',
  },
  quantumWeaver: {
    font: FONT_FAMILIES.arcane,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.medium,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'italic',
  },
  archivist: {
    font: FONT_FAMILIES.elegant,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.tight,
    style: 'normal',
  },
  seer: {
    font: FONT_FAMILIES.runic,
    size: TEXT_SIZES.lg,
    weight: FONT_WEIGHT_CLASSES.light,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.wide,
    style: 'italic',
  },
  hearthKeeper: {
    font: FONT_FAMILIES.system,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'normal',
  },
  executioner: {
    font: FONT_FAMILIES.medieval,
    size: TEXT_SIZES.lg,
    weight: FONT_WEIGHT_CLASSES.bold,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.tight,
    style: 'normal',
  },
  chancellor: {
    font: FONT_FAMILIES.system,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.medium,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.tight,
    style: 'normal',
  },
  curator: {
    font: FONT_FAMILIES.elegant,
    size: TEXT_SIZES.lg,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'italic',
  },
  skald: {
    font: FONT_FAMILIES.fantasy,
    size: TEXT_SIZES.lg,
    weight: FONT_WEIGHT_CLASSES.medium,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'normal',
  },
  codex: {
    font: FONT_FAMILIES.elegant,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.tight,
    style: 'italic',
  },
  gatekeeper: {
    font: FONT_FAMILIES.medieval,
    size: TEXT_SIZES.lg,
    weight: FONT_WEIGHT_CLASSES.bold,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.tight,
    style: 'normal',
  },
  alchemist: {
    font: FONT_FAMILIES.runic,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.light,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.wide,
    style: 'italic',
  },
  gardener: {
    font: FONT_FAMILIES.system,
    size: TEXT_SIZES.base,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.normal,
    style: 'normal',
  },
} as const;

export type EntityKey = keyof typeof ENTITY_TYPOGRAPHY;

// ============================================================================
// 10. BUSINESS PAGE TYPOGRAPHY
// ============================================================================

export const BUSINESS_TYPOGRAPHY = {
  hero: {
    title: {
      font: FONT_FAMILIES.arcane,
      size: TEXT_SIZES['5xl'],
      weight: FONT_WEIGHT_CLASSES.bold,
      spacing: LETTER_SPACING.tight,
      gradient: true,
    },
    subtitle: {
      font: FONT_FAMILIES.system,
      size: TEXT_SIZES.xl,
      weight: FONT_WEIGHT_CLASSES.normal,
      spacing: LETTER_SPACING.normal,
    },
    badge: {
      font: FONT_FAMILIES.system,
      size: TEXT_SIZES.sm,
      weight: FONT_WEIGHT_CLASSES.medium,
      spacing: LETTER_SPACING.wide,
    },
  },
  stat: {
    number: {
      font: FONT_FAMILIES.arcane,
      size: TEXT_SIZES['4xl'],
      weight: FONT_WEIGHT_CLASSES.bold,
      spacing: LETTER_SPACING.tight,
      gradient: true,
    },
    label: {
      font: FONT_FAMILIES.system,
      size: TEXT_SIZES.sm,
      weight: FONT_WEIGHT_CLASSES.medium,
      spacing: LETTER_SPACING.wide,
    },
    description: {
      font: FONT_FAMILIES.system,
      size: TEXT_SIZES.xs,
      weight: FONT_WEIGHT_CLASSES.normal,
    },
  },
  valueFlow: {
    title: {
      font: FONT_FAMILIES.arcane,
      size: TEXT_SIZES.xl,
      weight: FONT_WEIGHT_CLASSES.semibold,
      spacing: LETTER_SPACING.normal,
    },
    description: {
      font: FONT_FAMILIES.system,
      size: TEXT_SIZES.base,
      weight: FONT_WEIGHT_CLASSES.normal,
      spacing: LETTER_SPACING.normal,
    },
  },
  pillar: {
    title: {
      font: FONT_FAMILIES.system,
      size: TEXT_SIZES.lg,
      weight: FONT_WEIGHT_CLASSES.semibold,
      spacing: LETTER_SPACING.normal,
    },
    description: {
      font: FONT_FAMILIES.system,
      size: TEXT_SIZES.sm,
      weight: FONT_WEIGHT_CLASSES.normal,
      spacing: LETTER_SPACING.normal,
    },
  },
  projection: {
    year: {
      font: FONT_FAMILIES.arcane,
      size: TEXT_SIZES.xl,
      weight: FONT_WEIGHT_CLASSES.bold,
      spacing: LETTER_SPACING.tight,
    },
    phase: {
      font: FONT_FAMILIES.system,
      size: TEXT_SIZES.sm,
      weight: FONT_WEIGHT_CLASSES.medium,
      spacing: LETTER_SPACING.wide,
    },
    metricValue: {
      font: FONT_FAMILIES.arcane,
      size: TEXT_SIZES['2xl'],
      weight: FONT_WEIGHT_CLASSES.bold,
      spacing: LETTER_SPACING.tight,
      gradient: true,
    },
  },
} as const;

// ============================================================================
// 11. TYPE SCALES - Semantic hierarchies
// ============================================================================

export const TYPE_SCALES = {
  immersive: {
    h1: TEXT_SIZES['7xl'],
    h2: TEXT_SIZES['5xl'],
    h3: TEXT_SIZES['3xl'],
    body: TEXT_SIZES.xl,
    caption: TEXT_SIZES.lg,
  },
  interface: {
    h1: TEXT_SIZES['4xl'],
    h2: TEXT_SIZES['2xl'],
    h3: TEXT_SIZES.xl,
    body: TEXT_SIZES.base,
    caption: TEXT_SIZES.sm,
  },
  mobile: {
    h1: TEXT_SIZES['3xl'],
    h2: TEXT_SIZES.xl,
    h3: TEXT_SIZES.lg,
    body: TEXT_SIZES.sm,
    caption: TEXT_SIZES.xs,
  },
  council: {
    h1: TEXT_SIZES['4xl'],
    h2: TEXT_SIZES['2xl'],
    h3: TEXT_SIZES.xl,
    body: TEXT_SIZES.lg,
    detail: TEXT_SIZES.sm,
  },
  data: {
    h1: TEXT_SIZES['3xl'],
    h2: TEXT_SIZES.xl,
    h3: TEXT_SIZES.lg,
    body: TEXT_SIZES.base,
    mono: `${FONT_FAMILIES.mono[0]} ${TEXT_SIZES.sm}`,
    caption: TEXT_SIZES.xs,
  },
  code: {
    base: `${FONT_FAMILIES.mono[0]} ${TEXT_SIZES.base}`,
    sm: `${FONT_FAMILIES.mono[0]} ${TEXT_SIZES.sm}`,
    lg: `${FONT_FAMILIES.mono[0]} ${TEXT_SIZES.lg}`,
  },
} as const;

export type TypeScaleKey = keyof typeof TYPE_SCALES;

// ============================================================================
// 12. CONSCIOUSNESS & PROCESS TYPOGRAPHY
// ============================================================================

export const CONSCIOUSNESS_TYPOGRAPHY = {
  sovereign: {
    font: FONT_FAMILIES.arcane,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    weight: FONT_WEIGHT_CLASSES.bold,
    size: TEXT_SIZES.xl,
    spacing: LETTER_SPACING.tight,
    style: 'italic',
  },
  collaborative: {
    font: FONT_FAMILIES.system,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    size: TEXT_SIZES.base,
    spacing: LETTER_SPACING.normal,
    style: 'normal',
  },
  emergent: {
    font: FONT_FAMILIES.fantasy,
    weight: FONT_WEIGHT_CLASSES.medium,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    size: TEXT_SIZES.lg,
    spacing: LETTER_SPACING.wide,
    style: 'normal',    
  },
  quantum: {
    font: FONT_FAMILIES.runic,
    weight: FONT_WEIGHT_CLASSES.light,
    size: TEXT_SIZES.base,
    style: 'italic',
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    spacing: LETTER_SPACING.wide,    
  },
} as const;

export const PROCESS_TYPOGRAPHY = {
  chaosToClarity: {
    font: FONT_FAMILIES.fantasy,
    weight: FONT_WEIGHT_CLASSES.extrabold,
    spacing: LETTER_SPACING.wider,
    size: TEXT_SIZES.xl,
    style: 'normal',   
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
  },
  traumaToWisdom: {
    font: FONT_FAMILIES.elegant,
    weight: FONT_WEIGHT_CLASSES.normal,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    size: TEXT_SIZES.base,
    spacing: LETTER_SPACING.normal,
    style: 'italic',
  },
  emergence: {
    font: FONT_FAMILIES.arcane,
    weight: FONT_WEIGHT_CLASSES.medium,
    size: TEXT_SIZES.lg,
    style: 'italic', 
    spacing: LETTER_SPACING.wide,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
  },
  sufferingToSovereignty: {
    font: FONT_FAMILIES.medieval,
    weight: FONT_WEIGHT_CLASSES.extrabold,
    spacing: LETTER_SPACING.tight,
    lineHeight: LINE_HEIGHT_CLASSES.relaxed,
    size: TEXT_SIZES.xl,
    style: 'italic',
  },
} as const;

// ============================================================================
// 13. UTILITY FUNCTIONS
// ============================================================================

export interface TypographyConfig {
  font?: readonly string[];
  weight?: string;
  size?: string;
  lineHeight?: string;
  spacing?: string;
  style?: string;
  color?: string;
  gradient?: boolean;
}

/** Compose typography classes into a single Tailwind class string */
export function composeTypographyClasses(config: TypographyConfig): string {
  if (!config) return '';

  const classes: string[] = [];

  if (config.font) {
    const fontKey = Object.entries(FONT_FAMILIES).find(
      ([_, value]) => value[0] === config.font?.[0]
    )?.[0];
    if (fontKey) classes.push(`font-${fontKey}`);
  }
  if (config.weight) classes.push(config.weight);
  if (config.size) classes.push(config.size);
  if (config.lineHeight) classes.push(config.lineHeight);
  if (config.spacing) classes.push(config.spacing);
  if (config.style) classes.push(config.style === 'italic' ? 'italic' : 'not-italic');
  if (config.color) classes.push(config.color);
  if (config.gradient) classes.push('bg-gradient-to-r from-neurospark to-quantum-purple bg-clip-text text-transparent');

  return classes.join(' ');
}

/** Get typography classes for a domain */
export function getDomainTypography(domain: DomainKey): string {
  const config = DOMAIN_TYPOGRAPHY[domain];
  return composeTypographyClasses(config);
}

/** Get typography classes for an entity */
export function getEntityTypography(entity: EntityKey): string {
  const config = ENTITY_TYPOGRAPHY[entity];
  return composeTypographyClasses(config);
}

/** Get responsive typography for a scale */
export function getResponsiveTypography(scale: TypeScaleKey, element: keyof typeof TYPE_SCALES[TypeScaleKey]): string {
  const scaleConfig = TYPE_SCALES[scale];
  return scaleConfig[element] || TYPE_SCALES.interface.body;
}

/** Get font family CSS string for inline styles */
export function getFontFamily(key: FontFamilyKey): string {
  return FONT_FAMILIES[key].join(', ');
}

/** Get font size value for inline styles */
export function getFontSize(key: TextSizeKey): string {
  return FONT_SIZES[key];
}

/** Get font weight value for inline styles */
export function getFontWeight(key: FontWeightKey): string {
  return FONT_WEIGHTS[key];
}

/** Get line height value for inline styles */
export function getLineHeight(key: LineHeightKey): string {
  return LINE_HEIGHTS[key];
}

// ============================================================================
// 14. TYPE EXPORTS
// ============================================================================

export type {
  TypographyConfig as TypographyStyleConfig,
  DomainKey as DomainTypographyKey,
  EntityKey as EntityTypographyKey,
  TextSizeKey as textSizeKey,
  FontWeightKey as fontWeightKey,
  LineHeightKey as lineHeightKey,
  LetterSpacingKey as letterSpacingKey,
  TextAlignmentKey as textAlignmentKey,
  TextColorKey as textColorKey,
  TypeScaleKey as typeScaleKey,
};