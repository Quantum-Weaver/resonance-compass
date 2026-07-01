<script lang="ts">
	import { moodStore } from '$lib/stores/mood.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { EMOJI_DEFS } from '$lib/data/emojis';

	let expanded = $state(false);
	let confirmedEmoji = $state<string | null>(null);

	const track = $derived(playerStore.currentTrack);

	function handleSelect(emoji: string) {
		if (!track) return;
		moodStore.addMoodEvent(track.id, emoji);
		confirmedEmoji = emoji;
		setTimeout(() => {
			confirmedEmoji = null;
		}, 800);
	}
</script>

<div class="palette-wrapper">
	<button
		class="toggle-btn"
		onclick={() => (expanded = !expanded)}
		aria-label={expanded ? 'Hide mood palette' : 'Show mood palette'}
		aria-expanded={expanded}
		disabled={!track}
	>
		<span class="toggle-icon">{expanded ? '▲' : '🏷️'}</span>
		<span class="toggle-label">{expanded ? 'Hide' : 'Mood'}</span>
	</button>

	{#if expanded}
		<div class="emoji-strip">
			{#each EMOJI_DEFS as def (def.emoji)}
				<button
					class="emoji-btn"
					class:confirmed={confirmedEmoji === def.emoji}
					style="--eb-color: {def.color};"
					onclick={() => handleSelect(def.emoji)}
					title={def.label}
					aria-label="Tag mood: {def.label}"
				>
					<span class="emoji-glyph">{def.emoji}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.palette-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 16px;
		padding: 0.3rem 0.85rem;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 500;
	}

	.toggle-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.toggle-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.toggle-icon {
		font-size: 0.85rem;
	}

	.emoji-strip {
		width: 100%;
		display: flex;
		flex-wrap: nowrap;
		gap: 0.4rem;
		overflow-x: auto;
		padding: 0.6rem 0.5rem;
		border-radius: 12px;
		background-color: var(--bg-surface);
		border: 1px solid var(--border-color);
	}

	.emoji-btn {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 2px solid transparent;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		padding: 0;
		line-height: 1;
		transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
	}

	.emoji-btn:hover {
		border-color: var(--eb-color);
		background-color: color-mix(in srgb, var(--eb-color) 20%, transparent);
		transform: scale(1.12);
	}

	.emoji-btn.confirmed {
		border-color: var(--eb-color);
		background-color: color-mix(in srgb, var(--eb-color) 30%, transparent);
		transform: scale(1.2);
		box-shadow: 0 0 14px color-mix(in srgb, var(--eb-color) 55%, transparent);
	}

	.emoji-glyph {
		line-height: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.emoji-btn {
			transition: none;
		}
	}
</style>
