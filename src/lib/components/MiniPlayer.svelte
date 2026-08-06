<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { playerStore } from '$lib/stores/player.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
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

	// Broadcast the panel state so the Sidebar can close itself when it opens.
	$effect(() => {
		uiStore.setMiniPlayerExpanded(expanded);
	});

	const track = $derived(playerStore.currentTrack);
	const isPlaying = $derived(playerStore.isPlaying);
	const volume = $derived(playerStore.volume);
	const playbackError = $derived(playerStore.playbackError);
	const trackLabel = $derived(track ? `${track.title} — ${track.artist}` : 'No music playing');

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

			{#if playbackError}
				<p class="mp-error" role="alert">Playback failed: {playbackError}</p>
			{/if}

			{#if track}
				<!-- THE SHED (U7+U8, the ruled outline): seek · volume · the
				     mood palette · ONE link (the track line above, to Now
				     Playing). The nav row and profile chips left for their
				     hats; the panel stopped being a second sidebar. -->
				<PlayerControls />
				<div class="mp-emoji-row">
					<EmojiPalette />
				</div>
			{:else}
				<div class="mp-stats">Your library will appear here</div>
			{/if}
		</div>
	{:else}
		<div class="mini-player__minimized">
			<button class="mp-track-btn" onclick={openNowPlaying} disabled={!track}>
				{#if playbackError}<span class="mp-error-dot" title={playbackError} aria-label="Playback error">⚠</span>{/if}
				{trackLabel}
			</button>
			<!-- The five transports (U8): play/pause · previous · next · mute,
			     right here where a hand reaches a hundred times a day. -->
			<button class="mp-skip" onclick={() => playerStore.previous()} aria-label="Previous track" disabled={!track}>⏮</button>
			<button
				class="mp-play-pause"
				onclick={() => playerStore.togglePlay()}
				aria-label={isPlaying ? 'Pause' : 'Play'}
				disabled={!track}
			>
				{isPlaying ? '⏸' : '▶'}
			</button>
			<button class="mp-skip" onclick={() => playerStore.next()} aria-label="Next track" disabled={!track}>⏭</button>
			<button
				class="mp-mute"
				onclick={() => playerStore.toggleMute()}
				aria-label={volume === 0 ? 'Unmute' : 'Mute'}
				aria-pressed={volume === 0}
				disabled={!track}
			>
				{volume === 0 ? '🔇' : '🔊'}
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
		/* Own compositor layer: large relayouts elsewhere (e.g. the settings EQ
		   section expanding) could leave a stale painted copy of this fixed bar
		   in the Android WebView — the "ghost MiniPlayer" artifact.
		   translateZ alone proved insufficient on the S25 WebView (KP sighted
		   the ghost as an empty player-sized box, 2026-07-19): promote harder
		   and isolate — paired with per-section paint containment in Settings. */
		transform: translateZ(0);
		will-change: transform;
		backface-visibility: hidden;
		isolation: isolate;
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

	.mp-mute {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.95rem;
		padding: 0.25rem 0.3rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.mp-mute:disabled {
		opacity: 0.4;
		cursor: not-allowed;
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

	.mp-error {
		font-size: 0.75rem;
		color: color-mix(in srgb, red 70%, var(--text));
		margin: 0;
		overflow-wrap: anywhere;
	}

	.mp-error-dot {
		color: color-mix(in srgb, red 70%, var(--text));
		margin-right: 0.3rem;
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

	/* The bar's skip buttons — 44px floors per U8's ruling. */
	.mp-skip {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		flex-shrink: 0;
		min-width: 44px;
		min-height: 44px;
	}

	.mp-skip:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		.mini-player {
			transition: none;
		}
	}
</style>
