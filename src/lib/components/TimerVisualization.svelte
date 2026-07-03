<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	let {
		remainingSecs,
		totalSecs,
		mode,
	}: {
		remainingSecs: number;
		totalSecs: number;
		mode: 'sand' | 'breathing' | 'dissolve' | 'flower' | 'metatron' | 'cycle' | 'numeric';
	} = $props();

	let sandCanvas = $state<HTMLCanvasElement | null>(null);
	let dissolveCanvas = $state<HTMLCanvasElement | null>(null);
	let mounted = false;
	let rafId = 0;

	const progress = $derived(totalSecs > 0 ? 1 - remainingSecs / totalSecs : 0);

	function fmt(secs: number): string {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	// ── SAND — The Keeper's Hourglass ──────────────────────────────────────────

	const SAND_COLORS = ['#FDCB6E', '#E17055', '#C49A6C', '#8B5A2B', '#D4A853', '#B8732A'] as const;

	interface StreamParticle {
		x: number; y: number; vy: number; r: number;
		colorIdx: number; alpha: number;
	}

	let streamParticles: StreamParticle[] = [];
	let lastSpawnTime = 0;
	let sandInitialized = false;

	function initSand() {
		streamParticles = [];
		lastSpawnTime = 0;
		sandInitialized = true;
	}

	function drawSand(ctx: CanvasRenderingContext2D, w: number, h: number) {
		ctx.clearRect(0, 0, w, h);

		const cx = w / 2;
		const frameT = h * 0.07;
		const frameB = h * 0.91;
		const midY = (frameT + frameB) / 2;
		const topW = w * 0.36;
		const neckW = 4.5;
		const neckHalf = h * 0.04;
		const neckTopY = midY - neckHalf;
		const neckBotY = midY + neckHalf;
		const topChamberH = neckTopY - frameT;
		const botChamberH = frameB - neckBotY;
		const bend = topW * 0.35;

		const hg = new Path2D();
		hg.moveTo(cx - topW, frameT);
		hg.lineTo(cx + topW, frameT);
		hg.bezierCurveTo(cx + topW - bend, frameT + topChamberH * 0.5, cx + neckW, neckTopY - topChamberH * 0.1, cx + neckW, neckTopY);
		hg.lineTo(cx + neckW, neckBotY);
		hg.bezierCurveTo(cx + neckW, neckBotY + botChamberH * 0.1, cx + topW - bend, frameB - botChamberH * 0.5, cx + topW, frameB);
		hg.lineTo(cx - topW, frameB);
		hg.bezierCurveTo(cx - topW + bend, frameB - botChamberH * 0.5, cx - neckW, neckBotY + botChamberH * 0.1, cx - neckW, neckBotY);
		hg.lineTo(cx - neckW, neckTopY);
		hg.bezierCurveTo(cx - neckW, neckTopY - topChamberH * 0.1, cx - topW + bend, frameT + topChamberH * 0.5, cx - topW, frameT);
		hg.closePath();

		ctx.save();
		ctx.clip(hg);
		ctx.fillStyle = 'rgba(200, 230, 255, 0.05)';
		ctx.fillRect(0, 0, w, h);
		ctx.restore();

		const sandSurfaceY = frameT + progress * topChamberH;
		if (sandSurfaceY < neckTopY - 0.5) {
			ctx.save();
			ctx.clip(hg);
			ctx.beginPath();
			ctx.rect(0, sandSurfaceY, w, neckTopY - sandSurfaceY + 1);
			ctx.clip();
			const tg = ctx.createLinearGradient(0, sandSurfaceY, 0, neckTopY);
			tg.addColorStop(0, '#C49A6C');
			tg.addColorStop(0.35, '#FDCB6E');
			tg.addColorStop(0.7, '#D4A853');
			tg.addColorStop(1, '#8B5A2B');
			ctx.fillStyle = tg;
			ctx.fillRect(0, sandSurfaceY, w, neckTopY - sandSurfaceY + 1);
			ctx.restore();
		}

		const maxPileH = botChamberH * 0.87;
		const pileH = progress * maxPileH;
		const maxPileW = topW * 0.74;

		if (pileH > 0.5) {
			const pileW = Math.min(maxPileW, Math.max(4, pileH * 0.75));
			const pileBaseY = frameB - 2;
			const pilePeakY = pileBaseY - pileH;

			ctx.save();
			ctx.clip(hg);

			ctx.beginPath();
			ctx.moveTo(cx - pileW, pileBaseY);
			ctx.bezierCurveTo(cx - pileW * 0.85, pileBaseY - pileH * 0.05, cx - pileW * 0.15, pilePeakY + pileH * 0.08, cx, pilePeakY);
			ctx.bezierCurveTo(cx + pileW * 0.15, pilePeakY + pileH * 0.08, cx + pileW * 0.85, pileBaseY - pileH * 0.05, cx + pileW, pileBaseY);
			ctx.closePath();

			const pg = ctx.createLinearGradient(cx - pileW, 0, cx + pileW, 0);
			pg.addColorStop(0, '#7A4E25');
			pg.addColorStop(0.25, '#C49A6C');
			pg.addColorStop(0.5, '#FDCB6E');
			pg.addColorStop(0.75, '#C49A6C');
			pg.addColorStop(1, '#7A4E25');
			ctx.fillStyle = pg;
			ctx.fill();

			if (pileH > 12) {
				ctx.lineWidth = 1;
				for (let s = 0; s < 3; s++) {
					const sy = pileBaseY - pileH * (0.25 + s * 0.22);
					const sw = pileW * (0.9 - s * 0.2);
					ctx.beginPath();
					ctx.moveTo(cx - sw, sy);
					ctx.bezierCurveTo(cx - sw * 0.5, sy - 3, cx + sw * 0.5, sy - 3, cx + sw, sy);
					ctx.strokeStyle = `rgba(90,45,10,${0.18 - s * 0.04})`;
					ctx.stroke();
				}
			}
			ctx.restore();
		}

		const isFlowing = progress > 0.001 && progress < 0.999;
		const now = Date.now();

		if (isFlowing) {
			const pilePeakY = frameB - 2 - pileH;
			if (now - lastSpawnTime > 65) {
				streamParticles.push({
					x: cx + (Math.random() - 0.5) * 2,
					y: neckTopY,
					vy: 1.8 + Math.random() * 1.2,
					r: 1.2 + Math.random() * 1.2,
					colorIdx: Math.floor(Math.random() * SAND_COLORS.length),
					alpha: 1,
				});
				lastSpawnTime = now;
			}

			streamParticles = streamParticles.filter((sp) => sp.alpha > 0.05);
			for (const sp of streamParticles) {
				sp.y += sp.vy;
				sp.vy += 0.18;
				if (sp.y > neckBotY) sp.x += (Math.random() - 0.5) * 0.6;
				if (sp.y >= pilePeakY - sp.r) sp.alpha = 0;
				const hexA = Math.round(sp.alpha * 255).toString(16).padStart(2, '0');
				ctx.beginPath();
				ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
				ctx.fillStyle = SAND_COLORS[sp.colorIdx] + hexA;
				ctx.fill();
			}

			const sAlpha = 0.65 + Math.sin(now / 55) * 0.2;
			ctx.fillStyle = `rgba(253,203,110,${sAlpha})`;
			ctx.fillRect(cx - 2, neckTopY, 4, neckBotY - neckTopY);
		}

		ctx.save();
		if (isFlowing) { ctx.shadowColor = '#FDCB6E'; ctx.shadowBlur = 14; }
		ctx.strokeStyle = '#8B6914';
		ctx.lineWidth = 1.8;
		ctx.stroke(hg);
		ctx.restore();

		const capH = 13;
		const capW = topW + 9;
		for (const capY of [frameT - capH, frameB]) {
			ctx.save();
			if (isFlowing) { ctx.shadowColor = '#FDCB6E'; ctx.shadowBlur = 8; }
			const wg = ctx.createLinearGradient(0, capY, 0, capY + capH);
			wg.addColorStop(0, '#5C3A1A');
			wg.addColorStop(0.5, '#3E260E');
			wg.addColorStop(1, '#2A1808');
			ctx.fillStyle = wg;
			ctx.beginPath();
			ctx.rect(cx - capW, capY, capW * 2, capH);
			ctx.fill();
			ctx.strokeStyle = '#8B6914';
			ctx.lineWidth = 1.2;
			ctx.stroke();
			ctx.restore();
		}
	}

	function sandLoop() {
		if (!mounted || !sandCanvas) return;
		const ctx = sandCanvas.getContext('2d');
		if (!ctx) return;
		const w = sandCanvas.width;
		const h = sandCanvas.height;
		if (!sandInitialized) initSand();
		drawSand(ctx, w, h);
		rafId = requestAnimationFrame(sandLoop);
	}

	// ── DISSOLVE PATTERNS — Mandala, Flower of Life, Metatron's Cube ────────────

	let dissolveInitialized = false;
	let dissolvePixels: Uint8ClampedArray | null = null;
	let dissolveOrder: number[] = [];
	let dissolveImgData: ImageData | null = null;

	let cyclePhase = 0;
	let cycleSubMode: 'dissolve' | 'flower' | 'metatron' = 'dissolve';
	let lastCycleTime = 0;
	const CYCLE_MS = 10000;

	const MANDALA_COLORS = [
		[108, 92, 231], [9, 132, 227], [253, 203, 110],
		[225, 112, 85], [162, 155, 254], [85, 239, 196],
	] as const;

	function mandalaPixelColor(cx: number, cy: number, px: number, py: number, size: number): [number, number, number, number] {
		const dx = px - cx;
		const dy = py - cy;
		const dist = Math.sqrt(dx * dx + dy * dy);
		const maxR = size * 0.46;
		if (dist > maxR) return [0, 0, 0, 0];
		const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
		const arms = 6;
		const armAngle = (angle % ((Math.PI * 2) / arms)) / ((Math.PI * 2) / arms);
		const mirror = armAngle < 0.5 ? armAngle * 2 : (1 - armAngle) * 2;
		const rings = 5;
		const ring = Math.floor((dist / maxR) * rings);
		const wave = Math.sin(mirror * Math.PI * 3 + ring * 0.8) * 0.5 + 0.5;
		const spoke = Math.pow(Math.sin(mirror * Math.PI), 2);
		const combined = wave * 0.6 + spoke * 0.4;
		const colorIdx = (ring + Math.floor(mirror * 2)) % MANDALA_COLORS.length;
		const [r, g, b] = MANDALA_COLORS[colorIdx];
		const brightness = 0.4 + combined * 0.6;
		const fade = 1 - Math.pow(dist / maxR, 2.5) * 0.4;
		const alpha = Math.round(255 * fade * (0.7 + combined * 0.3));
		return [Math.round(r * brightness), Math.round(g * brightness), Math.round(b * brightness), alpha];
	}

	function buildMandalaImage(w: number, h: number): ImageData {
		const cx = w / 2;
		const cy = h / 2;
		const size = Math.min(w, h);
		const img = new ImageData(w, h);
		const d = img.data;
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const [r, g, b, a] = mandalaPixelColor(cx, cy, x, y, size);
				const i = (y * w + x) * 4;
				d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
			}
		}
		return img;
	}

	function buildFlowerImage(w: number, h: number): ImageData {
		const off = document.createElement('canvas');
		off.width = w; off.height = h;
		const ctx = off.getContext('2d')!;
		const cx = w / 2;
		const cy = h / 2;
		const r = Math.min(w, h) * 0.155;
		const COLS = ['#6C5CE7', '#0984E3', '#FDCB6E', '#E17055', '#A29BFE', '#00B894', '#6C5CE7'];
		const centers: [number, number][] = [[cx, cy]];
		for (let i = 0; i < 6; i++) {
			centers.push([cx + r * Math.cos((i * Math.PI) / 3), cy + r * Math.sin((i * Math.PI) / 3)]);
		}
		ctx.lineWidth = 1.5;
		for (let i = 0; i < centers.length; i++) {
			ctx.strokeStyle = COLS[i];
			ctx.shadowColor = COLS[i];
			ctx.shadowBlur = 5;
			ctx.beginPath();
			ctx.arc(centers[i][0], centers[i][1], r, 0, Math.PI * 2);
			ctx.stroke();
		}
		return ctx.getImageData(0, 0, w, h);
	}

	function buildMetatronImage(w: number, h: number): ImageData {
		const off = document.createElement('canvas');
		off.width = w; off.height = h;
		const ctx = off.getContext('2d')!;
		const cx = w / 2;
		const cy = h / 2;
		const r = Math.min(w, h) * 0.065;
		const d_val = r * 2;

		const centers: [number, number][] = [[cx, cy]];
		for (let i = 0; i < 6; i++) {
			const ang = (i * Math.PI) / 3;
			centers.push([cx + d_val * Math.cos(ang), cy + d_val * Math.sin(ang)]);
		}
		for (let i = 0; i < 6; i++) {
			const ang = (i * Math.PI) / 3;
			centers.push([cx + d_val * 2 * Math.cos(ang), cy + d_val * 2 * Math.sin(ang)]);
		}

		ctx.lineWidth = 0.55;
		for (let i = 0; i < centers.length; i++) {
			for (let j = i + 1; j < centers.length; j++) {
				const t = i / centers.length;
				const cr = Math.round(108 + (9 - 108) * t);
				const cg = Math.round(92 + (132 - 92) * t);
				ctx.strokeStyle = `rgba(${cr},${cg},231,0.38)`;
				ctx.beginPath();
				ctx.moveTo(centers[i][0], centers[i][1]);
				ctx.lineTo(centers[j][0], centers[j][1]);
				ctx.stroke();
			}
		}

		ctx.lineWidth = 1.2;
		for (let i = 0; i < centers.length; i++) {
			const col = i === 0 ? '#6C5CE7' : i <= 6 ? '#FDCB6E' : '#0984E3';
			ctx.strokeStyle = col;
			ctx.shadowColor = col;
			ctx.shadowBlur = 3;
			ctx.beginPath();
			ctx.arc(centers[i][0], centers[i][1], r, 0, Math.PI * 2);
			ctx.stroke();
		}
		return ctx.getImageData(0, 0, w, h);
	}

	function buildDissolvePattern(w: number, h: number, pattern: 'dissolve' | 'flower' | 'metatron') {
		const imgData = pattern === 'flower' ? buildFlowerImage(w, h)
			: pattern === 'metatron' ? buildMetatronImage(w, h)
			: buildMandalaImage(w, h);

		const d = imgData.data;
		const total = w * h;
		const order = Array.from({ length: total }, (_, i) => i);
		for (let i = total - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[order[i], order[j]] = [order[j], order[i]];
		}
		dissolveImgData = imgData;
		dissolvePixels = new Uint8ClampedArray(d);
		dissolveOrder = order;
		dissolveInitialized = true;
	}

	function drawDissolve(ctx: CanvasRenderingContext2D, w: number, h: number) {
		if (!dissolveImgData || !dissolvePixels) return;
		const d = dissolveImgData.data;
		for (let i = 0; i < dissolvePixels.length; i++) d[i] = dissolvePixels[i];
		const eraseCount = Math.floor(progress * dissolveOrder.length);
		for (let i = 0; i < eraseCount; i++) {
			const pi = dissolveOrder[i] * 4;
			d[pi + 3] = 0;
		}
		ctx.clearRect(0, 0, w, h);
		ctx.putImageData(dissolveImgData, 0, 0);
	}

	function dissolveLoop() {
		if (!mounted || !dissolveCanvas) return;
		const ctx = dissolveCanvas.getContext('2d');
		if (!ctx) return;
		const w = dissolveCanvas.width;
		const h = dissolveCanvas.height;

		if (mode === 'cycle') {
			const now = Date.now();
			if (lastCycleTime === 0) lastCycleTime = now;
			if (now - lastCycleTime >= CYCLE_MS) {
				const CYCLE_PATTERNS = ['dissolve', 'flower', 'metatron'] as const;
				cyclePhase = (cyclePhase + 1) % 3;
				cycleSubMode = CYCLE_PATTERNS[cyclePhase];
				dissolveInitialized = false;
				lastCycleTime = now;
			}
		}

		if (!dissolveInitialized) {
			const effective = mode === 'cycle' ? cycleSubMode : (mode as 'dissolve' | 'flower' | 'metatron');
			buildDissolvePattern(w, h, effective);
		}

		drawDissolve(ctx, w, h);
		rafId = requestAnimationFrame(dissolveLoop);
	}

	// ── BREATHING — pure SVG/CSS ─────────────────────────────────────────────────

	const breathCycleSecs = $derived(() => {
		const speed = 1 - progress * 0.5;
		return 5 / speed;
	});

	const breathColor = $derived(() => {
		const r = Math.round(108 + (9 - 108) * progress);
		const g = Math.round(92 + (132 - 92) * progress);
		const b = Math.round(231 + (227 - 231) * progress);
		return `rgb(${r},${g},${b})`;
	});

	// ── Lifecycle ──────────────────────────────────────────────────────────────

	function isDissolveMode(m: string) {
		return m === 'dissolve' || m === 'flower' || m === 'metatron' || m === 'cycle';
	}

	function startLoop() {
		cancelAnimationFrame(rafId);
		if (mode === 'sand' && sandCanvas) {
			sandLoop();
		} else if (isDissolveMode(mode) && dissolveCanvas) {
			dissolveLoop();
		}
	}

	onMount(() => {
		mounted = true;
		startLoop();
	});

	onDestroy(() => {
		mounted = false;
		cancelAnimationFrame(rafId);
	});

	$effect(() => {
		if (mode === 'sand') sandInitialized = false;
		if (isDissolveMode(mode)) {
			dissolveInitialized = false;
			cyclePhase = 0;
			cycleSubMode = 'dissolve';
			lastCycleTime = 0;
		}
		if (mounted) startLoop();
	});

	$effect(() => {
		if (sandCanvas && mode === 'sand' && mounted) {
			sandInitialized = false;
			startLoop();
		}
	});

	$effect(() => {
		if (dissolveCanvas && isDissolveMode(mode) && mounted) {
			dissolveInitialized = false;
			startLoop();
		}
	});
