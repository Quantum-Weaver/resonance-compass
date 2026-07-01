<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';

	let { mini = false }: { mini?: boolean } = $props();

	const isPlaying = $derived(playerStore.isPlaying);
	const position = $derived(playerStore.position);
	const duration = $derived(playerStore.duration);
	const volume = $derived(playerStore.volume);

	let dragging = false;

	function formatTime(secs: number): string {
		if (!secs || secs <= 0) return '0:00';
		const s = Math.floor(secs);
		return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
	}

	function seekAt(e: PointerEvent) {
		if (duration <= 0) return;
		const bar = e.currentTarget as HTMLElement;
		const rect = bar.getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		playerStore.seek(ratio * duration);
	}

	function onPointerDown(e: PointerEvent) {
		dragging = true;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		seekAt(e);
	}

	function onPointerMove(e: PointerEvent) {
		if (dragging) seekAt(e);
	}

	function onPointerUp() {
		dragging = false;
	}
</script>

{#if !mini}
	<div class="progress-row">
		<span class="time">{formatTime(position)}</span>
		<div
			class="progress-bar"
			role="slider"
			aria-label="Playback position"
			aria-valuenow={Math.round(position)}
			aria-valuemin={0}
			aria-valuemax={Math.round(duration)}
			tabindex="0"
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
		>
			<div class="progress-fill" style="width: {duration > 0 ? (position / duration) * 100 : 0}%;"></div>
		</div>
		<span class="time">{formatTime(duration)}</span>
	</div>
{/if}

<div class="controls-row" class:mini>
	<button class="ctrl-btn" onclick={() => playerStore.previous()} aria-label="Previous">⏮</button>
	<button class="play-btn" onclick={() => playerStore.togglePlay()} aria-label={isPlaying ? 'Pause' : 'Play'}>
		{isPlaying ? '⏸' : '▶'}
	</button>
	<button class="ctrl-btn" onclick={() => playerStore.next()} aria-label="Next">⏭</button>

	{#if !mini}
		<div class="volume-group">
			<span class="volume-icon" aria-hidden="true">🔊</span>
			<input
				type="range"
				class="volume-slider"
				min="0"
				max="1"
				step="0.01"
				value={volume}
				oninput={(e) => playerStore.setVolume(parseFloat((e.currentTarget as HTMLInputElement).value))}
				aria-label="Volume"
			/>
		</div>
	{/if}
</div>

<style>
	.progress-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 1.25rem;
	}

	.time {
		font-size: 0.75rem;
		width: 2.75rem;
		text-align: center;
		color: var(--text-muted);
		flex-shrink: 0;
		font-variant-numeric: tabular-nums;
	}

	.progress-bar {
		flex: 1;
		height: 4px;
		border-radius: 2px;
		cursor: pointer;
		background-color: var(--border-color);
		position: relative;
		touch-action: none;
		user-select: none;
	}

	.progress-fill {
		height: 100%;
		border-radius: 2px;
		background-color: var(--accent);
		pointer-events: none;
	}

	.controls-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
	}

	.controls-row.mini {
		gap: 0.5rem;
	}

	.ctrl-btn {
		background: none;
		border: none;
		font-size: 1.4rem;
		cursor: pointer;
		padding: 0.25rem;
		color: var(--text-secondary);
		line-height: 1;
	}

	.mini .ctrl-btn {
		font-size: 1.1rem;
		padding: 0.2rem 0.35rem;
	}

	.ctrl-btn:hover {
		color: var(--text);
	}

	.play-btn {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1.4rem;
		color: #fff;
		background-color: var(--accent);
		flex-shrink: 0;
		line-height: 1;
	}

	.mini .play-btn {
		width: 34px;
		height: 34px;
		font-size: 1rem;
	}

	.volume-group {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-left: 0.75rem;
	}

	.volume-icon {
		font-size: 0.9rem;
		line-height: 1;
	}

	.volume-slider {
		width: 80px;
		accent-color: var(--accent);
	}
</style>
