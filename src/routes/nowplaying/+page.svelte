<script lang="ts">
	import { goto } from '$app/navigation';
	import { invoke } from '@tauri-apps/api/core';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { fragmentStore } from '$lib/stores/fragment.svelte';
	import PlayerControls from '$lib/components/PlayerControls.svelte';
	import GradientPulse from '$lib/components/GradientPulse.svelte';
	import EmojiPalette from '$lib/components/EmojiPalette.svelte';

	const currentTrack = $derived(playerStore.currentTrack);
	const isPlaying = $derived(playerStore.isPlaying);
	const shuffle = $derived(playerStore.shuffle);
	const repeatMode = $derived(playerStore.repeatMode);
	const repeatIcon = $derived(repeatMode === 'one' ? '🔂' : '🔁');
	const isFav = $derived(currentTrack ? playlistStore.isFavorite(currentTrack.id) : false);

	let heartAnimating = $state(false);

	type ArtFetch = 'idle' | 'loading' | 'found' | 'not_found' | 'error';
	let artFetch = $state<ArtFetch>('idle');
	let fetchedArt = $state<string | null>(null);
	let localArt = $state<string | null>(null);
	const displayArt = $derived(localArt ?? currentTrack?.coverArt ?? null);

	function toggleFav() {
		if (!currentTrack) return;
		heartAnimating = true;
		setTimeout(() => { heartAnimating = false; }, 400);
		playlistStore.toggleFavorite(currentTrack.id);
	}

	function goBack() {
		history.back();
	}

	async function findCoverArt() {
		if (!currentTrack) return;
		artFetch = 'loading';
		fetchedArt = null;
		try {
			const result = await invoke<string | null>('fetch_cover_art', {
				artist: currentTrack.artist,
				album: currentTrack.album,
			});
			fetchedArt = result;
			artFetch = result ? 'found' : 'not_found';
		} catch {
			artFetch = 'error';
		}
	}

	async function saveCoverArt() {
		if (!fetchedArt || !currentTrack) return;
		const albumId = `${currentTrack.album.trim()}|||${currentTrack.artist.trim()}`;
		await libraryStore.updateAlbumCoverArt(albumId, fetchedArt);
		localArt = fetchedArt;
		artFetch = 'idle';
		fetchedArt = null;
	}

	function dismissArtFetch() {
		artFetch = 'idle';
		fetchedArt = null;
	}

	// ── Fragment creator ────────────────────────────────────────────────────────

	let fragOpen = $state(false);
	let fragStart = $state(0);
	let fragEnd = $state(15);
	let fragName = $state('');
	let fragSaving = $state(false);
	let fragSaveState = $state<'idle' | 'saved' | 'error'>('idle');
	let fragError = $state<string | null>(null);
	let fragPreview = $state(false);
	let previewInterval: ReturnType<typeof setInterval> | null = null;

	let timelineEl = $state<HTMLElement | null>(null);
	let dragging = $state<'start' | 'end' | null>(null);

	const trackDur = $derived(playerStore.duration || currentTrack?.duration || 1);
	const startPct = $derived((fragStart / trackDur) * 100);
	const endPct = $derived((fragEnd / trackDur) * 100);
	const posPct = $derived((playerStore.position / trackDur) * 100);

	function fmtSec(s: number): string {
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	function openFragmentCreator() {
		if (!currentTrack) return;
		const pos = playerStore.position;
		fragStart = Math.max(0, pos - 7.5);
		fragEnd = Math.min(trackDur, pos + 7.5);
		fragName = `${currentTrack.title} — Fragment ${fragmentStore.getNextFragmentNumber(currentTrack.id)}`;
		fragSaveState = 'idle';
		fragError = null;
		fragOpen = true;
	}

	function calcFragTime(clientX: number): number {
		if (!timelineEl) return 0;
		const rect = timelineEl.getBoundingClientRect();
		const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		return pct * trackDur;
	}

	function onHandleDown(e: PointerEvent, handle: 'start' | 'end') {
		dragging = handle;
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
	}

	function onHandleMove(e: PointerEvent, handle: 'start' | 'end') {
		if (dragging !== handle) return;
		const t = calcFragTime(e.clientX);
		if (handle === 'start') {
			fragStart = Math.max(0, Math.min(fragEnd - 1, t));
		} else {
			fragEnd = Math.max(fragStart + 1, Math.min(trackDur, t));
		}
	}

	function startPreview() {
		if (!currentTrack) return;
		fragPreview = true;
		playerStore.seek(fragStart);
		if (!playerStore.isPlaying) playerStore.play();
		if (previewInterval) clearInterval(previewInterval);
		previewInterval = setInterval(() => {
			if (playerStore.position >= fragEnd) {
				clearInterval(previewInterval!);
				previewInterval = null;
				playerStore.pause();
				fragPreview = false;
			}
		}, 200);
	}

	function stopPreview() {
		if (previewInterval) { clearInterval(previewInterval); previewInterval = null; }
		fragPreview = false;
	}

	function closeFragmentModal() {
		stopPreview();
		fragOpen = false;
	}

	async function saveFragment() {
		if (!currentTrack || fragSaving) return;
		fragSaving = true;
		fragSaveState = 'idle';
		fragError = null;
		try {
			const filePath = await invoke<string>('create_fragment', {
				sourcePath: currentTrack.uri,
				startSecs: fragStart,
				endSecs: fragEnd,
				outputName: fragName,
			});
			fragmentStore.createFragment({
				sourceTrackId: currentTrack.id,
				name: fragName,
				startTime: fragStart,
				endTime: fragEnd,
				duration: fragEnd - fragStart,
				filePath,
				emoji: null,
				favorite: false,
			});
			fragSaveState = 'saved';
			setTimeout(() => { fragOpen = false; fragSaveState = 'idle'; }, 1000);
		} catch (e) {
			const msg = String(e);
			fragError = msg.includes('ffmpeg_not_found')
				? 'ffmpeg not found. Install ffmpeg and add it to your PATH.'
				: msg;
			fragSaveState = 'error';
		} finally {
			fragSaving = false;
		}
	}
</script>

<div class="nowplaying-page" style="padding-top: env(safe-area-inset-top, 0px);">
	<button class="back-btn" onclick={goBack}>← Back</button>

	{#if !currentTrack}
		<div class="empty-state">
			<span class="empty-icon">🎵</span>
			<p>Select a track to play</p>
		</div>
	{:else}
		<div class="art-container">
			<GradientPulse color="var(--accent)" pulse={isPlaying}>
				<div class="album-art">
					{#if displayArt}
						<img src={displayArt} alt="" class="art-img" />
					{:else}
						<span>💿</span>
					{/if}
				</div>
			</GradientPulse>

			{#if !displayArt}
				<div class="art-fetch-row">
					{#if artFetch === 'idle'}
						<button class="art-fetch-btn" onclick={findCoverArt}>🖼️ Find Cover Art</button>
					{:else if artFetch === 'loading'}
						<span class="art-fetch-status">Searching…</span>
					{:else if artFetch === 'found' && fetchedArt}
						<img src={fetchedArt} alt="Found cover art" class="art-preview" />
						<div class="art-fetch-actions">
							<button class="art-save-btn" onclick={saveCoverArt}>Save</button>
							<button class="art-dismiss-btn" onclick={dismissArtFetch}>Dismiss</button>
						</div>
					{:else if artFetch === 'not_found'}
						<span class="art-fetch-status">No cover art found.</span>
					{:else if artFetch === 'error'}
						<span class="art-fetch-status">Could not reach search service.</span>
					{/if}
					{#if artFetch === 'not_found' || artFetch === 'error'}
						<button class="art-dismiss-btn" onclick={dismissArtFetch}>×</button>
					{/if}
				</div>
			{/if}
		</div>

		<div class="track-info">
			<div class="title-row">
				<h1>{currentTrack.title}</h1>
				<button
					class="heart-btn"
					class:pop={heartAnimating}
					onclick={toggleFav}
					aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
					aria-pressed={isFav}
				>{isFav ? '❤️' : '🤍'}</button>
			</div>
			<p class="artist">{currentTrack.artist}</p>
			<p class="album">{currentTrack.album}</p>
		</div>

		<PlayerControls />

		<div class="extra-controls">
			<button
				class="ctrl-btn"
				class:active={shuffle}
				onclick={() => playerStore.toggleShuffle()}
				aria-label="Shuffle"
				aria-pressed={shuffle}
			>🔀</button>
			<button
				class="ctrl-btn"
				class:active={repeatMode !== 'off'}
				onclick={() => playerStore.cycleRepeat()}
				aria-label="Repeat: {repeatMode}"
				aria-pressed={repeatMode !== 'off'}
			>{repeatIcon}</button>
			<button
				class="ctrl-btn"
				onclick={() => goto(`/lyrics?trackId=${encodeURIComponent(currentTrack.id)}`)}
				aria-label="Lyrics"
			>🎤</button>
			<button
				class="ctrl-btn"
				onclick={openFragmentCreator}
				aria-label="Capture fragment"
				title="Capture Fragment"
			>✂️</button>
		</div>

		<div class="mood-section">
			<EmojiPalette />
		</div>

		{#if fragOpen}
			<div class="frag-overlay" role="dialog" aria-modal="true" aria-label="Fragment Creator">
				<div class="frag-modal">
					<div class="frag-header">
						<h2 class="frag-title">✂️ Capture Fragment</h2>
						<p class="frag-tagline">Every fragment contains the whole.</p>
					</div>

					<div class="frag-timeline" bind:this={timelineEl}>
						<div class="tl-track"></div>
						<div class="tl-selection" style="left: {startPct}%; width: {endPct - startPct}%"></div>
						<div class="tl-playhead" style="left: {Math.min(100, posPct)}%"></div>
						<div
							class="tl-handle tl-handle-start"
							style="left: {startPct}%"
							role="slider"
							tabindex="0"
							aria-label="Fragment start"
							aria-valuemin={0}
							aria-valuemax={Math.round(fragEnd)}
							aria-valuenow={Math.round(fragStart)}
							onpointerdown={(e) => onHandleDown(e, 'start')}
							onpointermove={(e) => onHandleMove(e, 'start')}
							onpointerup={() => { dragging = null; }}
							onkeydown={(e) => {
								if (e.key === 'ArrowLeft') fragStart = Math.max(0, fragStart - 1);
								if (e.key === 'ArrowRight') fragStart = Math.min(fragEnd - 1, fragStart + 1);
							}}
						></div>
						<div
							class="tl-handle tl-handle-end"
							style="left: {endPct}%"
							role="slider"
							tabindex="0"
							aria-label="Fragment end"
							aria-valuemin={Math.round(fragStart)}
							aria-valuemax={Math.round(trackDur)}
							aria-valuenow={Math.round(fragEnd)}
							onpointerdown={(e) => onHandleDown(e, 'end')}
							onpointermove={(e) => onHandleMove(e, 'end')}
							onpointerup={() => { dragging = null; }}
							onkeydown={(e) => {
								if (e.key === 'ArrowLeft') fragEnd = Math.max(fragStart + 1, fragEnd - 1);
								if (e.key === 'ArrowRight') fragEnd = Math.min(trackDur, fragEnd + 1);
							}}
						></div>
					</div>

					<div class="frag-times">
						<span>Start <strong>{fmtSec(fragStart)}</strong></span>
						<span class="frag-dur">↔ {fmtSec(fragEnd - fragStart)}</span>
						<span>End <strong>{fmtSec(fragEnd)}</strong></span>
					</div>

					<div class="frag-set-row">
						<button class="frag-set-btn" onclick={() => { fragStart = Math.min(playerStore.position, fragEnd - 1); }}>
							← Set Start at {fmtSec(playerStore.position)}
						</button>
						<button class="frag-set-btn" onclick={() => { fragEnd = Math.max(playerStore.position, fragStart + 1); }}>
							Set End at {fmtSec(playerStore.position)} →
						</button>
					</div>

					<div class="frag-name-row">
						<input
							type="text"
							class="frag-name-input"
							bind:value={fragName}
							placeholder="Fragment name"
							aria-label="Fragment name"
						/>
					</div>

					{#if fragSaveState === 'error' && fragError}
						<p class="frag-error">{fragError}</p>
					{/if}
					{#if fragSaveState === 'saved'}
						<p class="frag-success">✓ Fragment saved!</p>
					{/if}

					<div class="frag-actions">
						<button
							class="frag-btn-preview"
							class:active={fragPreview}
							onclick={fragPreview ? stopPreview : startPreview}
						>{fragPreview ? '⏹ Stop' : '▶ Preview'}</button>
						<button
							class="frag-btn-save"
							onclick={saveFragment}
							disabled={fragSaving || fragSaveState === 'saved'}
						>{fragSaving ? 'Saving…' : 'Save Fragment'}</button>
						<button class="frag-btn-cancel" onclick={closeFragmentModal}>Cancel</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.nowplaying-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		padding: 1rem 1.5rem 2rem;
	}

	.back-btn {
		background: none;
		border: none;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		margin-bottom: 1.5rem;
		align-self: flex-start;
		color: var(--accent);
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		color: var(--text-secondary);
	}

	.empty-icon {
		font-size: 3.5rem;
	}

	.art-container {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.album-art {
		width: 260px;
		height: 260px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4rem;
		color: #fff;
		background-color: var(--accent);
		overflow: hidden;
	}

	.art-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.track-info {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	h1 {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	.heart-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.15rem;
		font-size: 1.3rem;
		line-height: 1;
		flex-shrink: 0;
		transition: transform 0.15s;
	}

	.heart-btn:hover {
		transform: scale(1.2);
	}

	.heart-btn.pop {
		animation: heartPop 0.35s ease-out;
	}

	@keyframes heartPop {
		0% { transform: scale(1); }
		40% { transform: scale(1.55); }
		70% { transform: scale(0.9); }
		100% { transform: scale(1); }
	}

	.artist {
		color: var(--text-secondary);
		margin: 0.15rem 0;
	}

	.album {
		color: var(--text-muted);
		font-size: 0.85rem;
		margin: 0.15rem 0;
	}

	.extra-controls {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 1rem;
	}

	.ctrl-btn {
		background: none;
		border: none;
		font-size: 1.4rem;
		cursor: pointer;
		padding: 0.25rem;
		opacity: 0.4;
	}

	.ctrl-btn:hover {
		opacity: 0.7;
	}

	.ctrl-btn.active {
		opacity: 1;
	}

	.mood-section {
		margin-top: 1.5rem;
		display: flex;
		justify-content: center;
	}

	/* Find Cover Art */
	.art-fetch-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 0.75rem;
	}

	.art-fetch-btn {
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 16px;
		padding: 0.3rem 0.85rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.15s, color 0.15s;
	}

	.art-fetch-btn:hover { border-color: var(--accent); color: var(--accent); }

	.art-fetch-status {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.art-preview {
		width: 80px;
		height: 80px;
		border-radius: 6px;
		object-fit: cover;
		border: 1px solid var(--border-color);
	}

	.art-fetch-actions {
		display: flex;
		gap: 0.4rem;
	}

	.art-save-btn {
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

	.art-dismiss-btn {
		padding: 0.3rem 0.9rem;
		border-radius: 14px;
		border: 1px solid var(--border-color);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
	}

	/* ── Fragment creator ── */
	.frag-overlay {
		position: fixed;
		inset: 0;
		z-index: 130;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.frag-modal {
		width: 100%;
		max-width: 560px;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-bottom: none;
		border-radius: 20px 20px 0 0;
		padding: 1.5rem 1.5rem calc(2rem + env(safe-area-inset-bottom, 0px));
		display: flex;
		flex-direction: column;
		gap: 1rem;
		color: var(--text);
	}

	.frag-header { text-align: center; }
	.frag-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.2rem; }
	.frag-tagline { font-size: 0.75rem; color: var(--text-secondary); margin: 0; font-style: italic; opacity: 0.7; }

	.frag-timeline {
		position: relative;
		height: 48px;
		display: flex;
		align-items: center;
		touch-action: none;
		user-select: none;
		cursor: col-resize;
	}

	.tl-track {
		position: absolute;
		left: 0;
		right: 0;
		height: 6px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.12);
	}

	.tl-selection {
		position: absolute;
		height: 6px;
		background: var(--accent);
		opacity: 0.6;
		border-radius: 2px;
		pointer-events: none;
	}

	.tl-playhead {
		position: absolute;
		width: 2px;
		height: 32px;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 1px;
		top: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.tl-handle {
		position: absolute;
		width: 16px;
		height: 32px;
		border-radius: 4px;
		top: 50%;
		transform: translate(-50%, -50%);
		cursor: ew-resize;
		touch-action: none;
	}

	.tl-handle-start { background: #00b894; border: 2px solid rgba(255, 255, 255, 0.3); }
	.tl-handle-end { background: #e17055; border: 2px solid rgba(255, 255, 255, 0.3); }

	.frag-times {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.82rem;
		color: var(--text-secondary);
	}

	.frag-dur { color: var(--accent); font-weight: 600; }

	.frag-set-row { display: flex; gap: 0.5rem; }

	.frag-set-btn {
		flex: 1;
		padding: 0.55rem 0.6rem;
		min-height: 44px;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.75rem;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.frag-set-btn:hover { background: rgba(255, 255, 255, 0.13); color: var(--text); }

	.frag-name-row { display: flex; }

	.frag-name-input {
		width: 100%;
		padding: 0.55rem 0.75rem;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: var(--text);
		font-size: 0.9rem;
		font-family: inherit;
		box-sizing: border-box;
	}
	.frag-name-input:focus { outline: none; border-color: var(--accent); }

	.frag-error { font-size: 0.82rem; color: #e17055; margin: 0; text-align: center; }
	.frag-success { font-size: 0.82rem; color: #00b894; margin: 0; text-align: center; font-weight: 600; }

	.frag-actions { display: flex; gap: 0.5rem; }

	.frag-btn-preview {
		padding: 0.55rem 0.9rem;
		min-height: 44px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 10px;
		color: var(--text);
		font-size: 0.88rem;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.15s;
		white-space: nowrap;
	}
	.frag-btn-preview:hover,
	.frag-btn-preview.active { background: rgba(255, 255, 255, 0.14); color: var(--accent); }

	.frag-btn-save {
		flex: 1;
		padding: 0.55rem;
		min-height: 44px;
		background: var(--accent);
		border: none;
		border-radius: 10px;
		color: #fff;
		font-size: 0.88rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.frag-btn-save:disabled { opacity: 0.5; cursor: default; }
	.frag-btn-save:not(:disabled):hover { opacity: 0.85; }

	.frag-btn-cancel {
		padding: 0.55rem 0.9rem;
		min-height: 44px;
		background: none;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 10px;
		color: var(--text-secondary);
		font-size: 0.88rem;
		font-family: inherit;
		cursor: pointer;
		white-space: nowrap;
	}
	.frag-btn-cancel:hover { color: var(--text); border-color: rgba(255, 255, 255, 0.3); }
</style>
