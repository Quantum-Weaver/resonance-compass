<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import AlbumCard from '$lib/components/AlbumCard.svelte';
	import TrackItem from '$lib/components/TrackItem.svelte';
	import type { Album } from '$lib/types/types';

	// The continue-strip: greeting, resume, recently played. Recording of
	// recent albums lives in the layout, which is always awake; this reads.
	const VESSEL_KEY = 'resonance-compass-vessel-name';
	const RECENT_KEY = 'recent_albums';

	let vesselName = $state('');
	let recentAlbumIds = $state<string[]>([]);

	onMount(() => {
		vesselName = localStorage.getItem(VESSEL_KEY) ?? '';
		try {
			const stored = localStorage.getItem(RECENT_KEY);
			if (stored) recentAlbumIds = JSON.parse(stored);
		} catch {}
		try {
			const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
			if (raw) recentSearches = JSON.parse(raw);
		} catch {}
	});

	const greeting = $derived(() => {
		const h = new Date().getHours();
		const base =
			h >= 5 && h < 12 ? 'Good morning'
			: h >= 12 && h < 17 ? 'Good afternoon'
			: 'Good evening';
		return vesselName ? `${base}, ${vesselName}` : base;
	});

	const recentAlbums = $derived(
		recentAlbumIds
			.map((id) => libraryStore.albums.find((a) => a.id === id))
			.filter((a): a is Album => a !== undefined)
			.slice(0, 8)
	);

	function resume() {
		if (playerStore.currentTrack) {
			playerStore.play();
			goto('/nowplaying');
		}
	}

	let searchQuery = $state('');
	let debouncedQuery = $state('');
	let viewMode = $state<'artists' | 'albums' | 'genres' | 'tracks'>('artists');
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

	// Track search: playing the full filtered set as the queue from the
	// tapped row, never just a preview slice.
	const filteredTracks = $derived(
		debouncedQuery
			? tracks.filter(
					(t) =>
						t.title.toLowerCase().includes(debouncedQuery) ||
						t.artist.toLowerCase().includes(debouncedQuery) ||
						t.album.toLowerCase().includes(debouncedQuery)
				)
			: tracks
	);

	function playTrack(i: number) {
		saveSearch(searchQuery);
		playerStore.setQueue(filteredTracks, i);
	}

	// The recent-searches and favorites cards: called from the menu bar,
	// never imposed. Recent searches keep the SAME storage key as the
	// retired search room — saved when a result is acted on, ten kept.
	const RECENT_SEARCHES_KEY = 'recent_searches';
	let recentSearches = $state<string[]>([]);
	let openCard = $state<'recent' | 'favorites' | null>(null);

	function toggleCard(card: 'recent' | 'favorites') {
		openCard = openCard === card ? null : card;
	}

	function saveSearch(term: string) {
		const t = term.trim();
		if (!t) return;
		const updated = [t, ...recentSearches.filter((s) => s !== t)].slice(0, 10);
		recentSearches = updated;
		try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)); } catch {}
	}

	function clearSearches() {
		recentSearches = [];
		try { localStorage.removeItem(RECENT_SEARCHES_KEY); } catch {}
	}

	function selectRecent(term: string) {
		searchQuery = term;
		openCard = null;
	}

	const favoriteAlbums = $derived(
		(() => {
			const favIds = playlistStore.getPlaylist('favorites')?.trackIds ?? [];
			const seen = new Set<string>();
			const result: Album[] = [];
			for (const trackId of favIds) {
				const track = libraryStore.getTrackById(trackId);
				if (!track) continue;
				const albumId = `${track.album.trim()}|||${track.artist.trim()}`;
				if (seen.has(albumId)) continue;
				seen.add(albumId);
				const album = libraryStore.albums.find((a) => a.id === albumId);
				if (album) result.push(album);
			}
			return result.slice(0, 8);
		})()
	);

	async function onScanClick() {
		await libraryStore.scanLibrary();
	}

	function openArtist(id: string) {
		saveSearch(searchQuery);
		goto(`/library/artist/${encodeURIComponent(id)}`);
	}

	function openAlbum(id: string) {
		saveSearch(searchQuery);
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

	<div class="continue-strip">
		<p class="strip-greeting">{greeting()}</p>
		<div class="strip-actions">
			<!-- The EQ door: rides the MiniPlayer's existing deep link. -->
			<button class="eq-btn" onclick={() => goto('/settings#eq')} title="Open the equalizer">
				🎛️ EQ
			</button>
			{#if playerStore.currentTrack}
				<button class="resume-btn" onclick={resume}>▶ Resume</button>
			{/if}
		</div>
	</div>

	{#if recentAlbums.length > 0}
		<div class="recent-row">
			{#each recentAlbums as album (album.id)}
				<div class="recent-card">
					<AlbumCard {album} size="small" onClick={() => openAlbum(album.id)} />
				</div>
			{/each}
		</div>
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
			<!-- The view dropdown. -->
			<select class="view-select" bind:value={viewMode} aria-label="Browse by">
				<option value="artists">Artists</option>
				<option value="albums">Albums</option>
				<option value="genres">Genres</option>
				<option value="tracks">Tracks</option>
			</select>
			<span class="tabs-spacer"></span>
			<!-- Callable cards — present, never imposed; separate from the
			     actual library (KP's ⚛ ruling, 2026-08-06). -->
			<button
				class="card-call"
				class:open={openCard === 'recent'}
				aria-expanded={openCard === 'recent'}
				onclick={() => toggleCard('recent')}
			>
				<span aria-hidden="true">🕐</span><span>Recent searches</span>
			</button>
			<button
				class="card-call"
				class:open={openCard === 'favorites'}
				aria-expanded={openCard === 'favorites'}
				onclick={() => toggleCard('favorites')}
			>
				<span aria-hidden="true">❤️</span><span>Favorites</span>
			</button>
		</div>

		{#if openCard === 'recent'}
			<div class="feature-card">
				<div class="feature-head">
					<span class="feature-title">Recent searches</span>
					{#if recentSearches.length > 0}
						<button class="feature-link" onclick={clearSearches}>Clear</button>
					{/if}
				</div>
				{#if recentSearches.length > 0}
					<div class="chip-row">
						{#each recentSearches as term (term)}
							<button class="recent-chip" onclick={() => selectRecent(term)}>{term}</button>
						{/each}
					</div>
				{:else}
					<p class="feature-empty">Searches you act on will gather here.</p>
				{/if}
			</div>
		{:else if openCard === 'favorites'}
			<div class="feature-card">
				<div class="feature-head">
					<span class="feature-title">Your favorites</span>
					<button class="feature-link" onclick={() => goto('/liked')}>All liked →</button>
				</div>
				{#if favoriteAlbums.length > 0}
					<div class="recent-row">
						{#each favoriteAlbums as album (album.id)}
							<div class="recent-card">
								<AlbumCard {album} size="small" onClick={() => openAlbum(album.id)} />
							</div>
						{/each}
					</div>
				{:else}
					<p class="feature-empty">Tap the ❤️ on any track and its album gathers here.</p>
				{/if}
			</div>
		{/if}

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
			{:else if viewMode === 'genres'}
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
			{:else}
				{#each filteredTracks as track, i (track.id)}
					<TrackItem
						{track}
						index={i + 1}
						showHeart
						showMenu
						playlists={playlistStore.playlists.filter((p) => p.id !== 'favorites')}
						isCurrentTrack={playerStore.currentTrack?.id === track.id}
						onPlay={() => playTrack(i)}
						onAddToPlaylist={(plId) => playlistStore.addTrack(plId, track.id)}
					/>
				{/each}
				{#if filteredTracks.length === 0}
					<p class="empty-search">No tracks match your search.</p>
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

	.continue-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.strip-greeting {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin: 0;
	}

	.strip-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.resume-btn {
		padding: 0.5rem 1.1rem;
		border-radius: 20px;
		border: none;
		background: var(--accent);
		color: #fff;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		flex-shrink: 0;
	}

	.resume-btn:hover {
		filter: brightness(1.1);
	}

	.eq-btn {
		padding: 0.5rem 1.1rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		flex-shrink: 0;
	}

	.eq-btn:hover {
		border-color: var(--accent);
		color: var(--text-primary);
	}

	.recent-row {
		display: flex;
		gap: 0.6rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
		margin-bottom: 0.75rem;
		scrollbar-width: thin;
	}

	.recent-card {
		flex-shrink: 0;
		width: 110px;
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
		flex-wrap: wrap;
		align-items: center;
		border-bottom: 1px solid var(--border-color);
		margin-bottom: 0.5rem;
	}

	.tabs-spacer {
		flex: 1;
	}

	.card-call {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 44px;
		padding: 0.35rem 0.7rem;
		margin: 0.15rem 0;
		border: 1px solid var(--border-color);
		border-radius: 16px;
		background: none;
		color: var(--text-secondary);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.card-call + .card-call {
		margin-left: 0.4rem;
	}

	.card-call:hover {
		border-color: var(--accent);
		color: var(--text);
	}

	.card-call.open {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.feature-card {
		border: 1px solid var(--border-color);
		border-radius: 12px;
		background: var(--bg-surface);
		padding: 0.75rem 0.9rem;
		margin: 0.25rem 0 0.75rem;
	}

	.feature-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.feature-title {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text);
	}

	.feature-link {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.78rem;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 3px;
		min-height: 44px;
		padding: 0 0.4rem;
	}

	.feature-link:hover {
		color: var(--text-secondary);
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.recent-chip {
		min-height: 44px;
		padding: 0.35rem 0.85rem;
		border: 1px solid var(--border-color);
		border-radius: 16px;
		background: none;
		color: var(--text-secondary);
		font-size: 0.82rem;
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.recent-chip:hover {
		border-color: var(--accent);
		color: var(--text);
	}

	.feature-empty {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin: 0;
	}

	.view-select {
		min-height: 44px;
		padding: 0.35rem 0.6rem;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		background-color: var(--bg-surface);
		color: var(--text);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		margin: 0.15rem 0;
	}

	.view-select:focus {
		border-color: var(--accent);
		outline: none;
	}

	.list {
		flex: 1;
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
