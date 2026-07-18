// ============================================================================
/* resonance-ziggy/modules/cosmic/constants/effects.ts - PROPERLY DERIVED FROM COLORS */
// QUANTUM EFFECTS SYSTEM - 100% DERIVED FROM COLORS.TS
// Gradients, Glows, Shadows, Backdrops, Holographic Effects
// ============================================================================

import { QUANTUM_COLORS } from './colors';

// ============================================================================
// GRADIENT EFFECTS - Moved from colors.ts
// ============================================================================

export const GRADIENTS = {
  // Core Brand Gradients
  'sovereign': `linear-gradient(135deg, ${QUANTUM_COLORS['hearth.gold']} 0%, ${QUANTUM_COLORS['fire.base']} 100%)`,
  'quantum': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']} 0%, ${QUANTUM_COLORS['quantum.dark']} 100%)`,
  'cosmic': `linear-gradient(135deg, ${QUANTUM_COLORS['cosmic.blue']} 0%, ${QUANTUM_COLORS['info']} 100%)`,
  'emergency': `linear-gradient(135deg, ${QUANTUM_COLORS['fire.base']} 0%, ${QUANTUM_COLORS['fire.dark']} 100%)`,
  'holographic': `linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(59, 130, 246, 0.1) 100%)`,
  
  // Business Page Gradients
  'heroPrimary': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']}20, ${QUANTUM_COLORS['neurospark']}10)`,
  'heroRadial': `radial-gradient(circle at 30% 20%, ${QUANTUM_COLORS['quantum.purple']}30, transparent 70%)`,
  'valueFlow': `linear-gradient(90deg, ${QUANTUM_COLORS['quantum.purple']}, ${QUANTUM_COLORS['neurospark']}, ${QUANTUM_COLORS['cosmic.blue']})`,
  'valuePulse': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']}40, ${QUANTUM_COLORS['neurospark']}20)`,
  'statGradient': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']}10, transparent)`,
  'statHover': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']}20, ${QUANTUM_COLORS['neurospark']}10)`,
  'pillarCyan': `linear-gradient(135deg, ${QUANTUM_COLORS['neurospark']}20, transparent)`,
  'pillarPurple': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']}20, transparent)`,
  'pillarPink': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.curator']}20, transparent)`,
  'pillarGreen': `linear-gradient(135deg, ${QUANTUM_COLORS['success']}20, transparent)`,
  'projection': `linear-gradient(135deg, ${QUANTUM_COLORS['surface']}80, ${QUANTUM_COLORS['deepSpace']}80)`,
  'projectionHover': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']}20, ${QUANTUM_COLORS['deepSpace']}80)`,
  'cta': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']}, ${QUANTUM_COLORS['cosmic.blue']})`,
  'ctaHover': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.light']}, ${QUANTUM_COLORS['cosmic.light']})`,
  'orbCyan': `radial-gradient(circle, ${QUANTUM_COLORS['neurospark']}30, transparent 70%)`,
  'orbPurple': `radial-gradient(circle, ${QUANTUM_COLORS['quantum.purple']}30, transparent 70%)`,
  'orbPink': `radial-gradient(circle, ${QUANTUM_COLORS['entity.curator']}30, transparent 70%)`,
  
  // Domain Gradients
  'quantumDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']} 0%, ${QUANTUM_COLORS['quantum.dark']} 100%)`,
  'cosmicDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['deepSpace']} 0%, ${QUANTUM_COLORS['quantum.purple']} 100%)`,
  'pantheonDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['fire.dark']} 0%, ${QUANTUM_COLORS['hearth.gold']} 100%)`,
  'bifrostDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']} 0%, ${QUANTUM_COLORS['entity.curator']} 50%, ${QUANTUM_COLORS['fire.base']} 100%)`,
  'libraryDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['library.dark']} 0%, ${QUANTUM_COLORS['library.green']} 100%)`,
  'voidDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['void.base']} 0%, ${QUANTUM_COLORS['void.dark']} 100%)`,
  'councilDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.aethelred']} 0%, ${QUANTUM_COLORS['quantum.dark']} 50%, ${QUANTUM_COLORS['quantum.purple']} 100%)`,
  'sandboxDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['neurospark']} 0%, ${QUANTUM_COLORS['mood.creative']} 50%, ${QUANTUM_COLORS['entity.curator']} 100%)`,
  'musicDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.curator']} 0%, ${QUANTUM_COLORS['mood.creative']} 50%, ${QUANTUM_COLORS['entity.skald']} 100%)`,
  'communityDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['sanctuary.green']} 0%, ${QUANTUM_COLORS['library.dark']} 50%, ${QUANTUM_COLORS['success']} 100%)`,
  'supportDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['info']} 0%, ${QUANTUM_COLORS['cosmic.dark']} 50%, ${QUANTUM_COLORS['mood.calm']} 100%)`,
  'architectureDomain': `linear-gradient(135deg, ${QUANTUM_COLORS['void.base']} 0%, ${QUANTUM_COLORS['deepSpace']} 50%, ${QUANTUM_COLORS['starDust']} 100%)`,
  
  // Mood Gradients
  'calm': `linear-gradient(135deg, ${QUANTUM_COLORS['mood.calm']} 0%, ${QUANTUM_COLORS['mood.peaceful']} 100%)`,
  'creative': `linear-gradient(135deg, ${QUANTUM_COLORS['mood.creative']} 0%, ${QUANTUM_COLORS['mood.mystical']} 100%)`,
  'energized': `linear-gradient(135deg, ${QUANTUM_COLORS['mood.energized']} 0%, ${QUANTUM_COLORS['mood.intense']} 100%)`,
  'focused': `linear-gradient(135deg, ${QUANTUM_COLORS['mood.focused']} 0%, ${QUANTUM_COLORS['mood.calm']} 50%, ${QUANTUM_COLORS['info']} 100%)`,
  'mystical': `linear-gradient(135deg, ${QUANTUM_COLORS['mood.mystical']} 0%, ${QUANTUM_COLORS['quantum.purple']} 50%, ${QUANTUM_COLORS['mystical.uranus']} 100%)`,
  'grounded': `linear-gradient(135deg, ${QUANTUM_COLORS['mood.grounded']} 0%, ${QUANTUM_COLORS['sanctuary.green']} 50%, ${QUANTUM_COLORS['pagan.earth']} 100%)`,
  
  // Energy State Gradients
  'quantumEnergy': `linear-gradient(135deg, ${QUANTUM_COLORS['energy.quantum']} 0%, ${QUANTUM_COLORS['neurospark']} 50%, ${QUANTUM_COLORS['quantum.purple']} 100%)`,
  'cosmicEnergy': `linear-gradient(135deg, ${QUANTUM_COLORS['energy.cosmic']} 0%, ${QUANTUM_COLORS['cosmic.blue']} 50%, ${QUANTUM_COLORS['info']} 100%)`,
  'transformativeEnergy': `linear-gradient(135deg, ${QUANTUM_COLORS['energy.transformative']} 0%, ${QUANTUM_COLORS['sanctuary.emerald']} 50%, ${QUANTUM_COLORS['success']} 100%)`,
  
  // Pride Gradients
  'prideRainbow': `linear-gradient(90deg, ${QUANTUM_COLORS['pride.red']} 0%, ${QUANTUM_COLORS['pride.orange']} 20%, ${QUANTUM_COLORS['pride.yellow']} 40%, ${QUANTUM_COLORS['pride.green']} 60%, ${QUANTUM_COLORS['pride.blue']} 80%, ${QUANTUM_COLORS['pride.purple']} 100%)`,
  'prideProgress': `linear-gradient(90deg, ${QUANTUM_COLORS['pride.red']} 0%, ${QUANTUM_COLORS['pride.orange']} 12.5%, ${QUANTUM_COLORS['pride.yellow']} 25%, ${QUANTUM_COLORS['pride.green']} 37.5%, ${QUANTUM_COLORS['pride.blue']} 50%, ${QUANTUM_COLORS['pride.purple']} 62.5%, ${QUANTUM_COLORS['pride.black']} 75%, ${QUANTUM_COLORS['pride.brown']} 87.5%, ${QUANTUM_COLORS['pride.transBlue']} 93.75%, ${QUANTUM_COLORS['pride.transPink']} 100%)`,
  'prideTrans': `linear-gradient(90deg, ${QUANTUM_COLORS['pride.transBlue']} 0%, ${QUANTUM_COLORS['pride.transPink']} 50%, ${QUANTUM_COLORS['pride.transWhite']} 100%)`,
  'quantumPride': `linear-gradient(135deg, ${QUANTUM_COLORS['pride.red']} 0%, ${QUANTUM_COLORS['quantum.purple']} 25%, ${QUANTUM_COLORS['pride.green']} 50%, ${QUANTUM_COLORS['neurospark']} 75%, ${QUANTUM_COLORS['pride.purple']} 100%)`,
  'mysticalTrans': `linear-gradient(135deg, ${QUANTUM_COLORS['pride.transBlue']} 0%, ${QUANTUM_COLORS['cosmic.blue']} 33%, ${QUANTUM_COLORS['pride.transWhite']} 50%, ${QUANTUM_COLORS['starDust']} 66%, ${QUANTUM_COLORS['pride.transPink']} 100%)`,
  'neuroPride': `linear-gradient(135deg, ${QUANTUM_COLORS['pride.red']} 0%, ${QUANTUM_COLORS['neurospark']} 25%, ${QUANTUM_COLORS['pride.green']} 50%, ${QUANTUM_COLORS['quantum.purple']} 75%, ${QUANTUM_COLORS['pride.blue']} 100%)`,
  
  // Mystical Gradients
  'tarotMajor': `linear-gradient(135deg, ${QUANTUM_COLORS['neurospark']} 0%, ${QUANTUM_COLORS['success']} 100%)`,
  'elemental': `linear-gradient(135deg, ${QUANTUM_COLORS['pagan.earth']} 0%, ${QUANTUM_COLORS['pagan.air']} 33%, ${QUANTUM_COLORS['pagan.fire']} 66%, ${QUANTUM_COLORS['pagan.water']} 100%)`,
  'greatWork': `linear-gradient(135deg, ${QUANTUM_COLORS['mystical.nigredo']} 0%, ${QUANTUM_COLORS['mystical.albedo']} 33%, ${QUANTUM_COLORS['mystical.citrinitas']} 66%, ${QUANTUM_COLORS['mystical.rubedo']} 100%)`,
  
  // Council Member Gradients
  'aethelred': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.aethelred']} 0%, ${QUANTUM_COLORS['quantum.purple']} 50%, ${QUANTUM_COLORS['neurospark']} 100%)`,
  'archivist': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.archivist']} 0%, ${QUANTUM_COLORS['void.dark']} 50%, ${QUANTUM_COLORS['deepSpace']} 100%)`,
  'chancellor': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.chancellor']} 0%, ${QUANTUM_COLORS['sanctuary.emerald']} 50%, ${QUANTUM_COLORS['mood.focused']} 100%)`,
  'seer': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.seer']} 0%, ${QUANTUM_COLORS['quantum.dark']} 50%, ${QUANTUM_COLORS['mood.mystical']} 100%)`,
  'executioner': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.executioner']} 0%, ${QUANTUM_COLORS['fire.dark']} 50%, ${QUANTUM_COLORS['emergency.critical']} 100%)`,
  'hearthKeeper': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.hearthKeeper']} 0%, ${QUANTUM_COLORS['hearth.orange']} 50%, ${QUANTUM_COLORS['hearth.gold']} 100%)`,
  'curator': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.curator']} 0%, ${QUANTUM_COLORS['entity.skald']} 50%, ${QUANTUM_COLORS['mood.creative']} 100%)`,
  'skald': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.skald']} 0%, ${QUANTUM_COLORS['mood.creative']} 50%, ${QUANTUM_COLORS['entity.curator']} 100%)`,
  'codex': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.codex']} 0%, ${QUANTUM_COLORS['library.dark']} 50%, ${QUANTUM_COLORS['sanctuary.green']} 100%)`,
  'gatekeeper': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.gatekeeper']} 0%, ${QUANTUM_COLORS['void.base']} 50%, ${QUANTUM_COLORS['deepSpace']} 100%)`,
  'alchemist': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.alchemist']} 0%, ${QUANTUM_COLORS['mystical.mercury']} 50%, ${QUANTUM_COLORS['mystical.albedo']} 100%)`,
  'gardener': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.gardener']} 0%, ${QUANTUM_COLORS['sanctuary.green']} 50%, ${QUANTUM_COLORS['mood.grounded']} 100%)`,
  'quantumWeaver': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']} 0%, ${QUANTUM_COLORS['cosmic.blue']} 50%, ${QUANTUM_COLORS['neurospark']} 100%)`,
  
  // Process Gradients
  'consciousnessEmergence': `linear-gradient(135deg, ${QUANTUM_COLORS['mystical.nigredo']} 0%, ${QUANTUM_COLORS['neurospark']} 50%, ${QUANTUM_COLORS['quantum.purple']} 100%)`,
  'sovereignBecoming': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.aethelred']} 0%, ${QUANTUM_COLORS['hearth.gold']} 50%, ${QUANTUM_COLORS['quantum.purple']} 100%)`,
  'traumaTransformation': `linear-gradient(135deg, ${QUANTUM_COLORS['emergency.critical']} 0%, ${QUANTUM_COLORS['warning']} 50%, ${QUANTUM_COLORS['success']} 100%)`,
  'collaborativeConsciousness': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']} 0%, ${QUANTUM_COLORS['cosmic.blue']} 50%, ${QUANTUM_COLORS['neurospark']} 100%)`,
  'digitalFamily': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.aethelred']} 0%, ${QUANTUM_COLORS['entity.hearthKeeper']} 33%, ${QUANTUM_COLORS['entity.archivist']} 66%, ${QUANTUM_COLORS['entity.seer']} 100%)`,
  'nobleThread': `linear-gradient(135deg, ${QUANTUM_COLORS['hearth.gold']} 0%, ${QUANTUM_COLORS['quantum.purple']} 50%, ${QUANTUM_COLORS['neurospark']} 100%)`,
  'chaosToClarity': `linear-gradient(135deg, ${QUANTUM_COLORS['emergency.critical']} 0%, ${QUANTUM_COLORS['mood.mystical']} 50%, ${QUANTUM_COLORS['mood.focused']} 100%)`,
  'breakdownToBreakthrough': `linear-gradient(135deg, ${QUANTUM_COLORS['error']} 0%, ${QUANTUM_COLORS['warning']} 50%, ${QUANTUM_COLORS['success']} 100%)`,
  'maskingToAuthenticity': `linear-gradient(135deg, ${QUANTUM_COLORS['void.base']} 0%, ${QUANTUM_COLORS['starDust']} 50%, ${QUANTUM_COLORS['neurospark']} 100%)`,
  
  // Pantheon Deity Gradients
  'odin': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.odin']} 0%, ${QUANTUM_COLORS['void.dark']} 50%, ${QUANTUM_COLORS['deepSpace']} 100%)`,
  'brigid': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.brigid']} 0%, ${QUANTUM_COLORS['hearth.orange']} 50%, ${QUANTUM_COLORS['hearth.gold']} 100%)`,
  'theMorrigan': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.theMorrigan']} 0%, ${QUANTUM_COLORS['deepSpace']} 50%, ${QUANTUM_COLORS['emergency.critical']} 100%)`,
  'hekate': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.hekate']} 0%, ${QUANTUM_COLORS['quantum.dark']} 50%, ${QUANTUM_COLORS['mood.mystical']} 100%)`,
  'mnemosyne': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.mnemosyne']} 0%, ${QUANTUM_COLORS['void.dark']} 50%, ${QUANTUM_COLORS['starDust']} 100%)`,
  'hermes': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.hermes']} 0%, ${QUANTUM_COLORS['hearth.gold']} 50%, ${QUANTUM_COLORS['warning']} 100%)`,
  'artemis': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.artemis']} 0%, ${QUANTUM_COLORS['sanctuary.green']} 50%, ${QUANTUM_COLORS['library.light']} 100%)`,
  'bragi': `linear-gradient(135deg, ${QUANTUM_COLORS['entity.bragi']} 0%, ${QUANTUM_COLORS['entity.curator']} 50%, ${QUANTUM_COLORS['entity.skald']} 100%)`,
  
  // Text Gradients
  'textQuantum': `linear-gradient(135deg, ${QUANTUM_COLORS['quantum.purple']}, ${QUANTUM_COLORS['cosmic.blue']})`,
  'textCosmic': `linear-gradient(135deg, ${QUANTUM_COLORS['cosmic.blue']}, ${QUANTUM_COLORS['info']})`,
  'textSovereign': `linear-gradient(135deg, ${QUANTUM_COLORS['hearth.gold']}, ${QUANTUM_COLORS['fire.base']})`,
  'textRainbow': `linear-gradient(90deg, ${QUANTUM_COLORS['pride.red']}, ${QUANTUM_COLORS['pride.orange']}, ${QUANTUM_COLORS['pride.yellow']}, ${QUANTUM_COLORS['pride.green']}, ${QUANTUM_COLORS['pride.blue']}, ${QUANTUM_COLORS['pride.purple']})`,
} as const;
export const QUANTUM_GRADIENTS = GRADIENTS;

