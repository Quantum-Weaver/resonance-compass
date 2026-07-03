<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" aria-hidden="true">
  <polygon points="19,3 7,12 19,21" />
  <rect x="3.5" y="3" width="2.5" height="18" rx="1" />
</svg>
