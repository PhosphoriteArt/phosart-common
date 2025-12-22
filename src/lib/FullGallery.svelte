<script lang="ts">
	import type { ArtPiece } from './util/art.ts';
	import ModalGallery from './ModalGallery.svelte';
	import type { Component } from 'svelte';
	import { useLibraryConfig } from './util/phosart_config.svelte.ts';

	interface Props {
		pieces: ArtPiece[];
		addNav?: boolean;
		noDetails?: boolean;
		browser: boolean;
		CardComponent?: Component<{
			piece: ArtPiece;
			onselect: () => void;
			showDescriptionByDefault: boolean;
		}>;
	}

	let { pieces, addNav = false, noDetails = false, browser, CardComponent }: Props = $props();

	let config = useLibraryConfig();

	const TheCardComponent = $derived(CardComponent ?? config.gallery?.DefaultCardComponent);

	let selected: number | null = $state(null);

	function onSelect(idx: number) {
		selected = idx;
	}
</script>

<div
	style="margin-bottom: 24px; align-items: stretch; display: flex; flex-direction: column; row-gap: 2rem;"
>
	{#each pieces as piece, i (piece.slug)}
		<section
			id={piece.name}
			data-nav={piece.name}
			data-nav-icon="palette"
			class:scroll-ignore={!addNav}
		>
			<TheCardComponent
				{piece}
				onselect={() => onSelect(i)}
				showDescriptionByDefault={!noDetails}
			/>
		</section>
	{/each}

	<ModalGallery {pieces} {browser} bind:selected />
</div>
