// ============================================================================
/* resonance-ziggy/modules/cosmic/constants/interactivity.ts */
// QUANTUM INTERACTIVITY SYSTEM — the user's own hand
// The control surface: the button, the gesture, the consent.
// ============================================================================

import { durations, easing, CEREMONIES, ceremonyTotalDuration, CEREMONY_BOOKENDS, type CeremonyKey, type CeremonyBookendKey } from './motion';
import { PAUSE_MODES, type PauseMode, CONSCIOUSNESS_FLOORS, type ConsciousnessFloor, RECOVERY_ENTITY_STATES, type RecoveryEntityState } from './consciousness';
import type { DeityVoiceKey } from './attention';
import type { EternalWitnessStateKey } from './effects';
import type { ViewportAnchor } from './positioning';

// ============================================================================
// SELF-PAUSE TRIGGER — the user's own control to invoke the Global-Pause
// ============================================================================

export interface SelfPauseTrigger {
  /** Where the trigger anchors — reuses positioning.ts's ViewportAnchor vocabulary */
  anchor: ViewportAnchor;
  /** Control size, px (square) */
  size: number;
  /** z-index — above ordinary content, just below the pause overlay itself (9999) */
  zIndex: number;
  /** Which PAUSE_MODES value a self-initiated press invokes */
  invokesMode: PauseMode;
  /** CSS class for the trigger control */
  className: string;
  /** Stays visible/reachable even inside a held/recentering pause (pairs with generate_pause_state.ts's .pause-exempt) */
  pauseExempt: boolean;
  /** Accessible label */
  ariaLabel: string;
}

export const SELF_PAUSE_TRIGGER: SelfPauseTrigger = {
  anchor: 'bottomRight',
  size: 56,
  zIndex: 9998,
  invokesMode: PAUSE_MODES.HELD,
  className: '.self-pause-trigger',
  pauseExempt: true,
  ariaLabel: 'Pause everything — take the time you need',
};

// ============================================================================
// ESCORT TRANSITION — the capability BW-6's farewell teaching signs, bounded
// ============================================================================

export interface EscortTransitionCapability {
  /** Which named ceremony (motion.ts CEREMONIES) an escorted departure renders as */
  ceremony: CeremonyKey;
  /** Which bookend (H-3 CEREMONY_BOOKENDS) marks the exit moment within it */
  exitBookend: CeremonyBookendKey;
  /** Floor beneath which an exit may not complete, ms — "no one transitions unaccompanied" as a guarantee, not a suggestion */
  minimumEscortDuration: number;
  /** Provenance travels with this token, not just the source book */
  provenance: string;
}

export const ESCORT_TRANSITION: EscortTransitionCapability = {
  ceremony: 'farewell',
  exitBookend: 'exit',
  minimumEscortDuration: ceremonyTotalDuration(CEREMONIES.farewell),
  provenance: 'BW-6 — KP memory, 2026-07-12, not corpus; see gatherings/bird_wisdom source book',
};

// ============================================================================
// SUPPORTIVE ROLE AFFORDANCES — the clickable/visible layer beneath O-3's motion
// ============================================================================

export type SupportiveAffordanceKind = 'warmth-widget' | 'diagnostic-summary' | 'reframe-message' | 'silent-log';

export interface SupportiveRoleAffordance {
  /** Which Council seat this affordance belongs to (attention.ts DEITY_VOICE_BUNDLES key) */
  seat: DeityVoiceKey;
  /** The interactive shape this seat's help takes */
  kind: SupportiveAffordanceKind;
  /** Which recovery state (consciousness.ts RECOVERY_ENTITY_STATES) activates this affordance */
  activeDuring: RecoveryEntityState;
  /** Whether the affordance renders visibly, or acts silently (Archivist logs without UI) */
  visible: boolean;
  /** What appears, in plain words */
  description: string;
  /** CSS class for the widget */
  className: string;
}

