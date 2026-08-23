<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, untrack } from 'svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import Icons from '$lib/components/icons/Icons.svelte';
	import type { IconName } from '$lib/components/icons/Icons.svelte';
	import { derive, rederive, wear, type Menu, type Shrine, type Door } from '$lib/cumdach';
	import { QUANTUM_COLORS } from '$lib/cosmic';

	import { modeStore, type ModeName } from '$lib/stores/mode.svelte';

	// Default-collapsed on every platform: the content is the destination, the
	// nav is a drawer — even on desktop. The open flag lives in uiStore because
	// the control that toggles it is in the MiniPlayer bar (2026-08-22, the
	// Echoes remedy of 2026-08-21).
	const open = $derived(uiStore.navOpen);
	let isMobile = $state(true);

	// THE SHRINE — the sidebar consumes the-cumdach (the spring's navigation
	// shell; this very menu is its proving fixture, and Compass its first
	// consumer). Compass declares the particulars — hats, doors, faces, the
	// foot — and the panels are DERIVED from the screen's own measure, never
	// arranged by opinion. The hats are KP's ruled four; Library IS home
	// (the U9 merge). The worn hat persists through modeStore and never
	// switches itself.
	type CompassDoor = Door & { href: string; icon: IconName };

	const door = (id: string, href: string, icon: IconName, label: string): CompassDoor => ({
		id,
		href,
		icon,
		label,
	});

	const MENU: Menu = {
		hats: [
			{
				id: 'listen',
				label: 'Listen',
				doors: [
					door('library', '/library', 'library', 'Library'),
					door('nowplaying', '/nowplaying', 'compass', 'Now Playing'),
					door('queue', '/queue', 'skip-forward', 'Queue'),
					door('playlists', '/playlists', 'playlist', 'Playlists'),
					door('liked', '/liked', 'heart', 'Liked'),
					door('history', '/history', 'history', 'History'),
				],
			},
			{
				id: 'create',
				label: 'Create',
				doors: [
					door('fragments', '/fragments', 'fragment', 'Fragments'),
					door('studio', '/fragments/studio', 'equalizer', 'Studio'),
				],
			},
			{
				id: 'settle',
				label: 'Settle',
				doors: [
					door('sattva', '/sattva', 'sattva', 'Sattva'),
					door('time', '/timer', 'timer', 'Timer & Focus'),
				],
			},
			{
				id: 'understand',
				label: 'Understand',
				// The visualizer moved here from Listen on 2026-08-22 at KP's ⚛ word:
				// "visualizer should be in the understand menu not listening."
				doors: [
					door('resonance', '/resonance', 'resonance', 'Resonance'),
					door('visualizer', '/visualizer', 'visualizer', 'Visualizer'),
				],
			},
		],
		foot: { door: door('settings', '/settings', 'settings', 'Settings') },
	};

	// The shrine's costs in this app's own pixels (the 44px calm floor lives
	// inside the door cost, gap included; over-reserving errs safe), and the
	// faces — cosmic's colors, the app's emoji; words always ride underneath.
	const COSTS = { door: 48, head: 64, switchButton: 58, switchColumns: 2 };
	const PALETTE = {
		colors: [
			QUANTUM_COLORS['cosmic.blue'], // Listen
			QUANTUM_COLORS['hearth.gold'], // Create
			QUANTUM_COLORS['sanctuary.green'], // Settle
			QUANTUM_COLORS['quantum.purple'], // Understand
		],
		emojis: ['🎧', '🎛️', '🧘', '🌀'],
	};
	// The MiniPlayer bar is a declared edge, honored by arithmetic — the
	// clearance that was once a CSS-only mend (U12) is an INPUT now. It is the
	// ONLY edge again: the floating hamburger that used to claim bottom 56–101px
	// moved inside the bar on 2026-08-22 (the Echoes remedy of 2026-08-21), so
	// nothing else paints over the sidebar's foot.
	const RESERVED = 48;

	let land = $state({ height: 900, reserved: RESERVED });
	let shrine = $state<Shrine>(derive(MENU, { height: 900, reserved: RESERVED }, COSTS, PALETTE));

	function measure() {
		land = { height: window.innerHeight, reserved: RESERVED };
	}

	// DYNAMICS ALWAYS RE-DERIVE — any new land re-runs the pure formula; the
	// worn panel survives by its hat's identity.
	$effect(() => {
		const l = land;
		shrine = rederive(
			untrack(() => shrine),
			MENU,
			l,
			COSTS,
			PALETTE
		);
	});

	function wearPanel(i: number) {
		shrine = wear(shrine, i);
		const hatId = shrine.panels[i]?.hatId;
		if (hatId) modeStore.setMode(hatId as ModeName);
	}

	const wornPanel = $derived(shrine.panels[shrine.worn] ?? null);
	const wornDoors = $derived((wornPanel?.doors ?? []) as CompassDoor[]);
	const footDoor = MENU.foot.door as CompassDoor;

	// The visualizer is a full-screen immersive experience — no nav toggle, no
	// sidebar. Its own z-index (100) sits above the sidebar panel (50), so an
	// opened panel would be invisible; the MiniPlayer hides its toggle there
	// (see MiniPlayer.svelte) and this force-closes the drawer.
	const isVisualizer = $derived(page.url.pathname === '/visualizer');

	$effect(() => {
		if (isVisualizer) uiStore.setNavOpen(false);
	});

	// The vessel opened the MiniPlayer panel — they want to see it, not the nav.
	$effect(() => {
		if (uiStore.miniPlayerExpanded) uiStore.setNavOpen(false);
	});

	onMount(() => {
		isMobile = window.innerWidth < 768;
		modeStore.load();
		measure();
		// Wake wearing the persisted hat — the vessel's choice, not the app's.
		const i = shrine.panels.findIndex((p) => p.hatId === modeStore.current && !p.continued);
		if (i >= 0) shrine = wear(shrine, i);
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	});

	function navigate(href: string) {
		goto(href);
		uiStore.setNavOpen(false);
	}
