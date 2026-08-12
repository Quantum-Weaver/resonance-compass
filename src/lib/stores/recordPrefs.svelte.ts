// The recording room's one preference — and it is an autonomy choice rather
// than a setting. KP's ⚛ word, 2026-08-12: "settings could offer a user a
// choice … to provide autonomy", then the shape itself: "none is held, all
// are a set max length or stopped early, no holding — the other is hold only
// the current recording as it is open and not stopped."
//
// 'hold'    — a take may be held open. Resume rejoins the same take. The mic
//             stays open while held, which is said plainly in the room.
// 'bounded' — nothing is ever held. Every take runs to a maximum length or is
//             stopped early, so the microphone is open ONLY while actually
//             recording. The cap is enforced on the capture thread in Rust,
//             never by a timer in this window — a promise about a microphone
//             must not depend on whether a webview is awake.

export type HoldMode = 'hold' | 'bounded';

const MODE_KEY = 'compass_record_hold_mode';
const MAX_KEY = 'compass_record_max_secs';

/// Offered lengths, in seconds. KP named 15–45 as the shape; the longer two
/// are here because a musician catching a whole idea is not a voice memo.
export const MAX_CHOICES = [15, 30, 45, 60, 120, 300] as const;

const DEFAULT_MAX = 45;

// 'hold' is the default because it is what the room already did — a
// preference should never change behavior for someone who never opened it.
let mode = $state<HoldMode>('hold');
let maxSecs = $state<number>(DEFAULT_MAX);

function isHoldMode(value: string | null): value is HoldMode {
	return value === 'hold' || value === 'bounded';
}

export function fmtMax(secs: number): string {
	if (secs < 60) return `${secs} seconds`;
	const m = secs / 60;
	return m === 1 ? '1 minute' : `${m} minutes`;
}

export const recordPrefs = {
	get mode() {
		return mode;
	},
	get maxSecs() {
		return maxSecs;
	},
	/// The cap to start a take with: none while holding is allowed, the chosen
	/// length when it is not.
	get capSecs(): number | null {
		return mode === 'bounded' ? maxSecs : null;
	},
	load() {
		const savedMode = localStorage.getItem(MODE_KEY);
		if (isHoldMode(savedMode)) mode = savedMode;
		const savedMax = Number(localStorage.getItem(MAX_KEY));
		if (Number.isFinite(savedMax) && savedMax > 0) maxSecs = savedMax;
	},
	setMode(next: HoldMode) {
		mode = next;
		localStorage.setItem(MODE_KEY, next);
	},
	setMaxSecs(next: number) {
		maxSecs = next;
		localStorage.setItem(MAX_KEY, String(next));
	},
};
