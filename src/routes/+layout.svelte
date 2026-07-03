<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { moodStore } from '$lib/stores/mood.svelte';
	import { profileStore } from '$lib/stores/profile.svelte';
	import { getThemeColors } from '$lib/theme/theme';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import MiniPlayer from '$lib/components/MiniPlayer.svelte';
	import MediaPermissionDialog from '$lib/components/MediaPermissionDialog.svelte';

	let { children } = $props();

	// Hide chrome during immersive full-screen flows
	const isOnboarding = $derived(page.url.pathname === '/onboarding');
	const isSattva = $derived(page.url.pathname === '/sattva');
	const hideChrome = $derived(isOnboarding || isSattva);

	onMount(async () => {
		themeStore.loadTheme();
		await libraryStore.initDB();
		playlistStore.loadPlaylists();
		await moodStore.initDB();
		playerStore.restoreState();
		profileStore.loadProfiles();
		const done = localStorage.getItem('onboarding_complete');
		if (!done && page.url.pathname !== '/onboarding') {
			goto('/onboarding');
		}
	});

	const config = $derived(themeStore.config);
	const colors = $derived(getThemeColors(config));

	// rem units are relative to <html>, not .app-shell — must update root font-size
	$effect(() => {
		const fs = themeStore.config.fontSize;
		document.documentElement.style.fontSize =
			fs === 'small' ? '14px' : fs === 'large' ? '18px' : '16px';
	});
</script>

<div
	class="app-shell"
	style="
		--bg: {colors.background};
		--accent: {colors.accent};
		--text: {colors.text};
		--text-secondary: {colors.textSecondary};
		--text-muted: {colors.textMuted};
		--bg-surface: {colors.surface};
		--border-color: {colors.border};
	"
>
	{#if !hideChrome}
		<Sidebar />
	{/if}

	<main class="main-content" class:full-screen={hideChrome}>
		{@render children()}
	</main>

	{#if !hideChrome}
		<MiniPlayer />
	{/if}

	<!-- Global: pre-scan media-permission explainer; must render during onboarding too -->
	<MediaPermissionDialog />
</div>

<style>
	.app-shell {
		display: flex;
		height: 100vh;
		max-width: 100vw;
		overflow: hidden;
		background-color: var(--bg);
		color: var(--text);
	}

	.main-content {
		flex: 1;
		/* min-width: 0 is the load-bearing guard: flex children default to
		   min-width auto, so any wide descendant would stretch the shell
		   past the viewport instead of being contained. */
		min-width: 0;
		max-width: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
	}

	.main-content.full-screen {
		padding-bottom: 0;
	}
</style>
