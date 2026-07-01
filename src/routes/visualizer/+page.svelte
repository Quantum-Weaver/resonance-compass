<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { listen } from '@tauri-apps/api/event';

	type VisMode = 'bars' | 'waveform' | 'spiral' | 'particles';
	const MODES: VisMode[] = ['bars', 'waveform', 'spiral', 'particles'];
	const MODE_LABELS: Record<VisMode, string> = {
		bars: '▊ Bars',
		waveform: '〜 Waveform',
		spiral: '◎ Spiral',
		particles: '✦ Particles',
	};

	let modeIndex = $state(0);
	const mode = $derived(MODES[modeIndex]);
	let showOverlay = $state(true);
	let showModeLabel = $state(false);
	let liveFFT = $state(false);

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

	// ── Bars ───────────────────────────────────────────────────────────────────

	function drawBars(ctx: CanvasRenderingContext2D, W: number, H: number, ts: number) {
		const gap = 2;
		const bw = Math.max(1, (W - (N_BARS - 1) * gap) / N_BARS);
		const tid = currentTrack?.id ?? '';

		if (liveFFT && !reducedMotion) {
			for (let i = 0; i < N_BARS; i++) {
				smoothedBars[i] += (targetBars[i] - smoothedBars[i]) * 0.35;
			}
		}

		for (let i = 0; i < N_BARS; i++) {
			let ratio: number;

			if (liveFFT) {
				ratio = smoothedBars[i];
			} else {
				const base = 0.08 + hash(tid, i) * 0.55;
				const freq = 0.5 + hash(tid + 'f', i) * 2.5;
				const phase = hash(tid + 'p', i) * Math.PI * 2;
				if (reducedMotion || !isPlaying) {
					ratio = base * 0.25;
				} else {
					const wave = (Math.sin((ts / 1000) * freq + phase) + 1) / 2;
					ratio = base * 0.2 + wave * base * 0.8;
				}
			}

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

	// ── Main draw loop ─────────────────────────────────────────────────────────

	function draw(ts: number) {
		if (!canvas || !mounted) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const W = canvas.width;
		const H = canvas.height;
		const dt = Math.min((ts - (lastTs || ts)) / 1000, 0.1);
		lastTs = ts;

		ctx.clearRect(0, 0, W, H);
		ctx.shadowBlur = 0;

		const m = mode;
		if (m === 'bars') drawBars(ctx, W, H, ts);
		else if (m === 'waveform') drawWaveform(ctx, W, H, ts);
		else if (m === 'spiral') drawSpiral(ctx, W, H, ts);
		else {
			updateParticles(W, H, dt);
			drawParticles(ctx);
		}

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

	function flashModeLabel() {
		showModeLabel = true;
		if (modeLabelTimer) clearTimeout(modeLabelTimer);
		modeLabelTimer = setTimeout(() => {
			showModeLabel = false;
		}, 1600);
	}

	function cycleMode(direction: 1 | -1 = 1) {
		modeIndex = (modeIndex + direction + MODES.length) % MODES.length;
		flashModeLabel();
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
		<div class="mode-label">{MODE_LABELS[mode]}</div>
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
		width: 40px;
		height: 40px;
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
