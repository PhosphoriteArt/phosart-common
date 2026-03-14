<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import type { ArtPiece, Picture } from '../util/art.ts';
	import ImageView from './ImageView.svelte';
	import { useLibraryConfig } from '../util/phosart_config.svelte.ts';
	import Image from '$lib/Image.svelte';

	interface Props {
		piece: ArtPiece;
		onnext: () => void;
		onprev: () => void;
	}

	let { piece, onnext, onprev }: Props = $props();

	function doOnNext(e: Event) {
		e.stopPropagation();
		onnext();
	}
	function doOnPrev(e: Event) {
		e.stopPropagation();
		onprev();
	}

	let infoHeight = $derived(
		parseInt(getComputedStyle(document.documentElement).getPropertyValue('--info-height') ?? '100')
	);

	let containerWidth: number = $state(0);
	let containerHeight: number = $state(0);
	let containerHeightLessInfo = $derived(Math.max(0, containerHeight - infoHeight));
	let isComic = $derived(piece.alts_display === 'comic_panels');
	let bounded: HTMLDivElement | null = $state(null);

	function scale(image: Picture) {
		const scaleByHeight =
			!isComic &&
			containerWidth / containerHeightLessInfo > image.full.fallback.w / image.full.fallback.h;
		const scalingFactor: number = scaleByHeight
			? containerHeightLessInfo / image.full.fallback.h
			: containerWidth / image.full.fallback.w;

		return scalingFactor;
	}

	function width(image: Picture) {
		return image.full.fallback.w * scale(image);
	}

	function height(image: Picture) {
		return image.full.fallback.h * scale(image);
	}

	function scrollDown() {
		if (!isComic) return;

		bounded?.scrollBy({ behavior: 'smooth', top: containerHeight });
	}

	let w = $derived(width(piece.image));
	let h = $derived(height(piece.image) + 50);

	let config = useLibraryConfig();

	let nameInHeader = $derived(!config.modal?.hideNames && w > 500);
</script>

<div class="image-section">
	<div class="nav-container">
		<div
			class="fa-solid fa-arrow-left hoverable"
			style="font-size: 32pt;"
			onclick={doOnPrev}
			onkeypress={doOnPrev}
			role="button"
			tabindex={-1}
		></div>
	</div>

	<div class="main-container" style={isComic ? 'overflow: visible' : ''}>
		<div
			class="bounding-div"
			style={isComic ? 'overflow-y: scroll; align-items: flex-start; z-index: 100' : ''}
			bind:clientHeight={containerHeight}
			bind:clientWidth={containerWidth}
			bind:this={bounded}
		>
			<div class="flex flex-col">
				<div
					class="bounded-div"
					onclick={(e) => {
						e.stopPropagation();
						scrollDown();
					}}
					onkeypress={(e) => {
						e.stopPropagation();
						scrollDown();
					}}
					role="button"
					tabindex={-1}
					style="width: {w}px; height: {h}px;{isComic ? ' border-radius: 12px 12px 0 0;' : ''}"
				>
					<ImageView {piece} {nameInHeader}>
						{#snippet display(image, onloaded)}
							<div class="image-container">
								<Image
									video={image.video?.full}
									controls
									picture={image.image.full}
									alt={image.alt}
									{onloaded}
								/>
							</div>
						{/snippet}
					</ImageView>
				</div>
				{#if isComic && piece.alts}
					{#each piece.alts as alt, i (JSON.stringify(alt))}
						<div
							class="bounded-div"
							onclick={(e) => {
								e.stopPropagation();
								scrollDown();
							}}
							onkeypress={(e) => {
								e.stopPropagation();
								scrollDown();
							}}
							role="button"
							tabindex={-1}
							style="width: {width(alt.image)}px; height: {height(
								alt.image
							)}px; border-radius: {i === piece.alts.length - 1 ? '0 0 12px 12px' : '0px'};"
						>
							<div class="image-container" style="top: 0; ">
								<Image video={alt.video?.full} controls picture={alt.image.full} alt={alt.alt} />
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<div class="nav-container">
		<div
			class="fa-solid fa-arrow-right hoverable"
			style="font-size: 32pt;"
			onclick={doOnNext}
			onkeypress={doOnPrev}
			role="button"
			tabindex={-1}
		></div>
	</div>
</div>

<style>
	@media only screen and (max-width: 800px) {
		.nav-container.nav-container {
			width: 0;
		}
	}

	.image-section {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		overflow: visible;
		max-height: calc(100% - var(--carousel-height));
		position: relative;
		height: 100%;
		padding: 1rem;
	}
	.nav-container {
		color: white;
		height: min-content;
		width: 50px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		transition: width 0.2s ease-in-out;
		overflow: hidden;
	}

	.hoverable {
		color: gray;
		cursor: pointer;
	}
	.hoverable:hover {
		color: white;
	}

	.main-container {
		flex-grow: 1;
		height: 100%;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	.bounding-div {
		flex-grow: 1;
		height: 100%;
		position: relative;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.bounded-div {
		overflow: hidden;
		border-radius: 12px;
		display: flex;
		position: relative;
	}

	.image-container {
		position: absolute;
		top: var(--info-height);
		bottom: 0;
		left: 0;
		right: 0;
	}
</style>
