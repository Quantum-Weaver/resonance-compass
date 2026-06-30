<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';

	let expanded = $state(false);

	const track = $derived(playerStore.currentTrack);
	const isPlaying = $derived(playerStore.isPlaying);
	const trackLabel = $derived(track ? `${track.title} — ${track.artist}` : 'No music playing');
	const progressPct = $derived(
		playerStore.duration > 0 ? Math.min(100, (playerStore.position / playerStore.duration) * 100) : 0
	);

	function toggleExpanded() {
		expanded = !expanded;
	}
</script>

<div class="mini-player" class:expanded>
	{#if expanded}
		<div class="mini-player__expanded">
			<button class="mp-collapse" onclick={toggleExpanded} aria-label="Collapse">⌄</button>
			<div class="mp-track">{trackLabel}</div>
			{#if track}
				<div class="mp-progress" aria-hidden="true">
					<div class="mp-progress__fill" style="width: {progressPct}%"></div>
				</div>
			{:else}
				<div class="mp-stats">Your library will appear here</div>
			{/if}
			<div class="mp-actions">
				<button
					class="mp-action primary"
					onclick={() => playerStore.togglePlay()}
					aria-label={isPlaying ? 'Pause' : 'Play'}
					disabled={!track}
				>
					{isPlaying ? '⏸' : '▶'}
				</button>
			</div>
		</div>
	{:else}
		<div class="mini-player__minimized">
			<button class="mp-track-btn" onclick={toggleExpanded}>
				{trackLabel}
			</button>
			<button
				class="mp-play-pause"
				onclick={() => playerStore.togglePlay()}
				aria-label={isPlaying ? 'Pause' : 'Play'}
				disabled={!track}
			>
				{isPlaying ? '⏸' : '▶'}
			</button>
		</div>
	{/if}
</div>

<style>
	.mini-player {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 110;
		background-color: var(--bg-surface);
		border-top: 1px solid var(--border-color);
		padding-bottom: env(safe-area-inset-bottom, 0px);
		transition: background-color 0.2s ease;
	}

	/* Minimized */
	.mini-player__minimized {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
		padding: 0 1rem;
	}

	.mp-track-btn {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mp-track-btn:hover {
		color: var(--text);
	}

	.mp-play-pause {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: var(--accent);
		color: #fff;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.mp-play-pause:disabled,
	.mp-action:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Expanded */
	.mini-player__expanded {
		padding: 0.75rem 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		position: relative;
	}

	.mp-collapse {
		position: absolute;
		top: 0.25rem;
		right: 0.75rem;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0.25rem 0.5rem;
		line-height: 1;
	}

	.mp-track {
		font-size: 1rem;
		color: var(--text);
		font-weight: 500;
		padding-right: 2rem;
	}

	.mp-stats {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	/* Progress bar placeholder — becomes draggable/seekable in Phase 4 */
	.mp-progress {
		height: 4px;
		border-radius: 2px;
		background-color: var(--border-color);
		overflow: hidden;
	}

	.mp-progress__fill {
		height: 100%;
		background-color: var(--accent);
		transition: width 0.2s linear;
	}

	.mp-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.mp-action {
		padding: 0.45rem 0.85rem;
		border-radius: 8px;
		background-color: var(--bg);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		font-size: 0.85rem;
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.mp-action:hover {
		background-color: var(--border-color);
		color: var(--text);
	}

	.mp-action.primary {
		background-color: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	.mp-action.primary:hover {
		opacity: 0.9;
	}

	@media (prefers-reduced-motion: reduce) {
		.mini-player {
			transition: none;
		}
	}
</style>
