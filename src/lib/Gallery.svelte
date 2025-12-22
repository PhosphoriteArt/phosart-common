<script lang="ts">
	import type { ArtPiece } from './util/art.ts';
	import FullGallery from './FullGallery.svelte';
	import ModalGallery from './ModalGallery.svelte';
	import type { Component } from 'svelte';
	import { useLibraryConfig } from './util/phosart_config.svelte.ts';

	interface Props {
		pieces: ArtPiece[];
		browser: boolean;
		PieceComponent?: Component<{ piece: ArtPiece; onselect: () => void }>;
		// Displayed when the screen is small
		FullCardComponent?: Component<{ piece: ArtPiece; onselect: () => void }> | null;
	}

	let { pieces, browser, PieceComponent, FullCardComponent }: Props = $props();

	let config = useLibraryConfig();

	let ThePieceComponent = $derived(PieceComponent ?? config.gallery?.DefaultPieceComponent);
	let TheCardComponent = $derived(FullCardComponent ?? config.gallery?.DefaultCardComponent);

	let selected: number | null = $state(null);

	function onSelect(idx: number) {
		selected = idx;
	}
</script>

<div
	class="row"
	class:notsmall={!!FullCardComponent}
	style="margin-bottom: 24px; align-items: stretch;"
>
	{#each pieces as piece, i (piece.slug)}
		<ThePieceComponent {piece} onselect={() => onSelect(i)} />
	{/each}

	<ModalGallery {pieces} {browser} bind:selected />
</div>
{#if TheCardComponent}
	<div class="small">
		<FullGallery {pieces} {browser} addNav={false} CardComponent={TheCardComponent} />
	</div>
{/if}

<style>
	.small {
		display: none;
	}
	@media only screen and (max-width: 400px) {
		.small {
			display: block;
		}
		.notsmall {
			display: none;
		}
	}
</style>
