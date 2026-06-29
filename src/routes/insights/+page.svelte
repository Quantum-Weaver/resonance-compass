<script lang="ts">
	import { echoStore } from '$lib/stores/echo.svelte';
	import { SENSES } from '$lib/data/senses';
	import type { Echo } from '$lib/types/types';

	const echoes = $derived(echoStore.echoes);

	function dayKey(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	// ── 1. Top Emojis ──────────────────────────────────────────────────────────

	const topEmojis = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const e of echoes) {
			if (e.emoji) counts[e.emoji] = (counts[e.emoji] || 0) + 1;
		}
		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 8)
			.map(([emoji, count]) => ({ emoji, count }));
	});

	const maxCount = $derived(topEmojis[0]?.count ?? 1);

	function emojiSize(count: number): string {
		return `${(1.2 + (count / maxCount) * 1.8).toFixed(2)}rem`;
	}

	// ── 2. By Sense ────────────────────────────────────────────────────────────

	const bySense = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const s of SENSES) counts[s.id] = 0;
		for (const e of echoes) {
			if (e.sense in counts) counts[e.sense]++;
		}
		return SENSES
			.map(s => ({ id: s.id, name: s.name, emoji: s.emoji, count: counts[s.id] }))
			.sort((a, b) => b.count - a.count);
	});

	const topSense = $derived(bySense.find(s => s.count > 0) ?? null);

	// ── 3. Streak ──────────────────────────────────────────────────────────────

	const streak = $derived.by(() => {
		if (echoes.length === 0) return 0;

		const days = new Set<string>();
		for (const e of echoes) days.add(dayKey(new Date(e.timestamp)));

		const today = new Date();
		const todayStr = dayKey(today);
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const yestStr = dayKey(yesterday);

		if (!days.has(todayStr) && !days.has(yestStr)) return 0;

		let count = 0;
		const d = days.has(todayStr) ? new Date(today) : new Date(yesterday);
		while (days.has(dayKey(d))) {
			count++;
			d.setDate(d.getDate() - 1);
		}
		return count;
	});

	// ── 4. Time of Day ─────────────────────────────────────────────────────────

	type TODKey = 'morning' | 'afternoon' | 'evening' | 'night';

	interface TimeData {
		b: Record<TODKey, number>;
		dominant: TODKey;
		nonZero: number;
		isEven: boolean;
	}

	const TOD_PERIODS: Array<{ key: TODKey; label: string; icon: string }> = [
		{ key: 'morning', label: 'Morning', icon: '🌅' },
		{ key: 'afternoon', label: 'Afternoon', icon: '☀️' },
		{ key: 'evening', label: 'Evening', icon: '🌆' },
		{ key: 'night', label: 'Night', icon: '🌙' }
	];

	const timeData = $derived.by((): TimeData | null => {
		if (echoes.length === 0) return null;
		const b: Record<TODKey, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
		for (const e of echoes) {
			const h = new Date(e.timestamp).getHours();
			if (h >= 5 && h < 12) b.morning++;
			else if (h >= 12 && h < 17) b.afternoon++;
			else if (h >= 17 && h < 21) b.evening++;
			else b.night++;
		}
		const maxVal = Math.max(b.morning, b.afternoon, b.evening, b.night);
		const dominant = (Object.entries(b).find(([, v]) => v === maxVal)?.[0] ?? 'morning') as TODKey;
		const nonZero = Object.values(b).filter(v => v > 0).length;
		const isEven = maxVal / echoes.length < 0.4;
		return { b, dominant, nonZero, isEven };
	});

	const timeObservation = $derived.by((): string | null => {
		if (!timeData) return null;
		const { dominant, nonZero, isEven } = timeData;
		if (nonZero === 1) return `All your echoes are from the ${dominant} so far.`;
		if (isEven) return 'You log throughout the day.';
		return `You often log in the ${dominant}.`;
	});

	// ── 5. Recent Mood ─────────────────────────────────────────────────────────

	function dayLabel(date: Date, index: number): string {
		if (index === 0) return 'Today';
		if (index === 1) return 'Yest';
		return date.toLocaleDateString('en', { weekday: 'short' });
	}

	const recentMood = $derived.by(() =>
		Array.from({ length: 7 }, (_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const key = dayKey(d);
			const dayEchoes = echoes.filter(e => dayKey(new Date(e.timestamp)) === key);
			const best = dayEchoes.reduce<Echo | null>(
				(b, e) =>
					!b || e.intensity > b.intensity || (e.intensity === b.intensity && e.timestamp > b.timestamp)
						? e
						: b,
				null
			);
			return { key, emoji: best?.emoji ?? null, date: d, count: dayEchoes.length };
		})
	);

	const hasThisWeek = $derived(recentMood.some(d => d.count > 0));

	// ── Not Sure count (Feature 4) ─────────────────────────────────────────────

	const notSureCount = $derived(echoes.filter((e) => e.sense === 'not_sure').length);

	// ── 6. Intensity Trend ─────────────────────────────────────────────────────

	const intensityTrend = $derived.by((): 'increasing' | 'decreasing' | 'stable' | 'insufficient' => {
		const now = Date.now();
		const week = 7 * 24 * 60 * 60 * 1000;
		const thisWeek = echoes.filter(e => now - e.timestamp < week);
		const lastWeek = echoes.filter(e => {
			const age = now - e.timestamp;
			return age >= week && age < 2 * week;
		});
		if (thisWeek.length === 0 || lastWeek.length === 0) return 'insufficient';
		const avgThis = thisWeek.reduce((s, e) => s + e.intensity, 0) / thisWeek.length;
		const avgLast = lastWeek.reduce((s, e) => s + e.intensity, 0) / lastWeek.length;
		const diff = avgThis - avgLast;
		if (diff > 0.3) return 'increasing';
		if (diff < -0.3) return 'decreasing';
		return 'stable';
	});

	// ── 7. Patterns (Feature 5) ─────────────────────────────────────────────────

	interface PatternEntry {
		senseId: string;
		senseName: string;
		senseEmoji: string;
		emoji: string;
		count: number;
		senseTotal: number;
	}

	const patterns = $derived.by((): PatternEntry[] | null => {
		if (echoes.length < 20) return null;
		const senseCounts: Record<string, number> = {};
		const combinations: Record<string, { senseId: string; emoji: string; count: number }> = {};
		for (const e of echoes) {
			if (!e.emoji || e.emoji === '❓' || e.sense === 'not_sure') continue;
			senseCounts[e.sense] = (senseCounts[e.sense] ?? 0) + 1;
			const key = `${e.sense}::${e.emoji}`;
			if (!combinations[key]) combinations[key] = { senseId: e.sense, emoji: e.emoji, count: 0 };
			combinations[key].count++;
		}
		return Object.values(combinations)
			.filter((c) => {
				const total = senseCounts[c.senseId] ?? 0;
				return total >= 3 && c.count >= 3 && c.count / total > 0.3;
			})
			.map((c) => {
				const sense = SENSES.find((s) => s.id === c.senseId);
				return {
					senseId: c.senseId,
					senseName: sense?.name ?? c.senseId,
					senseEmoji: sense?.emoji ?? '✨',
					emoji: c.emoji,
					count: c.count,
					senseTotal: senseCounts[c.senseId] ?? 0
				};
			})
			.sort((a, b) => b.count / b.senseTotal - a.count / a.senseTotal);
	});
