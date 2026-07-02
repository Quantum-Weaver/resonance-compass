<script lang="ts">
	import { goto } from '$app/navigation';
	import { invoke } from '@tauri-apps/api/core';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import PlayerControls from '$lib/components/PlayerControls.svelte';
	import GradientPulse from '$lib/components/GradientPulse.svelte';
	import EmojiPalette from '$lib/components/EmojiPalette.svelte';

	const currentTrack = $derived(playerStore.currentTrack);
	const isPlaying = $derived(playerStore.isPlaying);
	const shuffle = $derived(playerStore.shuffle);
	const repeatMode = $derived(playerStore.repeatMode);
	const repeatIcon = $derived(repeatMode === 'one' ? '🔂' : '🔁');
	const isFav = $derived(currentTrack ? playlistStore.isFavorite(currentTrack.id) : false);

	let heartAnimating = $state(false);

	type ArtFetch = 'idle' | 'loading' | 'found' | 'not_found' | 'error';
	let artFetch = $state<ArtFetch>('idle');
	let fetchedArt = $state<string | null>(null);
	let localArt = $state<string | null>(null);
	const displayArt = $derived(localArt ?? currentTrack?.coverArt ?? null);

	function toggleFav() {
		if (!currentTrack) return;
		heartAnimating = true;
		setTimeout(() => { heartAnimating = false; }, 400);
		playlistStore.toggleFavorite(currentTrack.id);
	}

	function goBack() {
		history.back();
	}

	async function findCoverArt() {
		if (!currentTrack) return;
		artFetch = 'loading';
		fetchedArt = null;
		try {
			const result = await invoke<string | null>('fetch_cover_art', {
				artist: currentTrack.artist,
				album: currentTrack.album,
			});
			fetchedArt = result;
			artFetch = result ? 'found' : 'not_found';
		} catch {
			artFetch = 'error';
		}
	}

	async function saveCoverArt() {
		if (!fetchedArt || !currentTrack) return;
		const albumId = `${currentTrack.album.trim()}|||${currentTrack.artist.trim()}`;
		await libraryStore.updateAlbumCoverArt(albumId, fetchedArt);
		localArt = fetchedArt;
		artFetch = 'idle';
		fetchedArt = null;
	}

	function dismissArtFetch() {
		artFetch = 'idle';
		fetchedArt = null;
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
					{#if displayArt}
						<img src={displayArt} alt="" class="art-img" />
					{:else}
						<span>💿</span>
					{/if}
				</div>
			</GradientPulse>

			{#if !displayArt}
				<div class="art-fetch-row">
					{#if artFetch === 'idle'}
						<button class="art-fetch-btn" onclick={findCoverArt}>🖼️ Find Cover Art</button>
					{:else if artFetch === 'loading'}
						<span class="art-fetch-status">Searching…</span>
					{:else if artFetch === 'found' && fetchedArt}
						<img src={fetchedArt} alt="Found cover art" class="art-preview" />
						<div class="art-fetch-actions">
							<button class="art-save-btn" onclick={saveCoverArt}>Save</button>
							<button class="art-dismiss-btn" onclick={dismissArtFetch}>Dismiss</button>
						</div>
					{:else if artFetch === 'not_found'}
						<span class="art-fetch-status">No cover art found.</span>
					{:else if artFetch === 'error'}
						<span class="art-fetch-status">Could not reach search service.</span>
					{/if}
					{#if artFetch === 'not_found' || artFetch === 'error'}
						<button class="art-dismiss-btn" onclick={dismissArtFetch}>×</button>
					{/if}
				</div>
			{/if}
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
			<button
				class="ctrl-btn"
				onclick={() => goto(`/lyrics?trackId=${encodeURIComponent(currentTrack.id)}`)}
				aria-label="Lyrics"
			>🎤</button>
		</div>

		<div class="mood-section">
			<EmojiPalette />
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

	.mood-section {
		margin-top: 1.5rem;
		display: flex;
		justify-content: center;
	}

	/* Find Cover Art */
	.art-fetch-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 0.75rem;
	}

	.art-fetch-btn {
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 16px;
		padding: 0.3rem 0.85rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.15s, color 0.15s;
	}

	.art-fetch-btn:hover { border-color: var(--accent); color: var(--accent); }

	.art-fetch-status {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.art-preview {
		width: 80px;
		height: 80px;
		border-radius: 6px;
		object-fit: cover;
		border: 1px solid var(--border-color);
	}

	.art-fetch-actions {
		display: flex;
		gap: 0.4rem;
	}

	.art-save-btn {
		padding: 0.3rem 0.9rem;
		border-radius: 14px;
		border: none;
		background: var(--accent);
		color: #fff;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
	}

	.art-dismiss-btn {
		padding: 0.3rem 0.9rem;
		border-radius: 14px;
		border: 1px solid var(--border-color);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
	}
</style>
