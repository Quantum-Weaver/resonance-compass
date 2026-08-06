// The sidebar wears one MODE at a time — KP's ruling, 2026-08-05
// (docs/THE-UX-WALK.md, U6): "Listen, Create, Settle, Understand are good
// words." A mode is a view, never a record: switching hats changes which
// doors are shown, nothing else — no state, no history, no room is lost.
// The worn hat holds until the vessel chooses again; it never switches
// itself, whatever route the app navigates to.

export type ModeName = 'listen' | 'create' | 'settle' | 'understand';

const STORAGE_KEY = 'compass_mode';

let current = $state<ModeName>('listen');

function isModeName(value: string | null): value is ModeName {
	return (
		value === 'listen' ||
		value === 'create' ||
		value === 'settle' ||
		value === 'understand'
	);
}

export const modeStore = {
	get current() {
		return current;
	},
	load() {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (isModeName(saved)) current = saved;
	},
	setMode(mode: ModeName) {
		current = mode;
		localStorage.setItem(STORAGE_KEY, mode);
	},
};
