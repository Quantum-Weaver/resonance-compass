// A mode is a view, never a record: switching modes changes which doors are
// shown, nothing else. The current mode holds until the vessel chooses again —
// it never switches itself, whatever route the app navigates to.

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
