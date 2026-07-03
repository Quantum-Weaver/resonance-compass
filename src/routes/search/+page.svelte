<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import AlbumCard from '$lib/components/AlbumCard.svelte';
	import TrackItem from '$lib/components/TrackItem.svelte';
	import type { Album, Artist } from '$lib/types/types';

	type Category = 'all' | 'artists' | 'albums' | 'tracks';

	const RECENT_KEY = 'recent_searches';

	let query = $state('');
	let debouncedQ = $state('');
	let category = $state<Category>('all');
	let recentSearches = $state<string[]>([]);
	let inputEl: HTMLInputElement | null = null;

	// Idiomatic Svelte 5 debounce — cleanup fn clears the timer on re-run and unmount.
	$effect(() => {
		const raw = query;
		const timer = setTimeout(() => { debouncedQ = raw.toLowerCase().trim(); }, 150);
		return () => clearTimeout(timer);
	});

	const tracks = $derived(libraryStore.tracks);
	const albums = $derived(libraryStore.albums);
	const artists = $derived(libraryStore.artists);

	const q = $derived(debouncedQ);

	const matchedTracks = $derived(
		q
			? tracks.filter(
					(t) =>
						t.title.toLowerCase().includes(q) ||
						t.artist.toLowerCase().includes(q) ||
						t.album.toLowerCase().includes(q)
				)
			: []
	);

	const matchedAlbums = $derived(
		q
			? albums.filter(
					(a) => a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
				)
			: []
	);

	const matchedArtists = $derived(
		q ? artists.filter((a) => a.name.toLowerCase().includes(q)) : []
	);

	// "All" tab limits: 3 artists, 3 albums, 5 tracks
	const displayArtists = $derived(category === 'all' ? matchedArtists.slice(0, 3) : matchedArtists);
	const displayAlbums = $derived(category === 'all' ? matchedAlbums.slice(0, 3) : matchedAlbums);
	const displayTracks = $derived(category === 'all' ? matchedTracks.slice(0, 5) : matchedTracks);

	const hasResults = $derived(
		matchedTracks.length > 0 || matchedAlbums.length > 0 || matchedArtists.length > 0
	);

	const showArtists = $derived(category === 'all' || category === 'artists');
	const showAlbums = $derived(category === 'all' || category === 'albums');
	const showTracks = $derived(category === 'all' || category === 'tracks');

	onMount(() => {
		try {
			const raw = localStorage.getItem(RECENT_KEY);
			if (raw) recentSearches = JSON.parse(raw);
		} catch {}
		inputEl?.focus();
	});

	function saveSearch(term: string) {
		const t = term.trim();
		if (!t) return;
		const updated = [t, ...recentSearches.filter((s) => s !== t)].slice(0, 10);
		recentSearches = updated;
		try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch {}
	}

	function clearSearches() {
		recentSearches = [];
		try { localStorage.removeItem(RECENT_KEY); } catch {}
	}

	function selectRecent(term: string) {
		query = term;
		inputEl?.focus();
	}

	function navigateAlbum(album: Album) {
		saveSearch(query);
		goto(`/library/album/${encodeURIComponent(album.id)}`);
	}

	function navigateArtist(artist: Artist) {
		saveSearch(query);
		goto(`/library/artist/${encodeURIComponent(artist.id)}`);
	}

	// Loads the full matched tracks list as the queue, starting at the tapped track.
	// This means the vessel can skip forward through all search results, not just the
	// limited preview slice shown in the "All" tab.
	function playTrack(trackIndex: number) {
		const track = displayTracks[trackIndex];
		if (!track) return;
		saveSearch(query);
		const fullQueue = [...matchedTracks];
		const queueIndex = fullQueue.findIndex((t) => t.id === track.id);
		playerStore.setQueue(fullQueue, queueIndex >= 0 ? queueIndex : 0);
	}
</script>