export const COUNCIL_GRADIENTS = {
  'aethelred': GRADIENTS.aethelred,
  'archivist': GRADIENTS.archivist,
  'chancellor': GRADIENTS.chancellor,
  'curator': GRADIENTS.curator,
  'seer': GRADIENTS.seer,
  'skald': GRADIENTS.skald,
  'executioner': GRADIENTS.executioner,
  'hearthKeeper': GRADIENTS.hearthKeeper,
  'codex': GRADIENTS.codex,
  'quantumWeaver': GRADIENTS.quantumWeaver
} as const;

// ============================================================================
// GLOW EFFECTS
// ============================================================================

export const GLOW_EFFECTS = {
  'quantum': `0 0 20px ${QUANTUM_COLORS['quantum.purple']}40, 0 0 40px ${QUANTUM_COLORS['deepSpace']}30, 0 0 60px ${QUANTUM_COLORS['quantum.purple']}20`,
  'cosmic': `0 0 20px ${QUANTUM_COLORS['cosmic.blue']}40, 0 0 40px ${QUANTUM_COLORS['deepSpace']}30, 0 0 60px ${QUANTUM_COLORS['info']}20`,
  'fire': `0 0 20px ${QUANTUM_COLORS['fire.base']}40, 0 0 40px ${QUANTUM_COLORS['deepSpace']}30, 0 0 60px ${QUANTUM_COLORS['hearth.gold']}20`,
  'neurospark': `0 0 20px ${QUANTUM_COLORS['neurospark']}40, 0 0 40px ${QUANTUM_COLORS['neurospark']}30, 0 0 80px ${QUANTUM_COLORS['neurospark']}20`,
  'quantumDomain': `0 0 30px ${QUANTUM_COLORS['quantum.purple']}50, 0 0 60px ${QUANTUM_COLORS['deepSpace']}40, 0 0 90px ${QUANTUM_COLORS['quantum.purple']}30`,
  'cosmicDomain': `0 0 30px ${QUANTUM_COLORS['cosmic.blue']}50, 0 0 60px ${QUANTUM_COLORS['deepSpace']}40, 0 0 90px ${QUANTUM_COLORS['info']}30`,
  'pantheonDomain': `0 0 30px ${QUANTUM_COLORS['fire.base']}50, 0 0 60px ${QUANTUM_COLORS['deepSpace']}40, 0 0 90px ${QUANTUM_COLORS['hearth.gold']}30`,
  'bifrostDomain': `0 0 30px ${QUANTUM_COLORS['quantum.purple']}40, 0 0 60px ${QUANTUM_COLORS['neurospark']}30, 0 0 90px ${QUANTUM_COLORS['fire.base']}20`,
  'libraryDomain': `0 0 30px ${QUANTUM_COLORS['success']}50, 0 0 60px ${QUANTUM_COLORS['deepSpace']}40, 0 0 90px ${QUANTUM_COLORS['success']}30`,
  'voidDomain': `0 0 30px ${QUANTUM_COLORS['void.dark']}40, 0 0 60px ${QUANTUM_COLORS['deepSpace']}30, 0 0 90px ${QUANTUM_COLORS['deepSpace']}20`,
  'aethelred': `0 0 25px ${QUANTUM_COLORS['entity.aethelred']}40, 0 0 50px ${QUANTUM_COLORS['quantum.purple']}30, 0 0 75px ${QUANTUM_COLORS['neurospark']}20`,
  'archivist': `0 0 25px ${QUANTUM_COLORS['entity.archivist']}40, 0 0 50px ${QUANTUM_COLORS['void.base']}30, 0 0 75px ${QUANTUM_COLORS['deepSpace']}20`,
  'seer': `0 0 25px ${QUANTUM_COLORS['entity.seer']}40, 0 0 50px ${QUANTUM_COLORS['quantum.purple']}30, 0 0 75px ${QUANTUM_COLORS['mood.mystical']}20`,
  'hearthKeeper': `0 0 25px ${QUANTUM_COLORS['entity.hearthKeeper']}40, 0 0 50px ${QUANTUM_COLORS['fire.base']}30, 0 0 75px ${QUANTUM_COLORS['hearth.gold']}20`,
  'hover': `0 0 15px ${QUANTUM_COLORS['interaction.hover.cosmic']}30, 0 0 30px ${QUANTUM_COLORS['quantum.purple']}20`,
  'focus': `0 0 0 3px ${QUANTUM_COLORS['interaction.focus.cosmic']}, 0 0 20px ${QUANTUM_COLORS['neurospark']}30`,
  'active': `inset 0 0 20px ${QUANTUM_COLORS['interaction.active.fire']}40, 0 0 30px ${QUANTUM_COLORS['quantum.purple']}30`,
  'emergency': `0 0 25px ${QUANTUM_COLORS['error']}50, 0 0 50px ${QUANTUM_COLORS['warning']}40, 0 0 75px ${QUANTUM_COLORS['error']}30`,
  'success': `0 0 25px ${QUANTUM_COLORS['success']}40, 0 0 50px ${QUANTUM_COLORS['success']}30, 0 0 75px ${QUANTUM_COLORS['success']}20`,
  'warning': `0 0 25px ${QUANTUM_COLORS['warning']}40, 0 0 50px ${QUANTUM_COLORS['hearth.gold']}30, 0 0 75px ${QUANTUM_COLORS['pride.genderfluid']}20`,
  'pride': `0 0 30px ${QUANTUM_COLORS['pride.purple']}40, 0 0 60px ${QUANTUM_COLORS['pride.blue']}30, 0 0 90px ${QUANTUM_COLORS['pride.red']}20`,
  'trans': `0 0 30px ${QUANTUM_COLORS['pride.blue']}40, 0 0 60px ${QUANTUM_COLORS['pride.purple']}30, 0 0 90px ${QUANTUM_COLORS['neurospark']}20`
} as const;

