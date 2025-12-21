<script lang="ts" module>
	import { getContext } from 'svelte';
	const ctxKey = Symbol();

	export function isHighRes() {
		return getContext(ctxKey) === true;
	}
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	setContext(ctxKey, true);
</script>

{@render children?.()}