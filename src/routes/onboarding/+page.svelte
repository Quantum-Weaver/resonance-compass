<script lang="ts">
	import { goto } from '$app/navigation';
	import { libraryStore, isAndroid } from '$lib/stores/library.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { PRESET_THEMES } from '$lib/theme/theme';
	import { EMOJI_DEFS } from '$lib/data/emojis';
	import GradientPulse from '$lib/components/GradientPulse.svelte';

	const MOOD_EMOJIS = EMOJI_DEFS.slice(0, 8);

	const THEMES = [
		{ key: 'dark',  label: 'Dark',  icon: '🌙', accent: PRESET_THEMES.dark.accentColor,  desc: 'Deep space'  },
		{ key: 'warm',  label: 'Warm',  icon: '🔥', accent: PRESET_THEMES.warm.accentColor,  desc: 'Hearth glow' },
		{ key: 'ocean', label: 'Ocean', icon: '🌊', accent: PRESET_THEMES.ocean.accentColor, desc: 'Cosmic sea'  },
	];

	let step = $state(0);
	let vesselName = $state('');
	let selectedEmojis = $state<string[]>([]);
	let selectedPreset = $state(themeStore.config.presetName?.toLowerCase() ?? 'dark');

	type ScanPhase = 'idle' | 'scanning' | 'done';
	let scanPhase = $state<ScanPhase>('idle');

	const trackCount = $derived(libraryStore.tracks.length);
	const scanProgress = $derived(libraryStore.scanProgress);
	const scanError = $derived(libraryStore.scanError);

	$effect(() => {
		if (libraryStore.isScanning) {
			scanPhase = 'scanning';
		} else if (scanPhase === 'scanning') {
			scanPhase = 'done';
		}
	});

	function saveNameAndAdvance() {
		if (vesselName.trim()) {
			try { localStorage.setItem('resonance-compass-vessel-name', vesselName.trim()); } catch {}
		}
		step = 1;
	}

	function toggleEmoji(emoji: string) {
		if (selectedEmojis.includes(emoji)) {
			selectedEmojis = selectedEmojis.filter((e) => e !== emoji);
		} else if (selectedEmojis.length < 3) {
			selectedEmojis = [...selectedEmojis, emoji];
		}
	}

	function saveSensoryProfile() {
		if (selectedEmojis.length > 0) {
			try { localStorage.setItem('sensory_profile', JSON.stringify(selectedEmojis)); } catch {}
		}
		step = 3;
	}

	function selectTheme(key: string) {
		selectedPreset = key;
		themeStore.setPreset(key);
	}

	function completeOnboarding() {
		themeStore.setPreset(selectedPreset);
		try { localStorage.setItem('onboarding_complete', 'true'); } catch {}
		goto('/');
	}

	async function startLibraryScan() {
		scanPhase = 'idle';
		await libraryStore.scanLibrary();
	}
</script>

