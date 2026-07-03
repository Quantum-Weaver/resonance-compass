<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="1,4 1,10 7,10" />
  <path d="M3.51,15a9,9,0,1,0,.49-4.95" />
  <polyline points="12,7 12,12 15,15" />
</svg>
