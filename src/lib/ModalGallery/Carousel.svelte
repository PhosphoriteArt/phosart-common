<script lang="ts">
	import { run, createBubbler, stopPropagation } from 'svelte/legacy';

	const bubble = createBubbler();
	import Image from '$lib/Image.svelte';
	import type { ArtPiece } from '../util/art.ts';

	interface Props {
		pieces: ArtPiece[];
		selected: number | null;
		browser: boolean;
	}

	let { pieces, selected = $bindable(), browser }: Props = $props();

	let carouselScroller: HTMLDivElement | undefined = $state();

	run(() => {
		if (carouselScroller && selected !== null && browser) {
			const width = browser
				? parseInt(
						getComputedStyle(document.documentElement).getPropertyValue('--carousel-height') || '100'
					)
				: 100;
			carouselScroller.scroll({
				left: Math.max(0, width * selected + width / 2 - window.innerWidth / 2),
				behavior: 'smooth'
			});
		}
	});
</script>

<div
	style="height: var(--carousel-height); width: 100%; overflow: scroll;"
	bind:this={carouselScroller}
	onclick={stopPropagation(bubble('click'))}
	onkeypress={stopPropagation(bubble('keypress'))}
	role="button"
	tabindex={-1}
>
	<div style="width: fit-content;">
		<div style=" display: flex; flex-direction: row; align-items: end;">
			{#each pieces as piece, j (piece.slug)}
				<div
					class="gallery-item"
					onclick={() => (selected = j)}
					onkeypress={() => (selected = j)}
					class:selected={selected === j}
					role="button"
					tabindex={-1}
				>
					<Image picture={piece.image.thumbnail} alt={piece.alt} />
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.selected.gallery-item {
		opacity: 1;
	}
	.gallery-item {
		border: 1px solid #0008;
		height: var(--carousel-height);
		width: auto;
		aspect-ratio: 1 / 1;
		user-select: none;
		cursor: pointer;
		display: flex;
		flex-direction: row;
		justify-content: center;
		opacity: 0.5;
	}
</style>
