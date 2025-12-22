<script lang="ts">
	import type { ArtPiece } from './util/art.ts';
	import ModalGallery from './ModalGallery.svelte';
	import type { Component } from 'svelte';
	import { useLibraryConfig } from './util/phosart_config.svelte.ts';

	interface Props {
		pieces: ArtPiece[];
		browser: boolean;
		PieceComponent?: Component<{ piece: ArtPiece; onselect: () => void }>;
	}

	let { pieces, browser, PieceComponent }: Props = $props();

	let config = useLibraryConfig();

	let ThePieceComponent = $derived(PieceComponent ?? config.gallery?.DefaultPieceComponent);

	let selected: number | null = $state(null);

	function onSelect(idx: number) {
		selected = idx;
	}
</script>

{#each pieces as piece, i (piece.slug)}
	<ThePieceComponent {piece} onselect={() => onSelect(i)} />
{/each}

<ModalGallery {pieces} {browser} bind:selected />
