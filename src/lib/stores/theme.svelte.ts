import { PRESET_THEMES } from '$lib/theme/theme';
import type { ThemeConfig } from '$lib/types/types';

const STORAGE_KEY = 'resonance-compass-theme';

let config = $state<ThemeConfig>(PRESET_THEMES.dark);

function persist() {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
	}
}

export const themeStore = {
	get config() {
		return config;
	},
	loadTheme() {
		if (typeof localStorage === 'undefined') return;
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return;
		try {
			config = JSON.parse(stored) as ThemeConfig;
		} catch {
			config = { ...PRESET_THEMES.dark };
		}
	},
	setPreset(presetName: string) {
		const preset = PRESET_THEMES[presetName];
		if (!preset) return;
		config = { ...preset };
		persist();
	},
	setMode(mode: 'dark' | 'light' | 'amoled') {
		config = { ...config, mode };
		persist();
	},
	setFontSize(size: 'small' | 'medium' | 'large') {
		config = { ...config, fontSize: size };
		persist();
	}
};
