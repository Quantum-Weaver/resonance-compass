import { browser } from '$app/environment';
import { playerStore } from '$lib/stores/player.svelte';
import { createTimer, prefersReducedMotion as coreReducedMotion } from '$lib/timer-core/core';
import type { TimerMode } from '$lib/timer-core/core';

export type { TimerMode } from '$lib/timer-core/core';

// Locks to numeric and hides the cycle control when the OS prefers reduced motion.
export const prefersReducedMotion = browser && coreReducedMotion();

// Reactive snapshot of the core's state — the dress's window into the water.
// The core lives at $lib/timer-core (mirrored from awen's the-timer, see its
// MIRROR.md); this store is the Compass coupling the re-homing transmuted
// into hooks: the music-fade organ on onTick, the pause + ⚛-ruled WAV
// end-chime on onComplete.
let totalSecs = $state(0);
let remainingSecs = $state(0);
let isRunning = $state(false);
let fadeOut = $state(false);
let mode = $state<TimerMode>(prefersReducedMotion ? 'numeric' : 'sand');

// The music fade stays Compass's own: fades player volume over the final
// 60 seconds when enabled, restoring on cancel or completion.
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let preTimerVolume = 0;

function startFade() {
	preTimerVolume = playerStore.volume;
	const FADE_STEPS = 30;
	let step = 0;
	fadeInterval = setInterval(() => {
		step++;
		playerStore.setVolume(Math.max(0, preTimerVolume * (1 - step / FADE_STEPS)));
		if (step >= FADE_STEPS) {
			if (fadeInterval) clearInterval(fadeInterval);
			fadeInterval = null;
		}
	}, 2000); // 30 steps * 2000ms = fades out over the final 60 seconds
}

function stopFade(restore: boolean) {
	if (fadeInterval) {
		clearInterval(fadeInterval);
		fadeInterval = null;
	}
	if (restore && preTimerVolume > 0) {
		playerStore.setVolume(preTimerVolume);
		preTimerVolume = 0;
	}
}

// ONE core instance at module scope (the water's own law) so the timer
// survives navigating away from /timer. The core's synthesized chime system
// ships OFF: Compass's end-of-timer chime is its own ⚛-ruled dress below —
// the mirrored WAV, opt-in, natural expiry only (cancel never lands there).
const core = createTimer({
	storage: null,
	onTick: (remaining, total) => {
		if (fadeOut && remaining === 60 && total > 60 && !fadeInterval) startFade();
	},
	onComplete: () => {
		stopFade(true);
		playerStore.pause();
		try {
			if (localStorage.getItem('timer_end_chime') === 'true') {
				new Audio('/chimes/chime-single.wav').play().catch(() => {});
			}
		} catch {}
	},
});
core.setSoundOn(false);
core.subscribe((s) => {
	totalSecs = s.totalSecs;
	remainingSecs = s.remainingSecs;
	isRunning = s.isRunning;
	mode = s.mode;
});

function start(minutes: number) {
	core.start(minutes); // the core replaces rather than stacks
}

function cancel() {
	stopFade(true);
	core.cancel();
}

function setFadeOut(v: boolean) {
	fadeOut = v;
}

function cycleMode() {
	core.cycleMode();
}

export const timerStore = {
	get totalSecs() { return totalSecs; },
	get remainingSecs() { return remainingSecs; },
	get isRunning() { return isRunning; },
	get fadeOut() { return fadeOut; },
	get mode() { return mode; },
	start,
	cancel,
	setFadeOut,
	cycleMode,
};
