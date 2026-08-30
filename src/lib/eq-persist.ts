// eq-persist.ts — the equalizer's settings outlive the session.
//
// The EQ's live state (on/off, preamp, the ten band gains, which preset was
// chosen) lives in the Rust engine's EqState and used to die with the process:
// the custom presets were saved, the settings in force were not (KP,
// 2026-08-30: "eq settings do not persist beyond session, they should though").
//
// Settings saves here on every change; the layout restores at startup by
// pushing the saved gains straight into the engine — bands, not the preset
// name, so a hand-tuned curve comes back exactly as it was left.

import { invoke } from '@tauri-apps/api/core';

export const EQ_KEY = 'resonance-compass-eq';

export interface SavedEq {
	enabled: boolean;
	preamp: number;
	bands: number[];
	/** 'rock' · 'c:My curve' · null when hand-tuned away from any preset */
	preset: string | null;
}

export function saveEq(eq: SavedEq): void {
	try {
		localStorage.setItem(EQ_KEY, JSON.stringify(eq));
	} catch (e) {
		console.error('[eq-persist] save failed:', e);
	}
}

export function loadSavedEq(): SavedEq | null {
	try {
		const raw = localStorage.getItem(EQ_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<SavedEq>;
		if (!Array.isArray(parsed.bands) || parsed.bands.length !== 10) return null;
		return {
			enabled: parsed.enabled === true,
			preamp: typeof parsed.preamp === 'number' ? parsed.preamp : 0,
			bands: parsed.bands.map((b) => (typeof b === 'number' ? b : 0)),
			preset: typeof parsed.preset === 'string' ? parsed.preset : null,
		};
	} catch (e) {
		console.error('[eq-persist] load failed:', e);
		return null;
	}
}

/** Push the saved EQ into the engine. Called once at startup; a no-op when
 *  nothing was saved. Each command is its own try so one failure (a stale
 *  build without a command) cannot block the rest. */
export async function restoreEq(): Promise<void> {
	const saved = loadSavedEq();
	if (!saved) return;
	const calls: Array<() => Promise<unknown>> = [
		...saved.bands.map((gainDb, band) => () => invoke('set_eq_band', { band, gainDb })),
		() => invoke('set_eq_preamp', { gainDb: saved.preamp }),
		() => invoke('toggle_eq', { enabled: saved.enabled }),
	];
	for (const call of calls) {
		try {
			await call();
		} catch (e) {
			console.error('[eq-persist] restore step failed:', e);
		}
	}
}
