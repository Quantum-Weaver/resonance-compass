<script lang="ts">
	let expanded = $state(false);

	function onPlayPause() {
		// Phase 1: wire to audio engine
	}

	function toggleExpanded() {
		expanded = !expanded;
	}
</script>

<div class="mini-player" class:expanded>
	{#if expanded}
		<div class="mini-player__expanded">
			<button class="mp-collapse" onclick={toggleExpanded} aria-label="Collapse">⌄</button>
			<div class="mp-track">No music playing</div>
			<div class="mp-stats">Your library will appear here</div>
			<div class="mp-actions">
				<button class="mp-action primary" onclick={onPlayPause} aria-label="Play">▶</button>
			</div>
		</div>
	{:else}
		<div class="mini-player__minimized">
			<button class="mp-track-btn" onclick={toggleExpanded}>
				No music playing
			</button>
			<button class="mp-play-pause" onclick={onPlayPause} aria-label="Play">
				▶
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
