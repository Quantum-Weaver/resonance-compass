<script lang="ts">
	import { page } from '$app/state';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';

	const albumId = $derived(decodeURIComponent(page.params.id ?? ''));
	const albumTracks = $derived(libraryStore.getTracksByAlbum(albumId));
	const album = $derived(libraryStore.albums.find((a) => a.id === albumId));
	const totalMins = $derived(Math.round(albumTracks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60));
	const currentTrack = $derived(playerStore.currentTrack);

	function playAll() {
		if (albumTracks.length > 0) playerStore.setQueue(albumTracks);
	}

	function playTrack(index: number) {
		playerStore.setQueue(albumTracks, index);
	}

	function formatDuration(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function goBack() {
		history.back();
	}
</script>

<div class="album-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<button class="back-btn" onclick={goBack}>← Back</button>

	<div class="hero">
		<div class="album-art">
			{#if album?.coverArt}
				<img src={album.coverArt} alt="" />
			{:else}
				💿
			{/if}
		</div>
		<h1>{album?.name ?? albumId}</h1>
		<p class="artist-name">{album?.artist ?? ''}</p>
		<p class="album-meta">
			{albumTracks.length} track{albumTracks.length !== 1 ? 's' : ''} · {totalMins} min{album?.year ? ` · ${album.year}` : ''}
		</p>
		<button class="play-btn" onclick={playAll} disabled={albumTracks.length === 0}>▶ Play Album</button>
	</div>

	<div class="track-list">
		{#each albumTracks as track, i (track.id)}
			<button
				class="track-row"
				class:current={currentTrack?.id === track.id}
				onclick={() => playTrack(i)}
			>
				<span class="track-number">{track.trackNumber ?? i + 1}</span>
				<span class="track-title">{track.title}</span>
				<span class="track-duration">{formatDuration(track.duration)}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.album-page {
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

	.album-art {
		width: 160px;
		height: 160px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		background-color: var(--bg-surface);
		margin-bottom: 0.75rem;
		overflow: hidden;
	}

	.album-art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	h1 {
		font-size: 1.25rem;
		font-weight: 700;
		text-align: center;
		color: var(--text);
		margin: 0;
		padding: 0 1rem;
	}

	.artist-name {
		color: var(--text-secondary);
		margin: 0;
	}

	.album-meta {
		color: var(--text-muted);
		font-size: 0.82rem;
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

	.play-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.track-list {
		flex: 1;
		overflow-y: auto;
	}

	.track-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.6rem 0.4rem;
		border: none;
		border-bottom: 1px solid var(--border-color);
		background: transparent;
		cursor: pointer;
		text-align: left;
		color: var(--text);
	}

	.track-row:hover {
		background-color: var(--bg-surface);
	}

	.track-row.current {
		color: var(--accent);
	}

	.track-number {
		width: 1.5rem;
		flex-shrink: 0;
		font-size: 0.85rem;
		color: var(--text-muted);
		text-align: right;
	}

	.track-title {
		flex: 1;
		font-size: 0.92rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.track-duration {
		font-size: 0.8rem;
		color: var(--text-muted);
		flex-shrink: 0;
	}
</style>
