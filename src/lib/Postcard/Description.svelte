<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import { markdown } from '../util/markdown.ts';
	import { type ArtPiece, normalizeArtist } from '../util/art.ts';

	import Character from './Description/Character.svelte';
	import { formatDate } from '../util/date.ts';
	import Chip from './Chip.svelte';

	interface Props {
		piece: ArtPiece;
		visible: boolean;
		showName: boolean;
		selectedAlt: number | null;
		onselectalt?: (index: number | null) => void;
	}

	let {
		piece,
		visible = $bindable(),
		showName,
		selectedAlt,
		onselectalt = undefined
	}: Props = $props();
</script>

<div class="description-inner" class:showing-description={visible}>
	<div style="overflow: hidden;">
		<div>
			{#if showName}
				<div style="margin-bottom: 0.5rem;">
					<span style="border-bottom: 1px dashed #8886; font-style: italic;">
						{piece.name}
					</span>
				</div>
			{/if}
		</div>

		<div
			style="font-size:0.8em; line-height: 1.2em; {piece.description ? 'margin-bottom: 1rem;' : ''}"
			class="no-p"
		>
			{@html markdown(
				(selectedAlt && piece.alts?.[selectedAlt]?.description) || piece.description || ''
			)}
		</div>

		{#if piece.alts && Object.keys(piece.alts).length > 0}
			<div style="font-size: 0.7em; line-height: 1.2em; margin-bottom: 1rem" class="tags">
				This piece as multiple versions:
				{#if selectedAlt !== null}
					<span>
						<!-- svelte-ignore a11y_invalid_attribute -->
						<a
							href="#"
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onselectalt?.(null);
							}}
						>
							Original Version
						</a>
					</span>
				{/if}

				{#each piece.alts as alt, i}
					{#if i !== selectedAlt}
						<span>
							<!-- svelte-ignore a11y_invalid_attribute -->
							<a
								href="#"
								onclick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onselectalt?.(i);
								}}
							>
								{alt.name}
							</a>
						</span>
					{/if}
				{/each}
			</div>
		{/if}

		<div style="font-size: 0.7em; line-height: 1.2em; margin-bottom: 1rem" class="tags">
			<Chip type="permalink" data={piece} />
		</div>

		<div style="font-size: 0.7em" class="tags">
			{#each normalizeArtist(piece.artist) as artist}
				<Chip type="artist" data={artist} />
			{/each}
			{#each piece.characters ?? [] as character, i}
				<Chip type="character" data={character} />
			{/each}
			{#if piece.tags}
				{#each piece.tags as tag (tag)}
					<Chip type="tag" data={tag} />
				{/each}
			{/if}
		</div>
		{#if piece.date}
			<div
				style="font-size: 0.7em; opacity: 0.8; font-style: italic; margin-top: 0.4rem; line-height: 1em"
			>
				{formatDate(piece.date)}
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	.tags {
		display: flex;
		flex-wrap: wrap;
		line-height: 2em;
		row-gap: 0.25rem;
		column-gap: 0.25rem;
	}
	.description-inner {
		display: grid;
		grid-template-rows: 0fr;
		width: 100%;
		text-align: left;
		padding: 0 2rem 0 2rem;
		transition:
			grid-template-rows 0.2s ease-in-out,
			padding 0.2s ease-in-out;
		pointer-events: auto;
	}
	.description-inner.showing-description {
		grid-template-rows: 1fr;
		padding: 1rem 2rem 1rem 2rem;
	}
	.no-p > :global(p) {
		margin-bottom: 0.25rem;
	}
</style>
