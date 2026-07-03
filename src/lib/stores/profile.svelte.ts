import { browser } from '$app/environment';
import { invoke } from '@tauri-apps/api/core';
import { themeStore } from '$lib/stores/theme.svelte';
import { PRESET_THEMES } from '$lib/theme/theme';

// ── Types ──────────────────────────────────────────────────────────────────

export interface SensoryProfile {
	id: string;
	name: string;
	emoji: string;
	themePreset: string;
	fontSize: 'small' | 'medium' | 'large';
	eqPreset: string;
	playlistId: string | null;
	createdAt: number;
}

// ── Persistence keys ───────────────────────────────────────────────────────

const PROFILES_KEY = 'sensory_profiles';
const ACTIVE_KEY = 'active_profile_id';
const PREV_THEME_KEY = 'profile_prev_theme';
const SHOW_MP_KEY = 'profile_show_mp';
const THEME_KEY = 'resonance-compass-theme';

// ── State ──────────────────────────────────────────────────────────────────

let profiles = $state<SensoryProfile[]>([]);
let activeProfileId = $state<string | null>(null);
let showInMiniPlayer = $state(true);

function persist() {
	if (!browser) return;
	try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch {}
	try { localStorage.setItem(SHOW_MP_KEY, showInMiniPlayer ? '1' : '0'); } catch {}
}

function currentPresetKey(): string {
	const display = themeStore.config.presetName;
	for (const [key, preset] of Object.entries(PRESET_THEMES)) {
		if (preset.presetName === display) return key;
	}
	return 'dark';
}

function restorePrevTheme() {
	if (!browser) return;
	const prev = localStorage.getItem(PREV_THEME_KEY);
	if (prev) {
		try {
			localStorage.setItem(THEME_KEY, prev);
			themeStore.loadTheme();
		} catch {}
		localStorage.removeItem(PREV_THEME_KEY);
	}
}

// ── Store export ───────────────────────────────────────────────────────────

export const profileStore = {
	get profiles() { return profiles; },
	get activeProfileId() { return activeProfileId; },
	get showInMiniPlayer() { return showInMiniPlayer; },

	loadProfiles() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(PROFILES_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) profiles = parsed;
			}
		} catch {}
		try {
			const aid = localStorage.getItem(ACTIVE_KEY);
			if (aid && profiles.some((p) => p.id === aid)) activeProfileId = aid;
		} catch {}
		try {
			const v = localStorage.getItem(SHOW_MP_KEY);
			if (v !== null) showInMiniPlayer = v !== '0';
		} catch {}
	},

	createProfile(name: string, emoji: string): string {
		const id = `prof_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
		const prof: SensoryProfile = {
			id,
			name: name.trim() || 'My Profile',
			emoji: emoji.trim() || '✨',
			themePreset: currentPresetKey(),
			fontSize: themeStore.config.fontSize ?? 'medium',
			eqPreset: 'flat',
			playlistId: null,
			createdAt: Date.now(),
		};
		profiles = [...profiles, prof];
		persist();
		return id;
	},

	updateProfile(id: string, changes: Partial<Omit<SensoryProfile, 'id' | 'createdAt'>>) {
		profiles = profiles.map((p) => (p.id === id ? { ...p, ...changes } : p));
		persist();
	},

	deleteProfile(id: string) {
		profiles = profiles.filter((p) => p.id !== id);
		if (activeProfileId === id) {
			activeProfileId = null;
			if (browser) {
				localStorage.removeItem(ACTIVE_KEY);
				restorePrevTheme();
			}
		}
		persist();
	},

	async activateProfile(id: string) {
		const p = profiles.find((pr) => pr.id === id);
		if (!p) return;

		if (activeProfileId === null && browser) {
			const cur = localStorage.getItem(THEME_KEY);
			if (cur) localStorage.setItem(PREV_THEME_KEY, cur);
		}

		themeStore.setPreset(p.themePreset);
		themeStore.setFontSize(p.fontSize);

		if (p.eqPreset && p.eqPreset !== 'custom') {
			try { await invoke('set_eq_preset', { preset: p.eqPreset }); } catch {}
		}

		activeProfileId = id;
		if (browser) localStorage.setItem(ACTIVE_KEY, id);
	},

	deactivateProfile() {
		if (!browser) return;
		restorePrevTheme();
		activeProfileId = null;
		localStorage.removeItem(ACTIVE_KEY);
	},

	setShowInMiniPlayer(val: boolean) {
		showInMiniPlayer = val;
		persist();
	},
};
