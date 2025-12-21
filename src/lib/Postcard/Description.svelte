<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import { markdown } from '../util/markdown.ts';
	import { type ArtPiece, normalizeArtist } from '../util/art.ts';

	import Character from './Description/Character.svelte';
	import { formatDate } from '../util/date.ts';

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
			<span>
				<a href={`/piece/${piece.slug}`}> Permalink </a>
			</span>
		</div>

		<div style="font-size: 0.7em" class="tags">
			{#each normalizeArtist(piece.artist) as artist}
				<span>
					<a href="/artist/{artist.name}">
						<span class="fa solid fa-paintbrush"></span>
						{artist.info ? `@${artist.name}` : artist.name}
					</a>
				</span>
			{/each}
			{#each piece.characters ?? [] as character, i}
				<span>
					<Character {character} />
				</span>
			{/each}
			{#if piece.tags}
				{#each piece.tags as tag (tag)}
					<span>
						<a href="/tag/{tag.toLowerCase()}">
							<!-- <span class="icon solid fa-hashtag" /> -->
							#{tag.toLowerCase()}
						</a>
					</span>
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

		& > span {
			line-height: 1.3em;
			display: inline-block;
			padding: 2px 6px;
			border-radius: 4px;
			border: 1px solid #fff4;
			background-color: #0001;
			transition: border-color 0.35s ease-in-out;
			white-space: nowrap;

			& :global(a) {
				border: 0;
			}
			&:first-child {
				margin-left: 0;
			}
			&:has(:global(a:hover)) {
				border-color: var(--color-accent);
			}
		}
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
