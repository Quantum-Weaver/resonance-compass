<script lang="ts">
	import { page } from '$app/state';
	import { focusStore } from '$lib/stores/focus.svelte';
	import SleepTimer from './SleepTimer.svelte';
	import FocusSession from './FocusSession.svelte';

	// The merged time-room — KP's ⚛ ruling (THE-UX-WALK, the outline):
	// "focus and timer can be merged without losing features." Nothing was
	// lost: each room stands whole as a colocated component; this shell only
	// wears the tabs. The old /focus address leads here with ?tab=focus, and
	// an active focus session opens its own tab first.
	let tab = $state<'sleep' | 'focus'>(
		page.url.searchParams.get('tab') === 'focus' || focusStore.activeSession ? 'focus' : 'sleep'
	);
</script>

<div class="time-room" style="padding-top: env(safe-area-inset-top, 0px);">
	<div class="room-tabs" role="tablist" aria-label="Timer and Focus">
		<button
			class="room-tab"
			class:active={tab === 'sleep'}
			role="tab"
			aria-selected={tab === 'sleep'}
			onclick={() => (tab = 'sleep')}
		>
			Sleep timer
		</button>
		<button
			class="room-tab"
			class:active={tab === 'focus'}
			role="tab"
			aria-selected={tab === 'focus'}
			onclick={() => (tab = 'focus')}
		>
			Focus
		</button>
	</div>

	{#if tab === 'sleep'}
		<SleepTimer />
	{:else}
		<FocusSession />
	{/if}
</div>

<style>
	.time-room {
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}

	.room-tabs {
		display: flex;
		padding: 0.25rem 1.25rem 0;
		border-bottom: 1px solid var(--border-color);
	}

	.room-tab {
		padding: 0.6rem 1rem;
		min-height: 44px;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	.room-tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
</style>
