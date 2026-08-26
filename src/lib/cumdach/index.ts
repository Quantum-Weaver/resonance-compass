// the-cumdach — the book-shrine, pure.

export interface Door {
	id: string;
	label: string;
	[k: string]: unknown; // href, icon, anything
}

export interface Hat {
	id: string;
	label: string;
	doors: Door[];
	[k: string]: unknown;
}

/** The menu as the app declares it: hats (semantic intent, respected)
 *  OR a flat door list (panels created by arithmetic alone). */
export interface Menu {
	hats?: Hat[];
	doors?: Door[];
	foot: { door: Door; more?: Door[] };
}

/** The land as the consumer measured it — numbers, never DOM. */
export interface Land {
	/** What the screen offers the shrine. */
	height: number;
	/**
	 * EVERY occupied edge, SUMMED — not one bar: bottom bars, safe-area
	 * insets, and any floating control pinned into the band. The foot door
	 * renders pinned to the bottom of the box this leaves.
	 *
	 * Measure it; do not pick a constant — a control sized in `rem` but
	 * pinned in `px` moves height as the root font-size changes.
	 */
	reserved: number;
}

/**
 * The shrine's fixed costs, in the consumer's own pixels.
 *
 * If sized in `rem`, these change with text size, and the derivation must
 * be re-run with both these and `land.reserved` measured afresh.
 */
export interface Costs {
	/** One door's height, gap included (the 44px calm floor lives here). */
	door: number;
	head: number;
	/** One mode button's height. */
	switchButton: number;
	/** The switch grid's columns. */
	switchColumns: number;
}

/** The faces the consumer supplies — cosmic's colors, the app's emoji. */
export interface Palette {
	colors: string[];
	emojis: string[];
}

export interface Face {
	color: string; // the visible face is color + emoji — never numbers, never words
	emoji: string;
	words: string; // the accessible name — ALWAYS words underneath, for ears and readers
}

export interface Panel {
	face: Face;
	doors: Door[];
	hatId: string | null; // the declared hat this panel serves, when one does
	continued: boolean; // true when a hat overflowed and was balanced across panels
}

export interface Shrine {
	panels: Panel[];
	switchShown: boolean;
	switchRows: number;
	capacity: number; // doors one panel may hold at the settled derivation
	worn: number; // index into panels
	footExpanded: boolean;
	flagged: string[]; // every told truth
}

/** Balanced sizes: n doors over p panels, each within one of the others. */
export function balancedSizes(n: number, p: number): number[] {
	const base = Math.floor(n / p);
	const extra = n % p;
	return Array.from({ length: p }, (_, i) => base + (i < extra ? 1 : 0));
}

function slice(doors: Door[], sizes: number[]): Door[][] {
	const out: Door[][] = [];
	let at = 0;
	for (const s of sizes) {
		out.push(doors.slice(at, at + s));
		at += s;
	}
	return out;
}

