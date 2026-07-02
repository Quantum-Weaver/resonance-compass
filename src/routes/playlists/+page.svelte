<script lang="ts">
	import { goto } from '$app/navigation';
	import { playlistStore } from '$lib/stores/playlist.svelte';

	const sortedPlaylists = $derived(
		[...playlistStore.playlists].sort((a, b) => {
			if (a.id === 'favorites') return -1;
			if (b.id === 'favorites') return 1;
			return 0;
		})
	);

	let showCreate = $state(false);
	let newName = $state('');

	function handleCreate() {
		if (newName.trim()) {
			const id = playlistStore.createPlaylist(newName.trim());
			newName = '';
			showCreate = false;
			goto(`/playlists/${id}`);
		}
	}

	function handleDelete(id: string, name: string) {
		if (confirm(`Delete "${name}"?`)) {
			playlistStore.deletePlaylist(id);
		}
	}
</script>

<div class="playlists-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<header class="pl-header">
		<h1 class="pl-title">Playlists</h1>
		<button class="add-btn" onclick={() => (showCreate = !showCreate)}>+ New</button>
	</header>

	{#if showCreate}
		<div class="create-row">
			<input
				type="text"
				class="create-input"
				placeholder="Playlist name..."
				bind:value={newName}
				onkeydown={(e) => e.key === 'Enter' && handleCreate()}
			/>
			<button class="create-btn" onclick={handleCreate}>Create</button>
		</div>
	{/if}

	{#if sortedPlaylists.length === 0}
		<div class="empty-state">
			<p class="empty-icon">📋</p>
			<p class="empty-heading">No playlists yet</p>
		</div>
	{:else}
		<div class="playlist-list">
			{#each sortedPlaylists as playlist (playlist.id)}
				<div class="playlist-item">
					<button class="playlist-click" onclick={() => goto(`/playlists/${playlist.id}`)}>
						<div class="playlist-icon" class:fav-icon={playlist.id === 'favorites'}>
							<span>{playlist.id === 'favorites' ? '❤️' : '🎵'}</span>
						</div>
						<div class="playlist-info">
							<span class="playlist-name">{playlist.name}</span>
							<span class="playlist-meta">
								{playlist.trackIds.length} track{playlist.trackIds.length !== 1 ? 's' : ''}
							</span>
						</div>
						<span class="chevron">›</span>
					</button>
					{#if playlist.id !== 'favorites'}
						<button class="delete-btn" onclick={() => handleDelete(playlist.id, playlist.name)} aria-label="Delete playlist">✕</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.playlists-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		padding: 1rem 1.25rem;
	}

	.pl-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.pl-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	.add-btn {
		background-color: var(--accent);
		color: #fff;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}

	.create-row {
		display: flex;
		gap: 0.5rem;
		padding: 0.6rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		background-color: var(--bg-surface);
	}

	.create-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		border: 1px solid var(--border-color);
		font-size: 0.95rem;
		outline: none;
		background-color: var(--bg);
		color: var(--text);
	}

	.create-input:focus {
		border-color: var(--accent);
	}

	.create-btn {
		color: #fff;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		background-color: var(--accent);
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-align: center;
		padding: 3rem 2rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin: 0;
	}

	.empty-heading {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text);
		margin: 0;
	}

	.playlist-list {
		flex: 1;
	}

	.playlist-item {
		display: flex;
		align-items: center;
		border-bottom: 1px solid var(--border-color);
	}

	.playlist-click {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		padding: 0.75rem 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		color: inherit;
		font: inherit;
	}

	.playlist-click:hover {
		background-color: var(--bg-surface);
	}

	.playlist-icon {
		width: 44px;
		height: 44px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		flex-shrink: 0;
		background-color: var(--accent);
	}

	.playlist-icon.fav-icon {
		background: linear-gradient(135deg, #e17055, #d63031);
	}

	.playlist-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.playlist-name {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text);
	}

	.playlist-meta {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.chevron {
		font-size: 1.4rem;
		padding-right: 0.5rem;
		color: var(--text-muted);
	}

	.delete-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.95rem;
		padding: 0.5rem;
		flex-shrink: 0;
	}

	.delete-btn:hover {
		color: var(--heart, #e74c3c);
	}
</style>
