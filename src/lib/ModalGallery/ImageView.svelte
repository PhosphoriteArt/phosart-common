<script lang="ts">
	import { run } from 'svelte/legacy';

	import Image from '../Image.svelte';

	import Spinner from './Spinner.svelte';
	import Headline from '../Postcard/Headline.svelte';
	import Description from '../Postcard/Description.svelte';
	import type { ArtPiece } from '../util/art.ts';

	interface Props {
		piece: ArtPiece;
		nameInHeader: boolean;
	}

	let { piece, nameInHeader }: Props = $props();

	let loading = $state(true);
	let showingDescription = $state(false);

	let selectedAlt: number | null = $state(null);

	let image = $derived(typeof selectedAlt === 'number' ? piece.alts![selectedAlt] : piece);

	run(() => {
		if (piece) loading = true;
	});
</script>

<Spinner {loading} />

<div class="image-container">
	<Image
		video={image.video?.full}
		controls
		picture={image.image.full}
		alt={image.alt}
		onloaded={() => (loading = false)}
	/>
</div>

<div class="headline-container">
	<Headline {piece} bind:showingDescription showName={nameInHeader} />
</div>
<div class="description-container">
	<Description
		{piece}
		bind:visible={showingDescription}
		showName={!nameInHeader}
		{selectedAlt}
		onselectalt={(i) => (selectedAlt = i ?? null)}
	/>
</div>

<style lang="postcss">
	.image-container {
		position: absolute;
		top: var(--info-height);
		bottom: 0;
		left: 0;
		right: 0;
	}
	.description-container {
		position: absolute;
		top: var(--info-height);
		height: calc(100% - var(--info-height));
		left: 0;
		right: 0;
		color: #ddd;
		overflow-x: hidden;
		overflow-y: auto;

		& > :global(*) {
			background-color: #000c;
		}
		:global(strong) {
			color: white;
		}
		pointer-events: none;
	}

	.headline-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		color: white;
		background-color: black;
		height: var(--info-height);
		z-index: 9;
	}
</style>
