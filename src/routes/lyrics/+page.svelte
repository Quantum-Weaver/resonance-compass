<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { invoke } from '@tauri-apps/api/core';
	import { playerStore } from '$lib/stores/player.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';

	const FONT_KEY = 'lyrics_font_size';
	const MIN_FONT = 0.9;
	const MAX_FONT = 2.4;

	const currentTrack = $derived(playerStore.currentTrack);
	const position = $derived(playerStore.position);
	const duration = $derived(playerStore.duration);

	const trackIdParam = $derived(page.url.searchParams.get('trackId'));
	const targetTrack = $derived(
		(trackIdParam ? libraryStore.getTrackById(trackIdParam) : null) ?? currentTrack
	);
	// LRC sync only applies when the viewed track is actually playing.
	const isSyncEnabled = $derived(!trackIdParam || targetTrack?.id === currentTrack?.id);

	let fontSize = $state(1.4);
	let headerVisible = $state(true);

	type LyricsFetch = 'idle' | 'loading' | 'found' | 'not_found' | 'error';
	let lyricsFetch = $state<LyricsFetch>('idle');
	let fetchedLyrics = $state<string | null>(null);
	// localLyrics holds lyrics saved this session so we don't need a store reload.
	let localLyrics = $state<string | null>(null);

	interface LRCLine { time: number; text: string; }
	interface LyricsApiResult { syncedLyrics: string | null; plainLyrics: string | null; }

	function parseLRC(text: string): LRCLine[] | null {
		const result: LRCLine[] = [];
		const pattern = /^\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/;
		let hasTimestamps = false;
		for (const raw of text.split('\n')) {
			const m = raw.match(pattern);
			if (m) {
				hasTimestamps = true;
				const mins = parseInt(m[1]);
				const secs = parseInt(m[2]);
				const frac = parseInt(m[3]) / (m[3].length === 2 ? 100 : 1000);
				const time = mins * 60 + secs + frac;
				const line = m[4].trim();
				if (line) result.push({ time, text: line });
			}
		}
		return hasTimestamps && result.length > 0 ? result : null;
	}

	const lyricsRaw = $derived(localLyrics ?? targetTrack?.lyrics ?? null);
	const lrcLines = $derived(lyricsRaw ? parseLRC(lyricsRaw) : null);
	const staticLines = $derived(
		lyricsRaw
			? lyricsRaw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
			: []
	);
	const displayLines = $derived(lrcLines ? lrcLines.map((l) => l.text) : staticLines);

	const currentLineIdx = $derived((() => {
		if (!lyricsRaw || displayLines.length === 0 || !isSyncEnabled) return 0;
		if (lrcLines) {
			let idx = 0;
			for (let i = 0; i < lrcLines.length; i++) {
				if (lrcLines[i].time <= position) idx = i;
			}
			return idx;
		}
		if (!duration || duration <= 0) return 0;
		const progress = Math.min(1, position / duration);
		return Math.min(displayLines.length - 1, Math.floor(progress * displayLines.length));
	})());

	onMount(() => {
		try {
			const stored = localStorage.getItem(FONT_KEY);
			if (stored) {
				const n = parseFloat(stored);
				if (!isNaN(n)) fontSize = Math.max(MIN_FONT, Math.min(MAX_FONT, n));
			}
		} catch {}
	});

	// Auto-scroll current line into view whenever the index changes.
	$effect(() => {
		if (!browser) return;
		const idx = currentLineIdx;
		void lyricsRaw; // retrigger when track/lyrics change
		const el = document.getElementById(`lyric-line-${idx}`);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
	});

	function adjustFont(delta: number) {
		fontSize = parseFloat(Math.max(MIN_FONT, Math.min(MAX_FONT, fontSize + delta)).toFixed(2));
		try { localStorage.setItem(FONT_KEY, String(fontSize)); } catch {}
	}

	function toggleHeader() {
		headerVisible = !headerVisible;
	}

	function previewLines(lyrics: string): string[] {
		const lrcPattern = /^\[\d{1,2}:\d{2}\.\d{2,3}\](.*)/;
		const result: string[] = [];
		for (const raw of lyrics.split('\n')) {
			const m = raw.match(lrcPattern);
			const text = m ? m[1].trim() : raw.trim();
			if (text) result.push(text);
			if (result.length >= 5) break;
		}
		return result;
	}

	async function findLyrics() {
		if (!targetTrack) return;
		lyricsFetch = 'loading';
		fetchedLyrics = null;
		try {
			const result = await invoke<LyricsApiResult | null>('fetch_lyrics', {
				artist: targetTrack.artist,
				title: targetTrack.title,
			});
			// Prefer synced lyrics (LRC) over plain text.
			const lyrics = result?.syncedLyrics ?? result?.plainLyrics ?? null;
			if (lyrics) {
				// Auto-persist at once via saveLyrics(): fetch_lyrics is a flaky
				// network call, so a found result is saved immediately rather than
				// waiting for a manual Save that, if skipped, lost it and re-fetched
				// next visit — the "found once, gone the next time" bug.
				fetchedLyrics = lyrics;
				await saveLyrics();
			} else {
				lyricsFetch = 'not_found';
			}
		} catch {
			lyricsFetch = 'error';
		}
	}

	async function saveLyrics() {
		if (!targetTrack || !fetchedLyrics) return;
		await libraryStore.updateTrackLyrics(targetTrack.id, fetchedLyrics);
		localLyrics = fetchedLyrics;
		lyricsFetch = 'idle';
		fetchedLyrics = null;
	}

	function dismissFetch() {
		lyricsFetch = 'idle';
		fetchedLyrics = null;
	}
