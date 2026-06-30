<script lang="ts">
	import { goto } from '$app/navigation';
	import GradientPulse from '$lib/components/GradientPulse.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';

	const tracks = $derived(libraryStore.tracks);
	const trackCount = $derived(tracks.length);

	// We don't track play history yet (that's Phase 9/14 scope) — "recently
	// added" is the closest honest signal we have from the data we do store.
	const recentlyAdded = $derived(
		[...tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 8)
	);

	async function onScanClick() {
		await libraryStore.scanLibrary();
	}

	function playTrack(track: (typeof tracks)[number]) {
		playerStore.setQueue([track], 0);
	}
</script>

<div class="home" style="padding-top: env(safe-area-inset-top, 0px);">
	<header class="home-header">
		<h1 class="home-title">Compass</h1>
		{#if trackCount > 0}
			<span class="count-badge">{trackCount}</span>
		{/if}
	</header>

	{#if trackCount === 0}
		<div class="empty-state">
			<GradientPulse>
				<div class="home-sigil">🧭</div>
			</GradientPulse>
			<p class="empty-heading">Your library will appear here.</p>
			<p class="empty-sub">Scan your music folder to get started.</p>
			<button class="scan-btn" onclick={onScanClick} disabled={libraryStore.isScanning}>
				{libraryStore.isScanning ? `Scanning ${Math.round(libraryStore.scanProgress * 100)}%` : 'Scan Library'}
			</button>
		</div>
	{:else}
		<div class="recent-section">
			<h2 class="recent-title">Recently Added</h2>
			<div class="recent-row">
				{#each recentlyAdded as track (track.id)}
					<button class="recent-card" onclick={() => playTrack(track)}>
						<div class="recent-art">
							{#if track.coverArt}
								<img src={track.coverArt} alt="" />
							{:else}
								🎵
							{/if}
						</div>
						<span class="recent-title-text">{track.title}</span>
						<span class="recent-artist">{track.artist}</span>
					</button>
				{/each}
			</div>
			<button class="browse-link" onclick={() => goto('/library')}>Browse full library →</button>
		</div>
	{/if}
</div>

<style>
	.home {
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}

	.home-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem 0.75rem;
		border-bottom: 1px solid var(--border-color);
	}

	.home-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	.count-badge {
		background: color-mix(in srgb, var(--accent) 20%, transparent);
		color: var(--accent);
		border-radius: 20px;
		padding: 0.1rem 0.6rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
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

	.scan-btn {
		margin-top: 0.5rem;
		padding: 0.55rem 1.1rem;
		border-radius: 8px;
		background-color: var(--accent);
		border: none;
		color: #fff;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
	}

	.scan-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.recent-section {
		padding: 1.25rem;
	}

	.recent-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text);
		margin: 0 0 0.75rem;
	}

	.recent-row {
		display: flex;
		gap: 0.85rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.recent-card {
		flex: 0 0 110px;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		text-align: left;
	}

	.recent-art {
		width: 110px;
		height: 110px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.75rem;
		background-color: var(--bg-surface);
		overflow: hidden;
	}

	.recent-art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.recent-title-text {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.recent-artist {
		font-size: 0.75rem;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.browse-link {
		margin-top: 1rem;
		background: none;
		border: none;
		color: var(--accent);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
	}
</style>
