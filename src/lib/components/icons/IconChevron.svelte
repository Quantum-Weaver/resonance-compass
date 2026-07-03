<script lang="ts">
  let { size = 20, color = 'currentColor', direction = 'down' }: { size?: number; color?: string; direction?: 'up' | 'down' | 'left' | 'right' } = $props();
  const rotations = { down: 0, up: 180, right: -90, left: 90 };
  const rotate = $derived(rotations[direction]);
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform: rotate({rotate}deg)">
  <polyline points="6,9 12,15 18,9" />
</svg>
