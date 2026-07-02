import { browser } from '$app/environment';

const ARRANGEMENTS_KEY = 'fragment_arrangements';

export interface StudioLayer {
	id: string;
	fragmentId: string;
	offsetSecs: number;
	volume: number;
	pan: number;
	fadeIn: number;
	fadeOut: number;
}

export interface Arrangement {
	id: string;
	name: string;
	layers: StudioLayer[];
	createdAt: number;
	updatedAt: number;
}

let arrangements = $state<Arrangement[]>([]);

function persist() {
	try { if (browser) localStorage.setItem(ARRANGEMENTS_KEY, JSON.stringify(arrangements)); } catch {}
}

export const studioStore = {
	get arrangements() { return arrangements; },

	loadArrangements() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(ARRANGEMENTS_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as unknown;
				if (Array.isArray(parsed)) arrangements = parsed as Arrangement[];
			}
		} catch {}
	},

	saveArrangement(name: string, layers: StudioLayer[], existingId?: string): Arrangement {
		const now = Date.now();
		if (existingId) {
			const existing = arrangements.find((a) => a.id === existingId);
			if (existing) {
				const updated: Arrangement = { ...existing, name, layers: [...layers], updatedAt: now };
				arrangements = arrangements.map((a) => (a.id === existingId ? updated : a));
				persist();
				return updated;
			}
		}
		const arr: Arrangement = {
			id: `arr_${now}_${Math.random().toString(36).slice(2, 7)}`,
			name: name.trim() || 'Untitled Mix',
			layers: [...layers],
			createdAt: now,
			updatedAt: now,
		};
		arrangements = [arr, ...arrangements];
		persist();
		return arr;
	},

	deleteArrangement(id: string) {
		arrangements = arrangements.filter((a) => a.id !== id);
		persist();
	},
};

export function newLayer(fragmentId: string, offsetSecs = 0): StudioLayer {
	return {
		id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
		fragmentId,
		offsetSecs,
		volume: 1,
		pan: 0,
		fadeIn: 0,
		fadeOut: 0,
	};
}
