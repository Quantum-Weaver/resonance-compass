<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" aria-hidden="true">
  <rect x="2" y="14" width="3" height="8" rx="1" />
  <rect x="7" y="8" width="3" height="14" rx="1" />
  <rect x="12" y="4" width="3" height="18" rx="1" />
  <rect x="17" y="10" width="3" height="12" rx="1" />
</svg>