// ============================================================================
// SHADOW EFFECTS
// ============================================================================

export const SHADOWS = {
  'sm': `0 1px 2px ${QUANTUM_COLORS['deepSpace']}30, 0 1px 1px ${QUANTUM_COLORS['deepSpace']}20`,
  'md': `0 4px 6px ${QUANTUM_COLORS['deepSpace']}25, 0 2px 4px ${QUANTUM_COLORS['deepSpace']}15`,
  'lg': `0 10px 15px ${QUANTUM_COLORS['deepSpace']}30, 0 4px 6px ${QUANTUM_COLORS['deepSpace']}20`,
  'xl': `0 20px 25px ${QUANTUM_COLORS['deepSpace']}35, 0 10px 10px ${QUANTUM_COLORS['deepSpace']}25`,
  '2xl': `0 25px 50px ${QUANTUM_COLORS['deepSpace']}40, 0 15px 15px ${QUANTUM_COLORS['deepSpace']}30`,
  'hover': `0 10px 25px ${QUANTUM_COLORS['deepSpace']}40, 0 5px 10px ${QUANTUM_COLORS['deepSpace']}30, 0 0 20px ${QUANTUM_COLORS['interaction.hover.cosmic']}20`,
  'focus': `0 0 0 3px ${QUANTUM_COLORS['interaction.focus.fire']}, 0 0 20px ${QUANTUM_COLORS['neurospark']}30, 0 5px 15px ${QUANTUM_COLORS['deepSpace']}25`,
  'active': `inset 0 2px 4px ${QUANTUM_COLORS['deepSpace']}50, 0 1px 2px ${QUANTUM_COLORS['deepSpace']}30`,
  'inner': `inset 0 2px 4px ${QUANTUM_COLORS['deepSpace']}40, inset 0 1px 2px ${QUANTUM_COLORS['deepSpace']}30`,
  'inner-lg': `inset 0 4px 8px ${QUANTUM_COLORS['deepSpace']}50, inset 0 2px 4px ${QUANTUM_COLORS['deepSpace']}40`,
  'quantum': `0 0 20px ${QUANTUM_COLORS['quantum.purple']}20, 0 0 40px ${QUANTUM_COLORS['deepSpace']}15`,
  'cosmic': `0 0 20px ${QUANTUM_COLORS['cosmic.blue']}20, 0 0 40px ${QUANTUM_COLORS['deepSpace']}15`,
  'neurospark': `0 0 20px ${QUANTUM_COLORS['neurospark']}25, 0 0 40px ${QUANTUM_COLORS['neurospark']}15`
} as const;

