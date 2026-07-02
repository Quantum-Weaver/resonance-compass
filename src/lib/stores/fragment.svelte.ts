import { browser } from '$app/environment';

const FRAGMENTS_KEY = 'audio_fragments';

export interface Fragment {
	id: string;
	sourceTrackId: string;
	name: string;
	startTime: number;
	endTime: number;
	duration: number;
	filePath: string;
	createdAt: number;
	emoji: string | null;
	favorite: boolean;
}

let fragments = $state<Fragment[]>([]);

function persist() {
	try { if (browser) localStorage.setItem(FRAGMENTS_KEY, JSON.stringify(fragments)); } catch {}
}

export const fragmentStore = {
	get fragments() { return fragments; },

	loadFragments() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(FRAGMENTS_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as unknown;
				if (Array.isArray(parsed)) fragments = parsed as Fragment[];
			}
		} catch {}
	},

	createFragment(data: Omit<Fragment, 'id' | 'createdAt'>): Fragment {
		const f: Fragment = {
			...data,
			id: `frag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			createdAt: Date.now(),
		};
		fragments = [f, ...fragments];
		persist();
		return f;
	},

	deleteFragment(id: string) {
		fragments = fragments.filter((f) => f.id !== id);
		persist();
	},

	renameFragment(id: string, name: string) {
		fragments = fragments.map((f) => (f.id === id ? { ...f, name } : f));
		persist();
	},

	setEmoji(id: string, emoji: string | null) {
		fragments = fragments.map((f) => (f.id === id ? { ...f, emoji } : f));
		persist();
	},

	toggleFavorite(id: string) {
		fragments = fragments.map((f) => (f.id === id ? { ...f, favorite: !f.favorite } : f));
		persist();
	},

	getNextFragmentNumber(trackId: string): number {
		return fragments.filter((f) => f.sourceTrackId === trackId).length + 1;
	},
};