/** DERIVE — the whole formula, one pure act. */
export function derive(menu: Menu, land: Land, costs: Costs, palette: Palette, footExpanded = false): Shrine {
	const flagged: string[] = [];
	const moreCount = footExpanded ? (menu.foot.more ?? []).length : 0;
	const usable0 = land.height - costs.head - costs.door - land.reserved - moreCount * costs.door;

	const flat = !menu.hats || menu.hats.length === 0;
	const hats: Hat[] = flat ? [{ id: '·', label: '', doors: menu.doors ?? [] }] : (menu.hats as Hat[]);
	const total = hats.reduce((s, h) => s + h.doors.length, 0);

	if (total === 0) {
		return { panels: [], switchShown: false, switchRows: 0, capacity: 0, worn: 0, footExpanded, flagged: ['no doors were declared — the shrine wraps nothing, honestly'] };
	}

	// The fixed point: capacity at P panels, the switch paying for itself.
	const capacityAt = (p: number): number => {
		const rows = p > 1 ? Math.ceil(p / costs.switchColumns) : 0;
		return Math.floor((usable0 - rows * costs.switchButton) / costs.door);
	};

	// Settle P: start from intent (declared hats) or 1 (flat), grow while
	// any panel would overflow — every growth re-prices the switch.
	let p = flat ? 1 : hats.length;
	let cap = capacityAt(p);
	if (cap < 1) {
		flagged.push(`the land cannot hold a single door (usable ${usable0}px, a door costs ${costs.door}px) — told, not scrolled`);
		return { panels: [], switchShown: false, switchRows: 0, capacity: 0, worn: 0, footExpanded, flagged };
	}
	for (;;) {
		const needed = flat
			? Math.max(p, Math.ceil(total / cap))
			: hats.reduce((s, h) => s + Math.max(1, Math.ceil(h.doors.length / cap)), 0);
		if (needed <= p) break;
		p = needed;
		const next = capacityAt(p);
		if (next < 1) {
			flagged.push(`the land cannot hold both doors and their switch (${p} panels wanted) — told, not scrolled`);
			return { panels: [], switchShown: false, switchRows: 0, capacity: 0, worn: 0, footExpanded, flagged };
		}
		cap = next;
	}

	// Build the panels — balanced always, never fill-then-spill.
	const panels: Panel[] = [];
	for (const hat of hats) {
		const pieces = Math.max(1, Math.ceil(hat.doors.length / cap));
		const sizes = balancedSizes(hat.doors.length, pieces);
		const parts = slice(hat.doors, sizes);
		if (pieces > 1) {
			flagged.push(
				flat
					? `${hat.doors.length} doors over ${pieces} panels — balanced ${sizes.join('+')}`
					: `hat "${hat.label}" overflowed capacity ${cap} — continued across ${pieces} panels, balanced ${sizes.join('+')}`
			);
		}
		parts.forEach((doors, i) => {
			panels.push({
				face: { color: '', emoji: '', words: '' },
				doors,
				hatId: flat ? null : hat.id,
				continued: pieces > 1 && i > 0,
			});
		});
	}

	// Faces — color + emoji cycled from the palette, deterministic;
	// never numbers, never visible words; the accessible name always
	// words underneath (the hat's own, or the panel's honest count).
	panels.forEach((panel, i) => {
		const hat = flat ? null : hats.find((h) => h.id === panel.hatId) ?? null;
		const words = hat && hat.label ? (panel.continued ? `${hat.label}, continued` : hat.label) : `Panel ${i + 1} of ${panels.length}`;
		panel.face = {
			color: palette.colors.length ? palette.colors[i % palette.colors.length] : '',
			emoji: palette.emojis.length ? palette.emojis[i % palette.emojis.length] : '',
			words,
		};
	});

	const switchShown = panels.length > 1;
	return {
		panels,
		switchShown,
		switchRows: switchShown ? Math.ceil(panels.length / costs.switchColumns) : 0,
		capacity: cap,
		worn: 0,
		footExpanded,
		flagged,
	};
}

/** Wear a panel by its place in the switch — the vessel's own hand. */
export function wear(shrine: Shrine, index: number): Shrine {
	if (index < 0 || index >= shrine.panels.length) return shrine;
	return { ...shrine, worn: index };
}

/** DYNAMICS ALWAYS RE-DERIVE — any new land re-runs the formula; the
 *  worn panel survives by identity (its hat, then its place) when it
 *  still exists, and falls calmly to the first when it does not. */
export function rederive(prev: Shrine, menu: Menu, land: Land, costs: Costs, palette: Palette, footExpanded = prev.footExpanded): Shrine {
	const next = derive(menu, land, costs, palette, footExpanded);
	const was = prev.panels[prev.worn];
	if (!was) return next;
	let i = -1;
	if (was.hatId !== null) i = next.panels.findIndex((p) => p.hatId === was.hatId && p.continued === was.continued);
	if (i === -1 && prev.worn < next.panels.length) i = prev.worn;
	return i === -1 ? next : { ...next, worn: i };
}
