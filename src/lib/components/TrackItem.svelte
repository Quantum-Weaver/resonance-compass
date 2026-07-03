<script lang="ts">
	import type { Track, Playlist } from '$lib/types/types';
	import { playlistStore } from '$lib/stores/playlist.svelte';

	let {
		track,
		index,
		showHeart = false,
		showMenu = false,
		isCurrentTrack = false,
		onPlay,
		playlists = [],
		onAddToPlaylist,
		onRemove,
		onTag,
	}: {
		track: Track;
		index: number;
		showHeart?: boolean;
		showMenu?: boolean;
		isCurrentTrack?: boolean;
		onPlay: () => void;
		playlists?: Playlist[];
		onAddToPlaylist?: (playlistId: string) => void;
		onRemove?: () => void;
		onTag?: () => void;
	} = $props();

	let menuOpen = $state(false);
	let heartAnimating = $state(false);

	const isFav = $derived(playlistStore.isFavorite(track.id));

	function formatDuration(seconds: number): string {
		if (!seconds || seconds <= 0) return '--:--';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function toggleFav(e: MouseEvent) {
		e.stopPropagation();
		heartAnimating = true;
		setTimeout(() => { heartAnimating = false; }, 400);
		playlistStore.toggleFavorite(track.id);
	}

	function openMenu(e: MouseEvent) {
		e.stopPropagation();
		menuOpen = !menuOpen;
	}

	function addToPlaylist(playlistId: string) {
		onAddToPlaylist?.(playlistId);
		menuOpen = false;
	}
</script>

{#if menuOpen}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="track-backdrop"
		onclick={() => (menuOpen = false)}
		onkeydown={(e) => { if (e.key === 'Escape') menuOpen = false; }}
		role="presentation"
	></div>
{/if}

<div class="track-item" class:playing={isCurrentTrack}>
	<button class="track-click" onclick={onPlay} aria-label="Play {track.title}">
		<span class="track-index" class:accent={isCurrentTrack}>
			{isCurrentTrack ? '▶' : (track.trackNumber || index)}
		</span>
		<div class="track-info">
			<span class="track-title" class:accent={isCurrentTrack}>{track.title}</span>
			<span class="track-artist">{track.artist}</span>
		</div>
		<span class="track-dur">{formatDuration(track.duration)}</span>
	</button>

	{#if showHeart}
		<button
			class="heart-btn"
			class:pop={heartAnimating}
			onclick={toggleFav}
			aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
			aria-pressed={isFav}
		>{isFav ? '❤️' : '🤍'}</button>
	{/if}

	{#if showMenu}
		<div class="menu-wrap">
			<button class="menu-btn" onclick={openMenu} aria-label="Track options">⋮</button>
			{#if menuOpen}
				<div class="menu-dropdown">
					<p class="dropdown-label">Add to playlist</p>
					{#if playlists.length === 0}
						<p class="dropdown-empty">No playlists yet</p>
					{:else}
						{#each playlists as pl (pl.id)}
							<button class="dropdown-item" onclick={() => addToPlaylist(pl.id)}>{pl.name}</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#if onTag}
		<button class="tag-btn" onclick={(e) => { e.stopPropagation(); onTag?.(); }} aria-label="Tag mood">+</button>
	{/if}

	{#if onRemove}
		<button class="remove-btn" onclick={(e) => { e.stopPropagation(); onRemove?.(); }} aria-label="Remove">✕</button>
	{/if}
</div>

<style>
	.track-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9;
		background: transparent;
		cursor: default;
	}

	.track-item {
		display: flex;
		align-items: center;
		border-bottom: 1px solid var(--border-color);
	}

	.track-item:hover {
		background-color: var(--bg-surface);
	}

	.track-click {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		padding: 0.7rem 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		color: inherit;
		font: inherit;
		min-width: 0;
	}

	.track-index {
		width: 2rem;
		text-align: center;
		font-size: 0.9rem;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.track-index.accent {
		color: var(--accent);
	}

	.track-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		overflow: hidden;
		min-width: 0;
	}

	.track-title {
		font-size: 0.95rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--text);
	}

	.track-title.accent {
		color: var(--accent);
	}

	.track-artist {
		font-size: 0.8rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--text-secondary);
	}

	.track-dur {
		font-size: 0.85rem;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.heart-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem 0.4rem;
		font-size: 1rem;
		line-height: 1;
		flex-shrink: 0;
		transition: transform 0.15s;
		min-width: 44px;
		min-height: 44px;
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

	.menu-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.menu-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem 0.75rem;
		font-size: 1.1rem;
		color: var(--text-muted);
		line-height: 1;
		min-width: 44px;
		min-height: 44px;
	}

	.menu-btn:hover {
		color: var(--text);
	}

	.menu-dropdown {
		position: absolute;
		right: 0;
		top: 100%;
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

	.tag-btn {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		border: 1px solid var(--accent);
		border-radius: 6px;
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 700;
		color: var(--accent);
		flex-shrink: 0;
		margin-right: 0.25rem;
		line-height: 1;
	}

	.tag-btn:hover {
		background: color-mix(in srgb, var(--accent) 30%, transparent);
	}

	.remove-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0.5rem 0.6rem;
		flex-shrink: 0;
	}

	.remove-btn:hover {
		color: var(--heart, #e74c3c);
	}
</style>