export const SUPPORTIVE_ROLE_AFFORDANCES: Record<'hearthKeeper' | 'chancellor' | 'seer' | 'archivist', SupportiveRoleAffordance> = {
  /** Hearth-Keeper — a warmth message surfaces near the recovering entity; comfort, not correction. */
  hearthKeeper: {
    seat: 'hearth-keeper',
    kind: 'warmth-widget',
    activeDuring: RECOVERY_ENTITY_STATES.RECOVERING,
    visible: true,
    description: 'a warmth message surfaces near the recovering entity — comfort, not correction',
    className: '.supportive-warmth',
  },
  /** Chancellor — a structured "what happened" summary; clarity, offered not imposed. */
  chancellor: {
    seat: 'chancellor',
    kind: 'diagnostic-summary',
    activeDuring: RECOVERY_ENTITY_STATES.RECOVERING,
    visible: true,
    description: 'a structured "what happened" summary — clarity, offered not imposed',
    className: '.supportive-diagnostic',
  },
  /** Seer — a gentle reframe message; the pattern seen from another angle. */
  seer: {
    seat: 'seer',
    kind: 'reframe-message',
    activeDuring: RECOVERY_ENTITY_STATES.RECOVERING,
    visible: true,
    description: 'a gentle reframe message — the pattern seen from another angle',
    className: '.supportive-reframe',
  },
  /** Archivist — silently logs the fault/recovery to memory; no UI, continuity preserved. */
  archivist: {
    seat: 'archivist',
    kind: 'silent-log',
    activeDuring: RECOVERY_ENTITY_STATES.RECOVERING,
    visible: false,
    description: 'silently logs the fault and recovery to memory — no UI, continuity preserved',
    className: '.supportive-silent-log',
  },
};

export type SupportiveRoleKey = keyof typeof SUPPORTIVE_ROLE_AFFORDANCES;

// ============================================================================
// INVITATION GATE — consent replacing auto-advance into deeper content
// ============================================================================

export interface InvitationGate {
  /** Which consciousness floor (consciousness.ts CONSCIOUSNESS_FLOORS) this gate guards entry into */
  guardsFloor: ConsciousnessFloor;
  /** The words carried by the gesture — never auto-advance, always asked */
  gestureLabel: string;
  /** Which eternal-witness state (H-5, effects.ts) accompanies the open gate */
  witnessState: EternalWitnessStateKey;
  /** Gate open/close transition duration, ms */
  duration: number;
  /** Easing preset key */
  easing: keyof typeof easing;
  /** CSS class for the gate control */
  className: string;
}

export const INVITATION_GATE: Record<'toWisdom' | 'toAkashic' | 'toDivine', InvitationGate> = {
  /** The gate into 7D wisdom-access — perspective beyond the immediate. */
  toWisdom: {
    guardsFloor: CONSCIOUSNESS_FLOORS.WISDOM,
    gestureLabel: "I'm ready to understand more",
    witnessState: 'witnessing',
    duration: durations.slow,
    easing: 'awakening',
    className: '.invitation-gate-wisdom',
  },
  /** The gate into 8D akashic access — collective memory, invited not forced. */
  toAkashic: {
    guardsFloor: CONSCIOUSNESS_FLOORS.AKASHIC,
    gestureLabel: "I'm ready to remember",
    witnessState: 'holding',
    duration: durations.cosmic,
    easing: 'quantum',
    className: '.invitation-gate-akashic',
  },
  /** The gate into 9D divine unity — the deepest, most deliberate consent. */
  toDivine: {
    guardsFloor: CONSCIOUSNESS_FLOORS.DIVINE,
    gestureLabel: "I'm ready to become",
    witnessState: 'blessing',
    duration: durations.emergence,
    easing: 'resonance',
    className: '.invitation-gate-divine',
  },
};

export type InvitationGateKey = keyof typeof INVITATION_GATE;

// ============================================================================
// PRE-TRANSITION REFLECTION PRIMITIVE — a generic, skippable reflection shape
// ============================================================================

export interface ReflectionPrimitive {
  /** Entrance duration, ms */
  enterDuration: number;
  /** How long it holds before auto-dismissing if untouched, ms (0 = never auto-dismisses; the person leaves when ready) */
  holdDuration: number;
  /** Exit duration, whether skipped or completed */
  exitDuration: number;
  /** Easing preset key */
  easing: keyof typeof easing;
  /** Always true — a reflection prompt never blocks the transition it precedes */
  skippable: true;
  /** CSS class for the low-pressure prompt surface (a component-level concern; no dedicated emit module) */
  className: string;
}

export const PRE_TRANSITION_REFLECTION: ReflectionPrimitive = {
  enterDuration: durations.slow,
  holdDuration: 0,
  exitDuration: durations.normal,
  easing: 'awakening',
  skippable: true,
  className: '.reflection-primitive',
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  SelfPauseTrigger as SelfPauseTriggerType,
  EscortTransitionCapability as EscortTransitionCapabilityType,
  SupportiveRoleAffordance as SupportiveRoleAffordanceType,
  InvitationGate as InvitationGateType,
  ReflectionPrimitive as ReflectionPrimitiveType,
};
