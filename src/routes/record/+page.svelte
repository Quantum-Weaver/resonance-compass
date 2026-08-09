<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { recorderStore, type Take } from '$lib/stores/recorder.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import type { Track } from '$lib/types/types';

	// The recording room (v3 Phase 2). The two findings of the Summons ride
	// here: the room ARMS INSTANTLY (nothing heavy on mount — the idea must
	// not die while the app loads), and Bluetooth's monitoring delay is said
	// plainly rather than pretended away.

	let selectedDevice = $state<string | null>(null);
	let takeName = $state('');
	let confirmDelete = $state<string | null>(null);
	let lastExported = $state<string | null>(null);

	const recording = $derived(recorderStore.recording);
	const peak = $derived(recorderStore.peak);
	const clipped = $derived(recorderStore.clipped);
	const takes = $derived(recorderStore.takes);

	const prefersReduced =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const btHint = $derived.by(() => {
		const name = (selectedDevice ?? recorderStore.devices.find((d) => d.is_default)?.name ?? '').toLowerCase();
		return /bluetooth|airpod|buds|headset|bt-|wh-|wf-/.test(name);
	});

	function fmtElapsed(secs: number): string {
		const m = Math.floor(secs / 60);
		const s = Math.floor(secs % 60);
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	function fmtSeconds(secs: number): string {
		if (secs >= 60) return fmtElapsed(secs);
		return `${secs.toFixed(1)}s`;
	}

	async function startTake() {
		lastExported = null;
		await recorderStore.start(selectedDevice);
	}

	async function stopTake() {
		await recorderStore.stop(true, takeName.trim() ? takeName.trim() : null);
		takeName = '';
	}

	async function discardTake() {
		await recorderStore.stop(false, null);
		takeName = '';
	}

	// A take plays through the normal player, like a fragment — it lands in
	// history and can be mood-tagged like any track.
	function takeToTrack(t: Take): Track {
		return {
			id: `take:${t.file_name}`,
			uri: t.path,
			filename: t.file_name,
			title: t.file_name.replace(/\.wav$/, ''),
			artist: 'Take',
			album: 'Recordings',
			genre: '',
			year: 0,
			trackNumber: 0,
			duration: t.seconds,
			coverArt: null,
			lyrics: null,
			dateAdded: t.created_at,
			lastScanned: t.created_at,
		} as unknown as Track;
	}

	function playTake(t: Take) {
		playerStore.setQueue([takeToTrack(t)], 0);
	}

	async function exportTake(t: Take) {
		const dest = await recorderStore.exportTake(t.file_name);
		if (dest) lastExported = dest;
	}

	onMount(() => {
		// Fast-arm: the record button is live immediately (a null device hint
		// means the platform default); the device list fills in behind it.
		recorderStore.loadDevices();
		recorderStore.refreshTakes();
	});

	onDestroy(() => {
		// Leaving the room never stops a running take silently — the take
		// keeps recording; the room shows it honestly on return.
	});
</script>

<div class="page">
	<h1 class="page-title">🎙️ Record</h1>

	{#if recorderStore.error}
		<p class="rec-error" role="alert">{recorderStore.error}</p>
	{/if}

	{#if !recording}
		<div class="arm-panel">
			<button class="record-btn" onclick={startTake} aria-label="Start recording">
				<span class="record-dot"></span>
				Record
			</button>

			<input
				type="text"
				class="take-name"
				placeholder="Name the take (optional)"
				bind:value={takeName}
				maxlength="60"
			/>

			{#if recorderStore.devices.length > 0}
				<select class="device-select" bind:value={selectedDevice} aria-label="Input device">
					<option value={null}>Default input</option>
					{#each recorderStore.devices as d (d.name)}
						<option value={d.name}>{d.name}{d.is_default ? ' (default)' : ''}</option>
					{/each}
				</select>
			{/if}

			{#if btHint}
				<p class="bt-note">
					Bluetooth listens on a delay — what you hear runs behind what you play.
					The take itself stays true, and can be aligned later. A wired input
					hears itself honestly.
				</p>
			{/if}
		</div>
	{:else}
		<div class="live-panel">
			<p class="listening" aria-live="polite">● Listening</p>
			<p class="live-elapsed">{fmtElapsed(recorderStore.elapsedSecs)}</p>
			<p class="live-device">
				{recorderStore.device} · {recorderStore.sampleRate} Hz · {recorderStore.channels === 1 ? 'mono' : `${recorderStore.channels}ch`}
			</p>

			<div class="meter" role="img" aria-label="Input level">
				<div
					class="meter-fill"
					class:hot={peak > 0.9}
					class:no-motion={prefersReduced}
					style="width: {Math.min(100, peak * 100)}%"
				></div>
			</div>
			{#if clipped > 0}
				<p class="clip-note">clipped ×{clipped}</p>
			{/if}

			<div class="live-actions">
				<button class="stop-btn" onclick={stopTake}>■ Keep take</button>
				<button class="discard-btn" onclick={discardTake}>Discard</button>
			</div>
		</div>
	{/if}

	{#if lastExported}
		<p class="export-note">Exported to {lastExported}</p>
	{/if}

	<h2 class="takes-title">Takes</h2>
	{#if takes.length === 0}
		<p class="takes-empty">No takes yet — the room is ready when you are.</p>
	{:else}
		<ul class="takes-list">
			{#each takes as t (t.file_name)}
				<li class="take-row">
					<button class="take-play" onclick={() => playTake(t)} aria-label="Play {t.file_name}">▶</button>
					<div class="take-meta">
						<span class="take-name-label">{t.file_name.replace(/\.wav$/, '')}</span>
						<span class="take-sub">{fmtSeconds(t.seconds)} · {t.sample_rate} Hz · {t.channels === 1 ? 'mono' : `${t.channels}ch`}</span>
					</div>
					<div class="take-actions">
						<button class="take-act" onclick={() => exportTake(t)} title="Export a copy">Export</button>
						{#if confirmDelete === t.file_name}
							<button class="take-act danger" onclick={() => { recorderStore.deleteTake(t.file_name); confirmDelete = null; }}>
								Sure?
							</button>
							<button class="take-act" onclick={() => (confirmDelete = null)}>Keep</button>
						{:else}
							<button class="take-act" onclick={() => (confirmDelete = t.file_name)} title="Delete this take">Delete</button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.page {
		padding: 1rem 1.25rem 2rem;
	}

	.page-title {
		font-size: 1.4rem;
		margin: 0 0 1rem;
	}

	.rec-error {
		color: var(--error, #e17055);
		font-size: 0.9rem;
	}

	.arm-panel {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.record-btn {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.9rem 1.8rem;
		border-radius: 28px;
		border: none;
		background: var(--accent);
		color: #fff;
		font-size: 1.05rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
	}

	.record-btn:hover {
		filter: brightness(1.1);
	}

	.record-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #fff;
	}

	.take-name {
		width: min(320px, 100%);
		padding: 0.55rem 0.9rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--surface, transparent);
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.device-select {
		max-width: min(320px, 100%);
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--surface, transparent);
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.bt-note {
		max-width: 46ch;
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.live-panel {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.listening {
		color: var(--accent);
		font-weight: 600;
		margin: 0;
	}

	.live-elapsed {
		font-size: 2.4rem;
		font-weight: 200;
		font-variant-numeric: tabular-nums;
		margin: 0;
		line-height: 1;
	}

	.live-device {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.meter {
		width: min(420px, 100%);
		height: 10px;
		border-radius: 5px;
		background: var(--surface, rgba(255, 255, 255, 0.08));
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.meter-fill {
		height: 100%;
		background: var(--accent);
		transition: width 120ms linear;
	}

	.meter-fill.hot {
		background: #e17055;
	}

	.meter-fill.no-motion {
		transition: none;
	}

	.clip-note {
		font-size: 0.8rem;
		color: #e17055;
		margin: 0;
	}

	.live-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.stop-btn {
		padding: 0.7rem 1.4rem;
		border-radius: 22px;
		border: none;
		background: var(--accent);
		color: #fff;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
	}

	.discard-btn {
		padding: 0.7rem 1.4rem;
		border-radius: 22px;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.95rem;
		cursor: pointer;
		min-height: 44px;
	}

	.export-note {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.takes-title {
		font-size: 1.05rem;
		margin: 1.25rem 0 0.5rem;
	}

	.takes-empty {
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.takes-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.take-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.6rem;
		border-radius: 10px;
		border: 1px solid var(--border);
	}

	.take-play {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: none;
		background: var(--accent);
		color: #fff;
		font-size: 0.9rem;
		cursor: pointer;
		flex-shrink: 0;
	}

	.take-meta {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
		flex: 1;
	}

	.take-name-label {
		font-size: 0.95rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.take-sub {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.take-actions {
		display: flex;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.take-act {
		padding: 0.45rem 0.8rem;
		border-radius: 16px;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.8rem;
		cursor: pointer;
		min-height: 36px;
	}

	.take-act:hover {
		border-color: var(--accent);
		color: var(--text-primary);
	}

	.take-act.danger {
		border-color: #e17055;
		color: #e17055;
	}
</style>
