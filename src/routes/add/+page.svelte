<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { echoStore } from '$lib/stores/echo.svelte';
	import { SENSES, type Sense } from '$lib/data/senses';
	import { EMOJI_DEFS } from '$lib/data/emojis';

	function toLocalISO(date: Date): string {
		const offset = date.getTimezoneOffset() * 60000;
		return new Date(date.getTime() - offset).toISOString().slice(0, 16);
	}

	let name = $state('');
	let selectedSense = $state('other');
	let selectedSubcategory = $state('custom');
	let customSubcategoryText = $state('');
	let selectedEmoji = $state('');
	let note = $state('');
	let intensity = $state(3);
	let useCustomTime = $state(false);
	let customTimestamp = $state(toLocalISO(new Date()));
	let saving = $state(false);
	let saveError = $state('');
	let saveSuccess = $state(false);

	// Edit mode
	let editId = $state<string | null>(null);
	const isEditMode = $derived(editId !== null);
	let prefilled = false; // plain var prevents re-fill on subsequent echoes updates

	onMount(() => {
		const id = page.url.searchParams.get('edit');
		if (!id) return;
		editId = id;
		showAdvanced = true;
	});

	$effect(() => {
		const allEchoes = echoStore.echoes;
		const id = editId;
		if (!id || prefilled || allEchoes.length === 0) return;
		const echo = allEchoes.find((e) => e.id === id);
		if (!echo) return;
		name = echo.name;
		selectedSense = echo.sense;
		selectedSubcategory = echo.subcategory || 'custom';
		customSubcategoryText = '';
		selectedEmoji = echo.emoji;
		note = echo.note ?? '';
		intensity = echo.intensity;
		useCustomTime = true;
		customTimestamp = toLocalISO(new Date(echo.timestamp));
		prefilled = true;
	});

	// Progressive disclosure: hide advanced fields until 10 echoes
	let showAdvanced = $state(false);
	const isSimplified = $derived(!showAdvanced && echoStore.totalCount < 10);

	// Emoji nudge: show "no pressure" after 5s with no emoji selected
	let showEmojiNudge = $state(false);
	$effect(() => {
		if (selectedEmoji) { showEmojiNudge = false; return; }
		const t = setTimeout(() => { showEmojiNudge = true; }, 5000);
		return () => clearTimeout(t);
	});

	// Disambiguation: track dismissal per emoji to avoid reshowing for same choice
	let disambigDismissedForEmoji = $state<string | null>(null);

	const disambiguationSenses = $derived.by((): Sense[] => {
		if (!selectedEmoji || selectedEmoji === disambigDismissedForEmoji) return [];
		const priorUses = echoStore.echoes.filter(
			(e) => e.emoji === selectedEmoji && e.sense !== 'not_sure'
		);
		if (priorUses.length === 0) return [];
		const sensesUsed = [...new Set(priorUses.map((e) => e.sense))];
		if (sensesUsed.length < 2) return [];
		return sensesUsed
			.map((id) => SENSES.find((s) => s.id === id))
			.filter((s): s is Sense => !!s)
			.slice(0, 3);
	});

	const currentSense = $derived(SENSES.find((s) => s.id === selectedSense));

	function selectSense(senseId: string) {
		selectedSense = senseId;
		if (senseId !== 'not_sure') {
			const sense = SENSES.find((s) => s.id === senseId);
			selectedSubcategory = sense?.subcategories[0]?.id ?? 'custom';
		}
		customSubcategoryText = '';
	}

	function getFinalSubcategory(): string {
		if (selectedSense === 'not_sure') return '';
		if (selectedSubcategory === 'custom' && customSubcategoryText.trim()) {
			return customSubcategoryText.trim();
		}
		return selectedSubcategory;
	}

	function getTimestamp(): number {
		if (useCustomTime && customTimestamp) {
			return new Date(customTimestamp).getTime();
		}
		return Date.now();
	}

	async function save() {
		console.log('[save] called');
		if (!name.trim() || saving) {
			console.log('[save] blocked — name empty or already saving', { nameEmpty: !name.trim(), saving });
			return;
		}
		saving = true;
		saveError = '';
		const payload = {
			name: name.trim(),
			sense: selectedSense,
			subcategory: getFinalSubcategory(),
			emoji: selectedEmoji || '✨',
			note: note.trim() || undefined,
			intensity,
			timestamp: getTimestamp()
		};
		console.log('[save] payload:', JSON.stringify(payload));
		try {
			if (editId) {
				await echoStore.updateEcho(editId, payload);
				console.log('[save] updateEcho returned — showing confirmation');
			} else {
				await echoStore.addEcho(payload);
				console.log('[save] addEcho returned — showing confirmation');
			}
			saveSuccess = true;
			await new Promise((r) => setTimeout(r, 900));
			goto('/');
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			console.error('[save] FAILED:', msg, e);
			saveError = msg;
		} finally {
			saving = false;
		}
	}
