<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { playerStore } from '$lib/stores/player.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { moodStore } from '$lib/stores/mood.svelte';
	import { focusStore, type FocusSession, type FocusRecord } from '$lib/stores/focus.svelte';
	import type { Track } from '$lib/types/types';

	// ── Phase ─────────────────────────────────────────────────────────────────

	type Phase = 'setup' | 'active' | 'complete';
	let phase = $state<Phase>('setup');

	// ── Settings ──────────────────────────────────────────────────────────────

	let selectedDuration = $state(25);
	let customDuration = $state(30);
	let isCustom = $state(false);
	let selectedPlaylist = $state<string | null>(null);
	let lockUI = $state(true);
	let breakReminders = $state(true);

	const playlists = $derived(playlistStore.playlists);

	const durationMs = $derived(
		isCustom ? Math.max(1, customDuration) * 60_000 : selectedDuration * 60_000
	);

	// ── Active session state ──────────────────────────────────────────────────

	let remaining = $state(0);
	let elapsed = $state(0);
	let breakVisible = $state(false);
	let breakShown = $state(false);
	let tracksPlayed = $state(0);
	let completedRecord = $state<FocusRecord | null>(null);

	// ── Track counting ────────────────────────────────────────────────────────

	let prevTrackId = '';

	$effect(() => {
		const ct = playerStore.currentTrack;
		if (ct && phase === 'active' && ct.id !== prevTrackId) {
			if (prevTrackId !== '') tracksPlayed++;
			prevTrackId = ct.id;
		}
	});

	// ── Timer ─────────────────────────────────────────────────────────────────

	let intervalId: ReturnType<typeof setInterval> | null = null;

	function startTimer(plannedMs: number, startedAt: number) {
		intervalId = setInterval(() => {
			const el = Date.now() - startedAt;
			elapsed = el;
			remaining = Math.max(0, plannedMs - el);

			if (breakReminders && !breakShown && el >= plannedMs / 2) {
				breakShown = true;
				breakVisible = true;
				setTimeout(() => { breakVisible = false; }, 8000);
			}

			if (remaining <= 0) {
				if (intervalId) clearInterval(intervalId);
				intervalId = null;
				completeSession();
			}
		}, 500);
	}

	function stopTimer() {
		if (intervalId) { clearInterval(intervalId); intervalId = null; }
	}

	// ── Hold-to-end ───────────────────────────────────────────────────────────

	let endHoldProgress = $state(0);
	let endHoldRafId = 0;
	const END_HOLD_MS = 1500;

	function onEndHoldStart(e: PointerEvent) {
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		const start = performance.now();
		const tick = () => {
			endHoldProgress = Math.min(1, (performance.now() - start) / END_HOLD_MS);
			if (endHoldProgress < 1) {
				endHoldRafId = requestAnimationFrame(tick);
			} else {
				endManual();
			}
		};
		endHoldRafId = requestAnimationFrame(tick);
	}

	function onEndHoldCancel() {
		cancelAnimationFrame(endHoldRafId);
		endHoldProgress = 0;
	}

	function endManual() {
		cancelAnimationFrame(endHoldRafId);
		endHoldProgress = 0;
		stopTimer();
		focusStore.endSession(tracksPlayed, false);
		phase = 'setup';
	}

	// ── Session lifecycle ─────────────────────────────────────────────────────

	async function startFocus() {
		let queue: Track[] = [];
		let playlistName = 'Current Queue';

		if (selectedPlaylist) {
			const pl = playlistStore.getPlaylist(selectedPlaylist);
			if (pl) {
				playlistName = pl.name;
				queue = pl.trackIds
					.map((id) => libraryStore.getTrackById(id))
					.filter((t): t is Track => t != null);
			}
		}

		if (queue.length > 0) {
			playerStore.setQueue(queue, 0);
		} else if (!playerStore.isPlaying) {
			playerStore.play();
		}

		const planned = durationMs;
		const startedAt = Date.now();

		const session: FocusSession = {
			id: `focus_${startedAt}`,
			startedAt,
			durationMs: planned,
			playlistId: selectedPlaylist,
			playlistName,
			lockUI,
			breakReminders,
		};

		focusStore.startSession(session);
		focusStore.saveSettings({
			defaultDuration: isCustom ? customDuration : selectedDuration,
			defaultPlaylistId: selectedPlaylist,
			lockUI,
			breakReminders,
		});

		remaining = planned;
		elapsed = 0;
		tracksPlayed = 0;
		breakShown = false;
		breakVisible = false;
		prevTrackId = playerStore.currentTrack?.id ?? '';

		phase = 'active';
		startTimer(planned, startedAt);
	}

	function completeSession() {
		stopTimer();
		const ct = playerStore.currentTrack;
		if (ct) {
			moodStore.addMoodEvent(ct.id, '🎯', 4, undefined, 'focus_complete').catch(() => {});
		}
		focusStore.endSession(tracksPlayed, true);
		completedRecord = focusStore.sessionHistory[0] ?? null;
		phase = 'complete';
	}

	function returnToSetup() {
		phase = 'setup';
		completedRecord = null;
		remaining = 0;
		elapsed = 0;
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	function fmtMs(ms: number): string {
		const total = Math.ceil(Math.max(0, ms) / 1000);
		const m = Math.floor(total / 60);
		const s = total % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function fmtMins(ms: number): string {
		return `${Math.round(ms / 60_000)} min`;
	}

	function dateStr(ts: number): string {
		return new Date(ts).toLocaleDateString('default', {
			month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
		});
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	onMount(() => {
		const s = focusStore.loadSettings();
		selectedDuration = [25, 45, 60, 90].includes(s.defaultDuration) ? s.defaultDuration : 25;
		if (![25, 45, 60, 90].includes(s.defaultDuration)) {
			isCustom = true;
			customDuration = s.defaultDuration;
		}
		selectedPlaylist = s.defaultPlaylistId;
		lockUI = s.lockUI;
		breakReminders = s.breakReminders;

		focusStore.loadHistory();

		const active = focusStore.activeSession;
		if (active) {
			const el = Date.now() - active.startedAt;
			const rem = Math.max(0, active.durationMs - el);
			lockUI = active.lockUI;
			breakReminders = active.breakReminders;
			elapsed = el;
			remaining = rem;
			if (rem > 0) {
				phase = 'active';
				startTimer(active.durationMs, active.startedAt);
			} else {
				completeSession();
			}
		}
	});

	onDestroy(() => {
		stopTimer();
		cancelAnimationFrame(endHoldRafId);
	});
</script>

<!-- ── Setup ── -->
{#if phase === 'setup'}
	<div class="focus-page">
		<header class="focus-header">
			<h1 class="focus-title">🎯 Focus Session</h1>
			<p class="focus-subtitle">Set a timer. Lock in. Be present.</p>
		</header>

		<div class="focus-card">
			<section class="focus-section">
				<h2 class="section-label">Duration</h2>
				<div class="preset-row">
					{#each [25, 45, 60, 90] as d}
						<button
							class="preset-btn"
							class:sel={!isCustom && selectedDuration === d}
							onclick={() => { selectedDuration = d; isCustom = false; }}
						>{d} min</button>
					{/each}
					<button class="preset-btn" class:sel={isCustom} onclick={() => (isCustom = true)}>Custom</button>
				</div>
				{#if isCustom}
					<div class="custom-duration-row">
						<input
							type="number"
							class="custom-input"
							min="1"
							max="480"
							bind:value={customDuration}
							aria-label="Custom duration in minutes"
						/>
						<span class="custom-unit">minutes</span>
					</div>
				{/if}
			</section>

			<section class="focus-section">
				<h2 class="section-label">Playlist</h2>
				<div class="preset-row">
					<button class="preset-btn" class:sel={!selectedPlaylist} onclick={() => (selectedPlaylist = null)}>
						Current Queue
					</button>
					{#each playlists as pl (pl.id)}
						<button class="preset-btn" class:sel={selectedPlaylist === pl.id} onclick={() => (selectedPlaylist = pl.id)}>
							{pl.name}
						</button>
					{/each}
				</div>
			</section>

			<section class="focus-section options-section">
				<label class="option-toggle">
					<span class="option-label">
						<span class="option-icon">🔒</span>
						<span>
							<strong>Lock UI</strong>
							<span class="option-hint">Full-screen session, hold to end</span>
						</span>
					</span>
					<input type="checkbox" class="sr-only" bind:checked={lockUI} />
					<span class="toggle-track" class:on={lockUI}><span class="toggle-thumb"></span></span>
				</label>

				<label class="option-toggle">
					<span class="option-label">
						<span class="option-icon">🔔</span>
						<span>
							<strong>Break Reminder</strong>
							<span class="option-hint">Gentle nudge at the halfway point</span>
						</span>
					</span>
					<input type="checkbox" class="sr-only" bind:checked={breakReminders} />
					<span class="toggle-track" class:on={breakReminders}><span class="toggle-thumb"></span></span>
				</label>
			</section>

			<button class="start-btn" onclick={startFocus}>
				▶ Start Focus — {isCustom ? `${customDuration} min` : `${selectedDuration} min`}
			</button>
		</div>

		{#if focusStore.sessionHistory.length > 0}
			<section class="history-section">
				<div class="history-header">
					<h2 class="section-label">Past Sessions</h2>
					<button class="clear-btn" onclick={() => focusStore.clearHistory()}>Clear</button>
				</div>
				<ul class="history-list">
					{#each focusStore.sessionHistory as rec (rec.id)}
						<li class="history-item">
							<span class="h-status">{rec.completed ? '✅' : '⏹'}</span>
							<span class="h-info">
								<span class="h-date">{dateStr(rec.date)}</span>
								<span class="h-detail">{fmtMins(rec.durationMs)} · {rec.tracksPlayed} track{rec.tracksPlayed !== 1 ? 's' : ''} · {rec.playlistName}</span>
							</span>
							<span class="h-planned">{fmtMins(rec.plannedMs)}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>

<!-- ── Active session ── -->
{:else if phase === 'active'}
	{@const sess = focusStore.activeSession}
	{@const planned = sess?.durationMs ?? 1}
	{@const progress = Math.min(1, elapsed / planned)}
	{@const arc = 2 * Math.PI * 88}
	<div class="active-overlay" class:locked={lockUI}>
		<div class="active-header">
			<span class="session-label">🎯 Focus Session</span>
			<span class="session-playlist">{sess?.playlistName ?? ''}</span>
		</div>

		<div class="countdown-wrap">
			<svg class="countdown-ring" viewBox="0 0 200 200" aria-hidden="true">
				<circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3" />
				<circle
					cx="100" cy="100" r="88"
					fill="none"
					style="stroke: var(--accent);"
					stroke-width="3"
					stroke-dasharray={arc}
					stroke-dashoffset={arc * (1 - progress)}
					stroke-linecap="round"
					transform="rotate(-90 100 100)"
				/>
			</svg>
			<div class="countdown-text">
				<span class="countdown-time">{fmtMs(remaining)}</span>
				<span class="countdown-label">remaining</span>
			</div>
		</div>

		{#if playerStore.currentTrack}
			{@const track = playerStore.currentTrack}
			<div class="np-info">
				{#if track.coverArt}
					<img class="np-art" src={track.coverArt} alt={track.album} />
				{:else}
					<div class="np-art np-art-fallback">💿</div>
				{/if}
				<div class="np-meta">
					<span class="np-title">{track.title}</span>
					<span class="np-artist">{track.artist}</span>
				</div>
			</div>
		{/if}

		<div class="playback-controls">
			<button class="ctrl-btn" onclick={() => playerStore.previous()} aria-label="Previous track">⏮</button>
			<button class="ctrl-btn ctrl-play" onclick={() => playerStore.togglePlay()} aria-label={playerStore.isPlaying ? 'Pause' : 'Play'}>
				{playerStore.isPlaying ? '⏸' : '▶'}
			</button>
			<button class="ctrl-btn" onclick={() => playerStore.next()} aria-label="Next track">⏭</button>
		</div>

		<div class="end-btn-wrap">
			<button
				class="end-hold-btn"
				onpointerdown={onEndHoldStart}
				onpointerup={onEndHoldCancel}
				onpointercancel={onEndHoldCancel}
				onpointerleave={onEndHoldCancel}
				aria-label="Hold to end session"
			>
				<svg viewBox="0 0 36 36" aria-hidden="true">
					<circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2.5" />
					{#if endHoldProgress > 0}
						<circle
							cx="18" cy="18" r="14"
							fill="none"
							stroke="#e17055"
							stroke-width="2.5"
							stroke-dasharray={2 * Math.PI * 14}
							stroke-dashoffset={2 * Math.PI * 14 * (1 - endHoldProgress)}
							stroke-linecap="round"
							transform="rotate(-90 18 18)"
						/>
					{/if}
				</svg>
				<span>End</span>
			</button>
			<p class="end-hint">Hold to end session</p>
		</div>

		{#if breakVisible}
			<div class="break-overlay" role="status" aria-live="polite">
				<p class="break-text">Halfway. Take a breath if you need it. 🌿</p>
			</div>
		{/if}
	</div>

<!-- ── Complete ── -->
{:else if phase === 'complete'}
	<div class="complete-overlay">
		<div class="complete-card">
			<div class="complete-icon">🎯</div>
			<h1 class="complete-title">Focus Complete</h1>
			<p class="complete-sub">Session finished. Well done.</p>

			{#if completedRecord}
				<div class="stats-grid">
					<div class="stat">
						<span class="stat-val">{fmtMins(completedRecord.durationMs)}</span>
						<span class="stat-lbl">Focused</span>
					</div>
					<div class="stat">
						<span class="stat-val">{completedRecord.tracksPlayed}</span>
						<span class="stat-lbl">Track{completedRecord.tracksPlayed !== 1 ? 's' : ''}</span>
					</div>
					<div class="stat">
						<span class="stat-val">{completedRecord.playlistName}</span>
						<span class="stat-lbl">Playlist</span>
					</div>
				</div>
			{/if}

			<button class="start-btn" onclick={returnToSetup}>Start Another Session</button>
			<button class="ghost-btn" onclick={() => goto('/')}>Back to Home</button>
		</div>
	</div>
{/if}

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	/* ── Setup ── */
	.focus-page {
		padding: 2rem 1.5rem 3rem;
		max-width: 600px;
		margin: 0 auto;
		color: var(--text);
	}

	.focus-header { margin-bottom: 2rem; }
	.focus-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.3rem; }
	.focus-subtitle { font-size: 0.9rem; color: var(--text-secondary); margin: 0; }

	.focus-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.focus-section { display: flex; flex-direction: column; gap: 0.6rem; }

	.section-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-secondary);
		margin: 0;
	}

	.preset-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }

	.preset-btn {
		padding: 0.55rem 0.9rem;
		min-height: 44px;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-family: inherit;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
	}
	.preset-btn:hover { color: var(--text); border-color: var(--accent); }
	.preset-btn.sel { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }

	.custom-duration-row { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.25rem; }
	.custom-input {
		width: 5rem;
		padding: 0.55rem 0.6rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg);
		color: var(--text);
		font-size: 0.9rem;
		font-family: inherit;
		text-align: center;
	}
	.custom-unit { font-size: 0.85rem; color: var(--text-secondary); }

	.options-section { gap: 0.8rem; }

	.option-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		gap: 1rem;
		min-height: 44px;
	}
	.option-label { display: flex; align-items: flex-start; gap: 0.7rem; font-size: 0.88rem; }
	.option-icon { font-size: 1rem; line-height: 1.4; flex-shrink: 0; }
	.option-label strong { display: block; color: var(--text); font-weight: 600; }
	.option-hint { display: block; font-size: 0.76rem; color: var(--text-secondary); margin-top: 0.1rem; }

	.toggle-track {
		flex-shrink: 0;
		width: 36px;
		height: 20px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.12);
		position: relative;
		transition: background 0.2s;
	}
	.toggle-track.on { background: var(--accent); }
	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.2s;
	}
	.toggle-track.on .toggle-thumb { transform: translateX(16px); }

	.start-btn {
		width: 100%;
		padding: 0.9rem;
		min-height: 48px;
		border-radius: 12px;
		border: none;
		background: var(--accent);
		color: #fff;
		font-size: 1rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
	}
	.start-btn:hover { opacity: 0.88; }
	.start-btn:active { transform: scale(0.98); }

	/* ── History ── */
	.history-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}
	.clear-btn {
		font-size: 0.78rem;
		color: var(--text-secondary);
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		padding: 0.5rem;
		min-height: 44px;
	}
	.clear-btn:hover { color: var(--text); }

	.history-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
	.history-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 10px;
		font-size: 0.83rem;
	}
	.h-status { font-size: 0.9rem; flex-shrink: 0; }
	.h-info { flex: 1; min-width: 0; }
	.h-date { display: block; color: var(--text); font-weight: 500; }
	.h-detail {
		display: block;
		color: var(--text-secondary);
		font-size: 0.77rem;
		margin-top: 0.1rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.h-planned { flex-shrink: 0; font-size: 0.77rem; color: var(--text-secondary); }

	/* ── Active ── */
	.active-overlay {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		min-height: calc(100vh - 60px);
		padding: 1.5rem;
		color: var(--text);
		box-sizing: border-box;
	}

	.active-overlay.locked {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: var(--bg);
		min-height: unset;
		height: 100%;
	}

	.active-header { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; text-align: center; }
	.session-label { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-secondary); }
	.session-playlist { font-size: 0.85rem; color: var(--accent); }

	.countdown-wrap {
		position: relative;
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.countdown-ring { position: absolute; inset: 0; width: 100%; height: 100%; }
	.countdown-text { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; pointer-events: none; }
	.countdown-time { font-size: 2.4rem; font-weight: 700; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
	.countdown-label { font-size: 0.72rem; color: var(--text-secondary); letter-spacing: 0.08em; text-transform: uppercase; }

	.np-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		width: 100%;
		max-width: 360px;
		box-sizing: border-box;
	}
	.np-art { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
	.np-art-fallback { display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.08); font-size: 1.4rem; }
	.np-meta { flex: 1; min-width: 0; }
	.np-title { display: block; font-size: 0.92rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.np-artist { display: block; font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

	.playback-controls { display: flex; align-items: center; gap: 1.5rem; }
	.ctrl-btn {
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 50%;
		width: 48px;
		height: 48px;
		font-size: 1.1rem;
		cursor: pointer;
		color: var(--text);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
	}
	.ctrl-btn:hover { background: rgba(255, 255, 255, 0.14); }
	.ctrl-play { width: 60px; height: 60px; font-size: 1.4rem; background: var(--accent); border-color: transparent; color: #fff; }
	.ctrl-play:hover { opacity: 0.85; background: var(--accent); }

	.end-btn-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; margin-top: 0.5rem; }

	.end-hold-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		background: rgba(225, 112, 85, 0.08);
		border: 1px solid rgba(225, 112, 85, 0.25);
		border-radius: 50%;
		width: 64px;
		height: 64px;
		cursor: pointer;
		color: rgba(225, 112, 85, 0.7);
		font-size: 0.65rem;
		font-family: inherit;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		touch-action: none;
		user-select: none;
		transition: background 0.1s;
	}
	.end-hold-btn:hover { background: rgba(225, 112, 85, 0.14); }
	.end-hold-btn svg { width: 36px; height: 36px; }
	.end-hint { font-size: 0.72rem; color: var(--text-secondary); margin: 0; }

	.break-overlay {
		position: fixed;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 12px;
		padding: 0.75rem 1.25rem;
		max-width: 320px;
		text-align: center;
		z-index: 250;
		animation: fade-slide-up 0.4s ease;
	}
	.break-text { margin: 0; font-size: 0.9rem; color: rgba(255, 255, 255, 0.85); }

	@keyframes fade-slide-up {
		from { opacity: 0; transform: translateX(-50%) translateY(8px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	/* ── Complete ── */
	.complete-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg);
		color: var(--text);
		padding: 1.5rem;
	}

	.complete-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		max-width: 380px;
		width: 100%;
		text-align: center;
	}
	.complete-icon { font-size: 3.5rem; line-height: 1; }
	.complete-title { font-size: 1.8rem; font-weight: 700; margin: 0; }
	.complete-sub { font-size: 0.9rem; color: var(--text-secondary); margin: 0; }

	.stats-grid {
		display: flex;
		gap: 1rem;
		width: 100%;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 1rem;
	}
	.stat { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
	.stat-val {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--accent);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.stat-lbl { font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }

	.ghost-btn {
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 12px;
		color: var(--text-secondary);
		padding: 0.65rem 1.5rem;
		min-height: 44px;
		font-size: 0.9rem;
		font-family: inherit;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}
	.ghost-btn:hover { color: var(--text); border-color: var(--accent); }

	@media (prefers-reduced-motion: reduce) {
		.break-overlay { animation: none; }
	}
</style>
