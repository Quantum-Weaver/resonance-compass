<script lang="ts">
	import { timerStore, prefersReducedMotion, type TimerMode } from '$lib/stores/timer.svelte';
	import TimerVisualization from '$lib/components/TimerVisualization.svelte';

	const PRESETS = [15, 30, 45, 60, 90, 120];
	const MODES: Array<{ id: TimerMode; label: string; icon: string }> = [
		{ id: 'sand', label: 'Sand', icon: '⌛' },
		{ id: 'breathing', label: 'Breathe', icon: '🫧' },
		{ id: 'dissolve', label: 'Mandala', icon: '✨' },
		{ id: 'flower', label: 'Flower', icon: '🌸' },
		{ id: 'metatron', label: 'Metatron', icon: '🔷' },
		{ id: 'cycle', label: 'Cycle', icon: '♻️' },
		{ id: 'numeric', label: 'Numeric', icon: '🔢' },
	];

	const isRunning = $derived(timerStore.isRunning);
	const totalSecs = $derived(timerStore.totalSecs);
	const remainingSecs = $derived(timerStore.remainingSecs);
	const mode = $derived(timerStore.mode);
	const fadeOut = $derived(timerStore.fadeOut);
	const currentModeInfo = $derived(MODES.find((m) => m.id === mode));

	// Custom duration (minutes). The store's start() already accepts any value,
	// so this just lets the vessel choose one outside the presets. Capped at 24h.
	let customMins = $state<number | null>(null);
	const isValidCustom = $derived(customMins !== null && customMins >= 1 && customMins <= 1440);

	function startCustom() {
		if (isValidCustom && customMins !== null) timerStore.start(customMins);
	}

	function formatDuration(mins: number): string {
		if (mins >= 60) {
			const h = Math.floor(mins / 60);
			const m = mins % 60;
			return m > 0 ? `${h}h ${m}m` : `${h}h`;
		}
		return `${mins} min`;
	}

	function formatCountdown(secs: number): string {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}
</script>

<div class="timer-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<header class="timer-header">
		<h1 class="timer-title">Sleep Timer</h1>
		{#if isRunning && !prefersReducedMotion}
			<div class="mode-btn-wrap">
				<button class="mode-btn" onclick={() => timerStore.cycleMode()} title="Switch visualization">
					{currentModeInfo?.icon} {currentModeInfo?.label}
					<span class="mode-cycle-icon">↻</span>
				</button>
			</div>
		{/if}
	</header>

	{#if isRunning}
		<div class="active-timer">
			<p class="timer-label">Music will stop in</p>

			<div class="vis-wrap">
				<TimerVisualization {remainingSecs} {totalSecs} {mode} />
			</div>

			{#if mode !== 'numeric' && mode !== 'breathing'}
				<span class="time-overlay">{formatCountdown(remainingSecs)}</span>
			{/if}

			<div class="progress-bar">
				<div
					class="progress-fill"
					style="width: {totalSecs > 0 ? ((totalSecs - remainingSecs) / totalSecs) * 100 : 0}%;"
				></div>
			</div>

			<button class="cancel-btn" onclick={() => timerStore.cancel()}>Cancel Timer</button>
		</div>
	{:else}
		<p class="section-label">Select duration</p>
		<div class="presets">
			{#each PRESETS as mins (mins)}
				<button class="preset-btn" onclick={() => timerStore.start(mins)}>
					{formatDuration(mins)}
				</button>
			{/each}
		</div>

		<div class="custom-row">
			<input
				class="custom-input"
				type="number"
				min="1"
				max="1440"
				inputmode="numeric"
				placeholder="Custom minutes"
				bind:value={customMins}
				aria-label="Custom duration in minutes"
			/>
			<button class="custom-btn" disabled={!isValidCustom} onclick={startCustom}>
				{isValidCustom ? `Start · ${formatDuration(customMins ?? 0)}` : 'Start'}
			</button>
		</div>

		<div class="fade-row">
			<span>Fade out at end</span>
			<button
				class="toggle"
				class:active={fadeOut}
				onclick={() => timerStore.setFadeOut(!fadeOut)}
				aria-label="Enable fade out"
				aria-pressed={fadeOut}
			>
				<span class="dot"></span>
			</button>
		</div>
	{/if}
</div>

<style>
	.timer-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		padding: 1rem 1.25rem 1.5rem;
	}

	.timer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.timer-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	.mode-btn-wrap {
		display: flex;
		padding-top: 1.5rem;
	}

	.mode-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.85rem;
		border: 1px solid var(--border-color);
		border-radius: 20px;
		background: var(--bg-surface);
		color: var(--text-secondary);
		font-size: 0.8rem;
		cursor: pointer;
	}

	.mode-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.mode-cycle-icon {
		font-size: 0.9rem;
		opacity: 0.6;
	}

	.section-label {
		margin: 0 0 0.75rem;
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	/* Active timer */
	.active-timer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.timer-label {
		color: var(--text-secondary);
		margin: 0;
		font-size: 0.9rem;
	}

	.vis-wrap {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 300px;
	}

	.time-overlay {
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.04em;
	}

	.progress-bar {
		width: 100%;
		max-width: 360px;
		height: 4px;
		border-radius: 2px;
		background-color: var(--border-color);
	}

	.progress-fill {
		height: 100%;
		border-radius: 2px;
		background-color: var(--accent);
		transition: width 1s linear;
	}

	.cancel-btn {
		color: #fff;
		border: none;
		padding: 0.5rem 2rem;
		border-radius: 20px;
		font-weight: 600;
		cursor: pointer;
		background-color: #f39c12;
	}

	/* Presets */
	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.preset-btn {
		width: calc(33% - 0.35rem);
		padding: 1.2rem 0;
		border-radius: 12px;
		border: 1px solid var(--border-color);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		background-color: var(--bg-surface);
		color: var(--text);
	}

	.preset-btn:hover {
		background-color: color-mix(in srgb, var(--accent) 15%, var(--bg-surface));
	}

	/* Custom duration */
	.custom-row {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.custom-input {
		flex: 1;
		min-width: 0;
		padding: 0 1rem;
		border-radius: 12px;
		border: 1px solid var(--border-color);
		background-color: var(--bg-surface);
		color: var(--text);
		font-size: 1rem;
	}

	.custom-input::placeholder {
		color: var(--text-secondary);
	}

	.custom-btn {
		padding: 0.9rem 1.5rem;
		border-radius: 12px;
		border: 1px solid var(--accent);
		background-color: var(--accent);
		color: #fff;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.custom-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Fade toggle */
	.fade-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1.5rem;
		margin-top: 2rem;
		border-top: 1px solid var(--border-color);
		color: var(--text);
	}

	.toggle {
		width: 48px;
		height: 28px;
		border-radius: 14px;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: 3px;
		background-color: var(--border-color);
		transition: background-color 0.2s;
	}

	.toggle.active {
		background-color: var(--accent);
	}

	.dot {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background-color: #fff;
		transition: transform 0.2s;
	}

	.toggle.active .dot {
		transform: translateX(20px);
	}
</style>