<div class="onboarding" style="padding-top: env(safe-area-inset-top, 0px);">
	<div class="screen-wrap">

		<!-- ── Screen 0: Welcome ── -->
		{#if step === 0}
			<div class="screen">
				<div class="screen-body">
					<div class="sigil-wrap">
						<GradientPulse pulse={true}>
							<div class="sigil">🧭</div>
						</GradientPulse>
					</div>

					<div class="header-text">
						<h1 class="ob-title">Welcome to Compass</h1>
						<p class="ob-sub">Your sovereign music player.<br>No cloud. No ads. No extraction.</p>
					</div>

					<div class="name-section">
						<label class="name-label" for="vessel-name">What should we call you?</label>
						<input
							id="vessel-name"
							type="text"
							bind:value={vesselName}
							placeholder="Your name, a nickname, anything"
							class="name-input"
							maxlength="40"
							autocomplete="off"
						/>
						<p class="name-hint">This is who you are in the Sanctuary.</p>
					</div>
				</div>

				<div class="screen-actions">
					<button class="btn-primary" onclick={saveNameAndAdvance}>Begin</button>
					<button class="btn-skip" onclick={saveNameAndAdvance}>Skip setup</button>
				</div>
			</div>

		<!-- ── Screen 1: Library Setup ── -->
		{:else if step === 1}
			<div class="screen">
				<div class="screen-body">
					<div class="step-icon">📂</div>
					<h2 class="ob-title">Where is your music?</h2>
					<p class="ob-sub">Your music stays on your device.<br>Nothing is uploaded or shared.</p>

					{#if scanPhase === 'idle'}
						<div class="screen-actions inner">
							<button class="btn-primary" onclick={startLibraryScan}>
								{isAndroid ? 'Scan Music Folder' : 'Select Music Folder'}
							</button>
							{#if isAndroid}
								<p class="scan-hint">Scans the Music and Download folders on this device</p>
							{/if}
							<button class="btn-skip" onclick={() => step = 2}>I'll do this later</button>
						</div>

					{:else if scanPhase === 'scanning'}
						<p class="scan-status">Scanning… {trackCount} tracks found</p>
						<div class="progress-bar">
							<div class="progress-fill" style="width: {Math.max(4, Math.round(scanProgress * 100))}%"></div>
						</div>
						<p class="scan-hint">This may take a moment for large libraries</p>

					{:else if scanError?.startsWith('PERMISSION_DENIED')}
						<div class="perm-notice">
							<p class="perm-msg">Resonance Compass needs access to your music files to scan your library. Your files never leave your device.</p>
							<p class="perm-hint">Go to Settings → Apps → Resonance Compass → Permissions → Music and audio (or Files) and enable access, then try again.</p>
						</div>
						<div class="screen-actions inner">
							<button class="btn-primary" onclick={startLibraryScan}>Try Again</button>
							<button class="btn-skip" onclick={() => step = 2}>I'll do this later</button>
						</div>

					{:else if scanError}
						<p class="scan-error-msg">{scanError}</p>
						<div class="screen-actions inner">
							<button class="btn-primary" onclick={startLibraryScan}>Retry</button>
							<button class="btn-skip" onclick={() => step = 2}>I'll do this later</button>
						</div>

					{:else}
						<div class="scan-done">
							<span class="done-check">✓</span>
							<span>Found {trackCount} track{trackCount !== 1 ? 's' : ''}</span>
						</div>
						<div class="screen-actions inner">
							<button class="btn-primary" onclick={() => step = 2}>Continue</button>
							<button class="btn-secondary" onclick={startLibraryScan}>Rescan</button>
						</div>
					{/if}
				</div>

				{#if scanPhase === 'idle' || scanError || scanPhase === 'done'}
					<div class="screen-actions outer-skip">
						{#if scanPhase !== 'idle'}
							<button class="btn-skip" onclick={() => step = 2}>I'll do this later</button>
						{/if}
					</div>
				{/if}
			</div>

		<!-- ── Screen 2: Sensory Profile ── -->
		{:else if step === 2}
			<div class="screen">
				<div class="screen-body">
					<div class="step-icon">✨</div>
					<h2 class="ob-title">How do you want to feel<br>while listening?</h2>
					<p class="ob-sub">Choose up to 3 that resonate with you.</p>

					<div class="emoji-picker">
						{#each MOOD_EMOJIS as item (item.emoji)}
							<button
								class="emoji-btn"
								class:selected={selectedEmojis.includes(item.emoji)}
								style="--ec: {item.color}"
								onclick={() => toggleEmoji(item.emoji)}
								aria-pressed={selectedEmojis.includes(item.emoji)}
								aria-label={item.label}
							>
								<span class="emoji-glyph">{item.emoji}</span>
								<span class="emoji-name">{item.label}</span>
							</button>
						{/each}
					</div>

					<p class="step-hint">You can change this anytime in Resonance.</p>
				</div>

				<div class="screen-actions">
					<button class="btn-primary" onclick={saveSensoryProfile}>Continue</button>
					<button class="btn-skip" onclick={() => step = 3}>Skip</button>
				</div>
			</div>

		<!-- ── Screen 3: Theme ── -->
		{:else if step === 3}
			<div class="screen">
				<div class="screen-body">
					<div class="step-icon">🎨</div>
					<h2 class="ob-title">Choose your atmosphere</h2>
					<p class="ob-sub">Tap to feel the difference.</p>

					<div class="theme-grid">
						{#each THEMES as t (t.key)}
							<button
								class="theme-card"
								class:selected={selectedPreset === t.key}
								style="--tc: {t.accent}"
								onclick={() => selectTheme(t.key)}
								aria-pressed={selectedPreset === t.key}
							>
								<span class="theme-icon">{t.icon}</span>
								<span class="theme-name">{t.label}</span>
								<span class="theme-desc">{t.desc}</span>
								{#if selectedPreset === t.key}
									<span class="theme-check" aria-hidden="true">✓</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<div class="screen-actions">
					<button class="btn-primary" onclick={() => step = 4}>Continue</button>
				</div>
			</div>

		<!-- ── Screen 4: Complete ── -->
		{:else if step === 4}
			<div class="screen">
				<div class="screen-body center">
					<div class="sigil-wrap">
						<GradientPulse pulse={true}>
							<div class="sigil done-sigil">✓</div>
						</GradientPulse>
					</div>

					<h2 class="ob-title">You're ready.</h2>
					<p class="ob-sub">
						{#if trackCount > 0}
							Your library has {trackCount} track{trackCount !== 1 ? 's' : ''}.<br>
						{/if}
						Your space is set up.
					</p>
				</div>

				<div class="screen-actions">
					<button class="btn-primary enter-btn" onclick={completeOnboarding}>
						Enter Resonance Compass
					</button>
				</div>
			</div>
		{/if}

	</div>

	<!-- Progress dots -->
	<div
		class="dots"
		role="progressbar"
		aria-valuenow={step + 1}
		aria-valuemin={1}
		aria-valuemax={5}
		aria-label="Step {step + 1} of 5"
	>
		{#each [0, 1, 2, 3, 4] as n (n)}
			<span class="dot" class:active={n === step} class:past={n < step}></span>
		{/each}
	</div>
</div>

<style>
	/* ── Layout ── */
	.onboarding {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--bg);
		color: var(--text);
		overflow: hidden;
	}

	.screen-wrap {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow-y: auto;
		padding: 2rem 1.5rem;
	}

	.screen {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 480px;
		gap: 1.5rem;
		animation: fadeSlide 0.28s ease-out;
	}

	@keyframes fadeSlide {
		from { opacity: 0; transform: translateY(10px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.screen-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1rem;
	}

	.screen-body.center {
		justify-content: center;
	}

	/* ── Sigil ── */
	.sigil-wrap {
		width: 100px;
		height: 100px;
		flex-shrink: 0;
	}

	.sigil {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		border: 2px solid color-mix(in srgb, var(--accent) 35%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
	}

	.done-sigil {
		font-size: 2.4rem;
		color: var(--accent);
		font-weight: 700;
	}

	.step-icon {
		font-size: 2.6rem;
		filter: drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 40%, transparent));
	}

	/* ── Typography ── */
	.ob-title {
		font-size: 1.8rem;
		font-weight: 700;
		line-height: 1.2;
		color: var(--text);
		margin: 0;
	}

	h2.ob-title { font-size: 1.45rem; }

	.ob-sub {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
	}

	.step-hint {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin: 0;
	}

	/* ── Welcome: name input ── */
	.name-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.name-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.name-input {
		width: 100%;
		padding: 0.8rem 1rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 12px;
		color: var(--text);
		font-size: 1rem;
		text-align: center;
		outline: none;
		box-sizing: border-box;
		font-family: inherit;
		transition: border-color 0.15s;
	}

	.name-input:focus { border-color: var(--accent); }
	.name-input::placeholder { color: var(--text-muted); }

	.name-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
	}

	/* ── Library scan ── */
	.scan-status {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin: 0.25rem 0;
	}

	.progress-bar {
		width: 280px;
		max-width: 90%;
		height: 4px;
		background: var(--border-color);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.scan-hint {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin: 0;
	}

	.scan-error-msg {
		font-size: 0.85rem;
		color: color-mix(in srgb, red 70%, var(--text));
		text-align: center;
		margin: 0.25rem 0;
	}

	.perm-notice {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.9rem 1rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
	}

	.perm-msg {
		font-size: 0.875rem;
		color: var(--text);
		margin: 0;
		line-height: 1.5;
	}

	.perm-hint {
		font-size: 0.78rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	.scan-done {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.05rem;
		color: var(--text);
		font-weight: 600;
	}

	.done-check { color: var(--accent); font-size: 1.25rem; }

	/* ── Sensory profile emoji picker ── */
	.emoji-picker {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.55rem;
		width: 100%;
	}

	.emoji-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.32rem;
		padding: 0.65rem 0.4rem;
		background: none;
		border: 2px solid var(--border-color);
		border-radius: 12px;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.18s;
	}

	.emoji-btn:hover {
		border-color: var(--ec);
		background: color-mix(in srgb, var(--ec) 14%, transparent);
		transform: scale(1.04);
	}

	.emoji-btn.selected {
		border-color: var(--ec);
		background: color-mix(in srgb, var(--ec) 24%, transparent);
		box-shadow: 0 0 16px color-mix(in srgb, var(--ec) 38%, transparent);
		transform: scale(1.06);
	}

	.emoji-glyph { font-size: 1.65rem; line-height: 1; }
	.emoji-name  { font-size: 0.7rem; color: var(--text-secondary); line-height: 1; }

	/* ── Theme cards ── */
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		width: 100%;
	}

	.theme-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 1.25rem 0.5rem 1rem;
		background: var(--bg-surface);
		border: 2px solid var(--border-color);
		border-radius: 14px;
		cursor: pointer;
		font-family: inherit;
		position: relative;
		transition: border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.15s;
	}

	.theme-card:hover {
		border-color: var(--tc);
		background: color-mix(in srgb, var(--tc) 10%, var(--bg-surface));
		transform: translateY(-2px);
	}

	.theme-card.selected {
		border-color: var(--tc);
		background: color-mix(in srgb, var(--tc) 16%, var(--bg-surface));
		box-shadow: 0 0 22px color-mix(in srgb, var(--tc) 28%, transparent);
	}

	.theme-icon { font-size: 1.9rem; }
	.theme-name { font-size: 0.9rem; font-weight: 700; color: var(--text); }
	.theme-desc { font-size: 0.68rem; color: var(--text-muted); }

	.theme-check {
		position: absolute;
		top: 0.4rem;
		right: 0.5rem;
		color: var(--tc);
		font-size: 0.85rem;
		font-weight: 700;
	}

	/* ── Buttons ── */
	.screen-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.screen-actions.inner {
		margin-top: 0.5rem;
	}

	.outer-skip {
		margin-top: -0.5rem;
	}

	.btn-primary {
		width: 100%;
		padding: 0.9rem;
		background: var(--accent);
		border: none;
		border-radius: 12px;
		color: #fff;
		font-size: 1rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: filter 0.15s, transform 0.1s;
	}

	.btn-primary:hover { filter: brightness(1.1); }
	.btn-primary:active { transform: scale(0.98); }

	.enter-btn { letter-spacing: 0.01em; }

	.btn-secondary {
		padding: 0.7rem 1.5rem;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 12px;
		color: var(--text-secondary);
		font-size: 0.95rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}

	.btn-secondary:hover { border-color: var(--accent); color: var(--text); }

	.btn-skip {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.875rem;
		font-family: inherit;
		cursor: pointer;
		padding: 0.25rem 0.75rem;
		transition: color 0.15s;
		text-decoration: underline;
		text-decoration-color: transparent;
		text-underline-offset: 3px;
	}

	.btn-skip:hover { color: var(--text-secondary); text-decoration-color: currentColor; }

	/* ── Progress dots ── */
	.dots {
		display: flex;
		justify-content: center;
		gap: 0.45rem;
		padding: 1rem 0 calc(1.5rem + env(safe-area-inset-bottom, 0px));
		flex-shrink: 0;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 3px;
		background: var(--border-color);
		transition: background 0.22s ease, width 0.22s ease;
	}

	.dot.past   { background: color-mix(in srgb, var(--accent) 50%, transparent); }
	.dot.active { background: var(--accent); width: 20px; }

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		.screen        { animation: none; }
		.btn-primary   { transition: filter 0.15s; }
		.btn-primary:active { transform: none; }
		.emoji-btn:hover,
		.emoji-btn.selected { transform: none; }
		.theme-card:hover   { transform: none; }
		.dot { transition: background 0.22s ease; }
	}
</style>
