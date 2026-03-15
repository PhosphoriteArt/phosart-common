<script lang="ts" module>
	import '@fortawesome/fontawesome-free/css/all.min.css';

	const modelGalleryOpens: boolean[] = [];

	export function useIsModelGalleryOpen() {
		const idx = modelGalleryOpens.length;
		modelGalleryOpens.push(false);
		return {
			set open(isOpen: boolean) {
				const wasOpen = isAnyModelGalleryOpen();
				modelGalleryOpens[idx] = isOpen;
				const nowOpen = isAnyModelGalleryOpen();
				if (
					wasOpen !== nowOpen &&
					typeof window !== 'undefined' &&
					typeof document !== 'undefined'
				) {
					document.body.style.overflow = isOpen ? 'hidden' : 'auto';
				}
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

	const currentIsComic = $derived(
		typeof selected === 'number' ? pieces[selected]?.alts_display === 'comic_panels' : false
	);

	onMount(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.code === 'ArrowLeft' && selected !== null) {
				selected = (selected - 1 + pieces.length) % pieces.length;
			} else if (e.code === 'ArrowRight' && selected !== null) {
				selected = (selected + 1) % pieces.length;
			}
		};

		const hashchange = (hce: { oldURL?: string; newURL: string }) => {
			const hash = new URL(hce.newURL).hash.replace(/^#/, '');
			if (browser) {
				const foundSelected = pieces.findIndex((piece) => piece.slug === decodeURIComponent(hash));
				if (!isAnyModelGalleryOpen()) {
					if (foundSelected !== -1) {
						selected = foundSelected;
					}
				} else if (isGalleryOpen.open) {
					if (!hash || hash == '#' || foundSelected === -1) {
						selected = null;
					} else {
						selected = foundSelected;
					}
				}
			}
		};
		hashchange({ newURL: window.location.href });

		window.addEventListener('hashchange', hashchange);
		document.body.addEventListener('keydown', handler);

		hashUpdateReady = true;
		return () => {
			window.removeEventListener('hashchange', hashchange);
			document.body.removeEventListener('keydown', handler);
		};
	});

	function updateHash(selected: number | null) {
		if (!browser) return;

		if (isAnyModelGalleryOpen() === false && window.location.hash) {
			window.location.hash = '##';
		} else if (selected !== null && pieces[selected]) {
			window.location.hash = '#' + encodeURIComponent(pieces[selected].slug);
		}
	}

	$effect.pre(() => {
		isGalleryOpen.open = selected !== null && !!pieces[selected];
	});
	$effect.pre(() => {
		if (hashUpdateReady) {
			updateHash(selected);
		}
	});
</script>

<Modal open={selected !== null && !!pieces[selected]} onclose={() => (selected = null)}>
	<div
		class="gallery-container overscroll-contain"
		style={currentIsComic ? '--carousel-height: 25px' : ''}
	>
		<div
			role="button"
			tabindex={-1}
			class="fa-solid fa-close hoverable close-button"
			onclick={(e) => {
				e.stopPropagation();
				selected = null;
			}}
			onkeypress={() => {
				selected = null;
			}}
		></div>
		<div style="flex-grow: 1"></div>

		{#if selected !== null && !!pieces[selected]}
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
	@media only screen and (max-width: 800px) {
		:global(:root) {
			--info-height: 50px;
			--carousel-height: 75px;
		}
	}

	:global(:root) {
		--info-height: 50px;
		--carousel-height: 50px;
	}

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
