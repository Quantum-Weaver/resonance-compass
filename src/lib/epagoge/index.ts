// the-epagoge — the leading-in, pure.
//
// Aristotle's word: being led from particulars toward the whole. This
// water owns the WALK — ordered steps, forward flow, skip always
// lawful, progression dots derived, completion honest — and never the
// particulars: what a step offers, how it is dressed, where answers
// are kept are all the consumer's (the four onboarding pages this
// water unifies each bring their own).
//
// THE LAWS, AS THE CORE KEEPS THEM:
//   · THE KEY LAW (the U13 mend, engraved): a choice is recorded by
//     its KEY, never its shown name — display names drift; keys hold.
//   · ADVICE NEVER GATES: no step refuses passage for an empty
//     answer; skip is lawful wherever the walk stands.
//   · THE DOORWAY LAW: the leading-in never locks a door — every
//     answer is the consumer's to change later; completion says what
//     was given and what was skipped, honestly.
//   · Trouble is told as data, never thrown; "later" stays lawful
//     mid-trouble (the scan screen's shape, generalized).
//   · Unknown keys on step definitions ride whole (the erasure law).
//   · Pure absolutely: no disk, no clock, no DOM — every move takes a
//     walk and returns a new one; the given walk is never mutated.

export interface Offer {
	key: string;
	[k: string]: unknown;
}

export interface StepDef {
	id: string;
	kind: 'threshold' | 'entry' | 'task' | 'choose';
	offers?: Offer[]; // choose only
	atMost?: number; // choose only; 1 = single choice, replaces
	preset?: string[]; // choose only; keys selected at the walk's start
	[k: string]: unknown;
}

export interface TaskState {
	phase: 'idle' | 'working' | 'done' | 'trouble';
	trouble: string | null;
}

export interface Walk {
	steps: StepDef[];
	at: number; // index into steps; steps.length means done
	entries: Record<string, string | null>; // entry answers; null = nothing given
	choices: Record<string, string[]>; // choose answers — KEYS only
	tasks: Record<string, TaskState>;
	skipped: string[]; // step ids passed by without an answer
}

export interface BegunWalk {
	walk: Walk | null;
	trouble: string | null;
}

/** Begin a walk — data trouble is told, never thrown. */
export function beginWalk(steps: StepDef[]): BegunWalk {
	if (steps.length === 0) return { walk: null, trouble: 'a walk needs at least one step' };
	const ids = new Set<string>();
	for (const s of steps) {
		if (!s.id) return { walk: null, trouble: 'every step needs an id' };
		if (ids.has(s.id)) return { walk: null, trouble: `step id "${s.id}" appears twice — ids must be unique` };
		ids.add(s.id);
		if (s.kind === 'choose') {
			const offers = s.offers ?? [];
			if (offers.length === 0) return { walk: null, trouble: `choose step "${s.id}" offers nothing` };
			if ((s.atMost ?? 0) < 1) return { walk: null, trouble: `choose step "${s.id}" needs atMost of 1 or more` };
			for (const p of s.preset ?? []) {
				if (!offers.some((o) => o.key === p))
					return { walk: null, trouble: `choose step "${s.id}" presets "${p}", which is not among its offers — keys, never display names` };
			}
		}
	}
	const choices: Record<string, string[]> = {};
	const tasks: Record<string, TaskState> = {};
	for (const s of steps) {
		if (s.kind === 'choose') choices[s.id] = [...(s.preset ?? [])];
		if (s.kind === 'task') tasks[s.id] = { phase: 'idle', trouble: null };
	}
	return { walk: { steps, at: 0, entries: {}, choices, tasks, skipped: [] }, trouble: null };
}

/** True when the walk has passed its last step. */
export function isDone(walk: Walk): boolean {
	return walk.at >= walk.steps.length;
}

/** The step the walk stands at, or null when done. */
export function current(walk: Walk): StepDef | null {
	return isDone(walk) ? null : walk.steps[walk.at];
}