</script>

<!-- The toggle lives in the MiniPlayer bar (see MiniPlayer.svelte). It used to
     float here at bottom:56px/left:1rem, z-index 120 — the same band and the
     same column as this drawer's own Settings foot. Removing the floating
     button was the mend that freed it (the Echoes remedy, 2026-08-21; carried
     here 2026-08-22). -->

<!-- Backdrop — dismisses the sidebar on outside interaction whenever it's open,
     desktop or mobile, since the MiniPlayer's toggle is always visible on both. -->
{#if open && !isVisualizer}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="backdrop"
		onclick={() => uiStore.setNavOpen(false)}
		onkeydown={(e) => { if (e.key === 'Escape') uiStore.setNavOpen(false); }}
		role="presentation"
	></div>
{/if}

<!-- Sidebar panel — class:open is gated on !isVisualizer too so nothing can
     render it expanded while on the visualizer, even defensively. -->
<nav class="sidebar" class:open={open && !isVisualizer} aria-label="Main navigation">
	<div class="sidebar__header">
		<!-- cosmic-sparkle-text adds the animated glow; the scoped accent color
		     below outranks its light-gray color so light mode stays readable. -->
		<span class="sidebar__wordmark cosmic-sparkle-text">Compass</span>
	</div>

	<!-- The switch — derived, never arranged. Faces wear color + emoji (THE
	     FACE LAW), the words always ride underneath; the worn panel holds
	     until tapped again. At one panel, no switch is derived at all. -->
	{#if shrine.switchShown}
		<div
			class="mode-switch"
			role="group"
			aria-label="Menu panels"
			style="grid-template-columns: repeat({COSTS.switchColumns}, 1fr);"
		>
			{#each shrine.panels as panel, i (i)}
				<button
					class="mode-btn"
					class:worn={i === shrine.worn}
					style="--face: {panel.face.color}"
					aria-pressed={i === shrine.worn}
					onclick={() => wearPanel(i)}
				>
					<span class="face-emoji" aria-hidden="true">{panel.face.emoji}</span>
					<span class="face-words">{panel.face.words}</span>
				</button>
			{/each}
		</div>
	{/if}

	<ul class="sidebar__nav">
		{#each wornDoors as item (item.id)}
			<li>
				<button
					class="nav-item"
					class:active={page.url.pathname === item.href}
					onclick={() => navigate(item.href)}
				>
					<span class="nav-icon"><Icons name={item.icon} size={18} /></span>
					<span class="nav-label">{item.label}</span>
				</button>
			</li>
		{/each}
	</ul>

	<!-- The foot — one chrome door, outside every panel, always reachable. -->
	<div class="sidebar__foot">
		<button
			class="nav-item"
			class:active={page.url.pathname === footDoor.href}
			onclick={() => navigate(footDoor.href)}
		>
			<span class="nav-icon"><Icons name={footDoor.icon} size={18} /></span>
			<span class="nav-label">{footDoor.label}</span>
		</button>
	</div>
</nav>

<style>
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
		/* The MiniPlayer bar (48px, fixed, z-index 110) always paints over the
		   sidebar (50) — the foot must clear it or Settings is buried (KP's
		   desktop-walk catch, 2026-08-06). Must stay equal to RESERVED in the
		   script above: one edge, declared once, honored twice. */
		padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
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

	.mode-switch {
		display: grid;
		gap: 0.35rem;
		padding: 0.75rem 0.5rem 0.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.mode-btn {
		min-height: 52px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		padding: 0.3rem 0.4rem;
		border-radius: 8px;
		background: none;
		border: 1.5px solid color-mix(in srgb, var(--face) 45%, var(--border-color));
		color: var(--text-secondary);
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.mode-btn:hover {
		background-color: color-mix(in srgb, var(--face) 10%, transparent);
		color: var(--text);
	}

	.mode-btn.worn {
		border-color: var(--face);
		background-color: color-mix(in srgb, var(--face) 16%, transparent);
		color: var(--text);
		font-weight: 600;
	}

	.face-emoji {
		font-size: 1.1rem;
		line-height: 1;
	}

	.face-words {
		font-size: 0.68rem;
		line-height: 1.1;
	}

	.sidebar__nav {
		list-style: none;
		padding: 0.75rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.sidebar__foot {
		padding: 0.5rem;
		border-top: 1px solid var(--border-color);
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
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar {
			transition: none;
		}
	}
</style>
