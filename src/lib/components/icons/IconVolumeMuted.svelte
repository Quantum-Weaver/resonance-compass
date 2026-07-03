<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polygon fill={color} stroke="none" points="11,5 6,9 2,9 2,15 6,15 11,19" />
  <line x1="23" y1="9" x2="17" y2="15" />
  <line x1="17" y1="9" x2="23" y2="15" />
</svg>
