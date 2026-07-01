import { browser } from '$app/environment';
import { playerStore } from '$lib/stores/player.svelte';

export type TimerMode = 'sand' | 'breathing' | 'dissolve' | 'flower' | 'metatron' | 'cycle' | 'numeric';

const MODE_ORDER: TimerMode[] = ['sand', 'breathing', 'dissolve', 'flower', 'metatron', 'cycle', 'numeric'];

// Locks to numeric and hides the cycle control when the OS prefers reduced motion.
export const prefersReducedMotion =
	browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let totalSecs = $state(0);
let remainingSecs = $state(0);
let isRunning = $state(false);
let fadeOut = $state(false);
let mode = $state<TimerMode>(prefersReducedMotion ? 'numeric' : 'sand');

// Kept as module state (not component-local) so the timer survives navigating
// away from /timer — a page-local implementation would unmount and remount
// on every visit, losing track of (but not actually stopping) any interval
// already running, letting it silently orphan or letting a second timer
// stack on top of it.
let tickInterval: ReturnType<typeof setInterval> | null = null;
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

function start(minutes: number) {
	cancel(); // replace rather than stack if one's already running
	totalSecs = minutes * 60;
	remainingSecs = minutes * 60;
	isRunning = true;
	tickInterval = setInterval(() => {
		remainingSecs -= 1;
		if (fadeOut && remainingSecs === 60 && totalSecs > 60 && !fadeInterval) {
			startFade();
		}
		if (remainingSecs <= 0) {
			isRunning = false;
			if (tickInterval) clearInterval(tickInterval);
			tickInterval = null;
			stopFade(true);
			playerStore.pause();
			totalSecs = 0;
		}
	}, 1000);
}

function cancel() {
	isRunning = false;
	totalSecs = 0;
	remainingSecs = 0;
	if (tickInterval) clearInterval(tickInterval);
	tickInterval = null;
	stopFade(true);
}

function setFadeOut(v: boolean) {
	fadeOut = v;
}

function cycleMode() {
	if (prefersReducedMotion) return;
	const idx = MODE_ORDER.indexOf(mode);
	mode = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
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
