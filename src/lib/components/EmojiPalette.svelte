<script lang="ts">
	import { moodStore } from '$lib/stores/mood.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { EMOJI_DEFS } from '$lib/data/emojis';

	let expanded = $state(false);
	let confirmedEmoji = $state<string | null>(null);

	const confirmedPersonalDef = $derived(
		confirmedEmoji ? moodStore.getPersonalDefinition(confirmedEmoji) : ''
	);

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
		{#if confirmedEmoji && confirmedPersonalDef}
			<p class="personal-hint" aria-live="polite">{confirmedPersonalDef}</p>
		{/if}
	{/if}
</div>

<style>
	.palette-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-2);
		/* Fill the mount row and allow shrinking below the strip's natural
		   width — without min-width: 0 a flex parent lets the strip's
		   fit-content width win, so it overflows both edges and max-width
		   below never engages the scroll. */
		width: 100%;
		min-width: 0;
		max-width: 100%;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
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
		width: fit-content;
		max-width: 100%;
		margin: 0 auto;
		display: flex;
		flex-wrap: nowrap;
		gap: 0.4rem;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		padding: 0.6rem 0.5rem;
		border-radius: var(--radius-lg);
		background-color: var(--bg-surface);
		border: 1px solid var(--border-color);
	}

	.emoji-btn {
		flex-shrink: 0;
		width: var(--spacing-10);
		height: var(--spacing-10);
		border-radius: var(--radius-full);
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

	.personal-hint {
		font-size: 0.78rem;
		color: var(--text-secondary);
		text-align: center;
		margin: 0;
		max-width: 200px;
		line-height: 1.4;
		font-style: italic;
	}

	@media (prefers-reduced-motion: reduce) {
		.emoji-btn {
			transition: none;
		}
	}
</style>
