<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="3" y="3" width="4" height="18" rx="1" />
  <rect x="10" y="6" width="4" height="15" rx="1" />
  <path d="M17,8l4,13" stroke-width="2" />
</svg>
