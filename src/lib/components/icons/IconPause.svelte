<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" aria-hidden="true">
  <rect x="5" y="3" width="4" height="18" rx="1.5" />
  <rect x="15" y="3" width="4" height="18" rx="1.5" />
</svg>
