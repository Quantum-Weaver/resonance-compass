<script lang="ts">
	import { goto } from '$app/navigation';
	import { echoStore } from '$lib/stores/echo.svelte';
	import { SENSES } from '$lib/data/senses';

	// --- Filter state ---
	let searchInput = $state('');
	let searchQuery = $state('');
	let activeSense = $state('');
	let activeEmoji = $state('');
	let sortOrder = $state<'newest' | 'oldest' | 'intensity'>('newest');
	let displayCount = $state(50);

	// Debounce: update searchQuery 150ms after last keystroke
	$effect(() => {
		const val = searchInput;
		const t = setTimeout(() => {
			searchQuery = val;
			displayCount = 50;
		}, 150);
		return () => clearTimeout(t);
	});

	function setSense(id: string) {
		activeSense = activeSense === id ? '' : id;
		displayCount = 50;
	}

	function setEmoji(emoji: string) {
		activeEmoji = activeEmoji === emoji ? '' : emoji;
		displayCount = 50;
	}

	function setSort(order: 'newest' | 'oldest' | 'intensity') {
		sortOrder = order;
		displayCount = 50;
	}

	function clearAll() {
		searchInput = '';
		searchQuery = '';
		activeSense = '';
		activeEmoji = '';
		sortOrder = 'newest';
		displayCount = 50;
	}

	// --- Derived ---

	// Top 8 most-used emojis across all echoes
	const topEmojis = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const echo of echoStore.echoes) {
			if (echo.emoji) counts[echo.emoji] = (counts[echo.emoji] || 0) + 1;
		}
		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 8)
			.map(([e]) => e);
	});

	// Combined filter + sort — all client-side over the in-memory echoes array
	const filteredEchoes = $derived.by(() => {
		let r = echoStore.echoes;

		if (activeSense) r = r.filter((e) => e.sense === activeSense);
		if (activeEmoji) r = r.filter((e) => e.emoji === activeEmoji);

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			r = r.filter(
				(e) =>
					e.name.toLowerCase().includes(q) ||
					(e.note?.toLowerCase().includes(q) ?? false)
			);
		}

		if (sortOrder === 'oldest') return [...r].sort((a, b) => a.timestamp - b.timestamp);
		if (sortOrder === 'intensity') return [...r].sort((a, b) => b.intensity - a.intensity);
		return r; // 'newest' — already DESC from the DB query
	});

	const visible = $derived(filteredEchoes.slice(0, displayCount));
	const hasMore = $derived(filteredEchoes.length > displayCount);
	const hasFilters = $derived(!!(activeSense || activeEmoji || searchQuery.trim()));

	// Human-readable description of active filters
	const filterLabel = $derived.by(() => {
		const parts: string[] = [];
		if (activeSense) {
			const s = SENSES.find((s) => s.id === activeSense);
			if (s) parts.push(`${s.emoji} ${s.name}`);
		}
		if (activeEmoji) parts.push(activeEmoji);
		if (searchQuery.trim()) parts.push(`"${searchQuery.trim()}"`);
		return parts.join(' · ');
	});

	// Empty-state emoji — reflects what's being filtered
	const emptyIcon = $derived(
		activeSense
			? (SENSES.find((s) => s.id === activeSense)?.emoji ?? '✨')
			: activeEmoji || '✨'
	);

	function getSense(senseId: string) {
		if (senseId === 'not_sure') return { name: 'Not Sure', emoji: '❓' };
		return SENSES.find((s) => s.id === senseId) ?? { name: senseId, emoji: '✨' };
	}

	// --- Quick Log ---
	let quickLogging = $state(false);
	let quickLogSuccess = $state(false);

	async function quickLog() {
		if (quickLogging) return;
		quickLogging = true;
		try {
			const emoji = echoStore.echoes[0]?.emoji || '😌';
			await echoStore.addEcho({
				name: 'Quick log',
				sense: 'other',
				subcategory: 'custom',
				emoji,
				intensity: 3,
				timestamp: Date.now()
			});
			quickLogSuccess = true;
			setTimeout(() => {
				quickLogSuccess = false;
				quickLogging = false;
			}, 1100);
		} catch {
			quickLogging = false;
		}
	}

	function relativeTime(timestamp: number): string {
		const diff = Date.now() - timestamp;
		if (diff < 60_000) return 'just now';
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
		if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
		const days = Math.floor(diff / 86_400_000);
		if (days === 1) return 'yesterday';
		if (days < 7) return new Date(timestamp).toLocaleDateString('en', { weekday: 'long' });
		return new Date(timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' });
	}
</script>

<div class="home" style="padding-top: env(safe-area-inset-top, 0px);">
	<header class="home-header">
		<h1 class="home-title">Echoes</h1>
		{#if echoStore.totalCount > 0}
			<span class="count-badge">{echoStore.totalCount}</span>
		{/if}
	</header>

	{#if echoStore.echoes.length > 0}
		<div class="browse">
			<!-- Search -->
			<div class="search-wrap">
				<span class="search-icon" aria-hidden="true">🔍</span>
				<input
					type="search"
					bind:value={searchInput}
					placeholder="Search echoes..."
					class="search-input"
					aria-label="Search echoes"
				/>
				{#if searchInput}
					<button
						class="search-clear"
						onclick={() => { searchInput = ''; }}
						aria-label="Clear search"
					>✕</button>
				{/if}
			</div>

			<!-- Sense chips -->
			<div class="chip-scroll" role="group" aria-label="Filter by sense">
				<button
					class="chip"
					class:active={!activeSense}
					onclick={() => { activeSense = ''; displayCount = 50; }}
				>All</button>
				{#each SENSES as sense}
					<button
						class="chip"
						class:active={activeSense === sense.id}
						onclick={() => setSense(sense.id)}
					>{sense.emoji} {sense.name}</button>
				{/each}
			</div>

			<!-- Emoji chips (only when echoes have emojis) -->
			{#if topEmojis.length > 0}
				<div class="chip-scroll" role="group" aria-label="Filter by feeling">
					<button
						class="chip"
						class:active={!activeEmoji}
						onclick={() => { activeEmoji = ''; displayCount = 50; }}
					>All</button>
					{#each topEmojis as emoji}
						<button
							class="chip emoji-chip"
							class:active={activeEmoji === emoji}
							onclick={() => setEmoji(emoji)}
							aria-label={emoji}
							aria-pressed={activeEmoji === emoji}
						>{emoji}</button>
					{/each}
				</div>
			{/if}

			<!-- Sort -->
			<div class="sort-row" role="group" aria-label="Sort order">
				<button class="sort-btn" class:active={sortOrder === 'newest'} onclick={() => setSort('newest')}>
					Newest
				</button>
				<button class="sort-btn" class:active={sortOrder === 'oldest'} onclick={() => setSort('oldest')}>
					Oldest
				</button>
				<button class="sort-btn" class:active={sortOrder === 'intensity'} onclick={() => setSort('intensity')}>
					Intensity ↓
				</button>
			</div>

			<!-- Filter status -->
			{#if hasFilters}
				<div class="filter-status">
					<span>{filteredEchoes.length} {filteredEchoes.length === 1 ? 'echo' : 'echoes'}{filterLabel ? ` in ${filterLabel}` : ''}</span>
					<button class="clear-btn" onclick={clearAll}>Clear all</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Quick Log FAB -->
	{#if quickLogSuccess}
		<p class="quick-log-hint">Tap the echo to edit</p>
	{/if}
	<button
		class="quick-log-fab"
		class:success={quickLogSuccess}
		onclick={quickLog}
		disabled={quickLogging}
		aria-label={quickLogSuccess ? 'Logged!' : 'Quick log'}
	>{quickLogSuccess ? '✓' : '⚡'}</button>

	<!-- Content -->
	{#if filteredEchoes.length === 0}
		<div class="empty-state">
			<div class="empty-icon">{emptyIcon}</div>
			{#if hasFilters}
				<p class="empty-heading">No echoes match.</p>
				<p class="empty-sub">
					Try different filters or
					<button class="inline-link" onclick={clearAll}>clear all</button>.
				</p>
			{:else}
				<p class="empty-heading">No echoes yet.</p>
				<p class="empty-sub">Tap + to log your first felt moment.</p>
			{/if}
		</div>
	{:else}
		<div class="echo-list">
			{#each visible as echo (echo.id)}
				{@const sense = getSense(echo.sense)}
				<button class="echo-card" type="button" onclick={() => goto(`/add?edit=${echo.id}`)}>
					<div class="echo-emoji">{echo.emoji}</div>
					<div class="echo-body">
						<div class="echo-header">
							<span class="echo-name">{echo.name}</span>
							<span class="echo-time">{relativeTime(echo.timestamp)}</span>
						</div>
						<div class="echo-meta">
							<span class="sense-badge">{sense.emoji} {sense.name}{echo.subcategory ? ` · ${echo.subcategory}` : ''}</span>
						</div>
						<div class="echo-intensity">
							{#each [1, 2, 3, 4, 5] as n}
								<div class="dot" class:filled={n <= echo.intensity}></div>
							{/each}
						</div>
						{#if echo.note}
							<p class="echo-note">{echo.note}</p>
						{/if}
					</div>
				</button>
			{/each}

			{#if hasMore}
				<button class="load-more" onclick={() => (displayCount += 50)}>
					Load more
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.home {
		min-height: 100%;
	}

	/* Header */
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

	/* Browse controls */
	.browse {
		padding: 0.75rem 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	/* Search */
	.search-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 0.7rem;
		font-size: 0.85rem;
		pointer-events: none;
		line-height: 1;
	}

	.search-input {
		width: 100%;
		padding: 0.55rem 2.25rem 0.55rem 2.1rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 20px;
		color: var(--text);
		font-size: 0.9rem;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}
	.search-input:focus { border-color: var(--accent); }
	.search-input::placeholder { color: var(--text-muted); }
	.search-input[type='search']::-webkit-search-cancel-button { display: none; }

	.search-clear {
		position: absolute;
		right: 0.5rem;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.7rem;
		padding: 0.3rem;
		line-height: 1;
		transition: color 0.15s;
	}
	.search-clear:hover { color: var(--text); }

	/* Chip rows */
	.chip-scroll {
		display: flex;
		gap: 0.4rem;
		overflow-x: auto;
		scrollbar-width: none;
		padding-bottom: 0.1rem;
	}
	.chip-scroll::-webkit-scrollbar { display: none; }

	.chip {
		padding: 0.3rem 0.75rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 20px;
		color: var(--text-secondary);
		font-size: 0.8rem;
		white-space: nowrap;
		flex-shrink: 0;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s, background 0.15s;
	}
	.chip.active {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.chip:not(.active):hover { border-color: var(--text-muted); }

	.emoji-chip {
		font-size: 1.15rem;
		padding: 0.2rem 0.5rem;
	}

	/* Sort */
	.sort-row {
		display: flex;
		gap: 0.4rem;
	}

	.sort-btn {
		padding: 0.28rem 0.7rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 20px;
		color: var(--text-secondary);
		font-size: 0.75rem;
		white-space: nowrap;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s, background 0.15s;
	}
	.sort-btn.active {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.sort-btn:not(.active):hover { border-color: var(--text-muted); }

	/* Filter status */
	.filter-status {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--text-muted);
		padding: 0.1rem 0;
	}

	.clear-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 0.5rem;
		text-align: center;
	}
	.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
	.empty-heading { font-size: 1.1rem; font-weight: 600; color: var(--text); margin: 0; }
	.empty-sub { font-size: 0.9rem; color: var(--text-muted); margin: 0; }

	.inline-link {
		background: none;
		border: none;
		color: var(--accent);
		font-size: inherit;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}

	/* Echo list */
	.echo-list {
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Echo card */
	.echo-card {
		display: flex;
		gap: 0.875rem;
		padding: 0.875rem 1rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		cursor: pointer;
		transition: border-color 0.15s, transform 0.1s;
		text-align: left;
		width: 100%;
		font: inherit;
		color: inherit;
		box-sizing: border-box;
	}
	.echo-card:hover { border-color: color-mix(in srgb, var(--accent) 40%, var(--border-color)); }
	.echo-card:active { transform: scale(0.99); }

	.echo-emoji {
		font-size: 2rem;
		line-height: 1;
		flex-shrink: 0;
		width: 2.25rem;
		text-align: center;
	}

	.echo-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.echo-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.echo-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text);
		flex: 1;
		min-width: 0;
		word-break: break-word;
	}

	.echo-time {
		font-size: 0.7rem;
		color: var(--text-muted);
		white-space: nowrap;
		flex-shrink: 0;
		padding-top: 0.1rem;
	}

	.echo-meta { display: flex; align-items: center; }

	.sense-badge {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.echo-intensity {
		display: flex;
		gap: 0.25rem;
		margin-top: 0.1rem;
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		border: 1.5px solid var(--border-color);
		background: transparent;
		transition: background 0.15s, border-color 0.15s;
	}
	.dot.filled {
		background: var(--accent);
		border-color: var(--accent);
	}

	.echo-note {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0.25rem 0 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
	}

	/* Quick log hint */
	.quick-log-hint {
		position: fixed;
		bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 3.75rem);
		right: 1rem;
		font-size: 0.68rem;
		color: var(--text-muted);
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 0.2rem 0.5rem;
		white-space: nowrap;
		z-index: 99;
		animation: hint-fade 0.2s ease;
	}
	@keyframes hint-fade {
		from { opacity: 0; transform: translateY(4px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* Quick Log FAB */
	.quick-log-fab {
		position: fixed;
		bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 0.75rem);
		right: 1rem;
		z-index: 100;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: var(--bg-surface);
		border: 2px solid var(--accent);
		color: var(--accent);
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 14px color-mix(in srgb, var(--accent) 35%, transparent);
		transition: transform 0.15s, background 0.2s, color 0.2s, border-color 0.2s;
	}
	.quick-log-fab:not(:disabled):active { transform: scale(0.9); }
	.quick-log-fab.success {
		background: #27ae60;
		border-color: #27ae60;
		color: #fff;
	}
	.quick-log-fab:disabled { opacity: 0.7; cursor: default; }

	/* Load more */
	.load-more {
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 10px;
		color: var(--text-muted);
		font-size: 0.85rem;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}
	.load-more:hover { color: var(--accent); border-color: var(--accent); }
</style>
