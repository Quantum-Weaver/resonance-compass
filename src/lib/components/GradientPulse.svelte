<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		color?: string;
		pulse?: boolean;
		children: Snippet;
	}

	let { color = 'var(--accent)', pulse = false, children }: Props = $props();
</script>

<div class="gradient-pulse" class:pulse style="--glow-color: {color};">
	{@render children()}
</div>

<style>
	.gradient-pulse {
		position: relative;
	}

	.gradient-pulse::before {
		content: '';
		position: absolute;
		inset: -20px;
		background: radial-gradient(ellipse at center, var(--glow-color) 0%, transparent 70%);
		opacity: 0.15;
		pointer-events: none;
		border-radius: inherit;
		z-index: -1;
	}

	.pulse::before {
		animation: breathe 4s ease-in-out infinite;
	}

	@keyframes breathe {
		0%,
		100% {
			opacity: 0.1;
			transform: scale(0.95);
		}
		50% {
			opacity: 0.25;
			transform: scale(1.05);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse::before {
			animation: none;
		}
	}
</style>
