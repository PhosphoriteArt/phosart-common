<script lang="ts">
	import type { ArtPiece } from './util/art.ts';
	import FullGallery from './FullGallery.svelte';
	import ModalGallery from './ModalGallery.svelte';
	import type { Component } from 'svelte';

	interface Props {
		pieces: ArtPiece[];
		browser: boolean,
		PieceComponent: Component<{piece: ArtPiece, onselect: () => void}>,
		// Displayed when the screen is small
		FullCardComponent: Component<{piece: ArtPiece, onselect: () => void}> | null,
	}

	let { pieces, browser, PieceComponent, FullCardComponent }: Props = $props();

	let selected: number | null = $state(null);

	function onSelect(idx: number) {
		selected = idx;
	}
</script>

<div class="row" class:notsmall={!!FullCardComponent} style="margin-bottom: 24px; align-items: stretch;">
	{#each pieces as piece, i (piece.slug)}
		<PieceComponent {piece} onselect={() => onSelect(i)} />
	{/each}

	<ModalGallery {pieces} {browser} bind:selected />
</div>
{#if FullCardComponent}
<div class="small">
	<FullGallery {pieces} {browser} addNav={false} CardComponent={FullCardComponent} />
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
