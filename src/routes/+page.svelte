<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Library is the landing — the U9 merge (KP's ⚛ ruling, THE-UX-WALK):
	// Home's living pieces (greeting · resume · recently played) moved into
	// Library's continue-strip; this address stays honest by leading there.
	onMount(() => {
		goto('/library', { replaceState: true });
	});
</script>
