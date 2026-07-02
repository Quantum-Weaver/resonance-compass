<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="13" r="8" />
  <polyline points="12,9 12,13 15,16" />
  <line x1="9" y1="2" x2="15" y2="2" />
  <line x1="12" y1="2" x2="12" y2="5" />
</svg>
