<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { untrack } from 'svelte';
	import GradientPulse from '$lib/components/GradientPulse.svelte';
	import AlbumCard from '$lib/components/AlbumCard.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import type { Album } from '$lib/types/types';

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
	});

	// Track the album of the currently playing track. untrack() reads
	// recentAlbumIds without adding it as a dependency, avoiding an effect loop.
	$effect(() => {
		const track = playerStore.currentTrack;
		if (!track) return;
		const albumId = `${track.album.trim()}|||${track.artist.trim()}`;
		const prev = untrack(() => recentAlbumIds);
		const updated = [albumId, ...prev.filter((id) => id !== albumId)].slice(0, 20);
		recentAlbumIds = updated;
		try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch {}
	});

	const tracks = $derived(libraryStore.tracks);
	const trackCount = $derived(tracks.length);

	const recentAlbums = $derived(
		recentAlbumIds
			.map((id) => libraryStore.albums.find((a) => a.id === id))
			.filter((a): a is Album => a !== undefined)
			.slice(0, 8)
	);

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

	const greeting = $derived(() => {
		const h = new Date().getHours();
		const base =
			h >= 5 && h < 12 ? 'Good morning'
			: h >= 12 && h < 17 ? 'Good afternoon'
			: 'Good evening';
		return vesselName ? `${base}, ${vesselName}` : base;
	});

	const insight = $derived(() => {
		const favIds = playlistStore.getPlaylist('favorites')?.trackIds ?? [];
		const favCount = favIds.length;
		if (trackCount === 0) return 'Your library will appear here. Scan a folder to get started.';
		if (favCount > 0)
			return `${favCount} track${favCount !== 1 ? 's' : ''} in your favorites. ${trackCount} in your library.`;
		return `${trackCount} track${trackCount !== 1 ? 's' : ''} in your library. Heart the ones that matter.`;
	});

	function navigateAlbum(album: Album) {
		goto(`/library/album/${encodeURIComponent(album.id)}`);
	}

	function resume() {
		if (playerStore.currentTrack) {
			playerStore.play();
			goto('/nowplaying');
		}
	}

	async function onScanClick() {
		await libraryStore.scanLibrary();
	}
</script>

<div class="home" style="padding-top: env(safe-area-inset-top, 0px);">
	<!-- Greeting -->
	<div class="greeting-wrap">
		<GradientPulse pulse={playerStore.isPlaying}>
			<div class="greeting-inner">
				<h1 class="greeting-text">{greeting()}</h1>
			</div>
		</GradientPulse>
	</div>

	<!-- Quick actions -->
	<div class="quick-actions">
		{#if playerStore.currentTrack}
			<button class="action-btn primary" onclick={resume}>▶ Resume</button>
		{/if}
		<button class="sattva-btn" onclick={() => goto('/sattva')}>
			🧘 Sattva
		</button>
	</div>

	<!-- Insight -->
	<p class="insight">{insight()}</p>

	{#if trackCount === 0}
		<!-- Empty state -->
		<div class="empty-state">
			<GradientPulse>
				<div class="home-sigil">🧭</div>
			</GradientPulse>
			<p class="empty-heading">Your library will appear here.</p>
			<p class="empty-sub">Scan your music folder to get started.</p>
			<button class="action-btn" onclick={onScanClick} disabled={libraryStore.isScanning}>
				{libraryStore.isScanning
					? `Scanning ${Math.round(libraryStore.scanProgress * 100)}%`
					: 'Scan Library'}
			</button>
		</div>
	{:else}
		<!-- Recently Played -->
		{#if recentAlbums.length > 0}
			<section class="section">
				<h2 class="section-title">Recently Played</h2>
				<div class="h-scroll">
					{#each recentAlbums as album (album.id)}
						<div class="h-card">
							<AlbumCard {album} size="small" onClick={() => navigateAlbum(album)} />
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Favorites -->
		{#if favoriteAlbums.length > 0}
			<section class="section">
				<h2 class="section-title">Your Favorites</h2>
				<div class="h-scroll">
					{#each favoriteAlbums as album (album.id)}
						<div class="h-card">
							<AlbumCard {album} size="small" onClick={() => navigateAlbum(album)} />
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Browse link when no recently played yet -->
		{#if recentAlbums.length === 0}
			<div class="browse-prompt">
				<p class="empty-sub">Play something to see it here.</p>
				<button class="action-btn" onclick={() => goto('/library')}>Browse Library</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.home {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow-y: auto;
	}

	/* Greeting */
	.greeting-wrap {
		padding: 2rem 1.5rem 1rem;
		position: relative;
	}

	.greeting-inner {
		position: relative;
		z-index: 1;
	}

	.greeting-text {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
		line-height: 1.2;
	}

	/* Quick actions */
	.quick-actions {
		display: flex;
		gap: 0.75rem;
		padding: 0 1.5rem 0.75rem;
		flex-wrap: wrap;
	}

	.action-btn {
		padding: 0.55rem 1.25rem;
		border-radius: 20px;
		border: 1px solid var(--border-color);
		background: var(--bg-surface);
		color: var(--text);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.action-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
		box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.action-btn.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	.action-btn.primary:hover {
		filter: brightness(1.1);
		box-shadow: none;
		color: #fff;
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.sattva-btn {
		padding: 0.55rem 1.25rem;
		border-radius: 20px;
		border: 1px solid rgba(217, 119, 6, 0.35);
		background: linear-gradient(
			135deg,
			rgba(217, 119, 6, 0.12),
			rgba(245, 158, 11, 0.07)
		);
		color: #d97706;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.sattva-btn:hover {
		border-color: rgba(217, 119, 6, 0.6);
		box-shadow: 0 0 14px rgba(217, 119, 6, 0.2);
	}

	/* Insight */
	.insight {
		font-size: 0.85rem;
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
		padding: 0 1.5rem 1.25rem;
	}

	/* Sections */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0 1.5rem 1.5rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
		letter-spacing: 0.01em;
	}

	.h-scroll {
		display: flex;
		gap: 0.75rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
		scrollbar-width: thin;
	}

	.h-card {
		flex-shrink: 0;
		width: 130px;
	}

	/* Empty state */
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		gap: 1rem;
		text-align: center;
	}

	.home-sigil {
		font-size: 4rem;
		line-height: 1;
	}

	.empty-heading {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text);
		margin: 0;
	}

	.empty-sub {
		font-size: 0.9rem;
		color: var(--text-muted);
		margin: 0;
	}

	/* Browse prompt (library exists but nothing played yet) */
	.browse-prompt {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.action-btn,
		.sattva-btn { transition: none; }
	}
</style>
