<script lang="ts">
	import { onMount } from 'svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { moodStore } from '$lib/stores/mood.svelte';
	import TrackItem from '$lib/components/TrackItem.svelte';
	import type { Track } from '$lib/types/types';

	type SortMode = 'recent' | 'alpha' | 'artist' | 'played';

	const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
		{ mode: 'recent', label: 'Recently Added' },
		{ mode: 'alpha', label: 'A–Z' },
		{ mode: 'artist', label: 'Artist' },
		{ mode: 'played', label: 'Most Played' },
	];

	let sortMode = $state<SortMode>('recent');
	let activeEmoji = $state<string | null>(null);
	// Keyed by track id → unique emojis tagged on that track.
	// Loaded once in onMount; full Map replacement triggers reactivity.
	let trackMoods = $state<Map<string, string[]>>(new Map());

	const currentTrack = $derived(playerStore.currentTrack);

	// Favorited tracks in add-order (oldest first, matching trackIds insertion order).
	const favoriteTracks = $derived(
		(playlistStore.getPlaylist('favorites')?.trackIds ?? [])
			.map((id) => libraryStore.getTrackById(id))
			.filter((t): t is Track => t !== undefined)
	);

	const sortedTracks = $derived(
		(() => {
			const list = [...favoriteTracks];
			switch (sortMode) {
				case 'alpha':
					return list.sort((a, b) => a.title.localeCompare(b.title));
				case 'artist':
					return list.sort(
						(a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title)
					);
				case 'played':
					// playCount not tracked yet (Phase 14 scope); sort by dateAdded asc
					// (oldest library additions first) as a reasonable proxy.
					return list.sort((a, b) => a.dateAdded - b.dateAdded);
				default:
					// 'recent': reverse insertion order → most recently favorited first
					return list.reverse();
			}
		})()
	);

	const filteredTracks = $derived(
		activeEmoji
			? sortedTracks.filter((t) => trackMoods.get(t.id)?.includes(activeEmoji!))
			: sortedTracks
	);

	// Top 8 emojis used across favorited tracks only.
	const topFavEmojis = $derived(
		(() => {
			const counts = new Map<string, number>();
			for (const [, emojis] of trackMoods) {
				for (const e of emojis) counts.set(e, (counts.get(e) ?? 0) + 1);
			}
			return [...counts.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, 8)
				.map(([emoji]) => emoji);
		})()
	);

	onMount(async () => {
		const ids = playlistStore.getPlaylist('favorites')?.trackIds ?? [];
		if (ids.length === 0) return;
		const results = await Promise.all(ids.map((id) => moodStore.getMoodEventsByTrack(id)));
		const map = new Map<string, string[]>();
		for (let i = 0; i < ids.length; i++) {
			const emojis = [...new Set(results[i].map((e) => e.emoji))];
			if (emojis.length > 0) map.set(ids[i], emojis);
		}
		trackMoods = map;
	});

	function playAt(index: number) {
		if (filteredTracks.length === 0) return;
		playerStore.setQueue([...filteredTracks], index);
	}

	function playAll() {
		if (filteredTracks.length === 0) return;
		playerStore.setQueue([...filteredTracks], 0);
	}

	function shuffleAll() {
		if (filteredTracks.length === 0) return;
		const shuffled = [...filteredTracks].sort(() => Math.random() - 0.5);
		playerStore.setQueue(shuffled, 0);
	}

	function toggleEmoji(emoji: string) {
		activeEmoji = activeEmoji === emoji ? null : emoji;
	}
</script>