<div class="search-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<!-- Search bar -->
	<div class="search-bar-wrap">
		<span class="search-icon" aria-hidden="true">🔍</span>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			bind:this={inputEl}
			bind:value={query}
			class="search-input"
			type="search"
			placeholder="Artists, albums, tracks..."
			aria-label="Search library"
			autofocus
		/>
		{#if query}
			<button
				class="clear-btn"
				onclick={() => { query = ''; inputEl?.focus(); }}
				aria-label="Clear search"
			>✕</button>
		{/if}
	</div>

	<!-- Category tabs -->
	<div class="tabs" role="tablist" aria-label="Search categories">
		{#each (['all', 'artists', 'albums', 'tracks'] as Category[]) as cat}
			<button
				class="tab"
				class:active={category === cat}
				role="tab"
				aria-selected={category === cat}
				onclick={() => { category = cat; }}
			>{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
		{/each}
	</div>

	<!-- Results -->
	<div class="results-area">
		{#if !q}
			{#if recentSearches.length > 0}
				<section class="recent-section">
					<div class="recent-header">
						<span class="recent-label">Recent</span>
						<button class="link-btn" onclick={clearSearches}>Clear</button>
					</div>
					<div class="recent-list">
						{#each recentSearches as term (term)}
							<button class="recent-chip" onclick={() => selectRecent(term)}>
								<span class="recent-icon" aria-hidden="true">🕐</span>
								{term}
							</button>
						{/each}
					</div>
				</section>
			{:else}
				<div class="empty-state">
					<span class="empty-icon">🔍</span>
					<p class="empty-text">Search your library</p>
					<p class="empty-sub">
						{tracks.length} track{tracks.length !== 1 ? 's' : ''} · {albums.length} album{albums.length !== 1 ? 's' : ''} · {artists.length} artist{artists.length !== 1 ? 's' : ''}
					</p>
				</div>
			{/if}

		{:else if !hasResults}
			<div class="empty-state">
				<span class="empty-icon">😶</span>
				<p class="empty-text">No results for "{query}"</p>
				<p class="empty-sub">Try a different spelling or search term</p>
			</div>

		{:else}
			<!-- Artists -->
			{#if showArtists && displayArtists.length > 0}
				<section class="result-section">
					<div class="section-header">
						<h3 class="section-title">Artists</h3>
						{#if category === 'all' && matchedArtists.length > 3}
							<button class="link-btn" onclick={() => { category = 'artists'; }}>
								See all {matchedArtists.length} →
							</button>
						{/if}
					</div>
					<div class="artist-list">
						{#each displayArtists as artist (artist.id)}
							<button class="artist-row" onclick={() => navigateArtist(artist)}>
								<span class="artist-avatar">{artist.name.charAt(0).toUpperCase()}</span>
								<div class="artist-info">
									<span class="artist-name">{artist.name}</span>
									<span class="artist-meta">{artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}</span>
								</div>
								<span class="row-arrow" aria-hidden="true">›</span>
							</button>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Albums -->
			{#if showAlbums && displayAlbums.length > 0}
				<section class="result-section">
					<div class="section-header">
						<h3 class="section-title">Albums</h3>
						{#if category === 'all' && matchedAlbums.length > 3}
							<button class="link-btn" onclick={() => { category = 'albums'; }}>
								See all {matchedAlbums.length} →
							</button>
						{/if}
					</div>
					<div class="album-grid">
						{#each displayAlbums as album (album.id)}
							<div class="card-wrap">
								<AlbumCard {album} size="small" onClick={() => navigateAlbum(album)} />
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Tracks -->
			{#if showTracks && displayTracks.length > 0}
				<section class="result-section">
					<div class="section-header">
						<h3 class="section-title">Tracks</h3>
						{#if category === 'all' && matchedTracks.length > 5}
							<button class="link-btn" onclick={() => { category = 'tracks'; }}>
								See all {matchedTracks.length} →
							</button>
						{/if}
					</div>
					<div class="track-list">
						{#each displayTracks as track, i (track.id)}
							<TrackItem
								{track}
								index={i + 1}
								showHeart
								showMenu
								playlists={playlistStore.playlists}
								isCurrentTrack={playerStore.currentTrack?.id === track.id}
								onPlay={() => playTrack(i)}
								onAddToPlaylist={(plId) => playlistStore.addTrack(plId, track.id)}
							/>
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	</div>
</div>

<style>
	.search-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}

	/* Search bar */
	.search-bar-wrap {
		position: relative;
		display: flex;
		align-items: center;
		padding: 1rem 1.25rem 0;
		flex-shrink: 0;
	}

	.search-icon {
		position: absolute;
		left: calc(1.25rem + 0.85rem);
		font-size: 1rem;
		pointer-events: none;
		line-height: 1;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 2.5rem 0.75rem 2.5rem;
		border-radius: 12px;
		border: 1.5px solid var(--border-color);
		background-color: var(--bg-surface);
		color: var(--text);
		font-size: 1rem;
		font-family: inherit;
		outline: none;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.search-input:focus { border-color: var(--accent); }

	/* Remove browser's default search-cancel button */
	.search-input::-webkit-search-cancel-button { display: none; }

	.clear-btn {
		position: absolute;
		right: calc(1.25rem + 0.75rem);
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.25rem;
		line-height: 1;
		transition: color 0.15s;
	}

	.clear-btn:hover { color: var(--text); }

	/* Category tabs */
	.tabs {
		display: flex;
		border-bottom: 1px solid var(--border-color);
		gap: 0;
		flex-shrink: 0;
		margin-top: 0.75rem;
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
		font-family: inherit;
		transition: color 0.15s, border-color 0.15s;
	}

	.tab:hover { color: var(--accent); }
	.tab.active { color: var(--accent); border-bottom-color: var(--accent); }

	/* Results area — .main-content is the scroller */
	.results-area {
		flex: 1;
		padding: 1.25rem 1.25rem 1rem;
	}

	/* Shared link-style button (See all, Clear) */
	.link-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
	}

	/* Empty states */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 3rem;
		gap: 0.5rem;
		text-align: center;
	}

	.empty-icon { font-size: 2.5rem; }
	.empty-text { font-size: 1rem; font-weight: 600; color: var(--text-secondary); margin: 0; }
	.empty-sub  { font-size: 0.82rem; color: var(--text-muted); margin: 0; }

	/* Recent searches */
	.recent-section { margin-bottom: 1.5rem; }

	.recent-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.6rem;
	}

	.recent-label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}

	.recent-list {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.recent-chip {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.6rem 0.75rem;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--text);
		font-size: 0.9rem;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		width: 100%;
		transition: background-color 0.15s;
	}

	.recent-chip:hover {
		background-color: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.recent-icon { font-size: 0.9rem; color: var(--text-muted); flex-shrink: 0; }

	/* Result sections */
	.result-section { margin-bottom: 1.75rem; }

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin: 0;
	}

	/* Artists */
	.artist-list { display: flex; flex-direction: column; gap: 0.2rem; }

	.artist-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.55rem 0.75rem;
		border: none;
		border-radius: 10px;
		background: transparent;
		cursor: pointer;
		text-align: left;
		font: inherit;
		color: inherit;
		width: 100%;
		transition: background-color 0.15s;
	}

	.artist-row:hover {
		background-color: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.artist-avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background-color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.artist-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
	.artist-name { font-size: 0.95rem; font-weight: 500; color: var(--text); }
	.artist-meta { font-size: 0.78rem; color: var(--text-secondary); }
	.row-arrow   { color: var(--text-muted); font-size: 1.2rem; flex-shrink: 0; }

	/* Albums */
	.album-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.card-wrap {
		flex: 0 0 130px;
		min-width: 0;
	}

	/* Tracks */
	.track-list { display: flex; flex-direction: column; }

	@media (prefers-reduced-motion: reduce) {
		.search-input,
		.clear-btn,
		.tab,
		.recent-chip,
		.artist-row { transition: none; }
	}
</style>
