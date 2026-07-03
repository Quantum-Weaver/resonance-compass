<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" aria-hidden="true">
  <polygon points="6,3 21,12 6,21" />
</svg>