</script>

<div class="add-page">
	<header class="add-header">
		<button class="back-btn" onclick={() => goto('/')}>←</button>
		<h1 class="add-title">{isEditMode ? 'Edit Echo' : 'New Echo'}</h1>
	</header>

	<div class="form">
		<!-- DB error banner -->
		{#if echoStore.dbError}
			<div class="db-error-banner">
				⚠️ Database not ready: {echoStore.dbError}
			</div>
		{/if}

		<!-- Name -->
		<section class="form-section">
			<input
				type="text"
				bind:value={name}
				placeholder="Name this moment..."
				class="name-input"
				maxlength="120"
			/>
		</section>

		<!-- Sense picker -->
		<section class="form-section">
			<div class="section-label">What sense?</div>
			<div class="sense-scroll">
				{#each SENSES as sense}
					<button
						class="sense-btn"
						class:selected={selectedSense === sense.id}
						onclick={() => selectSense(sense.id)}
					>
						<span class="sense-emoji">{sense.emoji}</span>
						<span class="sense-name">{sense.name}</span>
					</button>
				{/each}
				<button
					class="sense-btn not-sure-btn"
					class:selected={selectedSense === 'not_sure'}
					onclick={() => selectSense('not_sure')}
				>
					<span class="sense-emoji">❓</span>
					<span class="sense-name">Not Sure</span>
				</button>
			</div>
		</section>

		<!-- Subcategory chips -->
		{#if !isSimplified && currentSense && currentSense.subcategories.length > 0}
			<section class="form-section">
				<div class="section-label">Subcategory</div>
				<div class="chip-row">
					{#each currentSense.subcategories as sub}
						<button
							class="chip"
							class:selected={selectedSubcategory === sub.id}
							onclick={() => (selectedSubcategory = sub.id)}
						>
							{sub.name}
						</button>
					{/each}
				</div>
				{#if selectedSubcategory === 'custom'}
					<input
						type="text"
						bind:value={customSubcategoryText}
						placeholder="Name it..."
						class="custom-sub-input"
						maxlength="40"
					/>
				{/if}
			</section>
		{/if}

		<!-- Emoji grid -->
		<section class="form-section">
			<div class="section-label">Feeling</div>
			<div class="emoji-grid" role="group" aria-label="Select a feeling">
				{#each EMOJI_DEFS as def}
					<button
						class="emoji-btn"
						class:selected={selectedEmoji === def.emoji}
						onclick={() => (selectedEmoji = selectedEmoji === def.emoji ? '' : def.emoji)}
						title={def.label}
						aria-label={def.label}
						aria-pressed={selectedEmoji === def.emoji}
					>
						{def.emoji}
					</button>
				{/each}
			</div>
			<div class="emoji-skip-row">
				<button
					class="emoji-skip-btn"
					class:active={selectedEmoji === '❓'}
					onclick={() => (selectedEmoji = selectedEmoji === '❓' ? '' : '❓')}
					aria-pressed={selectedEmoji === '❓'}
				>— skip / not sure</button>
				{#if showEmojiNudge && !selectedEmoji}
					<span class="emoji-nudge">No pressure. You can skip this.</span>
				{/if}
			</div>
			{#if selectedEmoji && selectedEmoji !== '❓'}
				{@const def = EMOJI_DEFS.find((d) => d.emoji === selectedEmoji)}
				{#if def}
					<p class="emoji-def">{def.definition}</p>
				{/if}
			{/if}
			{#if disambiguationSenses.length > 0}
				<div class="disambig">
					<p class="disambig-text">
						You've used {selectedEmoji} across different senses before. Is this more about...
					</p>
					<div class="disambig-chips">
						{#each disambiguationSenses as sense}
							<button
								class="disambig-chip"
								onclick={() => { selectSense(sense.id); disambigDismissedForEmoji = selectedEmoji; }}
							>{sense.emoji} {sense.name}</button>
						{/each}
						<button
							class="disambig-chip chip-muted"
							onclick={() => { disambigDismissedForEmoji = selectedEmoji; }}
						>✨ Something else</button>
					</div>
				</div>
			{/if}
		</section>

		{#if isSimplified}
			<div class="disclosure-hint">
				<span class="disclosure-text">More options unlock after 10 echoes.</span>
				<button class="disclosure-toggle" onclick={() => (showAdvanced = true)}>Advanced</button>
			</div>
		{/if}

		{#if !isSimplified}
		<!-- Note -->
		<section class="form-section">
			<div class="section-label">Anything else? <span class="optional">(optional)</span></div>
			<textarea bind:value={note} placeholder="..." class="note-input" rows="3" maxlength="500"></textarea>
		</section>

		<!-- Intensity -->
		<section class="form-section">
			<div class="section-label">How intense? <span class="intensity-val">{intensity}/5</span></div>
			<div class="intensity-row" role="group" aria-label="Intensity level">
				{#each [1, 2, 3, 4, 5] as n}
					<button
						class="intensity-dot"
						class:filled={n <= intensity}
						onclick={() => (intensity = n)}
						aria-label="Intensity {n}"
						aria-pressed={intensity === n}
					></button>
				{/each}
			</div>
		</section>

		<!-- Timestamp -->
		<section class="form-section">
			<div class="section-label">When?</div>
			<div class="time-toggle">
				<button class="time-btn" class:active={!useCustomTime} onclick={() => (useCustomTime = false)}>
					Now
				</button>
				<button class="time-btn" class:active={useCustomTime} onclick={() => (useCustomTime = true)}>
					Custom
				</button>
			</div>
			{#if useCustomTime}
				<input type="datetime-local" bind:value={customTimestamp} class="datetime-input" />
			{/if}
		</section>
		{/if}

		<!-- Actions -->
		<section class="form-section actions">
			<button class="cancel-btn" onclick={() => goto('/')}>Cancel</button>
			<button
				class="save-btn"
				class:success={saveSuccess}
				onclick={save}
				disabled={!name.trim() || saving || !!echoStore.dbError || saveSuccess}
			>
				{saveSuccess ? '✓' : saving ? 'Saving…' : isEditMode ? 'Update' : 'Save Echo'}
			</button>
		</section>
		{#if saveError}
			<p class="save-error">{saveError}</p>
		{/if}
	</div>
</div>

<style>
	.add-page {
		min-height: 100%;
		padding-top: env(safe-area-inset-top, 0px);
	}

	.db-error-banner {
		margin: 1rem 0 0;
		padding: 0.75rem 1rem;
		background: color-mix(in srgb, #e74c3c 15%, transparent);
		border: 1px solid #e74c3c;
		border-radius: 8px;
		color: #e74c3c;
		font-size: 0.85rem;
	}

	.save-error {
		margin: 0.5rem 0 0;
		font-size: 0.82rem;
		color: #e74c3c;
		text-align: center;
	}

	.add-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem 0.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.back-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 1.4rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		line-height: 1;
	}
	.back-btn:hover { background: var(--bg-surface); }

	.add-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text);
		margin: 0;
	}

	.form {
		padding: 0 1.25rem 2rem;
	}

	.form-section {
		margin-top: 1.5rem;
	}

	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.6rem;
	}

	.optional {
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
	}

	.intensity-val {
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
		color: var(--accent);
	}

	/* Name input */
	.name-input {
		width: 100%;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 10px;
		color: var(--text);
		font-size: 1.1rem;
		padding: 0.75rem 1rem;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}
	.name-input:focus { border-color: var(--accent); }
	.name-input::placeholder { color: var(--text-muted); }

	/* Sense scroll */
	.sense-scroll {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		scrollbar-width: none;
	}
	.sense-scroll::-webkit-scrollbar { display: none; }

	.sense-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 10px;
		color: var(--text-secondary);
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
		transition: border-color 0.15s, color 0.15s;
	}
	.sense-btn.selected {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.sense-emoji { font-size: 1.4rem; line-height: 1; }
	.sense-name { font-size: 0.65rem; font-weight: 600; }

	/* Chips */
	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		padding: 0.3rem 0.75rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 20px;
		color: var(--text-secondary);
		font-size: 0.8rem;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}
	.chip.selected {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.custom-sub-input {
		margin-top: 0.5rem;
		width: 100%;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text);
		font-size: 0.9rem;
		padding: 0.5rem 0.75rem;
		outline: none;
		box-sizing: border-box;
	}
	.custom-sub-input:focus { border-color: var(--accent); }
	.custom-sub-input::placeholder { color: var(--text-muted); }

	/* Emoji grid */
	.emoji-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.emoji-btn {
		font-size: 1.75rem;
		padding: 0.5rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 10px;
		cursor: pointer;
		text-align: center;
		line-height: 1;
		transition: border-color 0.15s, transform 0.1s;
	}
	.emoji-btn.selected {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		transform: scale(1.08);
	}
	.emoji-btn:active { transform: scale(0.96); }

	/* Note */
	.note-input {
		width: 100%;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 10px;
		color: var(--text);
		font-size: 0.95rem;
		padding: 0.75rem 1rem;
		outline: none;
		resize: none;
		box-sizing: border-box;
		font-family: inherit;
		transition: border-color 0.15s;
	}
	.note-input:focus { border-color: var(--accent); }
	.note-input::placeholder { color: var(--text-muted); }

	/* Intensity */
	.intensity-row {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.intensity-dot {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2px solid var(--border-color);
		background: transparent;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, transform 0.1s;
	}
	.intensity-dot.filled {
		background: var(--accent);
		border-color: var(--accent);
	}
	.intensity-dot:active { transform: scale(0.9); }

	/* Timestamp */
	.time-toggle {
		display: flex;
		gap: 0.5rem;
	}

	.time-btn {
		padding: 0.4rem 1rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 20px;
		color: var(--text-secondary);
		font-size: 0.85rem;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}
	.time-btn.active {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.datetime-input {
		margin-top: 0.5rem;
		width: 100%;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text);
		font-size: 0.9rem;
		padding: 0.5rem 0.75rem;
		outline: none;
		box-sizing: border-box;
	}
	.datetime-input:focus { border-color: var(--accent); }

	/* Actions */
	.actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 2rem;
	}

	.cancel-btn {
		flex: 1;
		padding: 0.85rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-color);
		border-radius: 12px;
		color: var(--text-secondary);
		font-size: 1rem;
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.cancel-btn:hover { border-color: var(--text-muted); }

	.save-btn {
		flex: 2;
		padding: 0.85rem;
		background: var(--accent);
		border: none;
		border-radius: 12px;
		color: #fff;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
	}
	.save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.save-btn:not(:disabled):active { transform: scale(0.98); }
	.save-btn.success {
		background: #27ae60;
		opacity: 1;
	}

	/* Not Sure sense button */
	.not-sure-btn { border-style: dashed; }
	.not-sure-btn.selected { border-style: solid; }

	/* Progressive disclosure hint */
	.disclosure-hint {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.25rem;
		padding: 0.5rem 0.75rem;
		background: color-mix(in srgb, var(--accent) 5%, transparent);
		border-radius: 8px;
	}

	.disclosure-text {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.disclosure-toggle {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 0.78rem;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
		white-space: nowrap;
	}

	/* Emoji skip row */
	.emoji-skip-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.4rem;
	}

	.emoji-skip-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.78rem;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s;
		white-space: nowrap;
	}
	.emoji-skip-btn:hover { color: var(--text-secondary); }
	.emoji-skip-btn.active { color: var(--accent); font-weight: 600; }

	.emoji-nudge {
		font-size: 0.78rem;
		color: var(--text-muted);
		font-style: italic;
		margin: 0;
		animation: fade-in 0.4s ease;
	}

	/* Disambiguation prompt */
	.disambig {
		margin-top: 0.6rem;
		padding: 0.6rem 0.75rem;
		background: color-mix(in srgb, var(--accent) 6%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		animation: fade-in 0.2s ease;
	}

	.disambig-text {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}

	.disambig-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.disambig-chip {
		padding: 0.28rem 0.65rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--accent);
		border-radius: 20px;
		color: var(--accent);
		font-size: 0.8rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.disambig-chip:hover { background: color-mix(in srgb, var(--accent) 15%, transparent); }
	.disambig-chip.chip-muted {
		border-color: var(--border-color);
		color: var(--text-muted);
	}
	.disambig-chip.chip-muted:hover { color: var(--text-secondary); }

	.emoji-def {
		margin: 0.5rem 0 0;
		padding: 0.5rem 0.75rem;
		font-size: 0.82rem;
		color: var(--text-muted);
		line-height: 1.55;
		background: color-mix(in srgb, var(--accent) 6%, transparent);
		border-radius: 8px;
		border-left: 2px solid color-mix(in srgb, var(--accent) 40%, transparent);
		animation: fade-in 0.2s ease;
	}

	@keyframes fade-in {
		from { opacity: 0; transform: translateY(-4px); }
		to   { opacity: 1; transform: translateY(0); }
	}
</style>
