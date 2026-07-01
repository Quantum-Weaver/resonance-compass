<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let open = $state(false);
	let isMobile = $state(true);

	const navItems = [
		{ href: '/', icon: '🏠', label: 'Home' },
		{ href: '/library', icon: '🎵', label: 'Library' },
		{ href: '/liked', icon: '❤️', label: 'Liked' },
		{ href: '/playlists', icon: '📋', label: 'Playlists' },
		{ href: '/visualizer', icon: '🌊', label: 'Visualizer' },
		{ href: '/resonance', icon: '✨', label: 'Resonance' },
		{ href: '/timer', icon: '⏰', label: 'Timer' },
		{ href: '/settings', icon: '⚙️', label: 'Settings' },
	];

	// The visualizer is a full-screen immersive experience — no hamburger, no
	// sidebar. Its own z-index (100) sits above the sidebar panel (50) but below
	// the hamburger (120), so an opened panel would be invisible but the toggle
	// would still be clickable if left alone. Hide it and force-close instead.
	const isVisualizer = $derived(page.url.pathname === '/visualizer');

	$effect(() => {
		if (isVisualizer) open = false;
	});

	onMount(() => {
		isMobile = window.innerWidth < 768;
	});

	function navigate(href: string) {
		goto(href);
		if (isMobile) open = false;
	}

	function toggle() {
		open = !open;
	}
</script>

<!-- Hamburger — always visible except on the full-screen visualizer -->
{#if !isVisualizer}
	<button
		class="hamburger"
		onclick={toggle}
		aria-label={open ? 'Close navigation' : 'Open navigation'}
		aria-expanded={open}
	>
		{open ? '✕' : '☰'}
	</button>
{/if}

<!-- Backdrop — dismisses the sidebar on outside interaction whenever it's open,
     desktop or mobile, since the hamburger toggle is always visible on both. -->
{#if open && !isVisualizer}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="backdrop"
		onclick={() => (open = false)}
		onkeydown={(e) => { if (e.key === 'Escape') open = false; }}
		role="presentation"
	></div>
{/if}

<!-- Sidebar panel — class:open is gated on !isVisualizer too so nothing can
     render it expanded while on the visualizer, even defensively. -->
<nav class="sidebar" class:open={open && !isVisualizer} aria-label="Main navigation">
	<div class="sidebar__header">
		<span class="sidebar__wordmark">Compass</span>
	</div>

	<ul class="sidebar__nav">
		{#each navItems as item}
			<li>
				<button
					class="nav-item"
					class:active={page.url.pathname === item.href}
					onclick={() => navigate(item.href)}
				>
					<span class="nav-icon">{item.icon}</span>
					<span class="nav-label">{item.label}</span>
				</button>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.hamburger {
		position: fixed;
		bottom: calc(56px + env(safe-area-inset-bottom, 0px));
		left: 1rem;
		z-index: 120;
		background-color: var(--bg-surface);
		border: 1px solid var(--border-color);
		color: var(--text);
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 8px;
		font-size: 1.1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 49;
		background-color: transparent;
	}

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		width: 20vw;
		min-width: 180px;
		max-width: 280px;
		background-color: var(--bg-surface);
		border-right: 1px solid var(--border-color);
		z-index: 50;
		transform: translateX(-100%);
		transition: transform 0.3s ease;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.sidebar.open {
		transform: translateX(0);
	}

	.sidebar__header {
		padding: calc(1rem + env(safe-area-inset-top, 0px)) 1.25rem 1rem;
		border-bottom: 1px solid var(--border-color);
	}

	.sidebar__wordmark {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--accent);
		letter-spacing: 0.02em;
	}

	.sidebar__nav {
		list-style: none;
		padding: 0.75rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.65rem 0.75rem;
		border-radius: 8px;
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		text-align: left;
		font-size: 0.95rem;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.nav-item:hover {
		background-color: var(--bg);
		color: var(--text);
	}

	.nav-item.active {
		background-color: var(--accent);
		color: #fff;
	}

	.nav-icon {
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar {
			transition: none;
		}
	}
</style>