<div class="liked-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<div class="page-header">
		<div class="title-row">
			<h1 class="title">Liked Songs</h1>
			<span class="count">{favoriteTracks.length} track{favoriteTracks.length !== 1 ? 's' : ''}</span>
		</div>
	</div>

	{#if favoriteTracks.length === 0}
		<div class="empty-state">
			<span class="empty-icon">🤍</span>
			<p class="empty-text">No liked songs yet.</p>
			<p class="empty-sub">Tap the ❤️ on any track to add it here.</p>
		</div>
	{:else}
		<!-- Sort pills -->
		<div class="sort-row">
			{#each SORT_OPTIONS as opt (opt.mode)}
				<button
					class="sort-btn"
					class:active={sortMode === opt.mode}
					onclick={() => { sortMode = opt.mode; }}
				>{opt.label}</button>
			{/each}
		</div>

		<!-- Mood filter (only shown when at least one favorited track has been tagged) -->
		{#if topFavEmojis.length > 0}
			<div class="mood-row">
				{#each topFavEmojis as emoji (emoji)}
					<button
						class="mood-chip emoji-chip"
						class:active={activeEmoji === emoji}
						onclick={() => toggleEmoji(emoji)}
						aria-label="Filter by {emoji}"
					>{emoji}</button>
				{/each}
			</div>
		{/if}

		<!-- Play / Shuffle -->
		<div class="play-row">
			<button class="play-btn primary" onclick={playAll} disabled={filteredTracks.length === 0}>
				▶ Play All
			</button>
			<button class="play-btn" onclick={shuffleAll} disabled={filteredTracks.length === 0}>
				🔀 Shuffle
			</button>
			{#if activeEmoji !== null}
				<span class="filter-count">{filteredTracks.length} of {favoriteTracks.length}</span>
			{/if}
		</div>

		<!-- Track list -->
		<div class="track-list">
			{#if filteredTracks.length === 0}
				<div class="no-results">No tracks tagged with {activeEmoji}</div>
			{:else}
				{#each filteredTracks as track, i (track.id)}
					<div class="track-row">
						<TrackItem
							{track}
							index={i + 1}
							showHeart
							showMenu
							playlists={playlistStore.playlists.filter((p) => p.id !== 'favorites')}
							isCurrentTrack={currentTrack?.id === track.id}
							onPlay={() => playAt(i)}
							onAddToPlaylist={(plId) => playlistStore.addTrack(plId, track.id)}
						/>
						{#if (trackMoods.get(track.id) ?? []).length > 0}
							<div class="mood-tags">
								{#each trackMoods.get(track.id) ?? [] as emoji (emoji)}
									<span class="mood-tag">{emoji}</span>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.liked-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}

	/* Header */
	.page-header {
		padding: 1.25rem 1.25rem 0.75rem;
		border-bottom: 1px solid var(--border-color);
		flex-shrink: 0;
	}

	.title-row {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	.count {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	/* Sort pills */
	.sort-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding: 0.75rem 1.25rem 0;
		flex-shrink: 0;
	}

	.sort-btn {
		padding: 0.3rem 0.85rem;
		border-radius: 16px;
		border: 1px solid var(--border-color);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.15s, color 0.15s;
	}

	.sort-btn:hover {
		border-color: var(--accent);
		color: var(--text);
	}

	.sort-btn.active {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		border-color: var(--accent);
		color: var(--accent);
		font-weight: 600;
	}

	/* Mood filter row */
	.mood-row {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		align-items: center;
		padding: 0.5rem 1.25rem 0;
		flex-shrink: 0;
	}

	.mood-chip {
		padding: 0.3rem 0.75rem;
		border-radius: 14px;
		border: 1px solid var(--border-color);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
		line-height: 1.4;
		transition: border-color 0.15s, color 0.15s;
	}

	.emoji-chip {
		font-size: 1rem;
		padding: 0.2rem 0.5rem;
	}

	.mood-chip:hover {
		border-color: var(--accent);
		color: var(--text);
	}

	.mood-chip.active {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		border-color: var(--accent);
		color: var(--accent);
	}

	/* Play / shuffle row */
	.play-row {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding: 0.75rem 1.25rem 0.25rem;
		flex-shrink: 0;
	}

	.play-btn {
		padding: 0.5rem 1.35rem;
		border-radius: 22px;
		border: 1px solid var(--border-color);
		background: var(--bg-surface);
		color: var(--text);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.play-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
		box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.play-btn.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	.play-btn.primary:hover:not(:disabled) {
		filter: brightness(1.1);
		color: #fff;
		box-shadow: none;
	}

	.play-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.filter-count {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	/* Track list */
	.track-list {
		flex: 1;
		padding: 0.25rem 0;
	}

	.track-row {
		border-bottom: 1px solid var(--border-color);
	}

	/* TrackItem owns its border via .track-item — suppress it since .track-row owns it */
	.track-row :global(.track-item) {
		border-bottom: none;
	}

	.mood-tags {
		display: flex;
		gap: 0.2rem;
		flex-wrap: wrap;
		padding: 0 0.5rem 0.4rem 3.5rem;
	}

	.mood-tag {
		font-size: 0.85rem;
		line-height: 1;
	}

	/* Empty / no-results */
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-align: center;
		padding: 4rem 2rem;
	}

	.empty-icon {
		font-size: 3rem;
	}

	.empty-text {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin: 0;
	}

	.empty-sub {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin: 0;
	}

	.no-results {
		padding: 2rem;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.sort-btn,
		.mood-chip,
		.play-btn { transition: none; }
	}
</style>
