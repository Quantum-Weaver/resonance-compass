<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Library is the landing; this address leads there.
	onMount(() => {
		goto('/library', { replaceState: true });
	});
</script>
