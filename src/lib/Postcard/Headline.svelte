<script lang="ts">
	import { normalizeArtist, type ArtPiece } from '../util/art.ts';
	import { useArtists } from '../util/artistcontext.ts';
	import ArtistLink from './ArtistLink.svelte';

	const allArtists = useArtists();

	interface Props {
		piece: ArtPiece;
		showName: boolean;
		/* bind */
		showingDescription: boolean;
	}

	let { piece, showName, showingDescription = $bindable() }: Props = $props();
	let artists = $derived(normalizeArtist(piece.artist, allArtists));
</script>

<div class="headline-container">
	<div style="font-style: italic; padding-left: 2rem;" class="byline">
		by <ArtistLink {artists} />
	</div>
	<div style="display: flex">
		{#if showName}
			<div style="padding-right: 2rem" class="piece-name">
				{piece.name}
			</div>
		{/if}
		<div
			role="button"
			tabindex={-1}
			onclick={() => (showingDescription = !showingDescription)}
			onkeypress={() => (showingDescription = !showingDescription)}
			class="details-toggle"
		>
			{showingDescription ? 'hide' : 'show'} details
		</div>
	</div>
</div>

<style>
	.headline-container {
		display: flex;
		padding: 0 2rem;
		flex-direction: row-reverse;
		justify-content: space-between;
		align-items: center;
		overflow: hidden;
		width: 100%;
		height: 100%;
		white-space: nowrap;
		container: headline / size;
	}

	.details-toggle {
		color: #6389da;
		cursor: pointer;
		font-size: 0.9em;
		font-style: italic;
		user-select: none;
	}

	@container headline (width < 300px) {
		.byline {
			visibility: hidden;
		}
	}
</style>
