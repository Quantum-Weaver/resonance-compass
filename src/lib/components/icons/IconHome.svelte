<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M3,9.5L12,3l9,6.5V21a1,1,0,0,1-1,1H14V15H10v7H4a1,1,0,0,1-1-1Z" />
</svg>
