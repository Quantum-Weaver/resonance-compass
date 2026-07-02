<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { profileStore } from '$lib/stores/profile.svelte';
	import { moodStore } from '$lib/stores/mood.svelte';
	import { PRESET_THEMES } from '$lib/theme/theme';

	// ── Theme section ──────────────────────────────────────────────────────────

	const themeOptions = [
		{ key: 'dark', icon: '🌙', name: 'Dark', accent: PRESET_THEMES.dark.accentColor },
		{ key: 'warm', icon: '🔥', name: 'Warm', accent: PRESET_THEMES.warm.accentColor },
		{ key: 'ocean', icon: '🌊', name: 'Ocean', accent: PRESET_THEMES.ocean.accentColor }
	];

	const activePreset = $derived.by(() => {
		const acc = themeStore.config.accentColor;
		return themeOptions.find(o => o.accent === acc)?.key ?? 'dark';
	});

	const fontSizes = [
		{ key: 'small' as const, label: 'Small' },
		{ key: 'medium' as const, label: 'Medium' },
		{ key: 'large' as const, label: 'Large' }
	];

	// ── Equalizer section ────────────────────────────────────────────────────────

	interface EqStateResponse {
		enabled: boolean;
		bands: number[];
		preamp: number;
		labels: string[];
	}

	const EQ_PRESETS = ['flat', 'rock', 'jazz', 'classical', 'vocal', 'bass_boost'] as const;
	type Preset = (typeof EQ_PRESETS)[number];
	const PRESET_LABELS: Record<Preset, string> = {
		flat: 'Flat',
		rock: 'Rock',
		jazz: 'Jazz',
		classical: 'Classical',
		vocal: 'Vocal',
		bass_boost: 'Bass Boost',
	};

	let eqOpen = $state(false);
	let eqEnabled = $state(false);
	let eqBands = $state<number[]>(new Array(10).fill(0));
	let eqPreamp = $state(0);
	let eqLabels = $state<string[]>(['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k']);
	let eqLoading = $state(true);
	let eqActivePreset = $state<string | null>(null);
	let eqDirty = $state(false);

	async function loadEq() {
		try {
			const s = await invoke<EqStateResponse>('get_eq_state');
			eqEnabled = s.enabled;
			eqBands = [...s.bands];
			eqPreamp = s.preamp;
			eqLabels = [...s.labels];
		} catch (e) {
			console.error('[settings] loadEq failed:', e);
		} finally {
			eqLoading = false;
		}
	}

	async function setEqBand(i: number, v: number) {
		eqBands[i] = v;
		eqBands = [...eqBands];
		eqActivePreset = null;
		eqDirty = true;
		try {
			await invoke('set_eq_band', { band: i, gainDb: v });
		} catch (e) {
			console.error('[settings] set_eq_band failed:', e);
		}
	}

	async function setEqPreamp(v: number) {
		eqPreamp = v;
		eqDirty = true;
		try {
			await invoke('set_eq_preamp', { gainDb: v });
		} catch (e) {
			console.error('[settings] set_eq_preamp failed:', e);
		}
	}

	async function toggleEq(val: boolean) {
		eqEnabled = val;
		try {
			await invoke('toggle_eq', { enabled: val });
		} catch (e) {
			console.error('[settings] toggle_eq failed:', e);
		}
	}

	async function applyPreset(preset: Preset) {
		eqActivePreset = preset;
		eqDirty = false;
		try {
			await invoke('set_eq_preset', { preset });
			const s = await invoke<EqStateResponse>('get_eq_state');
			eqBands = [...s.bands];
			eqEnabled = s.enabled;
		} catch (e) {
			console.error('[settings] set_eq_preset failed:', e);
		}
	}

	function dbLabel(db: number): string {
		return db === 0 ? '0' : (db > 0 ? '+' : '') + db.toFixed(1);
	}

	// ── Custom EQ presets (localStorage) ──────────────────────────────────────────

	interface CustomEqPreset {
		name: string;
		bands: number[];
		preamp: number;
	}

	const CUSTOM_EQ_KEY = 'resonance-compass-eq-custom-presets';
	let customEqPresets = $state<CustomEqPreset[]>([]);

	function loadCustomEqPresets() {
		try {
			const raw = localStorage.getItem(CUSTOM_EQ_KEY);
			if (raw) customEqPresets = JSON.parse(raw) as CustomEqPreset[];
		} catch (e) {
			console.error('[settings] loadCustomEqPresets failed:', e);
		}
	}

	function persistCustomEqPresets() {
		try {
			localStorage.setItem(CUSTOM_EQ_KEY, JSON.stringify(customEqPresets));
		} catch (e) {
			console.error('[settings] persistCustomEqPresets failed:', e);
		}
	}

	function saveEqAsCustom() {
		const name = (prompt('Name this preset:') ?? '').trim();
		if (!name) return;
		customEqPresets = [
			...customEqPresets.filter((p) => p.name !== name),
			{ name, bands: [...eqBands], preamp: eqPreamp },
		];
		persistCustomEqPresets();
		eqActivePreset = 'c:' + name;
		eqDirty = false;
	}

	function deleteCustomEqPreset(name: string) {
		customEqPresets = customEqPresets.filter((p) => p.name !== name);
		persistCustomEqPresets();
		if (eqActivePreset === 'c:' + name) eqActivePreset = null;
	}

	async function applyCustomEqPreset(cp: CustomEqPreset) {
		eqActivePreset = 'c:' + cp.name;
		eqDirty = false;
		eqBands = [...cp.bands];
		eqPreamp = cp.preamp;
		for (let i = 0; i < cp.bands.length; i++) {
			try {
				await invoke('set_eq_band', { band: i, gainDb: cp.bands[i] });
			} catch (e) {
				console.error('[settings] applyCustomEqPreset set_eq_band failed:', e);
			}
		}
		try {
			await invoke('set_eq_preamp', { gainDb: cp.preamp });
		} catch (e) {
			console.error('[settings] applyCustomEqPreset set_eq_preamp failed:', e);
		}
	}

	onMount(() => {
		loadEq();
		loadCustomEqPresets();
		// Deep-linked from MiniPlayer's 🎛️ EQ button (goto('/settings#eq'))
		if (page.url.hash === '#eq') {
			eqOpen = true;
			requestAnimationFrame(() => {
				document.getElementById('eq-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			});
		}
	});

	// ── Data Sovereignty section ────────────────────────────────────────────────
	// Export/import cover EVERYTHING the app stores: the songs table (with lyrics
	// and cover art), all mood events, and every localStorage key (playlists,
	// history, fragments, arrangements, profiles, focus, sattva, theme, EQ
	// presets, personal emoji definitions, player state, onboarding flags).

	const trackCount = $derived(libraryStore.tracks.length);

	let purgeState = $state<'idle' | 'confirm1' | 'confirm2'>('idle');
	let pendingExport = $state(false);
	let showUninstallGuide = $state(false);

	interface CompassExport {
		format: string;
		version: number;
		exportedAt: string;
		library: unknown[];
		moodEvents: unknown[];
		localStorage: Record<string, string>;
	}

	async function buildSnapshot(): Promise<CompassExport> {
		const ls: Record<string, string> = {};
		for (let i = 0; i < localStorage.length; i++) {
			const k = localStorage.key(i);
			if (k !== null) ls[k] = localStorage.getItem(k) ?? '';
		}
		return {
			format: 'resonance-compass-export',
			version: 2,
			exportedAt: new Date().toISOString(),
			library: libraryStore.tracks,
			moodEvents: await moodStore.getAllMoodEvents(),
			localStorage: ls,
		};
	}

	async function exportData() {
		const json = JSON.stringify(await buildSnapshot(), null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		const date = new Date().toISOString().split('T')[0];
		a.href = url;
		a.download = `resonance-compass-export-${date}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// ── Import ──

	let importState = $state<'idle' | 'confirm' | 'importing' | 'error'>('idle');
	let importError = $state<string | null>(null);
	let importFileEl = $state<HTMLInputElement | null>(null);
	let pendingImport: CompassExport | null = null;
	let importSummary = $state('');

	function onImportFile(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const data = JSON.parse(String(reader.result)) as CompassExport;
				if (data.format !== 'resonance-compass-export') {
					throw new Error('Not a Resonance Compass export file.');
				}
				pendingImport = data;
				const nTracks = Array.isArray(data.library) ? data.library.length : 0;
				const nMoods = Array.isArray(data.moodEvents) ? data.moodEvents.length : 0;
				const nKeys = Object.keys(data.localStorage ?? {}).length;
				importSummary = `${nTracks} tracks · ${nMoods} mood events · ${nKeys} settings entries`;
				importState = 'confirm';
				importError = null;
			} catch (err) {
				importError = err instanceof Error ? err.message : String(err);
				importState = 'error';
			}
			if (importFileEl) importFileEl.value = '';
		};
		reader.readAsText(file);
	}

	async function executeImport() {
		if (!pendingImport) return;
		importState = 'importing';
		try {
			for (const [k, v] of Object.entries(pendingImport.localStorage ?? {})) {
				localStorage.setItem(k, v);
			}
			if (Array.isArray(pendingImport.library) && pendingImport.library.length > 0) {
				await libraryStore.importTracks(pendingImport.library as never[]);
			}
			if (Array.isArray(pendingImport.moodEvents) && pendingImport.moodEvents.length > 0) {
				await moodStore.importMoodEvents(pendingImport.moodEvents as never[]);
			}
			location.reload();
		} catch (err) {
			importError = err instanceof Error ? err.message : String(err);
			importState = 'error';
		}
	}

	function cancelImport() {
		pendingImport = null;
		importState = 'idle';
		importError = null;
	}

	// ── Purge ──

	function startPurge(withExport: boolean) {
		pendingExport = withExport;
		purgeState = 'confirm1';
	}

	function cancelPurge() {
		purgeState = 'idle';
		pendingExport = false;
	}

	async function executePurge() {
		if (pendingExport) await exportData();
		await libraryStore.clearLibrary();
		await moodStore.purgeAll();
		localStorage.clear();
		location.reload();
	}
</script>

<div class="settings" style="padding-top: env(safe-area-inset-top, 0px);">
	<header class="settings-header">
		<h1 class="settings-title">Settings</h1>
	</header>

	<!-- ── Section 1: Theme ── -->
	<section class="section">
		<h2 class="section-title">Theme</h2>

		<div class="theme-grid">
			{#each themeOptions as opt}
				<button
					class="theme-card"
					class:selected={activePreset === opt.key}
					style="--card-accent: {opt.accent};"
					onclick={() => themeStore.setPreset(opt.key)}
					aria-pressed={activePreset === opt.key}
				>
					<span class="theme-icon">{opt.icon}</span>
					<span class="theme-name">{opt.name}</span>
					<div class="theme-swatch" style="background: {opt.accent};"></div>
				</button>
			{/each}
		</div>

		<div class="font-row">
			<span class="font-label">Font size</span>
			<div class="font-btns" role="group" aria-label="Font size">
				{#each fontSizes as { key, label }}
					<button
						class="font-btn"
						class:active={themeStore.config.fontSize === key}
						onclick={() => themeStore.setFontSize(key)}
					>{label}</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── Section: Sensory Profiles ── -->
	<section class="section">
		<h2 class="section-title">Sensory Profiles</h2>
		<div class="profiles-row">
			<div class="profiles-info">
				<span class="profiles-count">
					{profileStore.profiles.length} profile{profileStore.profiles.length !== 1 ? 's' : ''}
				</span>
				<span class="profiles-hint">Bundle theme, EQ, and font — switch with one tap.</span>
			</div>
			<button class="profiles-manage-btn" onclick={() => goto('/profiles')}>Manage →</button>
		</div>
		<label class="toggle-wrap profiles-toggle" aria-label="Show profiles in MiniPlayer">
			<input
				type="checkbox"
				checked={profileStore.showInMiniPlayer}
				onchange={(e) => profileStore.setShowInMiniPlayer(e.currentTarget.checked)}
			/>
			<span>Show quick-switch in the MiniPlayer panel</span>
		</label>
	</section>

	<!-- ── Section 2: Equalizer ── -->
	<section class="section" id="eq-section">
		<button class="section-toggle" onclick={() => (eqOpen = !eqOpen)} aria-expanded={eqOpen}>
			<span>🎛️ Equalizer</span>
			<span class="toggle-arrow">{eqOpen ? '▲' : '▼'}</span>
		</button>

		{#if eqOpen}
			<div class="eq-section">
				<div class="eq-header">
					<label class="toggle-wrap" aria-label="Enable equalizer">
						<input
							type="checkbox"
							class="sr-only"
							checked={eqEnabled}
							onchange={(e) => toggleEq((e.target as HTMLInputElement).checked)}
						/>
						<span class="toggle-track" class:on={eqEnabled}><span class="toggle-thumb"></span></span>
						<span class="toggle-label">{eqEnabled ? 'On' : 'Off'}</span>
					</label>
				</div>

				<div class="presets-row">
					{#each EQ_PRESETS as preset}
						<button
							class="preset-btn"
							class:active={eqActivePreset === preset}
							onclick={() => applyPreset(preset)}
						>{PRESET_LABELS[preset]}</button>
					{/each}

					{#each customEqPresets as cp (cp.name)}
						<span class="custom-wrap">
							<button
								class="preset-btn custom-btn"
								class:active={eqActivePreset === 'c:' + cp.name}
								onclick={() => applyCustomEqPreset(cp)}
							>{cp.name}</button>
							<button class="preset-del" onclick={() => deleteCustomEqPreset(cp.name)} aria-label="Delete preset {cp.name}">✕</button>
						</span>
					{/each}

					{#if eqDirty && eqActivePreset === null}
						<span class="preset-btn custom-indicator">Custom</span>
					{/if}
				</div>

				{#if eqDirty}
					<button class="save-custom-btn" onclick={saveEqAsCustom}>💾 Save as Custom</button>
				{/if}

				{#if eqLoading}
					<p class="loading-hint">Loading EQ state…</p>
				{:else}
					<div class="sliders-wrap">
						<!-- Preamp -->
						<div class="slider-col preamp-col">
							<span class="band-db">{dbLabel(eqPreamp)}</span>
							<div class="slider-track-wrap">
								<input type="range" class="vslider" min="-12" max="12" step="0.5"
									value={eqPreamp}
									oninput={(e) => setEqPreamp(parseFloat((e.target as HTMLInputElement).value))}
									aria-label="Preamp gain" disabled={!eqEnabled}
								/>
								<div class="center-line"></div>
							</div>
							<span class="band-label">Pre</span>
						</div>

						<div class="divider"></div>

						{#each eqBands as band, i}
							<div class="slider-col">
								<span class="band-db">{dbLabel(band)}</span>
								<div class="slider-track-wrap">
									<input type="range" class="vslider" min="-12" max="12" step="0.5"
										value={band}
										oninput={(e) => setEqBand(i, parseFloat((e.target as HTMLInputElement).value))}
										aria-label="{eqLabels[i]} Hz" disabled={!eqEnabled}
									/>
									<div class="center-line"></div>
								</div>
								<span class="band-label">{eqLabels[i]}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</section>

	<!-- ── Section 3: Data Sovereignty ── -->
	<section class="section">
		<h2 class="section-title">Data Sovereignty</h2>

		<p class="track-count">
			{trackCount === 0
				? 'No data stored yet.'
				: `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'} in your library.`}
		</p>

		<div class="data-actions">
			<button class="btn-data" onclick={exportData} disabled={trackCount === 0}>
				Export All Data
			</button>
			<button class="btn-data warning" onclick={() => startPurge(true)} disabled={trackCount === 0}>
				Export &amp; Purge
			</button>
		</div>

		<div class="import-zone">
			<input
				bind:this={importFileEl}
				type="file"
				accept="application/json,.json"
				class="import-file-input"
				onchange={onImportFile}
				aria-label="Choose export file to import"
			/>
			{#if importState === 'idle'}
				<button class="btn-data" onclick={() => importFileEl?.click()}>Import Data</button>
				<p class="import-hint">Restore a previous export — library, playlists, moods, history, fragments, settings.</p>
			{:else if importState === 'confirm'}
				<div class="confirm-card">
					<p class="confirm-text">Import this export? {importSummary}. Existing data with matching ids will be overwritten.</p>
					<div class="confirm-actions">
						<button class="btn-neutral" onclick={cancelImport}>Cancel</button>
						<button class="btn-data" onclick={executeImport}>Import &amp; Restart</button>
					</div>
				</div>
			{:else if importState === 'importing'}
				<p class="import-hint">Importing…</p>
			{:else if importState === 'error'}
				<div class="confirm-card">
					<p class="confirm-text">Import failed: {importError}</p>
					<div class="confirm-actions">
						<button class="btn-neutral" onclick={cancelImport}>OK</button>
					</div>
				</div>
			{/if}
		</div>

		<div class="danger-zone">
			<p class="danger-label">Danger zone</p>

			{#if purgeState === 'idle'}
				<button class="btn-danger" onclick={() => startPurge(false)} disabled={trackCount === 0}>
					Purge All Data
				</button>

			{:else if purgeState === 'confirm1'}
				<div class="confirm-card">
					<p class="confirm-text">
						{#if pendingExport}
							This will export your library and permanently delete all stored data. This cannot be undone.
						{:else}
							This will permanently delete all stored data. This cannot be undone.
						{/if}
					</p>
					<div class="confirm-actions">
						<button class="btn-neutral" onclick={cancelPurge}>Cancel</button>
						<button class="btn-danger" onclick={() => (purgeState = 'confirm2')}>Continue</button>
					</div>
				</div>

			{:else}
				<div class="confirm-card final">
					<p class="confirm-text">
						{#if pendingExport}
							Are you absolutely sure? Your library will be downloaded then permanently deleted.
						{:else}
							Are you absolutely sure? All data, playlists, and settings will be removed.
						{/if}
					</p>
					<div class="confirm-actions">
						<button class="btn-neutral" onclick={cancelPurge}>Cancel</button>
						<button class="btn-danger-filled" onclick={executePurge}>Delete Everything</button>
					</div>
				</div>
			{/if}
		</div>

		<div class="uninstall-section">
			{#if !showUninstallGuide}
				<button class="btn-uninstall" onclick={() => (showUninstallGuide = true)}>
					Uninstall App
				</button>
			{:else}
				<div class="uninstall-guide">
					<p class="uninstall-intro">Resonance Compass stores all data on your device. To completely remove the app and all data:</p>
					<ol class="uninstall-steps">
						<li>Export your data if you want to keep it</li>
						<li>Go to Android Settings → Apps → Resonance Compass → Uninstall</li>
					</ol>
					<p class="uninstall-note">This ensures Android removes all app data.</p>
					<button class="btn-neutral" onclick={() => (showUninstallGuide = false)}>Got it</button>
				</div>
			{/if}
		</div>
	</section>

	<!-- ── Section 4: About ── -->
	<section class="section">
		<h2 class="section-title">About</h2>

		<div class="about-card">
			<div class="about-app">
				<span class="about-name">Resonance Compass</span>
				<span class="about-version">v2.0.0</span>
			</div>
			<p class="about-tag">A sovereign music player and self-understanding system.</p>
			<p class="about-built">Built with Aethelred by Quantum Weaver for the AudHDities Sanctuary.</p>
			<p class="about-license">All data belongs to the vessel. The Resonance Grammar governs.</p>
		</div>
	</section>
</div>

<style>
	.settings {
		min-height: 100%;
	}

	/* Header */
	.settings-header {
		padding: 1rem 1.25rem 0.75rem;
		border-bottom: 1px solid var(--border-color);
	}

	.settings-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	/* Sections */
	.section {
		padding: 1.25rem 1.25rem 0;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 1.25rem;
	}

	.section-title {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin: 0;
	}

	/* ── Theme ── */
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.65rem;
	}

	.theme-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 1rem 0.5rem 0.75rem;
		background: var(--bg-surface);
		border: 2px solid var(--border-color);
		border-radius: 14px;
		cursor: pointer;
		transition: border-color 0.2s, background 0.2s, transform 0.15s;
	}
	.theme-card:active { transform: scale(0.97); }
	.theme-card.selected {
		border-color: var(--card-accent);
		background: color-mix(in srgb, var(--card-accent) 10%, var(--bg-surface));
	}

	.theme-icon { font-size: 1.6rem; line-height: 1; }
	.theme-name { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
	.theme-swatch { width: 24px; height: 4px; border-radius: 2px; }

	/* Font size */
	.font-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.font-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.font-btns {
		display: flex;
		gap: 0.35rem;
	}

	.font-btn {
		padding: 0.3rem 0.7rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 20px;
		color: var(--text-secondary);
		font-size: 0.78rem;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s, background 0.15s;
	}
	.font-btn.active {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	/* ── Data Sovereignty ── */
	.track-count {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
	}

	.data-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.btn-data {
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 10px;
		color: var(--text);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s, background 0.15s;
	}
	.btn-data:not(:disabled):hover { border-color: var(--accent); }
	.btn-data:disabled { opacity: 0.35; cursor: not-allowed; }

	.btn-data.warning {
		border-color: rgba(243, 156, 18, 0.5);
		color: #f39c12;
	}
	.btn-data.warning:not(:disabled):hover {
		background: color-mix(in srgb, #f39c12 10%, var(--bg-surface));
		border-color: #f39c12;
	}

	/* Danger zone */
	.danger-zone {
		border: 1px solid rgba(231, 76, 60, 0.3);
		border-radius: 12px;
		padding: 0.875rem 1rem;
		background: color-mix(in srgb, #e74c3c 5%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.danger-label {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(231, 76, 60, 0.7);
		margin: 0;
	}

	.btn-danger {
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: 1.5px solid #e74c3c;
		border-radius: 10px;
		color: #e74c3c;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}
	.btn-danger:not(:disabled):hover { background: rgba(231, 76, 60, 0.1); }
	.btn-danger:disabled { opacity: 0.35; cursor: not-allowed; }

	.btn-danger-filled {
		padding: 0.6rem 1rem;
		background: #e74c3c;
		border: none;
		border-radius: 8px;
		color: #fff;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
	}
	.btn-danger-filled:active { transform: scale(0.97); }

	.btn-neutral {
		padding: 0.6rem 1rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.btn-neutral:hover { border-color: var(--text-muted); }

	/* Confirmation card */
	.confirm-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.confirm-card.final .confirm-text { color: #e74c3c; }

	.confirm-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
	}

	.confirm-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	/* ── About ── */
	.about-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.about-app {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.about-name {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text);
	}

	.about-version {
		font-size: 0.75rem;
		color: var(--text-muted);
		background: var(--bg);
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 0.1rem 0.45rem;
	}

	.about-tag {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	.about-built, .about-license {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}

	/* ── Uninstall Guide ── */
	.uninstall-section {
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-color);
	}

	.btn-uninstall {
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 10px;
		color: var(--text-muted);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s, color 0.15s;
	}
	.btn-uninstall:hover { border-color: var(--text-muted); color: var(--text-secondary); }

	.uninstall-guide {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.uninstall-intro, .uninstall-note {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.55;
	}

	.uninstall-steps {
		margin: 0;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.uninstall-steps li {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* ── Equalizer ── */
	.section-toggle {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 0.65rem 0.85rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		cursor: pointer;
		color: var(--text);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.section-toggle:hover {
		border-color: var(--accent);
	}
	.toggle-arrow {
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	.eq-section {
		border: 1px solid var(--border-color);
		border-top: none;
		border-radius: 0 0 8px 8px;
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.eq-header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.toggle-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.toggle-track {
		width: 40px;
		height: 22px;
		border-radius: 11px;
		background: var(--bg);
		border: 1px solid var(--border-color);
		position: relative;
		transition: background 0.2s, border-color 0.2s;
		display: block;
	}
	.toggle-track.on {
		background: var(--accent);
		border-color: var(--accent);
	}
	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.2s;
		display: block;
	}
	.toggle-track.on .toggle-thumb {
		transform: translateX(18px);
	}
	.toggle-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		min-width: 2rem;
	}

	.presets-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.preset-btn {
		padding: 0.35rem 0.8rem;
		border-radius: 20px;
		border: 1px solid var(--border-color);
		background: var(--bg-surface);
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}
	.preset-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.preset-btn.active {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	.sliders-wrap {
		display: flex;
		align-items: flex-end;
		gap: 0.4rem;
		padding: 0.25rem 0;
		overflow-x: auto;
		min-height: 190px;
	}
	.slider-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
		width: 34px;
	}
	.preamp-col {
		width: 42px;
	}
	.band-db {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--accent);
		min-height: 1rem;
		text-align: center;
	}
	.slider-track-wrap {
		position: relative;
		height: 140px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.vslider {
		-webkit-appearance: none;
		appearance: none;
		writing-mode: vertical-lr;
		direction: rtl;
		width: 26px;
		height: 140px;
		background: transparent;
		cursor: pointer;
		outline: none;
		padding: 0;
		margin: 0;
	}
	.vslider:disabled {
		opacity: 0.35;
		cursor: default;
	}
	.vslider::-webkit-slider-runnable-track {
		width: 4px;
		background: var(--border-color);
		border-radius: 2px;
	}
	.vslider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--accent);
		margin-left: -6px;
	}
	.vslider::-moz-range-track {
		width: 4px;
		background: var(--border-color);
		border-radius: 2px;
	}
	.vslider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--accent);
		border: none;
	}
	.center-line {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 18px;
		height: 1px;
		background: var(--border-color);
		pointer-events: none;
	}
	.band-label {
		font-size: 0.68rem;
		color: var(--text-muted);
		text-align: center;
	}
	.divider {
		width: 1px;
		height: 140px;
		background: var(--border-color);
		flex-shrink: 0;
		align-self: center;
	}

	.custom-wrap {
		display: inline-flex;
		align-items: center;
	}
	.custom-btn {
		border-radius: 20px 0 0 20px;
		border-right: none;
	}
	.custom-btn.active {
		border-right: none;
	}
	.preset-del {
		padding: 0.35rem 0.45rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-left: none;
		border-radius: 0 20px 20px 0;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 0.62rem;
	}
	.preset-del:hover {
		color: #e17055;
		background: color-mix(in srgb, #e17055 10%, transparent);
	}
	.custom-indicator {
		opacity: 0.55;
		cursor: default;
		border-style: dashed;
		background: transparent;
	}
	.save-custom-btn {
		align-self: flex-start;
		padding: 0.3rem 0.85rem;
		border-radius: 20px;
		border: 1px solid var(--accent);
		background: transparent;
		color: var(--accent);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
	}
	.save-custom-btn:hover {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.loading-hint {
		color: var(--text-muted);
		font-size: 0.88rem;
		margin: 0;
	}

	/* ── Import ── */
	.import-zone {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.75rem;
		align-items: flex-start;
	}

	.import-file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
	}

	.import-hint {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin: 0;
	}

	/* ── Sensory Profiles ── */
	.profiles-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.profiles-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.profiles-count {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text);
	}

	.profiles-hint {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.profiles-manage-btn {
		padding: 0.5rem 0.9rem;
		min-height: 44px;
		background: none;
		border: 1px solid var(--accent);
		border-radius: 8px;
		color: var(--accent);
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		flex-shrink: 0;
	}

	.profiles-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
		cursor: pointer;
	}
</style>
