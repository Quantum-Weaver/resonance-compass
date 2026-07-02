<script lang="ts">
	import { onMount } from 'svelte';
	import { fragmentStore, type Fragment } from '$lib/stores/fragment.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { EMOJI_DEFS } from '$lib/data/emojis';
	import type { Track } from '$lib/types/types';

	const fragments = $derived(fragmentStore.fragments);

	const QUICK_EMOJIS = EMOJI_DEFS.slice(0, 12).map((e) => e.emoji);

	onMount(() => {
		fragmentStore.loadFragments();
	});

	// ── Per-row menu state ─────────────────────────────────────────────────────

	let menuOpenId = $state<string | null>(null);
	let confirmDeleteId = $state<string | null>(null);
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let emojiPickerId = $state<string | null>(null);
	let addToPLId = $state<string | null>(null);

	function toggleMenu(id: string) {
		menuOpenId = menuOpenId === id ? null : id;
		confirmDeleteId = null;
		emojiPickerId = null;
		addToPLId = null;
	}

	function closeAll() {
		menuOpenId = null;
		confirmDeleteId = null;
		renamingId = null;
		emojiPickerId = null;
		addToPLId = null;
	}

	function startRename(frag: Fragment) {
		renamingId = frag.id;
		renameValue = frag.name;
		menuOpenId = null;
	}

	function commitRename(id: string) {
		if (renameValue.trim()) fragmentStore.renameFragment(id, renameValue.trim());
		renamingId = null;
	}

	// ── Play a fragment ────────────────────────────────────────────────────────

	function fragmentToTrack(frag: Fragment): Track {
		const src = libraryStore.getTrackById(frag.sourceTrackId);
		return {
			id: frag.id,
			uri: frag.filePath,
			filename: frag.name,
			title: frag.name,
			artist: src?.artist ?? 'Unknown',
			album: src?.album ?? 'Fragment',
			duration: frag.duration,
			dateAdded: frag.createdAt,
			lastScanned: frag.createdAt,
		};
	}

	function playFragment(frag: Fragment) {
		closeAll();
		playerStore.setQueue([fragmentToTrack(frag)], 0);
	}

	// ── Helpers ────────────────────────────────────────────────────────────────

	function fmtDur(secs: number): string {
		const m = Math.floor(secs / 60);
		const s = Math.floor(secs % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function relativeDate(ts: number): string {
		const diff = Date.now() - ts;
		const mins = Math.floor(diff / 60_000);
		const hours = Math.floor(diff / 3_600_000);
		const days = Math.floor(diff / 86_400_000);
		if (mins < 2) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return new Date(ts).toLocaleDateString('default', { month: 'short', day: 'numeric' });
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fragments-page"
	role="none"
	onclick={(e) => { if ((e.target as Element).closest('.frag-row, .frag-menu') === null) closeAll(); }}
>
	<header class="frag-page-header">
		<h1 class="frag-page-title">✂️ Fragments</h1>
		{#if fragments.length > 0}
			<span class="frag-count">{fragments.length}</span>
		{/if}
		<span class="header-spacer"></span>
		<a class="studio-link" href="/fragments/studio">🎚 Studio</a>
	</header>

	{#if fragments.length === 0}
		<div class="empty-state">
			<span class="empty-icon">✂️</span>
			<p class="empty-title">No fragments yet.</p>
			<p class="empty-hint">Play a track and tap ✂️ to capture a moment.</p>
			<p class="empty-quote">"Every fragment contains the whole."</p>
		</div>
	{:else}
		<ul class="frag-list">
			{#each fragments as frag (frag.id)}
				{@const src = libraryStore.getTrackById(frag.sourceTrackId)}
				<li class="frag-row" class:menu-open={menuOpenId === frag.id}>
					<button class="frag-play-area" onclick={() => playFragment(frag)} aria-label="Play {frag.name}">
						<div class="frag-info">
							{#if renamingId === frag.id}
								<input
									type="text"
									class="rename-input"
									bind:value={renameValue}
									onblur={() => commitRename(frag.id)}
									onkeydown={(e) => { if (e.key === 'Enter') commitRename(frag.id); if (e.key === 'Escape') renamingId = null; }}
									onclick={(e) => e.stopPropagation()}
									aria-label="Rename fragment"
								/>
							{:else}
								<span class="frag-name">
									{#if frag.emoji}<span class="frag-emoji">{frag.emoji}</span>{/if}
									{frag.name}
									{#if frag.favorite}<span class="frag-heart" aria-label="Favorited">❤️</span>{/if}
								</span>
							{/if}

							<span class="frag-source">
								{src ? `${src.title} — ${src.artist}` : 'Source removed from library'}
							</span>
						</div>

						<div class="frag-meta">
							<span class="frag-dur">{fmtDur(frag.duration)}</span>
							<span class="frag-date">{relativeDate(frag.createdAt)}</span>
						</div>
					</button>

					<button
						class="frag-menu-btn"
						onclick={(e) => { e.stopPropagation(); toggleMenu(frag.id); }}
						aria-label="Fragment options"
						aria-expanded={menuOpenId === frag.id}
					>⋮</button>

					{#if menuOpenId === frag.id}
						<div class="frag-menu" role="menu" tabindex="-1" onclick={(e) => e.stopPropagation()}>
							<button class="menu-item" onclick={() => startRename(frag)} role="menuitem">✏️ Rename</button>

							<button
								class="menu-item"
								onclick={() => { emojiPickerId = emojiPickerId === frag.id ? null : frag.id; addToPLId = null; }}
								role="menuitem"
							>😊 Tag Emoji</button>

							{#if emojiPickerId === frag.id}
								<div class="emoji-picker" role="group" aria-label="Tag emoji">
									{#each QUICK_EMOJIS as emoji}
										<button
											class="ep-btn"
											class:ep-sel={frag.emoji === emoji}
											onclick={() => { fragmentStore.setEmoji(frag.id, frag.emoji === emoji ? null : emoji); emojiPickerId = null; menuOpenId = null; }}
											aria-label={emoji}
										>{emoji}</button>
									{/each}
								</div>
							{/if}

							<button class="menu-item" onclick={() => { fragmentStore.toggleFavorite(frag.id); menuOpenId = null; }} role="menuitem">
								{frag.favorite ? '💔 Unfavorite' : '❤️ Favorite'}
							</button>

							<button
								class="menu-item"
								onclick={() => { addToPLId = addToPLId === frag.id ? null : frag.id; emojiPickerId = null; }}
								role="menuitem"
							>📋 Add to Playlist</button>

							{#if addToPLId === frag.id}
								<div class="pl-picker" role="group" aria-label="Select playlist">
									{#each playlistStore.playlists as pl (pl.id)}
										<button
											class="pl-btn"
											onclick={() => { playlistStore.addTrack(pl.id, frag.id); addToPLId = null; menuOpenId = null; }}
										>{pl.name}</button>
									{/each}
								</div>
							{/if}

							{#if confirmDeleteId !== frag.id}
								<button class="menu-item menu-item-danger" onclick={() => (confirmDeleteId = frag.id)} role="menuitem">🗑 Delete</button>
							{:else}
								<button class="menu-item menu-item-confirm" onclick={() => { fragmentStore.deleteFragment(frag.id); menuOpenId = null; confirmDeleteId = null; }} role="menuitem">Confirm Delete</button>
								<button class="menu-item" onclick={() => (confirmDeleteId = null)} role="menuitem">Cancel</button>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.fragments-page {
		padding: 1.5rem;
		max-width: 700px;
		margin: 0 auto;
		color: var(--text);
	}

	.frag-page-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1.5rem;
	}

	.frag-page-title { font-size: 1.5rem; font-weight: 700; margin: 0; }

	.frag-count {
		font-size: 0.8rem;
		font-weight: 700;
		padding: 0.15rem 0.5rem;
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		color: var(--accent);
		border-radius: 20px;
	}

	.header-spacer { flex: 1; }

	.studio-link {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
		text-decoration: none;
		border: 1px solid var(--accent);
		border-radius: 8px;
		padding: 0.5rem 0.8rem;
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	/* ── Empty state ── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon { font-size: 3rem; line-height: 1; }
	.empty-title { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0 0; }
	.empty-hint { font-size: 0.88rem; color: var(--text-secondary); margin: 0; }
	.empty-quote { font-size: 0.8rem; color: var(--text-secondary); opacity: 0.55; font-style: italic; margin: 0.75rem 0 0; }

	/* ── List ── */
	.frag-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.frag-row {
		position: relative;
		display: flex;
		align-items: stretch;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		overflow: visible;
		transition: border-color 0.15s;
	}

	.frag-row:hover { border-color: color-mix(in srgb, var(--accent) 40%, var(--border-color)); }
	.frag-row.menu-open { border-color: var(--accent); }

	.frag-play-area {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0.75rem 0.75rem 1rem;
		min-height: 44px;
		background: none;
		border: none;
		color: var(--text);
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		gap: 1rem;
		min-width: 0;
	}

	.frag-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
	.frag-name { font-size: 0.92rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 0.35rem; }
	.frag-emoji { flex-shrink: 0; }
	.frag-heart { flex-shrink: 0; font-size: 0.8rem; }
	.frag-source { font-size: 0.77rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

	.frag-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.15rem; flex-shrink: 0; }
	.frag-dur { font-size: 0.8rem; font-weight: 600; color: var(--accent); }
	.frag-date { font-size: 0.72rem; color: var(--text-secondary); }

	.frag-menu-btn {
		padding: 0 1rem;
		min-width: 44px;
		background: none;
		border: none;
		border-left: 1px solid var(--border-color);
		color: var(--text-secondary);
		font-size: 1.2rem;
		cursor: pointer;
		flex-shrink: 0;
		border-radius: 0 12px 12px 0;
		transition: background 0.15s, color 0.15s;
	}
	.frag-menu-btn:hover { background: rgba(255, 255, 255, 0.05); color: var(--text); }

	/* ── Menu ── */
	.frag-menu {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		z-index: 50;
		min-width: 200px;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 0.4rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.menu-item {
		display: block;
		width: 100%;
		padding: 0.6rem 0.75rem;
		min-height: 44px;
		background: none;
		border: none;
		border-radius: 8px;
		color: var(--text);
		font-size: 0.88rem;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}

	.menu-item:hover { background: rgba(255, 255, 255, 0.07); }
	.menu-item-danger { color: #e17055; }
	.menu-item-confirm { background: rgba(225, 112, 85, 0.12); color: #e17055; font-weight: 700; }
	.menu-item-confirm:hover { background: rgba(225, 112, 85, 0.2); }

	.emoji-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.35rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 8px;
		margin: 0.1rem 0;
	}

	.ep-btn {
		width: 38px;
		height: 38px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: 1px solid transparent;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.1s;
	}
	.ep-btn:hover { background: rgba(255, 255, 255, 0.08); }
	.ep-btn.ep-sel { border-color: var(--accent); background: rgba(255, 255, 255, 0.1); }

	.pl-picker {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.25rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 8px;
		margin: 0.1rem 0;
	}

	.pl-btn {
		padding: 0.5rem 0.6rem;
		min-height: 40px;
		background: none;
		border: none;
		border-radius: 6px;
		color: var(--text-secondary);
		font-size: 0.82rem;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s, color 0.1s;
	}
	.pl-btn:hover { background: rgba(255, 255, 255, 0.07); color: var(--text); }

	.rename-input {
		width: 100%;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid var(--accent);
		border-radius: 6px;
		color: var(--text);
		font-size: 0.88rem;
		font-family: inherit;
		padding: 0.2rem 0.4rem;
		box-sizing: border-box;
	}
</style>
