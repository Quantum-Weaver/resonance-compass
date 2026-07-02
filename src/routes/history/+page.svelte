<script lang="ts">
	import { playerStore, type HistoryEntry } from '$lib/stores/player.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { moodStore } from '$lib/stores/mood.svelte';
	import { onMount } from 'svelte';

	const history = $derived(playerStore.history);

	let showClearConfirm = $state(false);

	onMount(() => {
		moodStore.loadRecentMoods(100);
	});

	const moodByTrack = $derived((() => {
		const map = new Map<string, string[]>();
		for (const event of moodStore.recentMoods) {
			const cur = map.get(event.trackId) ?? [];
			if (!cur.includes(event.emoji) && cur.length < 3) {
				map.set(event.trackId, [...cur, event.emoji]);
			}
		}
		return map;
	})());

	function getGroupLabel(timestamp: number): string {
		const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
		const diff = Date.now() - timestamp;
		if (timestamp >= todayStart) return 'Today';
		if (timestamp >= todayStart - 86400000) return 'Yesterday';
		if (diff < 7 * 86400000) return 'This Week';
		return 'Earlier';
	}

	const grouped = $derived((() => {
		const groups: { label: string; entries: HistoryEntry[] }[] = [];
		for (const entry of history) {
			const label = getGroupLabel(entry.timestamp);
			const last = groups[groups.length - 1];
			if (last && last.label === label) {
				last.entries.push(entry);
			} else {
				groups.push({ label, entries: [entry] });
			}
		}
		return groups;
	})());

	function formatTime(timestamp: number): string {
		const diffMs = Date.now() - timestamp;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHrs = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHrs < 4) return `${diffHrs}h ago`;
		const d = new Date(timestamp);
		if (diffDays < 2) return d.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' });
		if (diffDays < 7) return d.toLocaleDateString('default', { weekday: 'long' });
		return d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
	}

	function formatDuration(seconds: number): string {
		if (!seconds || seconds <= 0) return '--:--';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function play(entry: HistoryEntry) {
		const track = libraryStore.getTrackById(entry.trackId);
		if (track) playerStore.setQueue([track], 0);
	}

	function confirmClear() {
		playerStore.clearHistory();
		showClearConfirm = false;
	}
</script>

<div class="history-page">
	<div class="page-header">
		<div class="header-left">
			<h1>Listening History</h1>
			{#if history.length > 0}
				<span class="count">{history.length} plays</span>
			{/if}
		</div>
		{#if history.length > 0 && !showClearConfirm}
			<button class="clear-btn" onclick={() => (showClearConfirm = true)}>Clear</button>
		{/if}
		{#if showClearConfirm}
			<div class="confirm-row">
				<span class="confirm-label">Clear all history?</span>
				<button class="confirm-yes" onclick={confirmClear}>Clear</button>
				<button class="confirm-no" onclick={() => (showClearConfirm = false)}>Cancel</button>
			</div>
		{/if}
	</div>

	{#if history.length === 0}
		<div class="empty-state">
			<span class="empty-icon">🕐</span>
			<p class="empty-title">No listening history yet</p>
			<p class="empty-sub">Start playing music and it will appear here.</p>
		</div>
	{:else}
		<div class="history-list">
			{#each grouped as group (group.label)}
				<div class="group">
					<h2 class="group-label">{group.label}</h2>
					{#each group.entries as entry (entry.id)}
						{@const inLibrary = !!libraryStore.getTrackById(entry.trackId)}
						{@const isFav = playlistStore.isFavorite(entry.trackId)}
						{@const moods = moodByTrack.get(entry.trackId) ?? []}
						<button
							class="hist-row"
							onclick={() => play(entry)}
							aria-label="Play {entry.title}"
							disabled={!inLibrary}
						>
							<div class="hist-art">
								{#if entry.coverArt}
									<img src={entry.coverArt} alt="" class="art-img" />
								{:else}
									<span class="art-placeholder">💿</span>
								{/if}
							</div>

							<div class="hist-info">
								<span class="hist-title">{entry.title}</span>
								<span class="hist-artist">{entry.artist}</span>
							</div>

							<div class="hist-meta">
								<span class="hist-time">{formatTime(entry.timestamp)}</span>
								<div class="hist-bottom">
									{#if moods.length > 0}
										<span class="hist-moods">{moods.join('')}</span>
									{/if}
									<span class="hist-dur">{formatDuration(entry.duration)}</span>
									{#if isFav}
										<span class="hist-fav" aria-label="Liked">❤️</span>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.history-page {
		display: flex;
		flex-direction: column;
		color: var(--text);
		min-height: 100%;
	}

	/* ── Header ── */
	.page-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem 1.5rem 0.75rem;
		border-bottom: 1px solid var(--border-color);
	}

	.header-left {
		flex: 1;
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		min-width: 0;
	}

	h1 {
		font-size: 1.35rem;
		font-weight: 700;
		margin: 0;
	}

	.count {
		font-size: 0.82rem;
		color: var(--text-muted);
		font-weight: 500;
		white-space: nowrap;
	}

	.clear-btn {
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.5rem 0.85rem;
		min-height: 44px;
		cursor: pointer;
		font-family: inherit;
		flex-shrink: 0;
		transition: border-color 0.15s, color 0.15s;
	}
	.clear-btn:hover { border-color: #e17055; color: #e17055; }

	.confirm-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.confirm-label {
		font-size: 0.82rem;
		color: var(--text-secondary);
	}

	.confirm-yes {
		padding: 0.5rem 0.85rem;
		min-height: 44px;
		background: #e17055;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
	}

	.confirm-no {
		padding: 0.5rem 0.85rem;
		min-height: 44px;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
	}

	/* ── Empty state ── */
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon { font-size: 2.5rem; opacity: 0.5; }
	.empty-title { font-size: 1rem; font-weight: 600; margin: 0; }
	.empty-sub { font-size: 0.85rem; color: var(--text-muted); margin: 0; }

	/* ── Groups ── */
	.group-label {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
		padding: 0.85rem 1.5rem 0.3rem;
		margin: 0;
		position: sticky;
		top: 0;
		background: var(--bg);
		z-index: 1;
		border-bottom: 1px solid var(--border-color);
	}

	/* ── Rows ── */
	.hist-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 1.5rem;
		width: 100%;
		min-height: 44px;
		background: none;
		border: none;
		border-bottom: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);
		cursor: pointer;
		font: inherit;
		color: inherit;
		text-align: left;
		transition: background-color 0.12s;
	}

	.hist-row:hover { background-color: color-mix(in srgb, var(--accent) 7%, transparent); }
	.hist-row:disabled { cursor: default; opacity: 0.45; }
	.hist-row:disabled:hover { background-color: transparent; }

	.hist-art {
		width: 40px;
		height: 40px;
		border-radius: 6px;
		overflow: hidden;
		flex-shrink: 0;
		background-color: color-mix(in srgb, var(--accent) 18%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
	}

	.art-img { width: 100%; height: 100%; object-fit: cover; }
	.art-placeholder { opacity: 0.7; }

	.hist-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
		min-width: 0;
		overflow: hidden;
	}

	.hist-title {
		font-size: 0.9rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hist-artist {
		font-size: 0.78rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hist-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.22rem;
		flex-shrink: 0;
		min-width: 72px;
	}

	.hist-time {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.hist-bottom {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.hist-moods { font-size: 0.8rem; line-height: 1; }

	.hist-dur {
		font-size: 0.72rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.hist-fav { font-size: 0.75rem; line-height: 1; }
</style>
