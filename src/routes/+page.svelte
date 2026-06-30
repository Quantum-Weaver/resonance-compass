<script lang="ts">
	import GradientPulse from '$lib/components/GradientPulse.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';

	const trackCount = $derived(libraryStore.tracks.length);
</script>

<div class="home" style="padding-top: env(safe-area-inset-top, 0px);">
	<header class="home-header">
		<h1 class="home-title">Compass</h1>
		{#if trackCount > 0}
			<span class="count-badge">{trackCount}</span>
		{/if}
	</header>

	<div class="empty-state">
		<GradientPulse>
			<div class="home-sigil">🧭</div>
		</GradientPulse>
		<p class="empty-heading">Your library will appear here.</p>
		<p class="empty-sub">Scan your music folder to get started.</p>
	</div>
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
</style>
