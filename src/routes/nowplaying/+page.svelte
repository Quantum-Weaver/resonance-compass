<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import PlayerControls from '$lib/components/PlayerControls.svelte';
	import GradientPulse from '$lib/components/GradientPulse.svelte';

	const currentTrack = $derived(playerStore.currentTrack);
	const isPlaying = $derived(playerStore.isPlaying);
	const shuffle = $derived(playerStore.shuffle);
	const repeatMode = $derived(playerStore.repeatMode);
	const repeatIcon = $derived(repeatMode === 'one' ? '🔂' : '🔁');
	const isFav = $derived(currentTrack ? playlistStore.isFavorite(currentTrack.id) : false);

	let heartAnimating = $state(false);

	function toggleFav() {
		if (!currentTrack) return;
		heartAnimating = true;
		setTimeout(() => { heartAnimating = false; }, 400);
		playlistStore.toggleFavorite(currentTrack.id);
	}

	function goBack() {
		history.back();
	}
</script>

<div class="nowplaying-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<button class="back-btn" onclick={goBack}>← Back</button>

	{#if !currentTrack}
		<div class="empty-state">
			<span class="empty-icon">🎵</span>
			<p>Select a track to play</p>
		</div>
	{:else}
		<div class="art-container">
			<GradientPulse color="var(--accent)" pulse={isPlaying}>
				<div class="album-art">
					{#if currentTrack.coverArt}
						<img src={currentTrack.coverArt} alt="" class="art-img" />
					{:else}
						<span>💿</span>
					{/if}
				</div>
			</GradientPulse>
		</div>

		<div class="track-info">
			<div class="title-row">
				<h1>{currentTrack.title}</h1>
				<button
					class="heart-btn"
					class:pop={heartAnimating}
					onclick={toggleFav}
					aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
					aria-pressed={isFav}
				>{isFav ? '❤️' : '🤍'}</button>
			</div>
			<p class="artist">{currentTrack.artist}</p>
			<p class="album">{currentTrack.album}</p>
		</div>

		<PlayerControls />

		<div class="extra-controls">
			<button
				class="ctrl-btn"
				class:active={shuffle}
				onclick={() => playerStore.toggleShuffle()}
				aria-label="Shuffle"
				aria-pressed={shuffle}
			>🔀</button>
			<button
				class="ctrl-btn"
				class:active={repeatMode !== 'off'}
				onclick={() => playerStore.cycleRepeat()}
				aria-label="Repeat: {repeatMode}"
				aria-pressed={repeatMode !== 'off'}
			>{repeatIcon}</button>
		</div>
	{/if}
</div>

<style>
	.nowplaying-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		padding: 1rem 1.5rem 2rem;
	}

	.back-btn {
		background: none;
		border: none;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		margin-bottom: 1.5rem;
		align-self: flex-start;
		color: var(--accent);
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		color: var(--text-secondary);
	}

	.empty-icon {
		font-size: 3.5rem;
	}

	.art-container {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.album-art {
		width: 260px;
		height: 260px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4rem;
		color: #fff;
		background-color: var(--accent);
		overflow: hidden;
	}

	.art-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.track-info {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	h1 {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	.heart-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.15rem;
		font-size: 1.3rem;
		line-height: 1;
		flex-shrink: 0;
		transition: transform 0.15s;
	}

	.heart-btn:hover {
		transform: scale(1.2);
	}

	.heart-btn.pop {
		animation: heartPop 0.35s ease-out;
	}

	@keyframes heartPop {
		0% { transform: scale(1); }
		40% { transform: scale(1.55); }
		70% { transform: scale(0.9); }
		100% { transform: scale(1); }
	}

	.artist {
		color: var(--text-secondary);
		margin: 0.15rem 0;
	}

	.album {
		color: var(--text-muted);
		font-size: 0.85rem;
		margin: 0.15rem 0;
	}

	.extra-controls {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 1rem;
	}

	.ctrl-btn {
		background: none;
		border: none;
		font-size: 1.4rem;
		cursor: pointer;
		padding: 0.25rem;
		opacity: 0.4;
	}

	.ctrl-btn:hover {
		opacity: 0.7;
	}

	.ctrl-btn.active {
		opacity: 1;
	}
</style>
