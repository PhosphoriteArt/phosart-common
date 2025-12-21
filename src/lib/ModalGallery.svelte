<script lang="ts" module>
	import '@fortawesome/fontawesome-free/css/all.min.css';

	const modelGalleryOpens: boolean[] = [];

	export function useIsModelGalleryOpen() {
		const idx = modelGalleryOpens.length;
		modelGalleryOpens.push(false);
		return {
			set open(isOpen: boolean) {
				modelGalleryOpens[idx] = isOpen;
			},
			get open() {
				return modelGalleryOpens[idx];
			}
		};
	}

	export function isAnyModelGalleryOpen() {
		return modelGalleryOpens.reduce((p, v) => p || v, false);
	}
</script>

<script lang="ts">
	import { run, stopPropagation } from 'svelte/legacy';

	import type { ArtPiece } from './util/art.ts';
	import Modal from './Modal.svelte';
	import { onMount } from 'svelte';
	import ImageSection from './ModalGallery/ImageSection.svelte';
	import Carousel from './ModalGallery/Carousel.svelte';
	import HighResContext from './HighResContext.svelte';

	interface Props {
		pieces: ArtPiece[];
		selected?: number | null;
		hashUpdateReady?: boolean;
		browser: boolean;
	}

	let {
		pieces,
		selected = $bindable(null),
		hashUpdateReady = $bindable(false),
		browser
	}: Props = $props();

	const isGalleryOpen = $state(useIsModelGalleryOpen());

	onMount(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.code === 'ArrowLeft' && selected !== null) {
				selected = (selected - 1 + pieces.length) % pieces.length;
			} else if (e.code === 'ArrowRight' && selected !== null) {
				selected = (selected + 1) % pieces.length;
			}
		};

		if (browser && window.location.hash && !isAnyModelGalleryOpen()) {
			const foundSelected = pieces.findIndex((piece) => '#' + piece.slug === window.location.hash);
			if (foundSelected !== -1) {
				selected = foundSelected;
				isGalleryOpen.open = true;
			}
		}

		document.body.addEventListener('keydown', handler);

		hashUpdateReady = true;
		return () => {
			document.body.removeEventListener('keydown', handler);
		};
	});

	function updateHash(selected: number | null) {
		if (!browser) return;

		if (isAnyModelGalleryOpen() === false && window.location.hash) {
			window.location.hash = '##';
		} else if (selected !== null) {
			window.location.hash = '#' + pieces[selected].slug;
		}
	}

	run(() => {
		isGalleryOpen.open = selected !== null;
	});
	run(() => {
		hashUpdateReady && updateHash(selected);
	});
</script>

<Modal open={selected !== null} onclose={() => (selected = null)}>
	<div class="gallery-container">
		<div
			role="button"
			tabindex={-1}
			class="fa-solid fa-close hoverable close-button"
			onclick={stopPropagation(() => {
				selected = null;
			})}
			onkeypress={() => {
				selected = null;
			}}
		></div>
		<div style="flex-grow: 1"></div>

		{#if selected !== null}
			<HighResContext>
				<ImageSection
					piece={pieces[selected]}
					onprev={() =>
						(selected = selected !== null ? (selected - 1 + pieces.length) % pieces.length : null)}
					onnext={() => (selected = selected !== null ? (selected + 1) % pieces.length : null)}
				/>
			</HighResContext>
		{/if}

		<div style="flex-grow: 1"></div>

		<Carousel {pieces} {browser} bind:selected />
	</div>
</Modal>

<style>
	.gallery-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		user-select: none;
	}

	.close-button {
		font-size: 20pt;
		position: fixed;
		top: 20px;
		left: 20px;
		z-index: 40;
	}

	.hoverable {
		color: gray;
		cursor: pointer;
	}
	.hoverable:hover {
		color: white;
	}
</style>
