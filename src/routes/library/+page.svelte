<script lang="ts">
	import { goto } from '$app/navigation';
	import { libraryStore } from '$lib/stores/library.svelte';

	let searchQuery = $state('');
	let debouncedQuery = $state('');
	let viewMode = $state<'artists' | 'albums' | 'genres'>('artists');
	let gridView = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		const raw = searchQuery;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			debouncedQuery = raw.trim().toLowerCase();
		}, 150);
	});

	const tracks = $derived(libraryStore.tracks);
	const artists = $derived(libraryStore.artists);
	const albums = $derived(libraryStore.albums);
	const genres = $derived(
		[...new Set(tracks.map((t) => t.genre).filter((g): g is string => !!g))].sort((a, b) =>
			a.localeCompare(b)
		)
	);

	const filteredArtists = $derived(
		[...(debouncedQuery ? artists.filter((a) => a.name.toLowerCase().includes(debouncedQuery)) : artists)].sort(
			(a, b) => a.name.localeCompare(b.name)
		)
	);

	const filteredAlbums = $derived(
		[
			...(debouncedQuery
				? albums.filter(
						(a) => a.name.toLowerCase().includes(debouncedQuery) || a.artist.toLowerCase().includes(debouncedQuery)
					)
				: albums),
		].sort((a, b) => a.name.localeCompare(b.name))
	);

	const filteredGenres = $derived(
		debouncedQuery ? genres.filter((g) => g.toLowerCase().includes(debouncedQuery)) : genres
	);

	async function onScanClick() {
		await libraryStore.scanLibrary();
	}

	function openArtist(id: string) {
		goto(`/library/artist/${encodeURIComponent(id)}`);
	}

	function openAlbum(id: string) {
		goto(`/library/album/${encodeURIComponent(id)}`);
	}
</script>

<div class="library-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<header class="lib-header">
		<h1 class="lib-title">Library</h1>
		<div class="lib-actions">
			{#if tracks.length > 0}
				<button class="icon-btn" onclick={() => (gridView = !gridView)} aria-label="Toggle view">
					{gridView ? '☰' : '⊞'}
				</button>
			{/if}
			<button class="scan-btn" onclick={onScanClick} disabled={libraryStore.isScanning}>
				{libraryStore.isScanning
					? `Scanning ${Math.round(libraryStore.scanProgress * 100)}%`
					: tracks.length > 0
						? 'Rescan'
						: 'Scan Library'}
			</button>
		</div>
	</header>

	{#if libraryStore.scanError}
		<p class="scan-error">{libraryStore.scanError}</p>
	{/if}

	{#if tracks.length === 0 && !libraryStore.isScanning}
		<div class="empty-state">
			<p class="empty-icon">🎵</p>
			<p class="empty-heading">Your music library will appear here</p>
			<p class="empty-sub">Scan a folder to get started.</p>
		</div>
	{:else}
		<input
			type="text"
			class="search-input"
			placeholder="Search artists, albums, genres..."
			bind:value={searchQuery}
		/>

		<div class="tabs">
			{#each (['artists', 'albums', 'genres'] as const) as mode}
				<button class="tab" class:active={viewMode === mode} onclick={() => (viewMode = mode)}>
					{mode.charAt(0).toUpperCase() + mode.slice(1)}
				</button>
			{/each}
		</div>

		<div class="list" class:grid-view={gridView}>
			{#if viewMode === 'artists'}
				{#each filteredArtists as artist (artist.id)}
					<button class="list-item" onclick={() => openArtist(artist.id)}>
						{#if gridView}
							<div class="card-icon">{artist.name.charAt(0).toUpperCase()}</div>
						{/if}
						<span class="item-text">{artist.name}</span>
						<span class="item-sub">{artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}</span>
					</button>
				{/each}
				{#if filteredArtists.length === 0}
					<p class="empty-search">No artists match your search.</p>
				{/if}
			{:else if viewMode === 'albums'}
				{#each filteredAlbums as album (album.id)}
					<button class="list-item" onclick={() => openAlbum(album.id)}>
						{#if gridView}
							<div class="card-icon cover">
								{#if album.coverArt}
									<img src={album.coverArt} alt="" />
								{:else}
									💿
								{/if}
							</div>
						{/if}
						<span class="item-text">{album.name}</span>
						<span class="item-sub">{album.artist}</span>
					</button>
				{/each}
				{#if filteredAlbums.length === 0}
					<p class="empty-search">No albums match your search.</p>
				{/if}
			{:else}
				{#each filteredGenres as genre (genre)}
					<button class="list-item">
						{#if gridView}
							<div class="card-icon">🎵</div>
						{/if}
						<span class="item-text">{genre}</span>
						<span class="item-sub">{tracks.filter((t) => t.genre === genre).length} tracks</span>
					</button>
				{/each}
				{#if filteredGenres.length === 0}
					<p class="empty-search">No genres match your search.</p>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.library-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		padding: 1rem 1.25rem;
	}

	.lib-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.lib-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	.lib-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.icon-btn {
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 0.35rem 0.6rem;
		font-size: 0.85rem;
		cursor: pointer;
		color: var(--text-secondary);
	}

	.scan-btn {
		background-color: var(--accent);
		color: #fff;
		border: none;
		padding: 0.5rem 1.25rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}

	.scan-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.scan-error {
		color: var(--heart, #e74c3c);
		font-size: 0.85rem;
		margin: 0 0 0.75rem;
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
		font-size: 3rem;
		margin: 0;
	}

	.empty-heading {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text);
		margin: 0;
	}

	.empty-sub {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
	}

	.search-input {
		padding: 0.65rem 0.9rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		background-color: var(--bg-surface);
		color: var(--text);
		font-size: 0.9rem;
		margin-bottom: 0.75rem;
		outline: none;
	}

	.search-input:focus {
		border-color: var(--accent);
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid var(--border-color);
		margin-bottom: 0.5rem;
	}

	.tab {
		padding: 0.55rem 1rem;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	.list {
		flex: 1;
		overflow-y: auto;
	}

	.list-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 0.75rem 0.4rem;
		border: none;
		border-bottom: 1px solid var(--border-color);
		background: transparent;
		cursor: pointer;
		text-align: left;
		color: var(--text);
	}

	.list-item:hover {
		background-color: var(--bg-surface);
	}

	.item-text {
		font-size: 0.95rem;
		font-weight: 500;
	}

	.item-sub {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.empty-search {
		text-align: center;
		padding: 2rem;
		color: var(--text-muted);
	}

	.list.grid-view {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-content: start;
	}

	.list.grid-view > .empty-search {
		flex: 0 0 100%;
	}

	.list.grid-view .list-item {
		flex: 0 0 130px;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1rem 0.75rem;
		min-height: 110px;
		text-align: center;
		gap: 0.35rem;
		background-color: var(--bg-surface);
	}

	.card-icon {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background-color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
		overflow: hidden;
	}

	.card-icon.cover {
		border-radius: 6px;
	}

	.card-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
