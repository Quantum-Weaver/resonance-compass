<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M22,12c0,0-4-7-10-7S2,12,2,12s4,7,10,7S22,12,22,12Z" />
  <circle cx="12" cy="12" r="3" />
  <circle cx="12" cy="12" r="7" opacity="0.4" />
</svg>
