<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polygon fill={color} stroke="none" points="11,5 6,9 2,9 2,15 6,15 11,19" />
  <path d="M15.54,8.46a5,5,0,0,1,0,7.07" />
  <path d="M19.07,4.93a10,10,0,0,1,0,14.14" />
</svg>