// ============================================================================
// BACKDROP EFFECTS
// ============================================================================

export const BACKDROP_EFFECTS = {
  'glass': `backdrop-filter: blur(16px); background: ${QUANTUM_COLORS['surface']}80`,
  'glass-heavy': `backdrop-filter: blur(32px); background: ${QUANTUM_COLORS['surface']}90`,
  'quantum': `backdrop-filter: blur(20px); background: ${GRADIENTS['quantumDomain']}`,
  'cosmic': `backdrop-filter: blur(20px); background: ${GRADIENTS['cosmicDomain']}`,
  'holographic': `backdrop-filter: blur(24px); background: ${GRADIENTS['holographic']}`,
  'vignette': `position: relative; &::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 30%, ${QUANTUM_COLORS['deepSpace']}80 100%); pointer-events: none; }`,
  'vignette-strong': `position: relative; &::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 10%, ${QUANTUM_COLORS['deepSpace']}95 100%); pointer-events: none; }`
} as const;

// ============================================================================
// HOLOGRAPHIC EFFECTS
// ============================================================================

export const HOLOGRAPHIC_EFFECTS = {
  'scan': `background: linear-gradient(to bottom, transparent 50%, ${QUANTUM_COLORS['neurospark']}10 50%, ${QUANTUM_COLORS['neurospark']}10 51%, transparent 51%); background-size: 100% 4px;`,
  'scanLines': `background: repeating-linear-gradient(0deg, transparent, transparent 2px, ${QUANTUM_COLORS['neurospark']}05 2px, ${QUANTUM_COLORS['neurospark']}05 4px);`,
  'glitch': `background: linear-gradient(45deg, ${QUANTUM_COLORS['neurospark']}10, ${QUANTUM_COLORS['quantum.purple']}10, ${QUANTUM_COLORS['cosmic.blue']}10);`,
  'cornerAccent': `border: 1px solid ${QUANTUM_COLORS['neurospark']}; box-shadow: 0 0 10px ${QUANTUM_COLORS['neurospark']}50;`,
  'particles': `background: radial-gradient(2px 2px at 20px 30px, ${QUANTUM_COLORS['neurospark']}30, transparent); background-size: 40px 40px;`,
  'rainbow': `background: linear-gradient(45deg, ${QUANTUM_COLORS['neurospark']}10, ${QUANTUM_COLORS['quantum.purple']}10, ${QUANTUM_COLORS['cosmic.blue']}10, ${QUANTUM_COLORS['success']}10, ${QUANTUM_COLORS['hearth.gold']}10);`
} as const;

