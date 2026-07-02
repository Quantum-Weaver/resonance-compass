<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { fragmentStore, type Fragment } from '$lib/stores/fragment.svelte';
	import { studioStore, newLayer, type StudioLayer } from '$lib/stores/studio.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import type { Track } from '$lib/types/types';

	// ── Working arrangement ────────────────────────────────────────────────────

	let layers = $state<StudioLayer[]>([]);
	let mixName = $state('My Mix');
	let loadedArrangementId = $state<string | null>(null);

	let pickerOpen = $state(false);
	let arrangementsOpen = $state(false);
	let crossfadeSecs = $state(2);

	let exporting = $state(false);
	let exportedPath = $state<string | null>(null);
	let exportError = $state<string | null>(null);

	onMount(() => {
		fragmentStore.loadFragments();
		studioStore.loadArrangements();
	});

	function fragFor(layer: StudioLayer): Fragment | undefined {
		return fragmentStore.fragments.find((f) => f.id === layer.fragmentId);
	}

	const validLayers = $derived(layers.filter((l) => fragFor(l) !== undefined));

	const totalDuration = $derived(
		validLayers.reduce((max, l) => {
			const f = fragFor(l);
			return Math.max(max, l.offsetSecs + (f?.duration ?? 0));
		}, 0)
	);

	// ── Layer operations ───────────────────────────────────────────────────────

	function addFragment(frag: Fragment) {
		const lastEnd = totalDuration;
		layers = [...layers, newLayer(frag.id, lastEnd)];
		pickerOpen = false;
		clearExport();
	}

	function removeLayer(id: string) {
		layers = layers.filter((l) => l.id !== id);
		clearExport();
	}

	function updateLayer(id: string, changes: Partial<StudioLayer>) {
		layers = layers.map((l) => (l.id === id ? { ...l, ...changes } : l));
		clearExport();
	}

	function moveLayer(id: string, dir: -1 | 1) {
		const idx = layers.findIndex((l) => l.id === id);
		const target = idx + dir;
		if (idx < 0 || target < 0 || target >= layers.length) return;
		const next = [...layers];
		[next[idx], next[target]] = [next[target], next[idx]];
		layers = next;
	}

	// ── Auto-crossfade ─────────────────────────────────────────────────────────
	// Lays layers end-to-end in list order, each overlapping the previous by
	// crossfadeSecs, with matching fade-out/fade-in applied at every seam.

	function autoCrossfade() {
		const xf = Math.max(0, crossfadeSecs);
		let cursor = 0;
		layers = layers.map((l, i) => {
			const f = fragFor(l);
			const dur = f?.duration ?? 0;
			const isFirst = i === 0;
			const isLast = i === layers.length - 1;
			const placed: StudioLayer = {
				...l,
				offsetSecs: cursor,
				fadeIn: isFirst ? l.fadeIn : Math.min(xf, dur / 2),
				fadeOut: isLast ? l.fadeOut : Math.min(xf, dur / 2),
			};
			cursor += Math.max(0.1, dur - xf);
			return placed;
		});
		clearExport();
	}

	// ── Export ─────────────────────────────────────────────────────────────────

	function clearExport() {
		exportedPath = null;
		exportError = null;
	}

	async function exportMix() {
		if (validLayers.length === 0 || exporting) return;
		exporting = true;
		clearExport();
		try {
			const payload = validLayers.map((l) => {
				const f = fragFor(l)!;
				return {
					path: f.filePath,
					offset_secs: l.offsetSecs,
					volume: l.volume,
					pan: l.pan,
					fade_in: l.fadeIn,
					fade_out: l.fadeOut,
					duration: f.duration,
				};
			});
			exportedPath = await invoke<string>('export_mix', {
				layers: payload,
				outputName: mixName || 'My Mix',
			});
		} catch (e) {
			const msg = String(e);
			exportError = msg.includes('ffmpeg_not_found')
				? 'ffmpeg not found. Install ffmpeg and add it to your PATH.'
				: msg;
		} finally {
			exporting = false;
		}
	}

	function playMix() {
		if (!exportedPath) return;
		const track: Track = {
			id: `mix_${Date.now()}`,
			uri: exportedPath,
			filename: `${mixName}.wav`,
			title: mixName || 'My Mix',
			artist: 'Fragment Studio',
			album: 'Mixes',
			duration: totalDuration,
			dateAdded: Date.now(),
			lastScanned: Date.now(),
		};
		playerStore.setQueue([track], 0);
	}

	// ── Arrangements ───────────────────────────────────────────────────────────

	function saveCurrent() {
		const saved = studioStore.saveArrangement(mixName, layers, loadedArrangementId ?? undefined);
		loadedArrangementId = saved.id;
	}

	function loadArrangement(id: string) {
		const arr = studioStore.arrangements.find((a) => a.id === id);
		if (!arr) return;
		mixName = arr.name;
		layers = arr.layers.map((l) => ({ ...l }));
		loadedArrangementId = arr.id;
		arrangementsOpen = false;
		clearExport();
	}

	// ── Helpers ────────────────────────────────────────────────────────────────

	function fmtSec(s: number): string {
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	const LAYER_COLORS = ['#6C5CE7', '#00B894', '#E17055', '#FDCB6E', '#74B9FF', '#E84393', '#55EFC4', '#A29BFE'];
</script>

<div class="studio-page">
	<header class="studio-header">
		<a class="back-link" href="/fragments">← Fragments</a>
		<h1 class="studio-title">🎚 Fragment Studio</h1>
	</header>

	<div class="name-row">
		<input class="mix-name-input" type="text" bind:value={mixName} maxlength="40" aria-label="Mix name" />
		<button class="ghost-btn" onclick={saveCurrent} disabled={layers.length === 0}>💾 Save</button>
		<button class="ghost-btn" onclick={() => (arrangementsOpen = !arrangementsOpen)} aria-expanded={arrangementsOpen}>
			📂 Load
		</button>
	</div>

	{#if arrangementsOpen}
		<div class="arrangements-panel">
			{#if studioStore.arrangements.length === 0}
				<p class="panel-empty">No saved arrangements yet.</p>
			{:else}
				{#each studioStore.arrangements as arr (arr.id)}
					<div class="arr-row">
						<button class="arr-load" onclick={() => loadArrangement(arr.id)}>
							<span class="arr-name">{arr.name}</span>
							<span class="arr-meta">{arr.layers.length} layer{arr.layers.length !== 1 ? 's' : ''}</span>
						</button>
						<button class="arr-delete" onclick={() => studioStore.deleteArrangement(arr.id)} aria-label="Delete {arr.name}">✕</button>
					</div>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- Timeline visualization -->
	{#if validLayers.length > 0 && totalDuration > 0}
		<div class="timeline-viz" aria-hidden="true">
			{#each validLayers as l, i (l.id)}
				{@const f = fragFor(l)}
				<div class="viz-lane">
					<div
						class="viz-bar"
						style="
							left: {(l.offsetSecs / totalDuration) * 100}%;
							width: {(((f?.duration ?? 0)) / totalDuration) * 100}%;
							background: {LAYER_COLORS[i % LAYER_COLORS.length]};
							opacity: {0.35 + l.volume * 0.3};
						"
					></div>
				</div>
			{/each}
			<div class="viz-total">{fmtSec(totalDuration)}</div>
		</div>
	{/if}

	<!-- Layers -->
	{#if layers.length === 0}
		<div class="empty-state">
			<span class="empty-icon">🎚</span>
			<p class="empty-title">No layers yet</p>
			<p class="empty-sub">Add fragments and layer them into a mix.</p>
		</div>
	{:else}
		<div class="layer-list">
			{#each layers as layer, i (layer.id)}
				{@const frag = fragFor(layer)}
				<div class="layer-card" style="--layer-color: {LAYER_COLORS[i % LAYER_COLORS.length]}">
					<div class="layer-head">
						<span class="layer-dot"></span>
						<span class="layer-name">{frag?.name ?? 'Missing fragment'}</span>
						<span class="layer-dur">{frag ? fmtSec(frag.duration) : '—'}</span>
						<button class="layer-move" onclick={() => moveLayer(layer.id, -1)} disabled={i === 0} aria-label="Move up">↑</button>
						<button class="layer-move" onclick={() => moveLayer(layer.id, 1)} disabled={i === layers.length - 1} aria-label="Move down">↓</button>
						<button class="layer-remove" onclick={() => removeLayer(layer.id)} aria-label="Remove layer">✕</button>
					</div>

					{#if frag}
						<div class="layer-controls">
							<label class="ctrl">
								<span class="ctrl-label">Start (s)</span>
								<input
									type="number" min="0" step="0.5"
									value={layer.offsetSecs}
									onchange={(e) => updateLayer(layer.id, { offsetSecs: Math.max(0, Number(e.currentTarget.value) || 0) })}
								/>
							</label>
							<label class="ctrl ctrl-slider">
								<span class="ctrl-label">Vol {Math.round(layer.volume * 100)}%</span>
								<input
									type="range" min="0" max="1.5" step="0.05"
									value={layer.volume}
									oninput={(e) => updateLayer(layer.id, { volume: Number(e.currentTarget.value) })}
								/>
							</label>
							<label class="ctrl ctrl-slider">
								<span class="ctrl-label">Pan {layer.pan === 0 ? 'C' : layer.pan < 0 ? `L${Math.round(-layer.pan * 100)}` : `R${Math.round(layer.pan * 100)}`}</span>
								<input
									type="range" min="-1" max="1" step="0.05"
									value={layer.pan}
									oninput={(e) => updateLayer(layer.id, { pan: Number(e.currentTarget.value) })}
								/>
							</label>
							<label class="ctrl">
								<span class="ctrl-label">Fade in (s)</span>
								<input
									type="number" min="0" step="0.5" max={frag.duration}
									value={layer.fadeIn}
									onchange={(e) => updateLayer(layer.id, { fadeIn: Math.max(0, Number(e.currentTarget.value) || 0) })}
								/>
							</label>
							<label class="ctrl">
								<span class="ctrl-label">Fade out (s)</span>
								<input
									type="number" min="0" step="0.5" max={frag.duration}
									value={layer.fadeOut}
									onchange={(e) => updateLayer(layer.id, { fadeOut: Math.max(0, Number(e.currentTarget.value) || 0) })}
								/>
							</label>
						</div>
					{:else}
						<p class="layer-missing">This fragment was deleted. Remove the layer.</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Actions -->
	<div class="action-row">
		<button class="add-btn" onclick={() => (pickerOpen = !pickerOpen)} aria-expanded={pickerOpen}>+ Add Fragment</button>
		{#if layers.length >= 2}
			<div class="xfade-group">
				<button class="ghost-btn" onclick={autoCrossfade}>⤨ Crossfade</button>
				<input
					type="number" class="xfade-input" min="0" max="30" step="0.5"
					bind:value={crossfadeSecs}
					aria-label="Crossfade seconds"
				/>
				<span class="xfade-unit">s</span>
			</div>
		{/if}
	</div>

	{#if pickerOpen}
		<div class="picker-panel">
			{#if fragmentStore.fragments.length === 0}
				<p class="panel-empty">No fragments yet. Capture some with ✂️ on Now Playing.</p>
			{:else}
				{#each fragmentStore.fragments as frag (frag.id)}
					<button class="picker-row" onclick={() => addFragment(frag)}>
						{#if frag.emoji}<span>{frag.emoji}</span>{/if}
						<span class="picker-name">{frag.name}</span>
						<span class="picker-dur">{fmtSec(frag.duration)}</span>
					</button>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- Export -->
	<div class="export-section">
		<button class="export-btn" onclick={exportMix} disabled={validLayers.length === 0 || exporting}>
			{exporting ? 'Mixing…' : '⬇ Export Mix'}
		</button>
		{#if exportError}
			<p class="export-error">{exportError}</p>
		{/if}
		{#if exportedPath}
			<div class="export-done">
				<p class="export-path">✓ Mix saved: {exportedPath}</p>
				<button class="ghost-btn" onclick={playMix}>▶ Play Mix</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.studio-page {
		padding: 1.5rem;
		max-width: 700px;
		margin: 0 auto;
		color: var(--text);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.studio-header { display: flex; flex-direction: column; gap: 0.5rem; }
	.back-link { color: var(--accent); font-size: 0.9rem; font-weight: 600; text-decoration: none; align-self: flex-start; }
	.studio-title { font-size: 1.5rem; font-weight: 700; margin: 0; }

	/* ── Name / save / load ── */
	.name-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }

	.mix-name-input {
		flex: 1;
		min-width: 10rem;
		padding: 0.6rem 0.75rem;
		background: transparent;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text);
		font-size: 0.95rem;
		font-weight: 600;
		font-family: inherit;
	}
	.mix-name-input:focus { outline: none; border-color: var(--accent); }

	.ghost-btn {
		padding: 0.5rem 0.85rem;
		min-height: 44px;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.15s, color 0.15s;
	}
	.ghost-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
	.ghost-btn:disabled { opacity: 0.4; cursor: default; }

	/* ── Panels ── */
	.arrangements-panel,
	.picker-panel {
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.panel-empty { font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem; text-align: center; }

	.arr-row { display: flex; align-items: stretch; gap: 0.25rem; }

	.arr-load {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		min-height: 44px;
		background: none;
		border: none;
		border-radius: 8px;
		color: var(--text);
		font-family: inherit;
		font-size: 0.88rem;
		cursor: pointer;
		text-align: left;
	}
	.arr-load:hover { background: rgba(255, 255, 255, 0.06); }
	.arr-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.arr-meta { font-size: 0.75rem; color: var(--text-muted); flex-shrink: 0; }

	.arr-delete {
		width: 44px;
		background: none;
		border: none;
		border-radius: 8px;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.9rem;
	}
	.arr-delete:hover { color: #e17055; background: rgba(225, 112, 85, 0.08); }

	.picker-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		min-height: 44px;
		background: none;
		border: none;
		border-radius: 8px;
		color: var(--text);
		font-family: inherit;
		font-size: 0.88rem;
		cursor: pointer;
		text-align: left;
	}
	.picker-row:hover { background: rgba(255, 255, 255, 0.06); }
	.picker-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.picker-dur { font-size: 0.78rem; color: var(--accent); flex-shrink: 0; }

	/* ── Timeline viz ── */
	.timeline-viz {
		position: relative;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 0.6rem 0.75rem 1.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.viz-lane { position: relative; height: 10px; }

	.viz-bar {
		position: absolute;
		top: 0;
		height: 100%;
		border-radius: 5px;
		min-width: 4px;
	}

	.viz-total {
		position: absolute;
		right: 0.75rem;
		bottom: 0.25rem;
		font-size: 0.7rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	/* ── Empty state ── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 2.5rem 2rem;
		text-align: center;
	}
	.empty-icon { font-size: 2.5rem; opacity: 0.6; }
	.empty-title { font-size: 1rem; font-weight: 600; margin: 0; }
	.empty-sub { font-size: 0.85rem; color: var(--text-muted); margin: 0; }

	/* ── Layers ── */
	.layer-list { display: flex; flex-direction: column; gap: 0.6rem; }

	.layer-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-left: 3px solid var(--layer-color);
		border-radius: 12px;
		padding: 0.75rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.layer-head { display: flex; align-items: center; gap: 0.5rem; }
	.layer-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--layer-color); flex-shrink: 0; }
	.layer-name { flex: 1; font-size: 0.9rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
	.layer-dur { font-size: 0.78rem; color: var(--accent); flex-shrink: 0; }

	.layer-move,
	.layer-remove {
		width: 40px;
		height: 40px;
		background: none;
		border: 1px solid transparent;
		border-radius: 8px;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.9rem;
		flex-shrink: 0;
	}
	.layer-move:hover:not(:disabled) { border-color: var(--border-color); color: var(--text); }
	.layer-move:disabled { opacity: 0.3; cursor: default; }
	.layer-remove:hover { color: #e17055; border-color: rgba(225, 112, 85, 0.4); }

	.layer-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
	}

	.ctrl { display: flex; flex-direction: column; gap: 0.25rem; }
	.ctrl-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.05em; color: var(--text-muted); text-transform: uppercase; white-space: nowrap; }

	.ctrl input[type='number'] {
		width: 5rem;
		padding: 0.45rem 0.5rem;
		background: transparent;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text);
		font-size: 0.85rem;
		font-family: inherit;
		text-align: center;
	}
	.ctrl input[type='number']:focus { outline: none; border-color: var(--accent); }

	.ctrl-slider { flex: 1; min-width: 8rem; }
	.ctrl-slider input[type='range'] { width: 100%; accent-color: var(--layer-color); min-height: 24px; }

	.layer-missing { font-size: 0.8rem; color: #e17055; margin: 0; }

	/* ── Actions ── */
	.action-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

	.add-btn {
		padding: 0.6rem 1rem;
		min-height: 44px;
		background: var(--accent);
		border: none;
		border-radius: 8px;
		color: #fff;
		font-size: 0.88rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
	}

	.xfade-group { display: flex; align-items: center; gap: 0.35rem; }
	.xfade-input {
		width: 3.5rem;
		padding: 0.45rem 0.4rem;
		background: transparent;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text);
		font-size: 0.85rem;
		font-family: inherit;
		text-align: center;
	}
	.xfade-unit { font-size: 0.8rem; color: var(--text-muted); }

	/* ── Export ── */
	.export-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-bottom: 1rem;
	}

	.export-btn {
		padding: 0.85rem;
		min-height: 48px;
		background: none;
		border: 2px solid var(--accent);
		border-radius: 12px;
		color: var(--accent);
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s;
	}
	.export-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--accent) 12%, transparent); }
	.export-btn:disabled { opacity: 0.4; cursor: default; }

	.export-error { font-size: 0.82rem; color: #e17055; margin: 0; }

	.export-done { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-start; }
	.export-path { font-size: 0.78rem; color: #00b894; margin: 0; word-break: break-all; }
</style>
