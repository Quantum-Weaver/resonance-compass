<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';
	import TrackItem from '$lib/components/TrackItem.svelte';

	const queue = $derived(playerStore.queue);
	const currentTrack = $derived(playerStore.currentTrack);

	function goBack() {
		window.history.back();
	}
</script>

<div class="queue-page">
	<div class="header">
		<button class="back-btn" onclick={goBack}>← Now Playing</button>
		{#if queue.length > 1}
			<button class="clear-btn" onclick={() => playerStore.clearQueue()}>Clear All</button>
		{/if}
	</div>

	<h2>Up Next · {queue.length} track{queue.length !== 1 ? 's' : ''}</h2>

	{#if queue.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📋</span>
			<p class="empty-title">Queue is empty</p>
			<p class="empty-sub">Play an album or playlist and it will appear here.</p>
		</div>
	{:else}
		<div class="track-list">
			{#each queue as track, i (track.id + '_' + i)}
				<TrackItem
					{track}
					index={i + 1}
					showHeart={true}
					isCurrentTrack={currentTrack?.id === track.id && i === playerStore.queueIndex}
					onPlay={() => playerStore.playFromQueue(i)}
					onRemove={() => playerStore.removeFromQueue(i)}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.queue-page {
		padding: 1.5rem;
		min-height: 100%;
		display: flex;
		flex-direction: column;
		color: var(--text);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.back-btn,
	.clear-btn {
		background: none;
		border: none;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0.5rem 0;
		min-height: 44px;
		color: var(--accent);
		font-family: inherit;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0 0 1rem;
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon { font-size: 3rem; opacity: 0.6; }
	.empty-title { font-size: 1rem; font-weight: 600; color: var(--text-secondary); margin: 0; }
	.empty-sub { font-size: 0.85rem; color: var(--text-muted); margin: 0; }

	.track-list { flex: 1; }
</style>
