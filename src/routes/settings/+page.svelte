<script lang="ts">
	import { goto } from '$app/navigation';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
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

	// ── Data Sovereignty section ────────────────────────────────────────────────

	const trackCount = $derived(libraryStore.tracks.length);

	let purgeState = $state<'idle' | 'confirm1' | 'confirm2'>('idle');
	let pendingExport = $state(false);
	let showUninstallGuide = $state(false);

	function exportData() {
		const json = JSON.stringify(libraryStore.tracks, null, 2);
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

	function startPurge(withExport: boolean) {
		pendingExport = withExport;
		purgeState = 'confirm1';
	}

	function cancelPurge() {
		purgeState = 'idle';
		pendingExport = false;
	}

	async function executePurge() {
		if (pendingExport) exportData();
		await libraryStore.clearLibrary();
		localStorage.removeItem('resonance-compass-vessel-name');
		localStorage.removeItem('resonance-compass-theme');
		localStorage.removeItem('onboarding_complete');
		goto('/onboarding');
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

	<!-- ── Section 2: Data Sovereignty ── -->
	<section class="section">
		<h2 class="section-title">Data Sovereignty</h2>

		<p class="track-count">
			{trackCount === 0
				? 'No data stored yet.'
				: `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'} in your library.`}
		</p>

		<div class="data-actions">
			<button class="btn-data" onclick={exportData} disabled={trackCount === 0}>
				Export Library Data
			</button>
			<button class="btn-data warning" onclick={() => startPurge(true)} disabled={trackCount === 0}>
				Export &amp; Purge
			</button>
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

	<!-- ── Section 3: About ── -->
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
</style>
