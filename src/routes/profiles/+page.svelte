<script lang="ts">
	import { profileStore, type SensoryProfile } from '$lib/stores/profile.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';

	const profiles = $derived(profileStore.profiles);
	const activeId = $derived(profileStore.activeProfileId);

	// ── Create form ────────────────────────────────────────────────────────────

	let creating = $state(false);
	let newName = $state('');
	let newEmoji = $state('✨');
	let nameInputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (creating && nameInputEl) nameInputEl.focus();
	});

	const QUICK_EMOJIS = ['✨', '🎯', '😌', '🌙', '⚡', '🌊', '🔥', '🌿', '🎵', '😴', '🧘', '💜'];

	function submitCreate() {
		if (!newName.trim()) return;
		profileStore.createProfile(newName, newEmoji);
		creating = false;
		newName = '';
		newEmoji = '✨';
	}

	// ── Edit state ─────────────────────────────────────────────────────────────

	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editEmoji = $state('');
	let editTheme = $state('dark');
	let editFont = $state<'small' | 'medium' | 'large'>('medium');
	let editEq = $state('flat');
	let editPl = $state<string | null>(null);

	function startEdit(p: SensoryProfile) {
		if (editingId === p.id) { editingId = null; return; }
		editingId = p.id;
		editName = p.name;
		editEmoji = p.emoji;
		editTheme = p.themePreset;
		editFont = p.fontSize;
		editEq = p.eqPreset;
		editPl = p.playlistId;
	}

	function saveEdit(id: string) {
		profileStore.updateProfile(id, {
			name: editName.trim() || 'My Profile',
			emoji: editEmoji.trim() || '✨',
			themePreset: editTheme,
			fontSize: editFont,
			eqPreset: editEq,
			playlistId: editPl,
		});
		editingId = null;
	}

	// ── Delete confirm ─────────────────────────────────────────────────────────

	let confirmDeleteId = $state<string | null>(null);

	function deleteConfirmed(id: string) {
		profileStore.deleteProfile(id);
		confirmDeleteId = null;
		if (editingId === id) editingId = null;
	}

	// ── Activation ─────────────────────────────────────────────────────────────

	let activating = $state<string | null>(null);

	async function activate(id: string) {
		activating = id;
		await profileStore.activateProfile(id);
		activating = null;
	}

	// ── Summary line ───────────────────────────────────────────────────────────

	function summarize(p: SensoryProfile): string {
		const parts: string[] = [];
		const t = p.themePreset.charAt(0).toUpperCase() + p.themePreset.slice(1);
		parts.push(`${t} theme`);
		if (p.eqPreset && p.eqPreset !== 'flat') {
			parts.push(p.eqPreset.replace('_', ' ') + ' EQ');
		}
		if (p.fontSize !== 'medium') parts.push(`${p.fontSize} text`);
		if (p.playlistId) {
			const pl = playlistStore.getPlaylist(p.playlistId);
			if (pl) parts.push(pl.name);
		}
		return parts.join(' · ');
	}

	const EQ_PRESETS = ['flat', 'rock', 'jazz', 'classical', 'vocal', 'bass_boost'] as const;
	const THEME_KEYS = ['dark', 'warm', 'ocean', 'forest', 'sunset', 'amoled'] as const;
	const FONT_SIZES = ['small', 'medium', 'large'] as const;
	const playlists = $derived(playlistStore.playlists);
</script>

