<script lang="ts">
  let { size = 20, color = 'currentColor', filled = false }: { size?: number; color?: string; filled?: boolean } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M20.84,4.61a5.5,5.5,0,0,0-7.78,0L12,5.67l-1.06-1.06a5.5,5.5,0,0,0-7.78,7.78L12,21.23l8.84-8.84A5.5,5.5,0,0,0,20.84,4.61Z" />
</svg>
