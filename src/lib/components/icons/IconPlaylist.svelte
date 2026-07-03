<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <line x1="3" y1="6" x2="16" y2="6" />
  <line x1="3" y1="12" x2="16" y2="12" />
  <line x1="3" y1="18" x2="11" y2="18" />
  <polygon fill={color} stroke="none" points="17,10 23,14 17,18" />
</svg>
