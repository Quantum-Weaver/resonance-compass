<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M20,21v-2a4,4,0,0,0-4-4H8a4,4,0,0,0-4,4v2" />
  <circle cx="12" cy="7" r="4" />
  <path d="M16,3.5 L17.5,5 L19,3.5" stroke-width="1.5" opacity="0.7" />
</svg>