</script>

<div class="lyrics-page" style="--lyric-font: {fontSize}rem; padding-top: env(safe-area-inset-top, 0px);">
	<!-- Blurred album art background -->
	<div class="art-bg" aria-hidden="true">
		{#if targetTrack?.coverArt}
			<img src={targetTrack.coverArt} alt="" class="bg-art" />
		{:else}
			<div class="bg-gradient"></div>
		{/if}
		<div class="bg-overlay"></div>
	</div>

	<!-- Header (toggleable for immersive mode) -->
	<div class="header" class:hidden={!headerVisible}>
		<button class="back-btn" onclick={() => window.history.back()}>← Now Playing</button>
		{#if targetTrack}
			<div class="track-mini">
				<span class="mini-title">{targetTrack.title}</span>
				<span class="mini-artist">{targetTrack.artist}</span>
			</div>
		{/if}
	</div>

	<!-- Lyrics scroll — click anywhere to toggle header visibility -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="lyrics-scroll"
		role="region"
		aria-label="Lyrics"
		onclick={toggleHeader}
	>
		{#if !targetTrack}
			<div class="center-message">
				<span class="center-icon">🎵</span>
				<p class="no-lyrics-title">No track playing</p>
			</div>

		{:else if !lyricsRaw}
			<div class="center-message">
				<span class="center-icon">🎤</span>
				<p class="no-lyrics-title">No lyrics available</p>

				{#if lyricsFetch === 'idle'}
					<p class="no-lyrics-sub">This track doesn't have embedded lyrics.</p>
					<button
						class="find-lyrics-btn"
						onclick={(e) => { e.stopPropagation(); findLyrics(); }}
					>🔍 Find Lyrics</button>

				{:else if lyricsFetch === 'loading'}
					<p class="no-lyrics-sub">Searching LRCLIB…</p>
					<div class="fetch-spinner" aria-label="Searching"></div>

				{:else if lyricsFetch === 'found' && fetchedLyrics}
					<p class="no-lyrics-sub fetch-preview-label">Found — preview:</p>
					<div class="lyrics-preview-box">
						{#each previewLines(fetchedLyrics) as line}
							<p class="preview-line">{line}</p>
						{/each}
					</div>
					<div class="fetch-actions">
						<button
							class="save-lyrics-btn"
							onclick={(e) => { e.stopPropagation(); saveLyrics(); }}
						>Save Lyrics</button>
						<button
							class="dismiss-btn"
							onclick={(e) => { e.stopPropagation(); dismissFetch(); }}
						>Dismiss</button>
					</div>

				{:else if lyricsFetch === 'not_found'}
					<p class="no-lyrics-sub">No lyrics found for this track.</p>
					<button
						class="dismiss-btn"
						onclick={(e) => { e.stopPropagation(); dismissFetch(); }}
					>Dismiss</button>

				{:else if lyricsFetch === 'error'}
					<p class="no-lyrics-sub">Couldn't reach the lyrics service — it may be busy.</p>
					<button
						class="find-lyrics-btn"
						onclick={(e) => { e.stopPropagation(); findLyrics(); }}
					>Try again</button>
					<button
						class="dismiss-btn"
						onclick={(e) => { e.stopPropagation(); dismissFetch(); }}
					>Dismiss</button>
				{/if}
			</div>

		{:else}
			<div class="lyric-spacer"></div>
			{#each displayLines as line, i (i)}
				<p
					id="lyric-line-{i}"
					class="lyric-line"
					class:current={i === currentLineIdx}
					class:past={i < currentLineIdx}
				>{line}</p>
			{/each}
			<div class="lyric-spacer"></div>
		{/if}
	</div>

	<!-- Font size controls — always visible, bottom-right -->
	<div class="font-controls">
		<button
			class="font-btn"
			onclick={(e) => { e.stopPropagation(); adjustFont(-0.1); }}
			aria-label="Decrease font size"
		>A−</button>
		<button
			class="font-btn"
			onclick={(e) => { e.stopPropagation(); adjustFont(0.1); }}
			aria-label="Increase font size"
		>A+</button>
	</div>
</div>

<style>
	.lyrics-page {
		position: relative;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		color: white;
	}

	/* ── Background ── */
	.art-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
	}

	.bg-art {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(48px) brightness(0.28) saturate(1.6);
		transform: scale(1.08);
	}

	.bg-gradient {
		width: 100%;
		height: 100%;
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--accent) 40%, #0a0c18) 0%,
			#0a0c18 60%
		);
	}

	.bg-overlay {
		position: absolute;
		inset: 0;
		background: rgba(8, 10, 22, 0.55);
	}

	/* ── Header ── */
	.header {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem 0.75rem;
		flex-shrink: 0;
		opacity: 1;
		transform: translateY(0);
		transition: opacity 0.25s ease, transform 0.25s ease;
	}

	.header.hidden {
		opacity: 0;
		transform: translateY(-100%);
		pointer-events: none;
	}

	.back-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.85);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		flex-shrink: 0;
		transition: color 0.15s;
	}

	.back-btn:hover { color: white; }

	.track-mini {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		overflow: hidden;
		min-width: 0;
	}

	.mini-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mini-artist {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ── Lyrics scroll ── */
	.lyrics-scroll {
		flex: 1;
		overflow-y: auto;
		position: relative;
		z-index: 1;
		padding: 0 3rem;
		scrollbar-width: none;
		cursor: pointer;
	}

	.lyrics-scroll::-webkit-scrollbar { display: none; }

	.lyric-spacer { height: 35vh; }

	.lyric-line {
		font-size: var(--lyric-font);
		color: rgba(255, 255, 255, 0.32);
		line-height: 1.55;
		text-align: center;
		padding: 0.4rem 0;
		margin: 0;
		transition: color 0.5s ease, font-size 0.4s ease, font-weight 0.3s ease;
		will-change: color;
	}

	.lyric-line.past {
		color: rgba(255, 255, 255, 0.16);
	}

	.lyric-line.current {
		color: white;
		font-size: calc(var(--lyric-font) * 1.12);
		font-weight: 700;
		text-shadow: 0 0 28px rgba(255, 255, 255, 0.4);
	}

	/* ── Center messages ── */
	.center-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 50vh;
		gap: 0.6rem;
		text-align: center;
		padding: 2rem;
	}

	.center-icon { font-size: 2.5rem; }

	.no-lyrics-title {
		font-size: 1.05rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
		margin: 0;
	}

	.no-lyrics-sub {
		font-size: 0.82rem;
		color: rgba(255, 255, 255, 0.38);
		line-height: 1.5;
		margin: 0;
	}

	/* ── Find Lyrics UI ── */
	.find-lyrics-btn {
		margin-top: 0.75rem;
		padding: 0.45rem 1.25rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.28);
		border-radius: 20px;
		color: rgba(255, 255, 255, 0.82);
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.15s;
	}

	.find-lyrics-btn:hover { background: rgba(255, 255, 255, 0.18); color: white; }

	.fetch-spinner {
		width: 22px;
		height: 22px;
		border: 2px solid rgba(255, 255, 255, 0.18);
		border-top-color: rgba(255, 255, 255, 0.8);
		border-radius: 50%;
		animation: spin 0.75s linear infinite;
		margin: 0.75rem auto 0;
	}

	@keyframes spin { to { transform: rotate(360deg); } }

	.fetch-preview-label { color: rgba(255, 255, 255, 0.55) !important; margin-bottom: 0.25rem; }

	.lyrics-preview-box {
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 8px;
		padding: 0.65rem 1rem;
		margin: 0.25rem 0 0.5rem;
		max-width: 320px;
		width: 100%;
	}

	.preview-line {
		font-size: 0.82rem;
		color: rgba(255, 255, 255, 0.68);
		margin: 0.18rem 0;
		line-height: 1.45;
		text-align: left;
	}

	.fetch-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.save-lyrics-btn {
		padding: 0.42rem 1.1rem;
		background: var(--accent);
		border: none;
		border-radius: 20px;
		color: white;
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: filter 0.15s;
	}

	.save-lyrics-btn:hover { filter: brightness(1.12); }

	.dismiss-btn {
		padding: 0.42rem 1.1rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 20px;
		color: rgba(255, 255, 255, 0.65);
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.15s;
	}

	.dismiss-btn:hover { background: rgba(255, 255, 255, 0.14); color: white; }

	/* ── Font size controls ── */
	.font-controls {
		position: absolute;
		bottom: 0.85rem;
		right: 1rem;
		z-index: 3;
		display: flex;
		gap: 0.25rem;
	}

	.font-btn {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.75rem;
		font-weight: 700;
		font-family: inherit;
		padding: 0.3rem 0.55rem;
		cursor: pointer;
		transition: background-color 0.15s;
		line-height: 1;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.font-btn:hover { background: rgba(255, 255, 255, 0.22); color: white; }

	@media (prefers-reduced-motion: reduce) {
		.header,
		.lyric-line,
		.find-lyrics-btn,
		.save-lyrics-btn,
		.dismiss-btn,
		.font-btn { transition: none; }

		.fetch-spinner { animation: none; border-top-color: rgba(255, 255, 255, 0.8); }
	}
</style>
