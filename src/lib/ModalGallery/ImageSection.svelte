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

	let altWidth: number = $state(0);
	let containerWidth: number = $state(0);
	let containerHeight: number = $state(0);
	let containerHeightLessInfo = $derived(Math.max(0, containerHeight - infoHeight));
	let containerWidthLessAlt = $derived(containerWidth - altWidth);
	let isComic = $derived(piece.alts_display === 'comic_panels');
	let bounded: HTMLDivElement | null = $state(null);
	let selectedAlt: number | null = $state(null);

	function scale(image: Picture) {
		const scaleByHeight =
			!isComic &&
			containerWidthLessAlt / containerHeightLessInfo >
				image.full.fallback.w / image.full.fallback.h;
		const scalingFactor: number = scaleByHeight
			? containerHeightLessInfo / image.full.fallback.h
			: containerWidthLessAlt / image.full.fallback.w;

		return scalingFactor;
	}

	function width(image: Picture) {
		return image.full.fallback.w * scale(image);
	}

	function height(image: Picture) {
		return image.full.fallback.h * scale(image);
	}

	function scrollDown() {
		if (!isComic || !bounded) return;

		bounded.scrollBy({
			behavior: 'smooth',
			top: Math.min(
				bounded.scrollHeight - bounded.clientHeight - bounded.scrollTop,
				(containerHeight * 2) / 3
			)
		});
	}

	let w = $derived(width(piece.image));
	let h = $derived(height(piece.image) + 50);

	let config = useLibraryConfig();

	let nameInHeader = $derived(!config.modal?.hideNames && w > 500);
	let pointerStartPos: [x: number, y: number] = $state([0, 0]);
	let pointerEndPos: [x: number, y: number] = $state([0, 0]);
	let pointerStartTime = $state(0);

	function onPointerDown(e: PointerEvent) {
		e.stopPropagation();

		pointerStartPos = [e.screenX, e.screenY];
		pointerStartTime = Date.now();
	}
	function onPointerMove(e: PointerEvent) {
		pointerEndPos = [e.screenX, e.screenY];
	}
	function onPointerUp(e: PointerEvent) {
		e.stopPropagation();

		if (pointerStartTime === 0) {
			return;
		}

		const [sx, sy] = pointerStartPos;
		const [ex, ey] = [e.screenX || pointerEndPos[0], e.screenY || pointerEndPos[1]];
		const [dx, dy] = [ex - sx, ey - sy];

		const isCancel = e.screenX === 0 && e.screenY === 0;

		const pointerDownTime = Date.now() - pointerStartTime;
		pointerStartTime = 0;
		// pixels per second
		const velocity = (dx / pointerDownTime) * 1000;

		if (Math.abs(velocity) < 50) {
			if (!isCancel) {
				scrollDown();
			}
			return;
		}
		if (Math.abs(dy) > 50 || Math.abs(dx) < window.screenLeft / 5 || Math.abs(velocity) < 200) {
			return;
		}

		if (velocity > 0) {
			onprev();
		} else {
			onnext();
		}
	}
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

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="main-container overscroll-contain"
		ondragstartcapture={(e) => e.preventDefault()}
		onpointerdown={onPointerDown}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onpointermove={onPointerMove}
	>
		<div
			class="bounding-div overscroll-contain"
			style={isComic ? 'overflow-y: scroll; align-items: flex-start; z-index: 100' : ''}
			bind:clientHeight={containerHeight}
			bind:clientWidth={containerWidth}
			bind:this={bounded}
		>
			<div class="flex flex-col">
				<div class="flex">
					<div
						class="bounded-div"
						onkeypress={(e) => {
							e.stopPropagation();
							scrollDown();
						}}
						onclick={(e) => {
							e.stopPropagation();
						}}
						role="button"
						tabindex={-1}
						style="
						z-index: 2; width: {w}px; height: {h}px;{isComic
							? ' border-radius: 12px 12px 0 0;'
							: piece.alts && piece.alts.length > 0
								? ' border-radius: 12px 0 0 12px;'
								: ''}"
					>
						<ImageView bind:selectedAlt {piece} {nameInHeader}>
							{#snippet display(image, onloaded)}
								<div class="image-container">
									<Image
										video={image.video?.full}
										controls
										picture={image.image.full}
										alt={image.alt}
										nsfw={image.nsfw}
										{onloaded}
									/>
								</div>
							{/snippet}
						</ImageView>
					</div>
					{#if piece.alts && piece.alts.length > 0}
						<div
							bind:clientWidth={altWidth}
							style="background-color: transparent; width:75px; position: relative"
						>
							{#each piece.alts as alt, i ('alt-' + JSON.stringify(alt))}
								{@const isOriginal = i === selectedAlt}
								{@const selPiece = isOriginal ? piece : alt}
								{@const top = (i * h) / piece.alts.length}
								{@const WRatio = 75 / selPiece.image.full.fallback.w}
								{@const myH = selPiece.image.full.fallback.h * WRatio}

								<div>
									<button
										onclick={(e) => {
											e.stopPropagation();
											selectedAlt = isOriginal ? null : i;
										}}
										tabindex={-1}
										class="altcarry"
										style="top: {top}px; width:75px; height: {h /
											piece.alts.length}px; overflow:hidden; position: absolute; z-index: 1;"
									>
										<div
											style="width: 75px; height: {Math.max(
												myH,
												h / piece.alts.length
											)}px; min-height: {myH}px;  position:absolute; top:0;right:0;"
										>
											<div class="image-container objr" style="top: 0; object-fit: cover">
												<Image
													video={selPiece.video?.full}
													controls
													picture={selPiece.image.full}
													alt={selPiece.alt}
													loading={false}
													nolqip
												/>
											</div>
										</div>
									</button>
									<div
										class="alt-tooltip"
										style="z-index: 3; height: 2rem; text-overflow: elipsis; top: calc({top}px + 1rem);  color: white; padding: 0.5rem; position: absolute; left: -9rem; width: 8rem;  display: flex; justify-content: end; align-items: center;"
									>
										<div
											style="background-color: #0009; border-radius: 0.25rem; padding: 0 0.25rem"
										>
											{#if isOriginal}
												Back to Original Piece
											{:else}
												Alt: {alt.name}
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
				{#if isComic && piece.alts && piece.alts.length > 0}
					{#each piece.alts as alt, i (JSON.stringify(alt))}
						<div
							class="bounded-div"
							onclick={(e) => {
								e.stopPropagation();
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
		overflow: hidden;
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

	.objr :global(img) {
		object-position: right center;
		object-fit: cover;
	}

	.altcarry {
		right: 1rem;
		transition:
			right 0.2s ease-in-out,
			clip-path 0.2s ease-in-out;
		clip-path: inset(0 0 0 16px);
	}
	.altcarry:hover {
		right: 0rem;
		clip-path: inset(0 0 0 0);
	}

	.altcarry:hover ~ .alt-tooltip {
		opacity: 1;
	}
	.alt-tooltip {
		opacity: 0;
		user-select: none;
		transition: opacity 0.2s ease-in-out;
	}
</style>
