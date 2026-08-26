// Cross-component UI signals that don't belong to any domain store.

// True while the MiniPlayer's expanded panel is open. The Sidebar watches it
// and closes itself — the vessel tapped the player, they want to see it.
let miniPlayerExpanded = $state(false);

// Whether the navigation drawer is open. Lives here rather than inside
// Sidebar.svelte because the MiniPlayer bar's control needs the same truth.
let navOpen = $state(false);

export const uiStore = {
	get miniPlayerExpanded() { return miniPlayerExpanded; },
	setMiniPlayerExpanded(value: boolean) { miniPlayerExpanded = value; },
	get navOpen() { return navOpen; },
	setNavOpen(value: boolean) { navOpen = value; },
	toggleNav() { navOpen = !navOpen; },
};
