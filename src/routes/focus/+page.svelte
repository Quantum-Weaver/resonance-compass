<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Focus lives in the merged time-room now — the ruled Focus+Timer merge
	// (KP's ⚛ word, nothing lost): this address stays honest by leading
	// there, straight to its own tab.
	onMount(() => {
		goto('/timer?tab=focus', { replaceState: true });
	});
</script>
