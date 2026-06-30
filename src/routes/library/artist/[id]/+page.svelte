<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';

	const artistId = $derived(decodeURIComponent(page.params.id ?? ''));
	const artistTracks = $derived(libraryStore.getTracksByArtist(artistId));
	const artistAlbums = $derived(libraryStore.getAlbumsByArtist(artistId));

	function playAll() {
		if (artistTracks.length > 0) playerStore.setQueue(artistTracks);
	}

	function openAlbum(id: string) {
		goto(`/library/album/${encodeURIComponent(id)}`);
	}

	function goBack() {
		history.back();
	}
</script>

<div class="artist-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<button class="back-btn" onclick={goBack}>← Library</button>

	<div class="hero">
		<div class="avatar">{artistId.charAt(0).toUpperCase()}</div>
		<h1>{artistId}</h1>
		<p class="artist-stats">
			{artistAlbums.length} album{artistAlbums.length !== 1 ? 's' : ''} · {artistTracks.length} track{artistTracks.length !== 1 ? 's' : ''}
		</p>
		<button class="play-btn" onclick={playAll} disabled={artistTracks.length === 0}>▶ Play All</button>
	</div>

	<div class="album-grid">
		{#each artistAlbums as album (album.id)}
			<button class="album-card" onclick={() => openAlbum(album.id)}>
				<div class="album-art">
					{#if album.coverArt}
						<img src={album.coverArt} alt="" />
					{:else}
						💿
					{/if}
				</div>
				<span class="album-name">{album.name}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.artist-page {
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
		gap: 0.4rem;
		margin-bottom: 1.75rem;
	}

	.avatar {
		width: 88px;
		height: 88px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.2rem;
		font-weight: 700;
		color: #fff;
		background-color: var(--accent);
		margin-bottom: 0.4rem;
	}

	h1 {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
		text-align: center;
	}

	.artist-stats {
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
		margin-top: 0.5rem;
		background-color: var(--accent);
	}

	.play-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.album-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
	}

	.album-card {
		flex: 0 0 130px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.album-art {
		width: 130px;
		height: 130px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		background-color: var(--bg-surface);
		overflow: hidden;
	}

	.album-art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.album-name {
		font-size: 0.85rem;
		color: var(--text);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
	}
</style>