</script>

<div class="insights" style="padding-top: env(safe-area-inset-top, 0px);">
	<header class="insights-header">
		<h1 class="insights-title">Your Patterns</h1>
	</header>

	<div class="cards">

		<!-- 1. Top Emojis -->
		<div class="card">
			<div class="card-label">Most felt</div>
			{#if topEmojis.length === 0}
				<p class="card-empty">Log your first echo to see patterns.</p>
			{:else}
				<div class="emoji-cloud">
					{#each topEmojis as { emoji, count }}
						<span
							class="cloud-emoji"
							style="font-size: {emojiSize(count)};"
							title="{count} {count === 1 ? 'echo' : 'echoes'}"
						>{emoji}</span>
					{/each}
				</div>
				<p class="card-note">
					Your most felt: {topEmojis[0].emoji}
					({topEmojis[0].count} {topEmojis[0].count === 1 ? 'echo' : 'echoes'})
				</p>
			{/if}
		</div>

		<!-- 2. By Sense -->
		<div class="card">
			<div class="card-label">By sense</div>
			<div class="sense-list">
				{#each bySense as sense}
					<div class="sense-row" class:muted={sense.count === 0}>
						<span class="sense-em">{sense.emoji}</span>
						<span class="sense-nm">{sense.name}</span>
						<span class="sense-ct">{sense.count}</span>
					</div>
				{/each}
			</div>
			{#if topSense}
				<p class="card-note">You feel most through {topSense.emoji} {topSense.name}.</p>
			{:else}
				<p class="card-empty">Log an echo to see sense distribution.</p>
			{/if}
			{#if notSureCount > 0}
				<p class="card-note">+ {notSureCount} {notSureCount === 1 ? 'echo' : 'echoes'} you weren't sure how to categorize.</p>
			{/if}
		</div>

		<!-- 3. Streak -->
		<div class="card">
			<div class="card-label">Streak</div>
			{#if streak === 0}
				<p class="card-empty">Log an echo today to start a streak.</p>
			{:else}
				<div class="streak-display">
					<span class="streak-num">{streak}</span>
					<span class="streak-unit">{streak === 1 ? 'day' : 'days'} in a row</span>
				</div>
				<p class="card-note">
					{#if streak >= 7}A full week. That's something.
					{:else if streak >= 3}Showing up.
					{:else}Keep going.
					{/if}
				</p>
			{/if}
		</div>

		<!-- 4. Time of Day -->
		<div class="card">
			<div class="card-label">Time of day</div>
			<div class="tod-grid">
				{#each TOD_PERIODS as period}
					<div
						class="tod-cell"
						class:dominant={!!timeData && timeData.dominant === period.key && timeData.b[period.key] > 0}
					>
						<span class="tod-icon">{period.icon}</span>
						<span class="tod-count">{timeData ? timeData.b[period.key] : 0}</span>
						<span class="tod-lbl">{period.label}</span>
					</div>
				{/each}
			</div>
			{#if timeObservation}
				<p class="card-note">{timeObservation}</p>
			{:else}
				<p class="card-empty">Log echoes to see when you feel most.</p>
			{/if}
		</div>

		<!-- 5. Recent Mood -->
		<div class="card">
			<div class="card-label">This week</div>
			{#if !hasThisWeek}
				<p class="card-empty">Log an echo today to start your week.</p>
			{:else}
				<div class="mood-row">
					{#each recentMood as day, i}
						<div class="mood-day">
							<span class="mood-emoji" class:mood-dot={!day.emoji}>{day.emoji ?? '·'}</span>
							<span class="mood-lbl">{dayLabel(day.date, i)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- 6. Intensity Trend -->
		<div class="card">
			<div class="card-label">Intensity</div>
			<p class="card-insight">
				{#if intensityTrend === 'increasing'}
					Your echoes are feeling more intense lately.
				{:else if intensityTrend === 'decreasing'}
					Your echoes have been gentler this week.
				{:else if intensityTrend === 'stable'}
					Your intensity has been steady.
				{:else}
					Log more echoes to see intensity patterns.
				{/if}
			</p>
		</div>

		<!-- 7. Patterns -->
		{#if echoes.length >= 20}
		<div class="card">
			<div class="card-label">Patterns</div>
			{#if patterns && patterns.length > 0}
				{#each patterns as p}
					<p class="card-insight">
						{p.senseEmoji} {p.senseName} with {p.emoji} appears a lot — {p.count} of your {p.senseTotal} {p.senseName} echoes feel this way.
					</p>
				{/each}
			{:else}
				<p class="card-insight">Your echoes are varied. No strong patterns yet.</p>
			{/if}
		</div>
		{/if}

	</div>
</div>

<style>
	.insights {
		min-height: 100%;
	}

	/* Header */
	.insights-header {
		padding: 1rem 1.25rem 0.75rem;
		border-bottom: 1px solid var(--border-color);
	}

	.insights-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}

	/* Card grid */
	.cards {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.card {
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: 14px;
		padding: 1rem 1.1rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.card-label {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.card-note {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin: 0;
		padding-top: 0.1rem;
	}

	.card-empty {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
		font-style: italic;
	}

	.card-insight {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	/* ── 1. Emoji Cloud ── */
	.emoji-cloud {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.65rem;
		padding: 0.25rem 0;
	}

	.cloud-emoji {
		line-height: 1;
		cursor: default;
		transition: transform 0.15s;
	}
	.cloud-emoji:hover { transform: scale(1.15); }

	/* ── 2. Sense List ── */
	.sense-list {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.sense-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.15rem 0;
		transition: opacity 0.15s;
	}
	.sense-row.muted { opacity: 0.3; }

	.sense-em { font-size: 1.1rem; line-height: 1; width: 1.4rem; flex-shrink: 0; }
	.sense-nm { font-size: 0.875rem; color: var(--text-secondary); flex: 1; }
	.sense-ct {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text);
		min-width: 1.5rem;
		text-align: right;
	}

	/* ── 3. Streak ── */
	.streak-display {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.streak-num {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--accent);
		line-height: 1;
	}

	.streak-unit {
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	/* ── 4. Time of Day ── */
	.tod-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.tod-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.6rem 0.25rem;
		border-radius: 10px;
		border: 1.5px solid var(--border-color);
		background: transparent;
		transition: border-color 0.15s, background 0.15s;
	}
	.tod-cell.dominant {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.tod-icon { font-size: 1.2rem; line-height: 1; }
	.tod-count {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text);
	}
	.tod-lbl { font-size: 0.6rem; color: var(--text-muted); text-align: center; }

	/* ── 5. Recent Mood ── */
	.mood-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.3rem;
	}

	.mood-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
	}

	.mood-emoji {
		font-size: 1.4rem;
		line-height: 1;
	}
	.mood-dot {
		font-size: 1.1rem;
		color: var(--border-color);
	}

	.mood-lbl {
		font-size: 0.55rem;
		color: var(--text-muted);
		text-align: center;
		white-space: nowrap;
	}
</style>
