<script lang="ts">
  let { size = 20, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="3" />
  <path d="M12,9 C12,9 9,6 6,6 C6,9 9,9 12,9Z" />
  <path d="M12,9 C12,9 15,6 18,6 C18,9 15,9 12,9Z" />
  <path d="M12,15 C12,15 9,18 6,18 C6,15 9,15 12,15Z" />
  <path d="M12,15 C12,15 15,18 18,18 C18,15 15,15 12,15Z" />
  <path d="M9,12 C9,12 6,9 6,6 C9,6 9,9 9,12Z" />
  <path d="M9,12 C9,12 6,15 6,18 C9,18 9,15 9,12Z" />
  <path d="M15,12 C15,12 18,9 18,6 C15,6 15,9 15,12Z" />
  <path d="M15,12 C15,12 18,15 18,18 C15,18 15,15 15,12Z" />
</svg>
