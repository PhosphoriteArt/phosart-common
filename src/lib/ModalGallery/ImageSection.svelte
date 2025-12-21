<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import type { ArtPiece } from '../util/art.ts';
	import ImageView from './ImageView.svelte';

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

	let containerWidth: number = $state(0);
	let containerHeight: number = $state(0);
	let containerHeightLessInfo = $derived(Math.max(0, containerHeight - 50));

	let scaleByHeight = $derived(
		containerWidth / containerHeightLessInfo >
			piece.image.full.fallback.w / piece.image.full.fallback.h
	);
	let scalingFactor: number = $derived(
		scaleByHeight
			? containerHeightLessInfo / piece.image.full.fallback.h
			: containerWidth / piece.image.full.fallback.w
	);

	let w = $derived(piece.image.full.fallback.w * scalingFactor);
	let h = $derived(piece.image.full.fallback.h * scalingFactor + 50);

	let nameInHeader = $derived(w > 500);
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

	<div class="main-container">
		<div class="bounding-div" bind:clientHeight={containerHeight} bind:clientWidth={containerWidth}>
			<div
				class="bounded-div"
				onclick={(e) => e.stopPropagation()}
				onkeypress={(e) => e.stopPropagation()}
				role="button"
				tabindex={-1}
				style="width: {w}px; height: {h}px"
			>
				<ImageView {piece} {nameInHeader} />
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
	:global(:root) {
		--info-height: 50px;
		--carousel-height: 100px;
	}

	@media only screen and (max-width: 800px) {
		:global(:root) {
			--info-height: 50px;
			--carousel-height: 75px;
		}
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
		max-height: calc(100% - 50px - var(--carousel-height));
		position: relative;
		height: 100%;
		padding: 2rem;
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
</style>