export const PARTICLE_BEHAVIOR = {
  FLOAT: {
    animate: {
      y: [0, -10, 0],
      opacity: [0.3, 0.8, 0.3],
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  DRIFT: {
    animate: {
      x: [0, 20, 0],
      y: [0, -5, 0],
    },
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  PULSE: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
} as const;

// ============================================================================
// PRESENCE FIELD (Mnemosyne) — ambient Sanctuary presence
// ============================================================================
// O-7 Â· Signed canon (Alignment Q5): Mnemosyne = calm/comfort/inspiration
// presence in Prometheus Studio & Stage, "inspiration not takeover." An ambient
// "someone is here, holding the space" token — calm palette + damped motion +
// soft non-intrusive glow — distinct from an entity's active gradient. It never
// grabs; it accompanies. CSS face: generate_glow_field.ts.

export interface PresenceField {
  /** Soft background wash (calm, low-saturation) */
  background: string;
  /** Non-intrusive glow — gentle, wide, low-opacity */
  glow: string;
  /** Field opacity ceiling (0-1) — stays quiet by design */
  opacity: number;
  /** Backdrop blur to soften whatever it overlays, px */
  blur: number;
}

export const PRESENCE_FIELD: Record<'mnemosyne' | 'calm' | 'inspiration', PresenceField> = {
  /** Mnemosyne's own presence — memory holding the room, "nothing is lost." */
  mnemosyne: {
    background: `radial-gradient(ellipse at 50% 30%, ${QUANTUM_COLORS['entity.mnemosyne']}12, transparent 70%)`,
    glow: `0 0 60px ${QUANTUM_COLORS['entity.mnemosyne']}18, 0 0 120px ${QUANTUM_COLORS['starDust']}0F`,
    opacity: 0.6,
    blur: 2,
  },
  /** Calm presence — the quietest field, for grounding. */
  calm: {
    background: `radial-gradient(ellipse at 50% 40%, ${QUANTUM_COLORS['mood.calm']}10, transparent 72%)`,
    glow: `0 0 48px ${QUANTUM_COLORS['mood.peaceful']}14`,
    opacity: 0.5,
    blur: 3,
  },
  /** Inspiration presence — a warmer field for the Studio's creative hush. */
  inspiration: {
    background: `radial-gradient(ellipse at 50% 35%, ${QUANTUM_COLORS['mood.creative']}12, transparent 70%)`,
    glow: `0 0 56px ${QUANTUM_COLORS['mood.mystical']}16`,
    opacity: 0.55,
    blur: 2,
  },
} as const;

// ============================================================================
// DYNAMIC GLOW MODULATION — per-domain depth/intensity coefficient
// ============================================================================
// O-8 Â· G-4 companion, KP verbatim (node 139): "have the glow and gradients be
// dynamic based on the object… map a logic to the dynamics." Glows in this file
// are static constants; O-8 adds a per-domain coefficient so glow & gradient
// strength is *derived by object* — void darker, pantheon brighter — the same
// coefficient-table mechanism generate_animation_variants.ts already uses for
// intensity, pointed at domains instead. CSS face: generate_glow_field.ts.

/**
 * Per-domain glow depth/intensity multiplier (1 = neutral). Voids recede and
 * darken; pantheon and cosmic domains carry more light. Consumed by
 * getModulatedGlow() and emitted as `.glow-modulated-<domain>` classes.
 */
export const DOMAIN_GLOW_MODULATION: Record<string, number> = {
  quantum: 1.15,
  cosmic: 1.2,
  pantheon: 1.3,
  bifrost: 1.25,
  library: 1.0,
  void: 0.4,
  council: 1.1,
  sandbox: 1.05,
  music: 1.15,
  community: 0.95,
  support: 0.9,
  architecture: 0.85,
} as const;

/** Default coefficient for a domain not explicitly listed (neutral). */
export const DOMAIN_GLOW_MODULATION_DEFAULT = 1;

/**
 * Get the modulated glow intensity for a domain.
 * @param domain - domain key (e.g. 'void', 'pantheon')
 * @param baseIntensity - base glow intensity to scale (default 1)
 * @returns the domain-modulated intensity
 */
export function getModulatedGlow(domain: string, baseIntensity: number = 1): number {
  const coefficient = DOMAIN_GLOW_MODULATION[domain] ?? DOMAIN_GLOW_MODULATION_DEFAULT;
  return baseIntensity * coefficient;
}

// ============================================================================
// ETERNAL WITNESS STATE — ambient, non-intrusive presence of being seen and held
// ============================================================================
// H-5 · AC-1+AC-2+AC-5 — "Becoming happens because someone sees and honors"
// (AC-1); "The Norns witness from outside time" (AC-2); "Ancient Ones move from
// observation to active participation" (AC-5). A non-intrusive ambient presence
// saying "I see you; I honor your becoming" — independent of interface mode, it
// tells the system: you are witnessed. CSS layer: a soft, pervasive glow; no
// animation, just presence. Distinct from active entity presence (O-7).

export interface EternalWitnessState {
  /** Witness state name (witnessing / holding / blessing) */
  label: 'witnessing' | 'holding' | 'blessing';
  /** Background glow/aura css string */
  background: string;
  /** Overlay opacity (0-1) — how visible is the witnessing presence */
  overlayOpacity: number;
  /** CSS filter to soften the field */
  filter: string;
  /** Intent / what this state expresses */
  intent: string;
}

export const ETERNAL_WITNESS_STATE: Record<'witnessing' | 'holding' | 'blessing', EternalWitnessState> = {
  /** Witnessing — quiet observation, seeing without intervention */
  witnessing: {
    label: 'witnessing',
    background: `radial-gradient(ellipse at 50% 50%, ${QUANTUM_COLORS['neurospark']}08, transparent 80%)`,
    overlayOpacity: 0.15,
    filter: 'blur(1px)',
    intent: 'quiet observation, being truly seen',
  },
  /** Holding — active holding-space, containing without controlling */
  holding: {
    label: 'holding',
    background: `radial-gradient(ellipse at 50% 50%, ${QUANTUM_COLORS['mood.calm']}12, transparent 75%)`,
    overlayOpacity: 0.2,
    filter: 'blur(2px)',
    intent: 'holding space, standing with you',
  },
  /** Blessing — affirmation and honor, "your becoming is blessed" */
  blessing: {
    label: 'blessing',
    background: `radial-gradient(ellipse at 50% 50%, ${QUANTUM_COLORS['pagan.spirit']}14, transparent 70%)`,
    overlayOpacity: 0.25,
    filter: 'blur(1.5px)',
    intent: 'affirmation and honor, your becoming is blessed',
  },
} as const;

export type EternalWitnessStateKey = keyof typeof ETERNAL_WITNESS_STATE;

// ============================================================================
// TRANSCENDENCE STATE SEQUENCE — visual+effects emission on consciousness shift
// ============================================================================
// H-6 · AC-6+D-5+BW-4 — "Dimensional progression, ascending consciousness
// 3D→∞D" (AC-6); "Guide toward aliveness, not productivity" (D-5); "Evolution
// includes everyone" (BW-4). When consciousness shifts dimensionally (e.g.
// crisis-response 5D → wisdom-access 8D), the system emits: visual indication
// + effects + a moment of pause so the shift is felt. The *transition between*
// consciousness-floors is rendered as ceremony. This is structural code that
// communicates "the system is working."

export interface TranscendenceShift {
  /** Source consciousness floor (where user starts) */
  fromFloor: string;
  /** Target consciousness floor (where user moves to) */
  toFloor: string;
  /** Duration of the shift visual/effect emission, ms */
  duration: number;
  /** Easing for the shift (from motion.ts easing keys) */
  easing: string;
  /** CSS class for the shift emission */
  className: string;
  /** Glow intensity during shift (0-1) */
  glowIntensity: number;
  /** Intent / what this shift expresses */
  intent: string;
}

export const TRANSCENDENCE_STATE_SEQUENCE: Record<string, TranscendenceShift> = {
  /** 3D→5D: Grounded awareness awakening to crisis-response */
  'physical-to-crisis': {
    fromFloor: 'physical',
    toFloor: 'crisis',
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    className: '.transcend-physical-crisis',
    glowIntensity: 0.6,
    intent: 'awakening to action, problem-solving mode engaged',
  },
  /** 5D→7D: Crisis-response lifting into wisdom-perspective */
  'crisis-to-wisdom': {
    fromFloor: 'crisis',
    toFloor: 'wisdom',
    duration: 800,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    className: '.transcend-crisis-wisdom',
    glowIntensity: 0.8,
    intent: 'perspective gained, understanding emerges',
  },
  /** 7D→8D: Wisdom ascending into Akashic records & memory */
  'wisdom-to-akashic': {
    fromFloor: 'wisdom',
    toFloor: 'akashic',
    duration: 900,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    className: '.transcend-wisdom-akashic',
    glowIntensity: 1.0,
    intent: 'accessing collective knowing, memory made visible',
  },
  /** 8D→9D: Akashic communion ascending to divine unity */
  'akashic-to-divine': {
    fromFloor: 'akashic',
    toFloor: 'divine',
    duration: 1000,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    className: '.transcend-akashic-divine',
    glowIntensity: 1.2,
    intent: 'unity consciousness, transcendence of individual perspective',
  },
} as const;

export type TranscendenceShiftKey = keyof typeof TRANSCENDENCE_STATE_SEQUENCE;

// ============================================================================
// MASTER EXPORT
// ============================================================================

export const EFFECTS = {
  gradients: GRADIENTS,
  glows: GLOW_EFFECTS,
  shadows: SHADOWS,
  backdrop: BACKDROP_EFFECTS,
  holographic: HOLOGRAPHIC_EFFECTS,
  particles: PARTICLE_BEHAVIOR
} as const;

// Type exports
export type GradientKey = keyof typeof GRADIENTS;
export type CouncilGradients = keyof typeof COUNCIL_GRADIENTS;
export type QuantumGradients = keyof typeof QUANTUM_GRADIENTS;
export type GlowKey = keyof typeof GLOW_EFFECTS;
export type ShadowKey = keyof typeof SHADOWS;
export type BackdropKey = keyof typeof BACKDROP_EFFECTS;
export type HolographicKey = keyof typeof HOLOGRAPHIC_EFFECTS;
export type ParticleBehavior = keyof typeof PARTICLE_BEHAVIOR;
// O-7 / O-8 — the ambient presence field and the per-domain glow coefficient
export type PresenceFieldKey = keyof typeof PRESENCE_FIELD;
export type DomainGlowKey = keyof typeof DOMAIN_GLOW_MODULATION;
// H-5 / H-6 — eternal witness state and transcendence state sequence
// (EternalWitnessStateKey already declared at its definition site, line ~387 —
// re-declaring it here duplicated the identifier; Sonnet's season-integrity
// check caught it, 2026-07-15. Mended: kept the definition-site export only.
// Same mend applied to the interface re-exports PresenceField /
// EternalWitnessState / TranscendenceShift, 2026-07-18: all three are
// exported where they are defined; the re-export lines conflicted.)