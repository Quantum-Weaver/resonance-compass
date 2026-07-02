<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { listen } from '@tauri-apps/api/event';

	type VisMode = 'bars' | 'waveform' | 'spiral' | 'particles' | 'mandala' | 'flower' | 'metatron';
	const MODES: VisMode[] = ['bars', 'waveform', 'spiral', 'particles', 'mandala', 'flower', 'metatron'];
	const MODE_LABELS: Record<VisMode, string> = {
		bars: '▊ Bars',
		waveform: '〜 Waveform',
		spiral: '◎ Spiral',
		particles: '✦ Particles',
		mandala: '✳ Mandala',
		flower: '❀ Flower of Life',
		metatron: "⬡ Metatron's Cube",
	};

	let modeIndex = $state(0);
	const mode = $derived(MODES[modeIndex]);
	let showOverlay = $state(true);
	let showModeLabel = $state(false);
	let modeLabelText = $state('');
	let liveFFT = $state(false);

	// Secret playable keyboard (v1 parity): letters tint the palette hue,
	// digits 1-9 set animation speed, 0 resets both. Arrows/Space keep their
	// mode-cycle and play/pause roles.
	let keyHue = $state(0);
	let speedMult = $state(1);

	let canvas: HTMLCanvasElement | null = null;
	let visPageEl: HTMLDivElement | null = null;
	let animFrame = 0;
	let mounted = false;
	let reducedMotion = false;
	let overlayTimer: ReturnType<typeof setTimeout> | null = null;
	let modeLabelTimer: ReturnType<typeof setTimeout> | null = null;
	let lastTs = 0;

	const currentTrack = $derived(playerStore.currentTrack);
	const isPlaying = $derived(playerStore.isPlaying);

	const N_BARS = 64;
	let targetBars: number[] = new Array(N_BARS).fill(0);
	let smoothedBars: number[] = new Array(N_BARS).fill(0);

	type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; ci: number };
	let particles: Particle[] = [];
	let touchStartX = 0;

	// ── Colour helpers ─────────────────────────────────────────────────────────
	// Canvas 2D needs literal color values (CSS custom properties don't apply to
	// fillStyle/strokeStyle), so the COSMIC gradient is hardcoded here rather
	// than read from --accent etc. The visualizer is a full-black immersive
	// surface independent of the active theme, matching the v1 reference.

	function lerp(a: number, b: number, t: number) {
		return a + (b - a) * t;
	}

	const STOPS = [
		[0.0, 108, 92, 231],
		[0.35, 9, 132, 227],
		[0.65, 253, 203, 110],
		[1.0, 108, 92, 231],
	] as const;

	function cosmicColor(t: number): string {
		for (let i = 0; i < STOPS.length - 1; i++) {
			const [t0, r0, g0, b0] = STOPS[i];
			const [t1, r1, g1, b1] = STOPS[i + 1];
			if (t <= t1) {
				const f = (t - t0) / (t1 - t0);
				return `rgb(${Math.round(lerp(r0, r1, f))},${Math.round(lerp(g0, g1, f))},${Math.round(lerp(b0, b1, f))})`;
			}
		}
		return '#6C5CE7';
	}

	// ── Seeded helpers — deterministic per-track fallback motion when no FFT ────

	function hash(s: string, i: number): number {
		let h = 0x811c9dc5 | 0;
		for (let j = 0; j < s.length; j++) {
			h ^= s.charCodeAt(j);
			h = Math.imul(h, 0x01000193);
		}
		h ^= i;
		h = Math.imul(h, 0x01000193);
		return (h >>> 0) / 0xffffffff;
	}

	// ── Spectrum level helpers (shared across all modes) ───────────────────────
	// smoothedBars is advanced once per frame in draw(), not per-mode, so every
	// mode sees live data. barLevel/bandLevel fall back to seeded motion when
	// no FFT data has ever arrived.

	function smoothSpectrum() {
		if (!liveFFT || reducedMotion) return;
		const target = isPlaying ? targetBars : ZERO_BARS;
		for (let i = 0; i < N_BARS; i++) {
			smoothedBars[i] += (target[i] - smoothedBars[i]) * 0.35;
		}
	}
	const ZERO_BARS = new Array(N_BARS).fill(0);

	function barLevel(i: number, ts: number): number {
		if (liveFFT) return smoothedBars[i];
		const tid = currentTrack?.id ?? '';
		const base = 0.08 + hash(tid, i) * 0.55;
		if (reducedMotion || !isPlaying) return base * 0.25;
		const freq = 0.5 + hash(tid + 'f', i) * 2.5;
		const phase = hash(tid + 'p', i) * Math.PI * 2;
		const wave = (Math.sin((ts / 1000) * freq + phase) + 1) / 2;
		return base * 0.2 + wave * base * 0.8;
	}

	function bandLevel(lo: number, hi: number, ts: number): number {
		let sum = 0;
		for (let i = lo; i < hi; i++) sum += barLevel(i, ts);
		return sum / (hi - lo);
	}

	// ── Bars ───────────────────────────────────────────────────────────────────

	function drawBars(ctx: CanvasRenderingContext2D, W: number, H: number, ts: number) {
		const gap = 2;
		const bw = Math.max(1, (W - (N_BARS - 1) * gap) / N_BARS);

		for (let i = 0; i < N_BARS; i++) {
			const ratio = barLevel(i, ts);
			const h = Math.max(2, ratio * H * 0.85);
			const x = i * (bw + gap);
			const color = cosmicColor(i / (N_BARS - 1));

			ctx.shadowBlur = (liveFFT || isPlaying) && !reducedMotion ? 12 : 0;
			ctx.shadowColor = color;
			ctx.fillStyle = color;
			ctx.fillRect(x, H - h, bw, h);
		}
	}

	// ── Waveform ───────────────────────────────────────────────────────────────

	function fftEnergy(): number {
		if (!liveFFT) return isPlaying && !reducedMotion ? 1.0 : 0.1;
		const s = smoothedBars.reduce((a, b) => a + b, 0) / N_BARS;
		return Math.min(s * 2.5, 1.0);
	}

	function drawWaveform(ctx: CanvasRenderingContext2D, W: number, H: number, ts: number) {
		const tid = currentTrack?.id ?? '';
		const energy = fftEnergy();
		const amp = H * 0.32 * energy;
		const scroll = reducedMotion ? 0 : (ts / 1000) * 0.5;
		const f1 = 0.7 + hash(tid, 1) * 1.5;
		const f2 = 1.1 + hash(tid, 2) * 2.0;
		const f3 = 0.4 + hash(tid, 3) * 1.0;

		const grad = ctx.createLinearGradient(0, 0, W, 0);
		grad.addColorStop(0, '#6C5CE7');
		grad.addColorStop(0.5, '#0984E3');
		grad.addColorStop(1, '#FDCB6E');

		ctx.beginPath();
		ctx.lineWidth = 2.5;
		ctx.strokeStyle = grad;
		ctx.shadowBlur = energy > 0.1 && !reducedMotion ? 16 : 0;
		ctx.shadowColor = '#6C5CE7';

		const N = 300;
		for (let i = 0; i <= N; i++) {
			const x = (i / N) * W;
			const barIdx = Math.floor((i / N) * N_BARS);
			const barMod = liveFFT ? 0.4 + smoothedBars[barIdx] * 0.6 : 1.0;
			const y =
				H / 2 +
				amp * barMod * Math.sin((i / N) * Math.PI * 4 * f1 + scroll) * 0.5 +
				amp * barMod * Math.sin((i / N) * Math.PI * 6 * f2 + scroll * 1.3) * 0.3 +
				amp * barMod * Math.sin((i / N) * Math.PI * 2 * f3 + scroll * 0.7) * 0.2;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}

	// ── Spiral ─────────────────────────────────────────────────────────────────

	function bassEnergy(): number {
		if (!liveFFT) return isPlaying && !reducedMotion ? 0.1 : 0.02;
		return smoothedBars.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
	}

	function drawSpiral(ctx: CanvasRenderingContext2D, W: number, H: number, ts: number) {
		const tid = currentTrack?.id ?? '';
		const cx = W / 2,
			cy = H / 2;
		const maxR = Math.min(W, H) * 0.43;
		const turns = 4 + hash(tid, 0) * 2;
		const N = 500;
		const speed = reducedMotion ? 0 : (ts / 1000) * (isPlaying || liveFFT ? 0.35 : 0.06);
		const bass = bassEnergy();

		const grad = ctx.createLinearGradient(cx - maxR, cy, cx + maxR, cy);
		grad.addColorStop(0, '#6C5CE7');
		grad.addColorStop(0.5, '#0984E3');
		grad.addColorStop(1, '#FDCB6E');

		ctx.beginPath();
		ctx.lineWidth = 1.5;
		ctx.strokeStyle = grad;
		ctx.shadowBlur = (isPlaying || liveFFT) && !reducedMotion ? 18 : 4;
		ctx.shadowColor = '#6C5CE7';

		for (let i = 0; i <= N; i++) {
			const t = i / N;
			const angle = t * Math.PI * 2 * turns + speed;
			const r = t * maxR;
			const pulse = reducedMotion ? 1 : 1 + bass * 0.25 * Math.sin((ts / 1000) * 3 + t * Math.PI * 6);
			const x = cx + Math.cos(angle) * r * pulse;
			const y = cy + Math.sin(angle) * r * pulse;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}

	// ── Particles ──────────────────────────────────────────────────────────────

	function updateParticles(W: number, H: number, dt: number) {
		const energy = liveFFT ? fftEnergy() : isPlaying ? 1 : 0.15;
		const spd = energy;
		const limit = liveFFT ? Math.floor(60 + energy * 60) : 100;
		if ((liveFFT ? energy > 0.05 : isPlaying) && particles.length < limit) {
			const count = liveFFT ? Math.ceil(energy * 4) : 2;
			for (let i = 0; i < count; i++) {
				particles.push({
					x: Math.random() * W,
					y: H + 5,
					vx: (Math.random() - 0.5) * 2,
					vy: -(1 + Math.random() * 2.5) * Math.max(spd, 0.1),
					r: 2 + Math.random() * 4,
					life: 1,
					ci: Math.random(),
				});
			}
		}
		particles = particles
			.map((p) => ({
				...p,
				x: p.x + p.vx * Math.max(spd, 0.1) * 60 * dt,
				y: p.y + p.vy * Math.max(spd, 0.1) * 60 * dt,
				life: p.life - 0.007 * Math.max(spd, 0.1),
			}))
			.filter((p) => p.life > 0 && p.y > -20);
	}

	function drawParticles(ctx: CanvasRenderingContext2D) {
		for (const p of particles) {
			const color = cosmicColor(p.ci);
			ctx.globalAlpha = p.life * 0.85;
			ctx.shadowBlur = !reducedMotion ? 14 : 0;
			ctx.shadowColor = color;
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}

	// ── Mandala ────────────────────────────────────────────────────────────────
	// Concentric rings of dots with 12-fold symmetry. Each ring is fed by a
	// different frequency band (inner = bass, outer = treble); bass pulses the
	// ring radii, rings counter-rotate.

	function drawMandala(ctx: CanvasRenderingContext2D, W: number, H: number, ts: number) {
		const cx = W / 2;
		const cy = H / 2;
		const maxR = Math.min(W, H) * 0.42;
		const RINGS = 5;
		const SYM = 12;
		const bass = bandLevel(0, 8, ts);
		const baseRot = reducedMotion ? 0 : (ts / 1000) * 0.12;

		ctx.shadowBlur = !reducedMotion ? 12 : 0;

		for (let ring = 0; ring < RINGS; ring++) {
			const ringT = (ring + 1) / RINGS;
			const bandLo = ring * 12;
			const ringR = maxR * ringT * (1 + bass * 0.18);
			const rot = baseRot * (ring % 2 === 0 ? 1 : -1) * (1 + ring * 0.15);
			const color = cosmicColor(ringT * 0.9);

			ctx.shadowColor = color;
			ctx.fillStyle = color;

			for (let s = 0; s < SYM; s++) {
				const level = barLevel(Math.min(N_BARS - 1, bandLo + Math.floor((s / SYM) * 12)), ts);
				const angle = rot + (s / SYM) * Math.PI * 2;
				const dotR = 2 + level * 14 * (0.6 + ringT * 0.4);
				const x = cx + Math.cos(angle) * ringR;
				const y = cy + Math.sin(angle) * ringR;

				ctx.globalAlpha = 0.35 + level * 0.65;
				ctx.beginPath();
				ctx.arc(x, y, dotR, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		const coreR = maxR * 0.1 * (1 + bass * 0.9);
		ctx.globalAlpha = 0.5 + bass * 0.5;
		ctx.strokeStyle = cosmicColor(0);
		ctx.shadowColor = cosmicColor(0);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
		ctx.stroke();
		ctx.globalAlpha = 1;
	}

	// ── Flower of Life ─────────────────────────────────────────────────────────
	// The 19-circle hexagonal pattern. Circle radii breathe with mid energy,
	// per-ring brightness follows its band, the whole flower slowly turns.

	function flowerCenters(d: number): Array<{ x: number; y: number; ring: number }> {
		const pts: Array<{ x: number; y: number; ring: number }> = [{ x: 0, y: 0, ring: 0 }];
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			pts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, ring: 1 });
		}
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			pts.push({ x: Math.cos(a) * d * 2, y: Math.sin(a) * d * 2, ring: 2 });
		}
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
			pts.push({ x: Math.cos(a) * d * Math.sqrt(3), y: Math.sin(a) * d * Math.sqrt(3), ring: 2 });
		}
		return pts;
	}

	function drawFlower(ctx: CanvasRenderingContext2D, W: number, H: number, ts: number) {
		const cx = W / 2;
		const cy = H / 2;
		const d = Math.min(W, H) * 0.13;
		const bass = bandLevel(0, 8, ts);
		const mid = bandLevel(8, 32, ts);
		const treble = bandLevel(32, 64, ts);
		const rot = reducedMotion ? 0 : (ts / 1000) * (0.06 + treble * 0.2);
		const breathe = 1 + mid * 0.22;
		const ringLevels = [bass, mid, treble];

		ctx.lineWidth = 1.6;
		ctx.shadowBlur = !reducedMotion ? 14 : 0;

		for (const c of flowerCenters(d)) {
			const level = ringLevels[c.ring];
			const rx = c.x * Math.cos(rot) - c.y * Math.sin(rot);
			const ry = c.x * Math.sin(rot) + c.y * Math.cos(rot);
			const color = cosmicColor(c.ring / 2.5);

			ctx.globalAlpha = 0.28 + level * 0.72;
			ctx.strokeStyle = color;
			ctx.shadowColor = color;
			ctx.beginPath();
			ctx.arc(cx + rx, cy + ry, d * breathe, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}

	// ── Metatron's Cube ────────────────────────────────────────────────────────
	// The 13 Fruit-of-Life nodes with all 78 connecting lines. Node size follows
	// bass, line glow follows treble, rotation follows overall energy.

	function metatronCenters(d: number): Array<{ x: number; y: number }> {
		const pts: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			pts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d });
		}
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			pts.push({ x: Math.cos(a) * d * 2, y: Math.sin(a) * d * 2 });
		}
		return pts;
	}

	function drawMetatron(ctx: CanvasRenderingContext2D, W: number, H: number, ts: number) {
		const cx = W / 2;
		const cy = H / 2;
		const d = Math.min(W, H) * 0.16;
		const bass = bandLevel(0, 8, ts);
		const treble = bandLevel(32, 64, ts);
		const energy = bandLevel(0, 64, ts);
		const rot = reducedMotion ? 0 : (ts / 1000) * (0.05 + energy * 0.18);

		const pts = metatronCenters(d).map((p) => ({
			x: cx + p.x * Math.cos(rot) - p.y * Math.sin(rot),
			y: cy + p.x * Math.sin(rot) + p.y * Math.cos(rot),
		}));

		ctx.lineWidth = 1;
		ctx.strokeStyle = cosmicColor(0.5);
		ctx.shadowBlur = !reducedMotion ? 8 : 0;
		ctx.shadowColor = cosmicColor(0.5);
		ctx.globalAlpha = 0.1 + treble * 0.55;
		ctx.beginPath();
		for (let i = 0; i < pts.length; i++) {
			for (let j = i + 1; j < pts.length; j++) {
				ctx.moveTo(pts[i].x, pts[i].y);
				ctx.lineTo(pts[j].x, pts[j].y);
			}
		}
		ctx.stroke();

		for (let i = 0; i < pts.length; i++) {
			const level = barLevel(Math.min(N_BARS - 1, i * 5), ts);
			const color = cosmicColor(i / (pts.length - 1));
			const nodeR = d * 0.16 * (1 + bass * 0.8) + level * 6;

			ctx.globalAlpha = 0.45 + level * 0.55;
			ctx.strokeStyle = color;
			ctx.shadowColor = color;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.arc(pts[i].x, pts[i].y, nodeR, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}

	// ── Main draw loop ─────────────────────────────────────────────────────────

	function draw(rawTs: number) {
		if (!canvas || !mounted) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const W = canvas.width;
		const H = canvas.height;
		const dt = Math.min((rawTs - (lastTs || rawTs)) / 1000, 0.1) * speedMult;
		lastTs = rawTs;
		const ts = rawTs * speedMult;

		ctx.clearRect(0, 0, W, H);
		ctx.shadowBlur = 0;
		ctx.filter = keyHue !== 0 ? `hue-rotate(${keyHue}deg)` : 'none';
		smoothSpectrum();

		const m = mode;
		if (m === 'bars') drawBars(ctx, W, H, ts);
		else if (m === 'waveform') drawWaveform(ctx, W, H, ts);
		else if (m === 'spiral') drawSpiral(ctx, W, H, ts);
		else if (m === 'mandala') drawMandala(ctx, W, H, ts);
		else if (m === 'flower') drawFlower(ctx, W, H, ts);
		else if (m === 'metatron') drawMetatron(ctx, W, H, ts);
		else {
			updateParticles(W, H, dt);
			drawParticles(ctx);
		}

		ctx.filter = 'none';
		animFrame = requestAnimationFrame(draw);
	}

	// ── Interaction helpers ────────────────────────────────────────────────────

	function resetOverlayTimer() {
		showOverlay = true;
		if (overlayTimer) clearTimeout(overlayTimer);
		overlayTimer = setTimeout(() => {
			showOverlay = false;
		}, 3000);
	}

	function flashModeLabel(text?: string) {
		modeLabelText = text ?? MODE_LABELS[mode];
		showModeLabel = true;
		if (modeLabelTimer) clearTimeout(modeLabelTimer);
		modeLabelTimer = setTimeout(() => {
			showModeLabel = false;
		}, 1600);
	}

	function cycleMode(direction: 1 | -1 = 1) {
		modeIndex = (modeIndex + direction + MODES.length) % MODES.length;
		flashModeLabel(MODE_LABELS[MODES[modeIndex]]);
		resetOverlayTimer();
	}

	function handleCanvasClick() {
		cycleMode(1);
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
	}
	function handleTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(dx) > 50) {
			cycleMode(dx < 0 ? 1 : -1);
		} else {
			resetOverlayTimer();
		}
	}

	function handleResize() {
		if (canvas) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

		if (e.key === ' ') {
			e.preventDefault();
			playerStore.togglePlay();
			resetOverlayTimer();
			return;
		}
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			cycleMode(1);
			return;
		}
		if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			cycleMode(-1);
			return;
		}
		if (/^[a-z]$/i.test(e.key)) {
			keyHue = ((e.key.toLowerCase().charCodeAt(0) - 97) * 14) % 360;
			flashModeLabel(`♪ ${e.key.toUpperCase()}`);
			return;
		}
		if (/^[1-9]$/.test(e.key)) {
			speedMult = Number(e.key) * 0.5;
			flashModeLabel(`»${speedMult}×`);
			return;
		}
		if (e.key === '0') {
			keyHue = 0;
			speedMult = 1;
			flashModeLabel('reset');
			return;
		}
	}

	// ── Lifecycle ──────────────────────────────────────────────────────────────

	let unlistenSpectrum: (() => void) | null = null;

	onMount(async () => {
		mounted = true;
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (canvas) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
		window.addEventListener('resize', handleResize);
		window.addEventListener('keydown', handleKeyDown);
		resetOverlayTimer();
		animFrame = requestAnimationFrame(draw);

		const unlisten = await listen<number[]>('spectrum', (event) => {
			const bars = event.payload;
			if (bars.length === N_BARS) {
				targetBars = bars;
				if (!liveFFT) liveFFT = true;
			}
		});
		unlistenSpectrum = unlisten;
	});

	onDestroy(() => {
		mounted = false;
		if (visPageEl) visPageEl.style.pointerEvents = 'none';
		cancelAnimationFrame(animFrame);
		if (overlayTimer) clearTimeout(overlayTimer);
		if (modeLabelTimer) clearTimeout(modeLabelTimer);
		window.removeEventListener('resize', handleResize);
		window.removeEventListener('keydown', handleKeyDown);
		unlistenSpectrum?.();
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={visPageEl}
	class="vis-page"
	onmousemove={() => resetOverlayTimer()}
	onclick={() => resetOverlayTimer()}
	onkeydown={(e) => { if (e.key === 'Enter') resetOverlayTimer(); }}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	role="application"
	aria-label="Music visualizer — click to cycle modes, swipe for direction, Space to play/pause"
	tabindex="0"
>
	<canvas bind:this={canvas} class="vis-canvas" onclick={handleCanvasClick} aria-hidden="true"></canvas>

	{#if showModeLabel}
		<div class="mode-label">{modeLabelText}</div>
	{/if}

	<div class="overlay" class:hidden={!showOverlay}>
		<div class="overlay-track">
			{#if currentTrack}
				<div class="ov-art">
					{#if currentTrack.coverArt}
						<img src={currentTrack.coverArt} alt="" class="ov-art-img" />
					{:else}
						<span>💿</span>
					{/if}
				</div>
				<div class="ov-info">
					<span class="ov-title">{currentTrack.title}</span>
					<span class="ov-artist">{currentTrack.artist}</span>
				</div>
			{:else}
				<span class="ov-empty">No track playing</span>
			{/if}
			{#if liveFFT}
				<span class="live-badge">● Live</span>
			{/if}
		</div>
		<div class="ov-controls">
			<button class="ov-btn" onclick={() => playerStore.previous()} aria-label="Previous">⏮</button>
			<button class="ov-btn play" onclick={() => playerStore.togglePlay()} aria-label={isPlaying ? 'Pause' : 'Play'}>
				{isPlaying ? '⏸' : '▶'}
			</button>
			<button class="ov-btn" onclick={() => playerStore.next()} aria-label="Next">⏭</button>
		</div>
		<button class="back-btn" onclick={() => goto('/nowplaying')} aria-label="Back">← Back</button>
	</div>
</div>

<style>
	.vis-page {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: #000;
		user-select: none;
	}

	.vis-canvas {
		display: block;
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	.mode-label {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 1.1rem;
		font-weight: 700;
		color: #fff;
		background: rgba(0, 0, 0, 0.5);
		padding: 0.4rem 1rem;
		border-radius: 20px;
		pointer-events: none;
		animation: fadeOut 1.4s ease-out 0.2s forwards;
	}

	@keyframes fadeOut {
		0% { opacity: 1; }
		100% { opacity: 0; }
	}

	.overlay {
		position: absolute;
		bottom: 60px;
		left: 0;
		right: 0;
		padding: 1.5rem 1.5rem 1.75rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, transparent 100%);
		display: flex;
		align-items: center;
		gap: 1.25rem;
		transition: opacity 0.4s ease;
	}

	.overlay.hidden {
		opacity: 0;
		pointer-events: none;
	}

	.overlay-track {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.ov-art {
		width: 44px;
		height: 44px;
		border-radius: 6px;
		background: rgba(108, 92, 231, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		flex-shrink: 0;
		overflow: hidden;
	}

	.ov-art-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.ov-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.ov-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ov-artist {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.65);
	}

	.ov-empty {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.live-badge {
		font-size: 0.72rem;
		font-weight: 700;
		color: #6c5ce7;
		background: rgba(108, 92, 231, 0.2);
		border: 1px solid rgba(108, 92, 231, 0.5);
		border-radius: 12px;
		padding: 0.15rem 0.5rem;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.ov-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.ov-btn {
		background: rgba(255, 255, 255, 0.12);
		border: none;
		border-radius: 50%;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1rem;
		color: #fff;
	}

	.ov-btn:hover {
		background: rgba(255, 255, 255, 0.22);
	}

	.ov-btn.play {
		width: 48px;
		height: 48px;
		font-size: 1.2rem;
		background: rgba(108, 92, 231, 0.8);
	}

	.ov-btn.play:hover {
		background: rgba(108, 92, 231, 1);
	}

	.back-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 0.4rem 0.85rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		color: #fff;
		flex-shrink: 0;
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	@media (prefers-reduced-motion: reduce) {
		.mode-label {
			animation: none;
		}
		.overlay {
			transition: none;
		}
	}
</style>
