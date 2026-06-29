<script lang="ts">
	import { goto } from '$app/navigation';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { PRESET_THEMES } from '$lib/theme/theme';
	import GradientPulse from '$lib/components/GradientPulse.svelte';

	let screen = $state(0);
	let vesselName = $state('');
	let selectedPreset = $state('dark');

	const themeOptions = [
		{ key: 'dark', icon: '🌙', name: 'Dark', accent: PRESET_THEMES.dark.accentColor },
		{ key: 'warm', icon: '🔥', name: 'Warm', accent: PRESET_THEMES.warm.accentColor },
		{ key: 'ocean', icon: '🌊', name: 'Ocean', accent: PRESET_THEMES.ocean.accentColor }
	];

	function begin() {
		if (vesselName.trim()) {
			localStorage.setItem('resonance-echoes-vessel-name', vesselName.trim());
		}
		screen = 1;
	}

	function next() {
		screen = 2;
	}

	function selectTheme(key: string) {
		selectedPreset = key;
		themeStore.setPreset(key);
	}

	function enterEchoes() {
		themeStore.setPreset(selectedPreset);
		localStorage.setItem('onboarding_complete', 'true');
		goto('/');
	}
</script>

<div class="onboarding" style="padding-top: env(safe-area-inset-top, 0px);">

	{#if screen === 0}
		<!-- Screen 1: Welcome -->
		<div class="screen">
			<div class="screen-body">
				<div class="sigil-wrap">
					<GradientPulse pulse={true}>
						<div class="sigil">🧭</div>
					</GradientPulse>
				</div>

				<div class="header-text">
					<h1 class="ob-title">Welcome to Echoes</h1>
					<p class="ob-sub">Your space to log anything with feeling. All stored on your device. No accounts. No cloud.</p>
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
				<button class="btn-primary" onclick={begin}>Begin</button>
				<button class="btn-skip" onclick={begin}>Skip</button>
			</div>

			<div class="progress" aria-label="Step 1 of 3">
				{#each [0, 1, 2] as i}
					<div class="dot" class:active={screen === i} class:done={screen > i}></div>
				{/each}
			</div>
		</div>

	{:else if screen === 1}
		<!-- Screen 2: How it works -->
		<div class="screen">
			<div class="screen-body">
				<h1 class="ob-title">How it works</h1>

				<div class="how-cards">
					<div class="how-card">
						<span class="how-icon">📖</span>
						<div class="how-text">
							<strong>Log anything</strong>
							<span>Name a moment, choose a sense, tag it with an emoji.</span>
						</div>
					</div>
					<div class="how-card">
						<span class="how-icon">✨</span>
						<div class="how-text">
							<strong>See patterns</strong>
							<span>Gentle insights emerge over time — no pressure, no judgment.</span>
						</div>
					</div>
					<div class="how-card">
						<span class="how-icon">🔒</span>
						<div class="how-text">
							<strong>Your data stays yours</strong>
							<span>Export anytime. Delete anytime. Nothing leaves your device.</span>
						</div>
					</div>
				</div>
			</div>

			<div class="screen-actions">
				<button class="btn-primary" onclick={next}>Continue</button>
				<button class="btn-skip" onclick={next}>Skip</button>
			</div>

			<div class="progress" aria-label="Step 2 of 3">
				{#each [0, 1, 2] as i}
					<div class="dot" class:active={screen === i} class:done={screen > i}></div>
				{/each}
			</div>
		</div>

	{:else}
		<!-- Screen 3: Theme -->
		<div class="screen">
			<div class="screen-body">
				<h1 class="ob-title">Choose your atmosphere</h1>

				<div class="theme-grid">
					{#each themeOptions as opt}
						<button
							class="theme-card"
							class:selected={selectedPreset === opt.key}
							style="--card-accent: {opt.accent};"
							onclick={() => selectTheme(opt.key)}
							aria-pressed={selectedPreset === opt.key}
						>
							<span class="theme-icon">{opt.icon}</span>
							<span class="theme-name">{opt.name}</span>
							<div class="theme-swatch" style="background: {opt.accent};"></div>
						</button>
					{/each}
				</div>
			</div>

			<div class="screen-actions">
				<button class="btn-primary" onclick={enterEchoes}>Enter Echoes</button>
				<button class="btn-skip" onclick={enterEchoes}>Skip</button>
			</div>

			<div class="progress" aria-label="Step 3 of 3">
				{#each [0, 1, 2] as i}
					<div class="dot" class:active={screen === i} class:done={screen > i}></div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.onboarding {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

	/* Each screen fills the viewport */
	.screen {
		flex: 1;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 2rem 1.5rem 0;
		box-sizing: border-box;
	}

	/* Vertically centers the content area */
	.screen-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1.75rem;
	}

	/* ── Screen 1: Welcome ── */
	.sigil-wrap {
		display: flex;
		justify-content: center;
	}

	.sigil {
		font-size: 4.5rem;
		line-height: 1;
		text-align: center;
	}

	.header-text {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		text-align: center;
	}

	.ob-title {
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
		text-align: center;
	}

	.ob-sub {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.65;
		margin: 0;
		text-align: center;
	}

	.name-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.name-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
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
		transition: border-color 0.15s;
	}
	.name-input:focus { border-color: var(--accent); }
	.name-input::placeholder { color: var(--text-muted); }

	.name-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-align: center;
		margin: 0;
	}

	/* ── Screen 2: How it works ── */
	.how-cards {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.how-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
	}

	.how-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
		width: 2rem;
		text-align: center;
	}

	.how-text {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.how-text strong {
		font-size: 0.95rem;
		color: var(--text);
	}
	.how-text span {
		font-size: 0.82rem;
		color: var(--text-muted);
		line-height: 1.5;
	}

	/* ── Screen 3: Theme ── */
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.theme-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.4rem 0.5rem 1rem;
		background: var(--bg-surface);
		border: 2px solid var(--border-color);
		border-radius: 16px;
		cursor: pointer;
		transition: border-color 0.2s, background 0.2s, transform 0.15s;
	}
	.theme-card:active { transform: scale(0.97); }
	.theme-card.selected {
		border-color: var(--card-accent);
		background: color-mix(in srgb, var(--card-accent) 10%, var(--bg-surface));
		transform: scale(1.03);
	}

	.theme-icon { font-size: 2rem; line-height: 1; }
	.theme-name { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
	.theme-swatch {
		width: 28px;
		height: 5px;
		border-radius: 3px;
	}

	/* ── Actions ── */
	.screen-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.btn-primary {
		width: 100%;
		padding: 0.9rem;
		background: var(--accent);
		border: none;
		border-radius: 12px;
		color: #fff;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
	}
	.btn-primary:active { transform: scale(0.98); }

	.btn-skip {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0.25rem 0.75rem;
		transition: color 0.15s;
	}
	.btn-skip:hover { color: var(--text-secondary); }

	/* ── Progress dots ── */
	.progress {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		padding: 1.25rem 0 calc(1.25rem + env(safe-area-inset-bottom, 0px));
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 4px;
		background: var(--border-color);
		transition: width 0.3s ease, background 0.3s ease;
	}
	.dot.active {
		width: 22px;
		background: var(--accent);
	}
	.dot.done {
		background: color-mix(in srgb, var(--accent) 45%, var(--border-color));
	}
</style>