</script>

{#if mode === 'numeric'}
	<div class="numeric">
		<span class="num-time">{fmt(remainingSecs)}</span>
		<div class="num-arc-wrap">
			<svg viewBox="0 0 120 120" class="num-arc">
				<circle class="arc-bg" cx="60" cy="60" r="52" />
				<circle
					class="arc-fg"
					cx="60" cy="60" r="52"
					stroke-dasharray="{2 * Math.PI * 52}"
					stroke-dashoffset="{2 * Math.PI * 52 * progress}"
				/>
			</svg>
		</div>
	</div>
{:else if mode === 'breathing'}
	<div class="breathing">
		<div class="breath-outer" style="animation-duration: {breathCycleSecs()}s; --bc: {breathColor()}">
			<div class="breath-inner" style="animation-duration: {breathCycleSecs()}s; --bc: {breathColor()}">
				<span class="breath-time">{fmt(remainingSecs)}</span>
			</div>
		</div>
		<p class="breath-hint">Breathe with the circle</p>
	</div>
{:else if mode === 'sand'}
	<canvas bind:this={sandCanvas} width="280" height="360" class="vis-canvas"></canvas>
{:else}
	<!-- dissolve / flower / metatron / cycle — all share the same canvas -->
	<canvas bind:this={dissolveCanvas} width="300" height="300" class="vis-canvas"></canvas>
{/if}

<style>
	.numeric {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.num-time {
		font-size: 3.5rem;
		font-weight: 700;
		color: var(--accent);
		letter-spacing: 0.05em;
		font-variant-numeric: tabular-nums;
	}

	.num-arc-wrap {
		width: 120px;
		height: 120px;
	}

	.num-arc {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}

	.arc-bg {
		fill: none;
		stroke: var(--border-color);
		stroke-width: 6;
	}

	.arc-fg {
		fill: none;
		stroke: var(--accent);
		stroke-width: 6;
		stroke-linecap: round;
		transition: stroke-dashoffset 1s linear;
	}

	.breathing {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.breath-outer {
		width: 220px;
		height: 220px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(circle, color-mix(in srgb, var(--bc) 20%, transparent), transparent 70%);
		box-shadow: 0 0 40px color-mix(in srgb, var(--bc) 35%, transparent);
		animation: breathe linear infinite alternate;
	}

	.breath-inner {
		width: 140px;
		height: 140px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(circle, color-mix(in srgb, var(--bc) 30%, transparent), transparent 80%);
		border: 2px solid color-mix(in srgb, var(--bc) 60%, transparent);
		animation: breathe linear infinite alternate;
	}

	.breath-time {
		font-size: 1.6rem;
		font-weight: 700;
		color: var(--text);
		font-variant-numeric: tabular-nums;
	}

	.breath-hint {
		font-size: 0.85rem;
		color: var(--text-secondary);
		letter-spacing: 0.08em;
	}

	@keyframes breathe {
		from { transform: scale(0.82); }
		to { transform: scale(1.12); }
	}

	.vis-canvas {
		display: block;
		border-radius: 12px;
	}

	@media (prefers-reduced-motion: reduce) {
		.breath-outer,
		.breath-inner {
			animation: none;
		}
	}
</style>
