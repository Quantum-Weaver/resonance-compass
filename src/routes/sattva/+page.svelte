<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { invoke } from '@tauri-apps/api/core';
	import type { Track } from '$lib/types/types';
	import { createBreath, drawSquarePulse, PHASE_COLORS } from '$lib/breath-core/index';
	import type { BreathDuration } from '$lib/breath-core/index';

	// Settings

	interface SattvaSettings {
		playlistId: string | null;
		theme: 'warm_amber' | 'deep_space' | 'cosmic_purple';
		eq: 'reduced_bass' | 'flat' | 'custom';
		breathingEnabled: boolean;
		breathDuration: BreathDuration;
		volumeReduction: 0 | 10 | 25 | 50;
		exitTransition: 'fade' | 'instant';
		exitDestination: string;
	}

	const SATTVA_KEY = 'sattva_settings';
	const THEME_KEY = 'resonance-compass-theme';

	const DEFAULTS: SattvaSettings = {
		playlistId: null,
		theme: 'warm_amber',
		eq: 'reduced_bass',
		breathingEnabled: true,
		breathDuration: '4-4',
		volumeReduction: 25,
		exitTransition: 'fade',
		exitDestination: '/',
	};

	function loadSettings(): SattvaSettings {
		try {
			const raw = localStorage.getItem(SATTVA_KEY);
			if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SattvaSettings>) };
		} catch {}
		return { ...DEFAULTS };
	}

	// Reactive state

	let visible = $state(false);
	let fadingOut = $state(false);
	let breathingOn = $state(DEFAULTS.breathingEnabled);

	let currentCount = $state(1);
	let countOpacity = $state(0.04);
	let phaseIdx = $state(0);

	let borderCanvas = $state<HTMLCanvasElement | null>(null);

	// Non-reactive session state

	// The pacer is recreated at mount with the session's chosen duration.
	let breath = createBreath(DEFAULTS.breathDuration);
	let rafId = 0;
	let sessionSettings = DEFAULTS;
	let exiting = false;

	let savedThemeJSON: string | null = null;
	let savedVolume: number | null = null;
	interface EqSnapshot { bands: number[]; preamp: number; enabled: boolean; }
	let savedEqState: EqSnapshot | null = null;
	let savedQueue: Track[] | null = null;
	let savedCurrentTrack: Track | null = null;
	let sattvaSwitchedPlaylist = false;
	let stateRestored = false;

	const prefersReduced =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Animation loop

	function animLoop() {
		if (!visible || fadingOut) return;

		const s = breath.sample(performance.now());
		currentCount = s.count;
		countOpacity = s.countOpacity;
		phaseIdx = s.phaseIdx;

		if (borderCanvas && !prefersReduced && breathingOn) {
			drawSquarePulse(borderCanvas, s.color, s.borderAlpha);
		} else if (borderCanvas && !prefersReduced) {
			const ctx = borderCanvas.getContext('2d');
			if (ctx) ctx.clearRect(0, 0, borderCanvas.width, borderCanvas.height);
		}

		rafId = requestAnimationFrame(animLoop);
	}

	function resizeCanvas() {
		if (!borderCanvas) return;
		borderCanvas.width = window.innerWidth;
		borderCanvas.height = window.innerHeight;
	}

	// State save / restore

	async function applyEntryState(s: SattvaSettings) {
		savedThemeJSON = localStorage.getItem(THEME_KEY);
		savedVolume = playerStore.volume;
		try {
			const eq = await invoke<EqSnapshot>('get_eq_state');
			savedEqState = { bands: [...eq.bands], preamp: eq.preamp, enabled: eq.enabled };
		} catch {}

		const themeMap: Record<string, string> = {
			warm_amber: 'warm',
			deep_space: 'dark',
			cosmic_purple: 'dark',
		};
		themeStore.setPreset(themeMap[s.theme] ?? 'warm');

		if (s.eq === 'reduced_bass') {
			try {
				await invoke('toggle_eq', { enabled: true });
				for (let i = 0; i < 3; i++) {
					await invoke('set_eq_band', { band: i, gainDb: -3 });
				}
				for (let i = 3; i < 10; i++) {
					await invoke('set_eq_band', { band: i, gainDb: 0 });
				}
			} catch {}
		} else if (s.eq === 'flat') {
			try { await invoke('set_eq_preset', { preset: 'flat' }); } catch {}
		}

		if (s.volumeReduction > 0 && savedVolume !== null) {
			playerStore.setVolume(savedVolume * (1 - s.volumeReduction / 100));
		}

		if (s.playlistId) {
			const pl = playlistStore.getPlaylist(s.playlistId);
			if (pl && pl.trackIds.length > 0) {
				const plTracks = pl.trackIds
					.map((id) => libraryStore.getTrackById(id))
					.filter((t): t is Track => t != null);
				if (plTracks.length > 0) {
					savedQueue = [...playerStore.queue];
					savedCurrentTrack = playerStore.currentTrack;
					sattvaSwitchedPlaylist = true;
					playerStore.setQueue(plTracks, 0);
				}
			}
		}
	}

	function restoreState() {
		if (stateRestored) return;
		stateRestored = true;

		if (sattvaSwitchedPlaylist && savedQueue && savedQueue.length > 0) {
			const prevTrack = savedCurrentTrack;
			const idx = prevTrack
				? Math.max(0, savedQueue.findIndex((t) => t.id === prevTrack.id))
				: 0;
			playerStore.setQueue(savedQueue, idx);
			sattvaSwitchedPlaylist = false;
		}

		if (savedVolume !== null) playerStore.setVolume(savedVolume);

		if (savedThemeJSON) {
			try {
				localStorage.setItem(THEME_KEY, savedThemeJSON);
				themeStore.loadTheme();
			} catch {}
		}

		if (savedEqState) {
			const eq = savedEqState;
			(async () => {
				try {
					await invoke('toggle_eq', { enabled: eq.enabled });
					for (let i = 0; i < eq.bands.length; i++) {
						await invoke('set_eq_band', { band: i, gainDb: eq.bands[i] });
					}
					await invoke('set_eq_preamp', { gainDb: eq.preamp });
				} catch {}
			})();
		}
	}

	// Exit

	async function exitSattva() {
		if (exiting) return;
		exiting = true;
		cancelAnimationFrame(rafId);
		restoreState();

		if (sessionSettings.exitTransition === 'fade' && !prefersReduced) {
			fadingOut = true;
			await new Promise<void>((res) => setTimeout(res, 380));
		}

		goto(sessionSettings.exitDestination || '/');
	}

	function toggleBreathing(e: MouseEvent) {
		e.stopPropagation();
		breathingOn = !breathingOn;
	}

	// Lifecycle

	onMount(async () => {
		sessionSettings = loadSettings();
		breathingOn = sessionSettings.breathingEnabled;
		breath = createBreath(sessionSettings.breathDuration);

		await applyEntryState(sessionSettings);

		if (!prefersReduced) {
			resizeCanvas();
			window.addEventListener('resize', resizeCanvas);
		}

		requestAnimationFrame(() => {
			visible = true;
			if (!prefersReduced) {
				rafId = requestAnimationFrame(animLoop);
			}
		});
	});

	onDestroy(() => {
		cancelAnimationFrame(rafId);
		if (typeof window !== 'undefined') window.removeEventListener('resize', resizeCanvas);
		restoreState();
	});
