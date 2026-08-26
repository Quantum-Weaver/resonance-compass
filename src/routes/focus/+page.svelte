<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Focus lives in the merged time-room; this address leads to its tab.
	onMount(() => {
		goto('/timer?tab=focus', { replaceState: true });
	});
</script>
