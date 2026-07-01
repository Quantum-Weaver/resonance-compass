<script lang="ts">
	import type { Album } from '$lib/types/types';

	let { album, onClick, size = 'medium' }: {
		album: Album;
		onClick: () => void;
		size?: 'small' | 'medium' | 'large';
	} = $props();
</script>

<button class="album-card {size}" onclick={onClick} aria-label="{album.name} by {album.artist}">
	<div class="card-art">
		{#if album.coverArt}
			<img src={album.coverArt} alt="" class="art-img" />
		{:else}
			<span class="art-placeholder">💿</span>
		{/if}
	</div>
	<div class="card-meta">
		<span class="card-name">{album.name}</span>
		<span class="card-artist">{album.artist}</span>
		{#if album.year}
			<span class="card-year">{album.year}</span>
		{/if}
	</div>
</button>

<style>
	.album-card {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		border: 1px solid var(--border-color);
		border-radius: 12px;
		background: var(--bg-surface);
		cursor: pointer;
		text-align: left;
		font: inherit;
		color: inherit;
		overflow: hidden;
		padding: 0;
		transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
	}

	.album-card:hover {
		border-color: var(--accent);
		box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 22%, transparent);
		transform: translateY(-2px);
	}

	.card-art {
		width: 100%;
		aspect-ratio: 1;
		background-color: color-mix(in srgb, var(--accent) 20%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.art-img { width: 100%; height: 100%; object-fit: cover; }
	.art-placeholder { font-size: 2rem; }

	.card-meta {
		padding: 0.5rem 0.65rem 0.65rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.card-name {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text);
		overflow: hidden;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		white-space: normal;
		line-height: 1.3;
	}

	.card-artist {
		font-size: 0.75rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 0.1rem;
	}

	.card-year {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin-top: 0.05rem;
	}

	.album-card.small .card-name { font-size: 0.78rem; }
	.album-card.small .card-meta { padding: 0.35rem 0.5rem 0.5rem; }
	.album-card.large .card-name { font-size: 1rem; }
	.album-card.large .card-meta { padding: 0.75rem 0.85rem 0.9rem; }

	@media (prefers-reduced-motion: reduce) {
		.album-card { transition: none; }
	}
</style>