</script>

<div
	class="sattva"
	class:visible
	class:fading-out={fadingOut}
	onclick={exitSattva}
	role="button"
	tabindex="0"
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') exitSattva(); }}
	aria-label="Sattva screen — tap anywhere to exit"
>
	{#if !prefersReduced}
		<canvas bind:this={borderCanvas} class="border-canvas" aria-hidden="true"></canvas>
	{/if}

	<div
		class="count-number"
		style="
			opacity: {prefersReduced ? 0.15 : countOpacity};
			color: {PHASE_COLORS[phaseIdx]};
		"
		aria-hidden="true"
	>{currentCount}</div>

	<button
		class="vis-toggle"
		class:on={breathingOn}
		onclick={toggleBreathing}
		aria-label={breathingOn ? 'Disable breathing visualization' : 'Enable breathing visualization'}
		title={breathingOn ? 'Hide breathing' : 'Show breathing'}
	>
		<span class="toggle-dot" class:on={breathingOn}></span>
	</button>
</div>

<style>
	.sattva {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: #0c0f1d;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		user-select: none;
		opacity: 0;
		transition: opacity 0.45s ease;
	}

	.sattva.visible { opacity: 1; }
	.sattva.fading-out { opacity: 0; transition: opacity 0.38s ease; }

	.border-canvas {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}

	.count-number {
		position: relative;
		z-index: 3;
		font-size: clamp(120px, 28vmin, 240px);
		font-weight: 200;
		letter-spacing: -0.04em;
		line-height: 1;
		pointer-events: none;
		font-variant-numeric: tabular-nums;
		transition: color 0.8s ease;
		will-change: opacity, color;
	}

	.vis-toggle {
		position: absolute;
		bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
		right: 1.75rem;
		z-index: 10;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-color 0.2s;
		padding: 0;
	}
	.vis-toggle:hover { border-color: rgba(255, 255, 255, 0.35); }
	.vis-toggle.on { border-color: rgba(253, 203, 110, 0.35); }

	.toggle-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		transition: background 0.2s;
	}
	.toggle-dot.on { background: rgba(253, 203, 110, 0.55); }

	@media (prefers-reduced-motion: reduce) {
		.sattva { transition: none; }
	}
</style>
