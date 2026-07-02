<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="17,1 21,5 17,9" />
  <path d="M3,11V9a4,4,0,0,1,4-4H21" />
  <polyline points="7,23 3,19 7,15" />
  <path d="M21,13v2a4,4,0,0,1-4,4H3" />
</svg>
