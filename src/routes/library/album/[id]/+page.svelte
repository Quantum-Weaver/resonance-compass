<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';
	import { page } from '$app/state';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import TrackItem from '$lib/components/TrackItem.svelte';

	const albumId = $derived(decodeURIComponent(page.params.id ?? ''));
	const albumTracks = $derived(libraryStore.getTracksByAlbum(albumId));
	const album = $derived(libraryStore.albums.find((a) => a.id === albumId));
	const totalMins = $derived(Math.round(albumTracks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60));
	const currentTrack = $derived(playerStore.currentTrack);
	const playlists = $derived(playlistStore.playlists);

	let albumMenuOpen = $state(false);

	type ArtFetch = 'idle' | 'loading' | 'found' | 'not_found' | 'error';
	let artFetch = $state<ArtFetch>('idle');
	let fetchedArt = $state<string | null>(null);

	function playAll() {
		if (albumTracks.length > 0) playerStore.setQueue(albumTracks);
	}

	function playTrack(index: number) {
		playerStore.setQueue(albumTracks, index);
	}

	function addAlbumToPlaylist(playlistId: string) {
		for (const track of albumTracks) {
			playlistStore.addTrack(playlistId, track.id);
		}
		albumMenuOpen = false;
	}

	function goBack() {
		history.back();
	}

	async function findCoverArt() {
		if (!album) return;
		artFetch = 'loading';
		fetchedArt = null;
		try {
			const result = await invoke<string | null>('fetch_cover_art', {
				artist: album.artist,
				album: album.name,
			});
			fetchedArt = result;
			artFetch = result ? 'found' : 'not_found';
		} catch {
			artFetch = 'error';
		}
	}

	async function saveCoverArt() {
		if (!fetchedArt) return;
		await libraryStore.updateAlbumCoverArt(albumId, fetchedArt);
		artFetch = 'idle';
		fetchedArt = null;
	}

	function dismissArtFetch() {
		artFetch = 'idle';
		fetchedArt = null;
	}
</script>

{#if albumMenuOpen}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="backdrop"
		onclick={() => (albumMenuOpen = false)}
		onkeydown={(e) => { if (e.key === 'Escape') albumMenuOpen = false; }}
		role="presentation"
	></div>
{/if}

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

		{#if !album?.coverArt}
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
					<button class="art-dismiss-btn sm" onclick={dismissArtFetch}>×</button>
				{:else if artFetch === 'error'}
					<span class="art-fetch-status">Could not reach search service.</span>
					<button class="art-dismiss-btn sm" onclick={dismissArtFetch}>×</button>
				{/if}
			</div>
		{/if}
		<h1>{album?.name ?? albumId}</h1>
		<p class="artist-name">{album?.artist ?? ''}</p>
		<p class="album-meta">
			{albumTracks.length} track{albumTracks.length !== 1 ? 's' : ''} · {totalMins} min{album?.year ? ` · ${album.year}` : ''}
		</p>
		<div class="hero-actions">
			<button class="play-btn" onclick={playAll} disabled={albumTracks.length === 0}>▶ Play Album</button>
			<div class="album-menu-wrap">
				<button class="playlist-btn" onclick={() => (albumMenuOpen = !albumMenuOpen)}>⊕ Add to Playlist</button>
				{#if albumMenuOpen}
					<div class="playlist-dropdown">
						<p class="dropdown-label">Add all tracks to</p>
						{#if playlists.length === 0}
							<p class="dropdown-empty">No playlists yet</p>
						{:else}
							{#each playlists as pl (pl.id)}
								<button class="dropdown-item" onclick={() => addAlbumToPlaylist(pl.id)}>{pl.name}</button>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="track-list">
		{#each albumTracks as track, i (track.id)}
			<TrackItem
				{track}
				index={i + 1}
				showHeart={true}
				showMenu={true}
				isCurrentTrack={currentTrack?.id === track.id}
				onPlay={() => playTrack(i)}
				{playlists}
				onAddToPlaylist={(plId) => playlistStore.addTrack(plId, track.id)}
			/>
		{/each}
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 9;
		background: transparent;
		border: none;
		cursor: default;
		padding: 0;
	}

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

	.hero-actions {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-top: 0.6rem;
	}

	.album-menu-wrap {
		position: relative;
	}

	.play-btn {
		color: #fff;
		border: none;
		padding: 0.5rem 1.75rem;
		border-radius: 20px;
		font-weight: 600;
		cursor: pointer;
		background-color: var(--accent);
	}

	.play-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.playlist-btn {
		background: none;
		border: 1px solid var(--accent);
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-weight: 600;
		cursor: pointer;
		color: var(--accent);
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.playlist-btn:hover {
		background-color: var(--bg-surface);
	}

	.playlist-dropdown {
		position: absolute;
		left: 50%;
		right: auto;
		transform: translateX(-50%);
		top: calc(100% + 0.5rem);
		z-index: 10;
		min-width: 170px;
		background-color: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		overflow: hidden;
	}

	.dropdown-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.5px;
		color: var(--text-muted);
		padding: 0.5rem 0.75rem 0.25rem;
		text-transform: uppercase;
		margin: 0;
	}

	.dropdown-empty {
		font-size: 0.85rem;
		color: var(--text-muted);
		padding: 0.5rem 0.75rem 0.75rem;
		margin: 0;
	}

	.dropdown-item {
		display: block;
		width: 100%;
		padding: 0.6rem 0.75rem;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--text);
		font: inherit;
	}

	.dropdown-item:hover {
		background-color: var(--border-color);
	}

	.track-list {
		flex: 1;
		overflow-y: auto;
	}

	/* Find Cover Art */
	.art-fetch-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 0.25rem;
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

	.art-fetch-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

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

	.art-dismiss-btn.sm {
		padding: 0.2rem 0.5rem;
		font-size: 0.85rem;
	}
</style>
