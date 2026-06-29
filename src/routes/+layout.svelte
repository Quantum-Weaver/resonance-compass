<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { echoStore } from '$lib/stores/echo.svelte';
	import { getThemeColors } from '$lib/theme/theme';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ComfortBar from '$lib/components/ComfortBar.svelte';

	let { children } = $props();

	// Hide chrome during the immersive onboarding flow
	const isOnboarding = $derived(page.url.pathname === '/onboarding');

	onMount(async () => {
		themeStore.loadTheme();
		await echoStore.initDB();
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
	{#if !isOnboarding}
		<Sidebar />
	{/if}

	<main class="main-content" class:full-screen={isOnboarding}>
		{@render children()}
	</main>

	{#if !isOnboarding}
		<ComfortBar />
	{/if}
</div>

<style>
	.app-shell {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background-color: var(--bg);
		color: var(--text);
	}

	.main-content {
		flex: 1;
		overflow-y: auto;
		padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
	}

	.main-content.full-screen {
		padding-bottom: 0;
	}
</style>