<div class="profiles-page">
	<div class="page-header">
		<div class="header-left">
			<h1>Sensory Profiles</h1>
			<span class="count">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</span>
		</div>
		{#if !creating}
			<button class="create-btn" onclick={() => { creating = true; newName = ''; newEmoji = '✨'; }}>
				+ Create
			</button>
		{/if}
	</div>

	<p class="page-helper">Switch your entire experience with one tap — theme, EQ, and font together.</p>

	{#if creating}
		<div class="create-form">
			<div class="emoji-quick">
				{#each QUICK_EMOJIS as e}
					<button
						class="emoji-btn"
						class:active={newEmoji === e}
						onclick={() => (newEmoji = e)}
						aria-label={e}
					>{e}</button>
				{/each}
			</div>
			<div class="create-row">
				<span class="new-emoji-preview">{newEmoji}</span>
				<input
					bind:this={nameInputEl}
					class="name-input"
					type="text"
					placeholder="Profile name (e.g. Morning Focus)"
					maxlength="30"
					bind:value={newName}
					onkeydown={(e) => { if (e.key === 'Enter') submitCreate(); if (e.key === 'Escape') creating = false; }}
				/>
				<button class="confirm-btn" onclick={submitCreate} disabled={!newName.trim()}>Create</button>
				<button class="cancel-btn" onclick={() => (creating = false)}>✕</button>
			</div>
		</div>
	{/if}

	{#if profiles.length === 0 && !creating}
		<div class="empty-state">
			<span class="empty-icon">✨</span>
			<p class="empty-title">No profiles yet</p>
			<p class="empty-sub">
				Create one for Focus, one for when you're Overwhelmed, one for Night Wind-Down.<br />
				Each profile bundles a theme, EQ, and font — activated with a single tap.
			</p>
			<button class="create-btn large" onclick={() => (creating = true)}>+ Create your first profile</button>
		</div>
	{:else}
		<div class="profile-list">
			{#each profiles as prof (prof.id)}
				{@const isActive = activeId === prof.id}
				{@const isEditing = editingId === prof.id}
				{@const isConfirmDelete = confirmDeleteId === prof.id}

				<div class="profile-card" class:is-active={isActive}>
					<div class="card-main">
						<span class="card-emoji">{prof.emoji}</span>

						<div
							class="card-info"
							role="button"
							tabindex="0"
							onclick={() => startEdit(prof)}
							onkeydown={(e) => { if (e.key === 'Enter') startEdit(prof); }}
							aria-expanded={isEditing}
							aria-label="Edit {prof.name}"
						>
							<span class="card-name">{prof.name}</span>
							<span class="card-summary">{summarize(prof)}</span>
						</div>

						<div class="card-actions">
							{#if isConfirmDelete}
								<button class="danger-confirm" onclick={() => deleteConfirmed(prof.id)}>Delete</button>
								<button class="cancel-inline" onclick={() => (confirmDeleteId = null)}>✕</button>
							{:else}
								{#if isActive}
									<button class="deactivate-btn" onclick={() => profileStore.deactivateProfile()}>
										Active ✓
									</button>
								{:else}
									<button
										class="activate-btn"
										onclick={() => activate(prof.id)}
										disabled={activating !== null}
									>{activating === prof.id ? '…' : 'Activate'}</button>
								{/if}
								<button class="icon-btn" class:open={isEditing} onclick={() => startEdit(prof)} aria-label="Edit {prof.name}">✏️</button>
								<button class="icon-btn" onclick={() => (confirmDeleteId = prof.id)} aria-label="Delete {prof.name}">✕</button>
							{/if}
						</div>
					</div>

					{#if isEditing}
						<div class="edit-panel">
							<div class="edit-row">
								<span class="edit-label">EMOJI</span>
								<div class="emoji-quick">
									{#each QUICK_EMOJIS as e}
										<button class="emoji-btn small" class:active={editEmoji === e} onclick={() => (editEmoji = e)} aria-label={e}>{e}</button>
									{/each}
								</div>
							</div>

							<div class="edit-row">
								<span class="edit-label">NAME</span>
								<input class="edit-input" type="text" maxlength="30" bind:value={editName} />
							</div>

							<div class="edit-row">
								<span class="edit-label">THEME</span>
								<div class="option-row">
									{#each THEME_KEYS as tk}
										<button class="opt-btn" class:active={editTheme === tk} onclick={() => (editTheme = tk)}>
											{tk.charAt(0).toUpperCase() + tk.slice(1)}
										</button>
									{/each}
								</div>
							</div>

							<div class="edit-row">
								<span class="edit-label">FONT SIZE</span>
								<div class="option-row">
									{#each FONT_SIZES as fs}
										<button class="opt-btn" class:active={editFont === fs} onclick={() => (editFont = fs)}>
											{fs.charAt(0).toUpperCase() + fs.slice(1)}
										</button>
									{/each}
								</div>
							</div>

							<div class="edit-row">
								<span class="edit-label">EQ PRESET</span>
								<div class="option-row">
									{#each EQ_PRESETS as ep}
										<button class="opt-btn" class:active={editEq === ep} onclick={() => (editEq = ep)}>
											{(ep.replace('_', ' ').charAt(0).toUpperCase() + ep.replace('_', ' ').slice(1))}
										</button>
									{/each}
								</div>
							</div>

							<div class="edit-row">
								<span class="edit-label">PLAYLIST</span>
								<div class="option-row">
									<button class="opt-btn" class:active={editPl === null} onclick={() => (editPl = null)}>None</button>
									{#each playlists as pl (pl.id)}
										<button class="opt-btn" class:active={editPl === pl.id} onclick={() => (editPl = pl.id)}>{pl.name}</button>
									{/each}
								</div>
							</div>

							<div class="edit-footer">
								<button class="save-btn" onclick={() => saveEdit(prof.id)}>Save Changes</button>
								<button class="cancel-btn" onclick={() => (editingId = null)}>Cancel</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.profiles-page {
		display: flex;
		flex-direction: column;
		color: var(--text);
		min-height: 100%;
		padding-bottom: 1.5rem;
	}

	/* ── Header ── */
	.page-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem 1.5rem 0.75rem;
		border-bottom: 1px solid var(--border-color);
	}

	.header-left {
		flex: 1;
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		min-width: 0;
	}

	h1 { font-size: 1.35rem; font-weight: 700; margin: 0; }

	.count { font-size: 0.82rem; color: var(--text-muted); font-weight: 500; white-space: nowrap; }

	.page-helper {
		padding: 0.6rem 1.5rem 0;
		font-size: 0.82rem;
		color: var(--text-muted);
		margin: 0;
	}

	/* ── Create ── */
	.create-btn {
		padding: 0.5rem 0.9rem;
		min-height: 44px;
		background: var(--accent);
		border: none;
		border-radius: 22px;
		color: #fff;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		flex-shrink: 0;
		transition: filter 0.15s;
	}
	.create-btn:hover { filter: brightness(1.1); }
	.create-btn.large { margin-top: 1.25rem; padding: 0.55rem 1.4rem; font-size: 0.9rem; }

	.create-form {
		margin: 0.85rem 1.5rem 0;
		padding: 0.9rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.emoji-quick {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.emoji-btn {
		width: 44px;
		height: 44px;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		background: transparent;
		font-size: 1.1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-color 0.12s, background 0.12s;
		padding: 0;
		line-height: 1;
	}
	.emoji-btn.small { width: 38px; height: 38px; font-size: 0.95rem; }
	.emoji-btn:hover { border-color: var(--accent); }
	.emoji-btn.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 20%, transparent); }

	.create-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.new-emoji-preview { font-size: 1.4rem; line-height: 1; flex-shrink: 0; }

	.name-input,
	.edit-input {
		flex: 1;
		background: transparent;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 0.6rem 0.65rem;
		color: var(--text);
		font-size: 0.9rem;
		font-family: inherit;
		outline: none;
		min-width: 0;
		transition: border-color 0.15s;
	}
	.name-input:focus,
	.edit-input:focus { border-color: var(--accent); }

	.confirm-btn {
		padding: 0.6rem 0.85rem;
		min-height: 44px;
		background: var(--accent);
		border: none;
		border-radius: 8px;
		color: #fff;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		flex-shrink: 0;
	}
	.confirm-btn:disabled { opacity: 0.4; cursor: default; }

	.cancel-btn {
		padding: 0.6rem 0.7rem;
		min-height: 44px;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text-muted);
		font-size: 0.82rem;
		cursor: pointer;
		font-family: inherit;
		flex-shrink: 0;
	}

	/* ── Empty state ── */
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon { font-size: 2.5rem; opacity: 0.5; }
	.empty-title { font-size: 1rem; font-weight: 600; margin: 0; }
	.empty-sub { font-size: 0.85rem; color: var(--text-muted); margin: 0; line-height: 1.5; }

	/* ── Cards ── */
	.profile-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.85rem 1.5rem 0;
	}

	.profile-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		overflow: hidden;
		transition: border-color 0.15s;
	}
	.profile-card.is-active { border-color: var(--accent); }

	.card-main {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0.9rem;
	}

	.card-emoji { font-size: 1.5rem; line-height: 1; flex-shrink: 0; }

	.card-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		cursor: pointer;
	}

	.card-name {
		font-size: 0.95rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-summary {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-actions {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		flex-shrink: 0;
	}

	.activate-btn {
		padding: 0.5rem 0.8rem;
		min-height: 44px;
		background: none;
		border: 1px solid var(--accent);
		border-radius: 8px;
		color: var(--accent);
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
	}
	.activate-btn:disabled { opacity: 0.5; cursor: default; }

	.deactivate-btn {
		padding: 0.5rem 0.8rem;
		min-height: 44px;
		background: var(--accent);
		border: 1px solid var(--accent);
		border-radius: 8px;
		color: #fff;
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
	}

	.icon-btn {
		width: 44px;
		height: 44px;
		background: none;
		border: 1px solid transparent;
		border-radius: 8px;
		color: var(--text-muted);
		font-size: 0.85rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}
	.icon-btn:hover { border-color: var(--border-color); color: var(--text); }
	.icon-btn.open { border-color: var(--accent); }

	.danger-confirm {
		padding: 0.5rem 0.8rem;
		min-height: 44px;
		background: #e17055;
		border: none;
		border-radius: 8px;
		color: #fff;
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
	}

	.cancel-inline {
		width: 44px;
		height: 44px;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0;
	}

	/* ── Edit panel ── */
	.edit-panel {
		border-top: 1px solid var(--border-color);
		padding: 0.85rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.edit-row {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.edit-label {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}

	.option-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.opt-btn {
		padding: 0.5rem 0.7rem;
		min-height: 40px;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.78rem;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.12s, background 0.12s;
	}
	.opt-btn:hover { border-color: var(--accent); }
	.opt-btn.active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: var(--text);
	}

	.edit-footer {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.15rem;
	}

	.save-btn {
		padding: 0.6rem 1rem;
		min-height: 44px;
		background: var(--accent);
		border: none;
		border-radius: 8px;
		color: #fff;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
	}
</style>
