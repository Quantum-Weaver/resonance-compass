<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { profileStore } from '$lib/stores/profile.svelte';
	import PlayerControls from '$lib/components/PlayerControls.svelte';
	import EmojiPalette from '$lib/components/EmojiPalette.svelte';

	let expanded = $state(false);
	let previousPath = $state(page.url.pathname);

	// Collapse on route change only — not on initial mount (previousPath === currentPath).
	$effect(() => {
		const currentPath = page.url.pathname;
		if (currentPath !== previousPath && expanded) {
			expanded = false;
		}
		previousPath = currentPath;
	});

	const track = $derived(playerStore.currentTrack);
	const isPlaying = $derived(playerStore.isPlaying);
	const trackLabel = $derived(track ? `${track.title} — ${track.artist}` : 'No music playing');
	const isFav = $derived(track ? playlistStore.isFavorite(track.id) : false);

	function toggleFav() {
		if (track) playlistStore.toggleFavorite(track.id);
	}

	function toggleExpanded() {
		expanded = !expanded;
	}

	function openNowPlaying() {
		if (track) goto('/nowplaying');
	}
</script>

<div class="mini-player" class:expanded>
	{#if expanded}
		<div class="mini-player__expanded">
			<button class="mp-collapse" onclick={toggleExpanded} aria-label="Collapse">⌄</button>
			<button class="mp-track" onclick={openNowPlaying} disabled={!track}>{trackLabel}</button>

			{#if track}
				<PlayerControls />
				<div class="mp-nav-row">
					<button class="mp-nav-btn" onclick={() => goto('/')} aria-label="Home">
						🏠
					</button>
					<button
						class="mp-nav-btn"
						onclick={toggleFav}
						aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
						aria-pressed={isFav}
					>
						{isFav ? '❤️' : '🤍'}
					</button>
					<button class="mp-nav-btn" onclick={() => goto('/visualizer')} aria-label="Visualizer">
						🌊
					</button>
					<button class="mp-nav-btn" onclick={() => goto('/settings#eq')} aria-label="Equalizer">
						🎛️
					</button>
					<button class="mp-nav-btn" onclick={() => goto('/timer')} aria-label="Timer">
						⏰
					</button>
					<button class="mp-nav-btn" onclick={() => goto('/sattva')} aria-label="Sattva">
						🧘
					</button>
					<button class="mp-nav-btn" onclick={() => goto('/focus')} aria-label="Focus">
						🎯
					</button>
					<button class="mp-nav-btn" onclick={() => goto('/history')} aria-label="History">
						📜
					</button>
					<button class="mp-nav-btn" onclick={() => goto('/fragments')} aria-label="Fragments">
						✂️
					</button>
				</div>
				<div class="mp-emoji-row">
					<EmojiPalette />
				</div>
			{:else}
				<div class="mp-stats">Your library will appear here</div>
			{/if}

			{#if profileStore.showInMiniPlayer && profileStore.profiles.length > 0}
				<div class="mp-profile-row" role="group" aria-label="Sensory profiles">
					{#each profileStore.profiles as prof (prof.id)}
						{@const isActiveProf = profileStore.activeProfileId === prof.id}
						<button
							class="mp-profile-chip"
							class:prof-active={isActiveProf}
							onclick={() => isActiveProf ? profileStore.deactivateProfile() : profileStore.activateProfile(prof.id)}
							aria-label="{isActiveProf ? 'Deactivate' : 'Activate'} {prof.name}"
							aria-pressed={isActiveProf}
							title={prof.name}
						>
							<span class="chip-emoji">{prof.emoji}</span>
							<span class="chip-name">{prof.name}</span>
						</button>
					{/each}
					<button class="mp-profile-chip manage" onclick={() => goto('/profiles')} aria-label="Manage profiles">⚙</button>
				</div>
			{/if}
		</div>
	{:else}
		<div class="mini-player__minimized">
			<button class="mp-track-btn" onclick={openNowPlaying} disabled={!track}>
				{trackLabel}
			</button>
			<button
				class="mp-play-pause"
				onclick={() => playerStore.togglePlay()}
				aria-label={isPlaying ? 'Pause' : 'Play'}
				disabled={!track}
			>
				{isPlaying ? '⏸' : '▶'}
			</button>
			<button class="mp-expand" onclick={toggleExpanded} aria-label="Expand" disabled={!track}>⌃</button>
		</div>
	{/if}
</div>

<style>
	.mini-player {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 110;
		background-color: var(--bg-surface);
		border-top: 1px solid var(--border-color);
		padding-bottom: env(safe-area-inset-bottom, 0px);
		transition: background-color 0.2s ease;
	}

	/* Minimized */
	.mini-player__minimized {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		height: 48px;
		padding: 0 1rem;
	}

	.mp-track-btn {
		flex: 1;
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mp-track-btn:hover:not(:disabled) {
		color: var(--text);
	}

	.mp-expand {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.25rem 0.4rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.mp-play-pause {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: var(--accent);
		color: #fff;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.mp-play-pause:disabled,
	.mp-expand:disabled,
	.mp-track-btn:disabled,
	.mp-track:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Expanded */
	.mini-player__expanded {
		padding: 0.75rem 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		position: relative;
	}

	.mp-collapse {
		position: absolute;
		top: 0.25rem;
		right: 0.75rem;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0.25rem 0.5rem;
		line-height: 1;
	}

	.mp-track {
		background: none;
		border: none;
		font-size: 1rem;
		color: var(--text);
		font-weight: 500;
		padding: 0 2rem 0 0;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mp-track:hover:not(:disabled) {
		color: var(--accent);
	}

	.mp-stats {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.mp-nav-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem 1rem;
	}

	.mp-emoji-row {
		display: flex;
		justify-content: center;
		width: 100%;
		/* Keeps the strip clear of the fixed hamburger (bottom-left, z-index 120)
		   even though it's visually below this panel's own stacking context. */
		max-width: calc(100% - 3.5rem);
		margin: 0 auto;
	}

	.mp-nav-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.25rem 0.5rem;
		line-height: 1;
		min-width: 44px;
		min-height: 44px;
	}

	/* Profile quick-switch */
	.mp-profile-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.4rem 0.75rem 0.55rem;
	}

	.mp-profile-chip {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.7rem;
		min-height: 36px;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 18px;
		color: var(--text-secondary);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.15s, background 0.15s;
		max-width: 40vw;
	}
	.mp-profile-chip:hover { border-color: var(--accent); }
	.mp-profile-chip.prof-active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 20%, transparent);
		color: var(--text);
	}
	.mp-profile-chip.manage { padding: 0.4rem 0.55rem; }

	.chip-emoji { line-height: 1; }

	.chip-name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (prefers-reduced-motion: reduce) {
		.mini-player {
			transition: none;
		}
	}
</style>