/** One step forward. Past the last step, the walk is done and stays done. */
export function advance(walk: Walk): Walk {
	if (isDone(walk)) return walk;
	return { ...walk, at: walk.at + 1 };
}

/** One step back — answers already given survive the retreat. */
export function retreat(walk: Walk): Walk {
	if (walk.at === 0) return walk;
	return { ...walk, at: Math.min(walk.at, walk.steps.length) - 1 };
}

/** Pass the standing step by without an answer — lawful anywhere. */
export function skip(walk: Walk): Walk {
	const step = current(walk);
	if (step === null) return walk;
	const skipped = walk.skipped.includes(step.id) ? walk.skipped : [...walk.skipped, step.id];
	return { ...advance(walk), skipped };
}

/** Give a free answer at an entry step — trimmed; nothing given is an honest null, never "". */
export function enter(walk: Walk, text: string): Walk {
	const step = current(walk);
	if (step === null || step.kind !== 'entry') return walk;
	const value = text.trim() === '' ? null : text.trim();
	return { ...walk, entries: { ...walk.entries, [step.id]: value } };
}

/** Toggle a choice BY KEY at a choose step. atMost 1 replaces; at
 *  capacity, an unselected key leaves the walk unchanged — the calm no. */
export function toggleChoice(walk: Walk, key: string): Walk {
	const step = current(walk);
	if (step === null || step.kind !== 'choose') return walk;
	if (!(step.offers ?? []).some((o) => o.key === key)) return walk;
	const held = walk.choices[step.id] ?? [];
	const atMost = step.atMost ?? 1;
	let next: string[];
	if (held.includes(key)) next = held.filter((k) => k !== key);
	else if (atMost === 1) next = [key];
	else if (held.length < atMost) next = [...held, key];
	else return walk;
	return { ...walk, choices: { ...walk.choices, [step.id]: next } };
}

/** The standing task begins its doing. */
export function taskBegun(walk: Walk): Walk {
	return setTask(walk, { phase: 'working', trouble: null });
}

/** The standing task finished true. */
export function taskDone(walk: Walk): Walk {
	return setTask(walk, { phase: 'done', trouble: null });
}

/** The standing task met trouble — told as data, with its reason; "later" stays lawful. */
export function taskTrouble(walk: Walk, reason: string): Walk {
	return setTask(walk, { phase: 'trouble', trouble: reason });
}

function setTask(walk: Walk, state: TaskState): Walk {
	const step = current(walk);
	if (step === null || step.kind !== 'task') return walk;
	return { ...walk, tasks: { ...walk.tasks, [step.id]: state } };
}

export interface Dots {
	states: ('past' | 'active' | 'ahead')[];
	label: string; // "Step n of N" — the walk's own accessibility words
	valuenow: number;
	valuemin: number;
	valuemax: number;
}

/** The progression, derived — the consumer draws it, the walk knows it. */
export function dots(walk: Walk): Dots {
	const n = walk.steps.length;
	const shown = Math.min(walk.at, n - 1);
	const states = walk.steps.map((_, i): 'past' | 'active' | 'ahead' => {
		if (isDone(walk)) return 'past';
		if (i < shown) return 'past';
		if (i === shown) return 'active';
		return 'ahead';
	});
	const now = isDone(walk) ? n : walk.at + 1;
	return { states, label: `Step ${now} of ${n}`, valuenow: now, valuemin: 1, valuemax: n };
}

export interface Completion {
	entries: Record<string, string | null>;
	choices: Record<string, string[]>; // keys only, always
	skipped: string[];
	tasks: Record<string, TaskState>;
}

/** What the walk gathered — the consumer stores it under its own roof.
 *  Every choice is keys; every absence is named, never papered over. */
export function completion(walk: Walk): Completion {
	return { entries: walk.entries, choices: walk.choices, skipped: walk.skipped, tasks: walk.tasks };
}
