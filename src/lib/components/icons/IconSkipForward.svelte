<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" aria-hidden="true">
  <polygon points="5,3 17,12 5,21" />
  <rect x="18" y="3" width="2.5" height="18" rx="1" />
</svg>
