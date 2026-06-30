<script lang="ts">
	import { page } from '$app/state';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import TrackItem from '$lib/components/TrackItem.svelte';

	const playlistId = $derived(page.params.id ?? '');
	const playlist = $derived(playlistStore.getPlaylist(playlistId));
	const tracks = $derived(
		(playlist?.trackIds ?? [])
			.map((id) => libraryStore.getTrackById(id))
			.filter((t) => t !== undefined)
	);
	const currentTrack = $derived(playerStore.currentTrack);

	function playAll() {
		if (tracks.length > 0) playerStore.setQueue(tracks);
	}

	function playTrack(index: number) {
		playerStore.setQueue(tracks, index);
	}

	function goBack() {
		history.back();
	}
</script>

<div class="playlist-detail" style="padding-top: env(safe-area-inset-top, 0px);">
	<button class="back-btn" onclick={goBack}>← Playlists</button>

	{#if !playlist}
		<div class="empty-state">
			<p class="empty-text">Playlist not found</p>
		</div>
	{:else}
		<div class="hero">
			<h1>{playlist.name}</h1>
			<p class="track-count">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</p>
			{#if tracks.length > 0}
				<button class="play-btn" onclick={playAll}>▶ Play All</button>
			{/if}
		</div>

		{#if tracks.length === 0}
			<div class="empty-state">
				<p class="empty-icon">🎵</p>
				<p class="empty-text">No tracks in this playlist</p>
			</div>
		{:else}
			<div class="track-list">
				{#each tracks as track, i (track.id)}
					<TrackItem
						{track}
						index={i + 1}
						showHeart={true}
						isCurrentTrack={currentTrack?.id === track.id}
						onPlay={() => playTrack(i)}
						onRemove={() => playlistStore.removeTrack(playlistId, track.id)}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.playlist-detail {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		padding: 1rem 1.25rem;
	}

	.back-btn {
		background: none;
		border: none;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		margin-bottom: 1.25rem;
		align-self: flex-start;
		color: var(--accent);
	}

	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 1.75rem;
	}

	h1 {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
		text-align: center;
	}

	.track-count {
		color: var(--text-secondary);
		font-size: 0.85rem;
		margin: 0;
	}

	.play-btn {
		color: #fff;
		border: none;
		padding: 0.5rem 1.75rem;
		border-radius: 20px;
		font-weight: 600;
		cursor: pointer;
		margin-top: 0.6rem;
		background-color: var(--accent);
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-align: center;
		padding: 3rem 2rem;
	}

	.empty-icon {
		font-size: 2.5rem;
		margin: 0;
	}

	.empty-text {
		color: var(--text-secondary);
		margin: 0;
	}

	.track-list {
		flex: 1;
		overflow-y: auto;
	}
</style>
