<script lang="ts">
	import { onMount } from 'svelte';
	import { moodStore } from '$lib/stores/mood.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { EMOJI_DEFS } from '$lib/data/emojis';
	import TrackItem from '$lib/components/TrackItem.svelte';

	type Tab = 'map' | 'emojis' | 'pending' | 'tag' | 'dict';
	const TABS: { key: Tab; label: string }[] = [
		{ key: 'map', label: '🗺️ Mood Map' },
		{ key: 'emojis', label: '🏆 Top Emojis' },
		{ key: 'pending', label: '⏳ Pending' },
		{ key: 'tag', label: '✏️ Tag Music' },
		{ key: 'dict', label: '📖 Dictionary' },
	];

	let activeTab = $state<Tab>('map');
	let searchQuery = $state('');
	let tagMenuTrackId = $state<string | null>(null);
	let selectedDictEmoji = $state<string | null>(null);
	let editingPersonalDef = $state('');

	// Resolved pending prompts, this session only — tagging a skip prompt logs a
	// new mood event (matching how manual tagging works) rather than mutating or
	// deleting the original row, so we track "answered" locally to keep the
	// Pending list honest without adding delete/update methods to moodStore.
	let resolvedPendingIds = $state<Set<number>>(new Set());

	onMount(() => {
		moodStore.loadRecentMoods(50);
		moodStore.loadPersonalDefinitions();
	});

	const recentMoods = $derived(moodStore.recentMoods);
	const topEmojis = $derived(moodStore.topEmojis);
	const totalEvents = $derived(moodStore.totalEvents);
	const tracks = $derived(libraryStore.tracks);

	const pendingMoods = $derived(
		recentMoods.filter((m) => m.context === 'skip_prompt' && !resolvedPendingIds.has(m.id))
	);

	const filteredTracks = $derived(
		searchQuery.trim()
			? tracks.filter(
					(t) =>
						t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						t.artist.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: tracks
	);

	const topEmojiTotal = $derived(topEmojis.reduce((sum, e) => sum + e.count, 0) || 1);

	function relativeTime(ts: number): string {
		const diff = Date.now() - ts;
		if (diff < 60_000) return 'just now';
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
		if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
		return `${Math.floor(diff / 86_400_000)}d ago`;
	}

	function intensityDots(intensity = 3): string {
		const filled = Math.min(5, Math.max(1, intensity));
		return '●'.repeat(filled) + '○'.repeat(5 - filled);
	}

	async function tagTrack(trackId: string, emoji: string) {
		await moodStore.addMoodEvent(trackId, emoji, 3, undefined, 'manual');
		tagMenuTrackId = null;
	}

	async function resolvePending(moodId: number, trackId: string, emoji: string) {
		await moodStore.addMoodEvent(trackId, emoji, 3, undefined, 'manual');
		resolvedPendingIds = new Set([...resolvedPendingIds, moodId]);
	}

	function playTrack(trackId: string) {
		const track = libraryStore.getTrackById(trackId);
		if (track) playerStore.setQueue([track], 0);
	}

	function topInsight(): string {
		if (topEmojis.length === 0) return 'No mood data yet. Start tagging what you hear.';
		const top = topEmojis[0];
		const pct = Math.round((top.count / topEmojiTotal) * 100);
		return `Your most common feeling is ${top.emoji} — ${pct}% of ${totalEvents} tagged moment${totalEvents === 1 ? '' : 's'}.`;
	}

	const selectedDef = $derived(EMOJI_DEFS.find((d) => d.emoji === selectedDictEmoji));

	function selectDict(emoji: string) {
		if (selectedDictEmoji === emoji) {
			selectedDictEmoji = null;
			return;
		}
		selectedDictEmoji = emoji;
		editingPersonalDef = moodStore.getPersonalDefinition(emoji);
	}

	function savePersonalDef() {
		if (!selectedDictEmoji) return;
		moodStore.setPersonalDefinition(selectedDictEmoji, editingPersonalDef);
	}
</script>

<div class="resonance-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<header class="res-header">
		<h1 class="res-title">Resonance</h1>
		<p class="res-subtitle">Your music, your moods.</p>
	</header>

	<div class="tabs">
		{#each TABS as tab (tab.key)}
			<button class="tab" class:active={activeTab === tab.key} onclick={() => (activeTab = tab.key)}>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- ── Mood Map ── -->
	{#if activeTab === 'map'}
		<div class="tab-content">
			{#if moodStore.loading}
				<p class="empty-text">Loading…</p>
			{:else if recentMoods.length === 0}
				<div class="empty-state">
					<span class="empty-icon">💭</span>
					<p class="empty-heading">No mood events yet.</p>
					<p class="empty-sub">Head to "Tag Music" to start tagging tracks with emojis.</p>
				</div>
			{:else}
				<div class="mood-list">
					{#each recentMoods as mood (mood.id)}
						{@const track = libraryStore.getTrackById(mood.trackId)}
						<div class="mood-row">
							<div class="mood-art">
								{#if track?.coverArt}
									<img src={track.coverArt} alt="" class="mood-art-img" />
								{:else}
									<span>💿</span>
								{/if}
							</div>
							<div class="mood-info">
								<span class="mood-title">{track?.title ?? mood.trackId}</span>
								<span class="mood-artist">{track?.artist ?? '—'}</span>
								<span class="mood-dots">{intensityDots(mood.intensity)}</span>
							</div>
							<div class="mood-right">
								<span class="mood-emoji">{mood.emoji}</span>
								<span class="mood-time">{relativeTime(mood.timestamp)}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ── Top Emojis ── -->
	{#if activeTab === 'emojis'}
		<div class="tab-content">
			<p class="insight">{topInsight()}</p>
			{#if topEmojis.length === 0}
				<div class="empty-state">
					<span class="empty-icon">📊</span>
					<p class="empty-heading">No patterns yet.</p>
				</div>
			{:else}
				<div class="emoji-list">
					{#each topEmojis as entry (entry.emoji)}
						{@const pct = Math.round((entry.count / topEmojiTotal) * 100)}
						<div class="emoji-row">
							<span class="emoji-big">{entry.emoji}</span>
							<div class="emoji-bar-wrap">
								<div class="emoji-bar-track">
									<div class="emoji-bar-fill" style="width: {pct}%;"></div>
								</div>
								<span class="emoji-count">{entry.count} × {pct}%</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ── Pending ── -->
	{#if activeTab === 'pending'}
		<div class="tab-content">
			{#if pendingMoods.length === 0}
				<div class="empty-state">
					<span class="empty-icon">✅</span>
					<p class="empty-heading">Nothing pending.</p>
					<p class="empty-sub">Skip prompts will appear here for you to tag later.</p>
				</div>
			{:else}
				<div class="mood-list">
					{#each pendingMoods as mood (mood.id)}
						{@const track = libraryStore.getTrackById(mood.trackId)}
						<div class="pending-row">
							<div class="mood-art">
								{#if track?.coverArt}
									<img src={track.coverArt} alt="" class="mood-art-img" />
								{:else}
									<span>💿</span>
								{/if}
							</div>
							<div class="pending-info">
								<span class="mood-title">{track?.title ?? 'Unknown'}</span>
								<span class="mood-artist">{track?.artist ?? '—'}</span>
								<span class="mood-time">skipped {relativeTime(mood.timestamp)}</span>
								<div class="quick-picks">
									{#each EMOJI_DEFS.slice(0, 6) as def (def.emoji)}
										<button
											class="quick-pick-btn"
											onclick={() => resolvePending(mood.id, mood.trackId, def.emoji)}
											title={def.label}
											aria-label="Tag {def.label}"
										>{def.emoji}</button>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ── Tag Music ── -->
	{#if activeTab === 'tag'}
		<div class="tab-content">
			<input
				class="search-input"
				type="text"
				placeholder="Search tracks..."
				bind:value={searchQuery}
				aria-label="Search tracks"
			/>

			{#if filteredTracks.length === 0}
				<div class="empty-state">
					<span class="empty-icon">🔍</span>
					<p class="empty-heading">{searchQuery ? 'No tracks match your search.' : 'Your library is empty. Scan some music first.'}</p>
				</div>
			{:else}
				<div class="tag-list">
					{#each filteredTracks as track (track.id)}
						<TrackItem
							{track}
							index={0}
							showHeart={true}
							isCurrentTrack={playerStore.currentTrack?.id === track.id}
							onPlay={() => playTrack(track.id)}
							onTag={() => (tagMenuTrackId = tagMenuTrackId === track.id ? null : track.id)}
						/>
						{#if tagMenuTrackId === track.id}
							<div class="palette-popup">
								{#each EMOJI_DEFS as def (def.emoji)}
									<button
										class="quick-pick-btn"
										onclick={() => tagTrack(track.id, def.emoji)}
										title={def.label}
										aria-label="Tag {def.label}"
									>{def.emoji}</button>
								{/each}
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ── Emoji Dictionary ── -->
	{#if activeTab === 'dict'}
		<div class="tab-content dict-tab">
			<div class="dict-grid">
				{#each EMOJI_DEFS as def (def.emoji)}
					<button
						class="dict-btn"
						class:selected={selectedDictEmoji === def.emoji}
						style="--dict-btn-color: {def.color};"
						onclick={() => selectDict(def.emoji)}
						title={def.label}
					>{def.emoji}</button>
				{/each}
			</div>

			{#if selectedDef}
				<div class="dict-expansion" style="--dict-color: {selectedDef.color};">
					<div class="dict-header">
						<span class="dict-emoji">{selectedDef.emoji}</span>
						<span class="dict-label">{selectedDef.label}</span>
					</div>
					<div class="dict-columns">
						<div class="dict-col">
							<h4 class="dict-col-title">Sanctuary</h4>
							<p class="dict-definition">{selectedDef.definition}</p>
							<div class="sensory-grid">
								<span class="sensory-item">🎨 {selectedDef.sensory.color}</span>
								<span class="sensory-item">🔊 {selectedDef.sensory.sound}</span>
								<span class="sensory-item">✋ {selectedDef.sensory.texture}</span>
								<span class="sensory-item">🌡️ {selectedDef.sensory.temperature}</span>
							</div>
						</div>
						<div class="dict-col">
							<h4 class="dict-col-title">Yours</h4>
							<textarea
								class="personal-textarea"
								placeholder="What does this feel like to you?"
								rows={5}
								bind:value={editingPersonalDef}
								onblur={savePersonalDef}
								onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); savePersonalDef(); } }}
							></textarea>
							<button class="personal-save-btn" onclick={savePersonalDef}>Save</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.resonance-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		padding: 1rem 1.25rem 1.5rem;
	}

	.res-header {
		margin-bottom: 1rem;
	}

	.res-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	.res-subtitle {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin: 0.15rem 0 0;
	}

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 1rem;
	}

	.tab {
		padding: 0.4rem 0.75rem;
		border-radius: 16px;
		border: 1px solid var(--border-color);
		background: var(--bg-surface);
		color: var(--text-secondary);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
	}

	.tab.active {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	.tab-content {
		flex: 1;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-align: center;
		padding: 3rem 2rem;
	}

	.empty-icon {
		font-size: 2.5rem;
	}

	.empty-heading {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text);
		margin: 0;
	}

	.empty-sub {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin: 0;
	}

	.empty-text {
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	/* Mood Map / Pending */
	.mood-list {
		display: flex;
		flex-direction: column;
	}

	.mood-row,
	.pending-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 0.25rem;
		border-bottom: 1px solid var(--border-color);
	}

	.pending-row {
		align-items: flex-start;
	}

	.mood-art {
		width: 44px;
		height: 44px;
		border-radius: 6px;
		background: var(--bg-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		flex-shrink: 0;
		overflow: hidden;
	}

	.mood-art-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.mood-info,
	.pending-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.mood-title {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mood-artist {
		font-size: 0.78rem;
		color: var(--text-secondary);
	}

	.mood-dots {
		font-size: 0.65rem;
		color: var(--accent);
		letter-spacing: 0.1em;
	}

	.mood-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.2rem;
		flex-shrink: 0;
	}

	.mood-emoji {
		font-size: 1.3rem;
	}

	.mood-time {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	/* Single-row carousel — all moods reachable by horizontal scroll */
	.quick-picks {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.3rem;
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: thin;
		padding-bottom: 0.2rem;
	}

	.quick-pick-btn {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1px solid var(--border-color);
		background: var(--bg);
		cursor: pointer;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		line-height: 1;
	}

	.quick-pick-btn:hover {
		border-color: var(--accent);
		transform: scale(1.1);
	}

	/* Top Emojis */
	.insight {
		font-size: 0.88rem;
		color: var(--text-secondary);
		margin: 0 0 1rem;
		line-height: 1.5;
	}

	.emoji-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.emoji-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.emoji-big {
		font-size: 1.6rem;
		flex-shrink: 0;
		width: 2rem;
		text-align: center;
	}

	.emoji-bar-wrap {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.emoji-bar-track {
		height: 8px;
		border-radius: 4px;
		background: var(--bg-surface);
		overflow: hidden;
	}

	.emoji-bar-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 4px;
	}

	.emoji-count {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	/* Tag Music */
	.search-input {
		width: 100%;
		padding: 0.65rem 0.9rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		background-color: var(--bg-surface);
		color: var(--text);
		font-size: 0.9rem;
		margin-bottom: 0.75rem;
		outline: none;
		box-sizing: border-box;
	}

	.search-input:focus {
		border-color: var(--accent);
	}

	.tag-list {
		display: flex;
		flex-direction: column;
	}

	/* Single-row carousel — all moods reachable by horizontal scroll */
	.palette-popup {
		display: flex;
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: thin;
		gap: 0.35rem;
		padding: 0.6rem 0.5rem;
		margin-bottom: 0.5rem;
		border-radius: 10px;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
	}

	/* Emoji Dictionary */
	/* Single-row carousel — all moods reachable by horizontal scroll */
	.dict-grid {
		display: flex;
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: thin;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding-bottom: 0.3rem;
	}

	.dict-btn {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 2px solid transparent;
		background: var(--bg-surface);
		cursor: pointer;
		font-size: 1.3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.dict-btn:hover {
		border-color: var(--dict-btn-color);
	}

	.dict-btn.selected {
		border-color: var(--dict-btn-color);
		background: color-mix(in srgb, var(--dict-btn-color) 25%, transparent);
	}

	.dict-expansion {
		border: 1px solid var(--dict-color);
		border-radius: 12px;
		padding: 1rem;
		background: color-mix(in srgb, var(--dict-color) 8%, transparent);
	}

	.dict-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.6rem;
	}

	.dict-emoji {
		font-size: 1.8rem;
	}

	.dict-label {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text);
	}

	.dict-definition {
		font-size: 0.9rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0 0 0.85rem;
	}

	.sensory-grid {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.sensory-item {
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	/* Two-column dictionary layout */
	.dict-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.dict-col-title {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin: 0 0 0.5rem;
	}

	.personal-textarea {
		width: 100%;
		padding: 0.5rem 0.65rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		background: var(--bg);
		color: var(--text);
		font-size: 0.85rem;
		font-family: inherit;
		resize: vertical;
		outline: none;
		box-sizing: border-box;
		line-height: 1.5;
		transition: border-color 0.15s;
	}

	.personal-textarea:focus {
		border-color: var(--accent);
	}

	.personal-save-btn {
		margin-top: 0.5rem;
		padding: 0.3rem 0.9rem;
		border-radius: 14px;
		border: none;
		background: var(--accent);
		color: #fff;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
	}
</style>
