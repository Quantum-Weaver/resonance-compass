<script lang="ts">
	import { libraryStore } from '$lib/stores/library.svelte';

	const open = $derived(libraryStore.permissionNeeded);
</script>

<!-- Pre-scan permission explainer (Android). Mounted once in +layout so every
     scan entry point (onboarding, library, home) gets the same gate. -->
{#if open}
	<div
		class="perm-backdrop"
		role="presentation"
		onclick={() => libraryStore.dismissPermissionPrompt()}
		onkeydown={(e) => { if (e.key === 'Escape') libraryStore.dismissPermissionPrompt(); }}
	></div>
	<div class="perm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="perm-title" aria-describedby="perm-body">
		<h2 id="perm-title" class="perm-title">Music Access Required</h2>
		<p id="perm-body" class="perm-body">
			Resonance Compass needs access to your music files to scan your library.
			Your files never leave your device.
		</p>
		<div class="perm-actions">
			<button class="perm-grant" onclick={() => libraryStore.grantPermissionAndScan()}>
				Grant Access
			</button>
			<button class="perm-skip" onclick={() => libraryStore.dismissPermissionPrompt()}>
				Skip
			</button>
		</div>
	</div>
{/if}

<style>
	/* Above MiniPlayer (110) and hamburger (120) */
	.perm-backdrop {
		position: fixed;
		inset: 0;
		z-index: 199;
		background: rgba(0, 0, 0, 0.55);
	}

	.perm-dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 200;
		width: min(420px, calc(100vw - 2.5rem));
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		padding: 1.5rem 1.25rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.perm-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
		text-align: center;
	}

	.perm-body {
		font-size: 0.9rem;
		color: var(--text-secondary);
		line-height: 1.55;
		margin: 0;
		text-align: center;
	}

	.perm-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.perm-grant {
		width: 100%;
		padding: 0.85rem;
		background: var(--accent);
		border: none;
		border-radius: 12px;
		color: #fff;
		font-size: 0.95rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: filter 0.15s;
	}

	.perm-grant:hover {
		filter: brightness(1.1);
	}

	.perm-skip {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.875rem;
		font-family: inherit;
		cursor: pointer;
		padding: 0.35rem 0.75rem;
	}

	.perm-skip:hover {
		color: var(--text-secondary);
	}
</style>
