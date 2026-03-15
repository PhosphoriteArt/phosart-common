<script lang="ts">
	import { run } from 'svelte/legacy';

	import Spinner from './Spinner.svelte';
	import Headline from '../Postcard/Headline.svelte';
	import Description from '../Postcard/Description.svelte';
	import type { ArtPiece } from '../util/art.ts';
	import { useLibraryConfig } from '../util/phosart_config.svelte.ts';
	import type { Snippet } from 'svelte';

	interface Props {
		piece: ArtPiece;
		nameInHeader: boolean;
		display: Snippet<
			[image: ArtPiece | NonNullable<ArtPiece['alts']>[number], onloaded: () => void]
		>;
	}

	let { piece, nameInHeader, display }: Props = $props();

	let config = useLibraryConfig();

	let loading = $state(true);
	let showingDescription = $state(false);

	let selectedAlt: number | null = $state(null);

	let image = $derived(typeof selectedAlt === 'number' ? piece.alts![selectedAlt] : piece);

	run(() => {
		if (piece) loading = true;
	});
</script>

<Spinner {loading} />

{@render display(image, () => (loading = false))}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="headline-container"
	onclick={(e) => e.stopPropagation()}
	onkeypress={(e) => e.stopPropagation()}
	onpointerdown={(e) => e.stopPropagation()}
	onpointerup={(e) => e.stopPropagation()}
	role="contentinfo"
>
	<Headline {piece} bind:showingDescription showName={!config.modal?.hideNames && nameInHeader} />
</div>
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="description-container"
	onclick={(e) => e.stopPropagation()}
	onkeypress={(e) => e.stopPropagation()}
	onpointerdown={(e) => e.stopPropagation()}
	onpointerup={(e) => e.stopPropagation()}
	role="contentinfo"
>
	<Description
		{piece}
		bind:visible={showingDescription}
		showName={!config.modal?.hideNames && !nameInHeader}
		{selectedAlt}
		onselectalt={(i) => (selectedAlt = i ?? null)}
		hideAlts={piece.alts_display === 'comic_panels'}
	/>
</div>

<style lang="postcss">
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
