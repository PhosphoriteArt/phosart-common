<script lang="ts">
	import { onlyHighRes, type Image as ImageModel, no4K } from './util/art.ts';
	import { untrack } from 'svelte';
	import { isHighRes } from './HighResContext.svelte';
	import { useLibraryConfig } from './util/phosart_config.svelte.ts';

	interface Props {
		picture: ImageModel;
		alt: string;
		video?: string | undefined;
		controls?: boolean;
		nolqip?: boolean;
		onloaded?: () => void;
		loading?: boolean;
		transformSrc?: (src: string) => string;
	}

	let {
		picture,
		alt,
		onloaded = undefined,
		video = undefined,
		controls = false,
		nolqip = false,
		loading = $bindable(true),
		transformSrc: userTransformSrc
	}: Props = $props();

	const config = useLibraryConfig();
	const transformSrc = $derived(
		userTransformSrc ?? config.defaultTransformSrc ?? ((s: string) => s)
	);

	let showBackground = $state(true);
	let loadingMeta = $state(true);
	// svelte-ignore state_referenced_locally
	let lastSrc = $state(picture.fallback.src);

	const highRes = isHighRes();
	let src = $derived(highRes ? onlyHighRes(picture) : no4K(picture));

	let background = $derived(
		!nolqip && src.lqip && showBackground ? `url(${src.lqip.src}) no-repeat center/contain` : 'none'
	);

	$effect(() => {
		let prev = untrack(() => lastSrc);

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		picture;
		untrack(() => {
			lastSrc = picture.fallback.src;
			if (prev !== picture.fallback.src) {
				showBackground = true;
				loading = true;
			}
		});
	});

	function onload(el: HTMLImageElement | HTMLVideoElement) {
		let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
		const onloadend = () => {
			loading = false;
			onloaded?.();
		};

		const onloadstart = () => {
			if (loading) {
				showBackground = true;
				loadingMeta = true;
			}
		};

		const animationend = () => {
			showBackground = false;
		};

		const onloadmeta = () => {
			loadingMeta = false;
		};

		el.addEventListener('loadstart', onloadstart);
		el.addEventListener('load', onloadend);
		el.addEventListener('loadeddata', onloadend);
		el.addEventListener('loadedmetadata', onloadmeta);
		el.addEventListener('animationend', animationend);

		onloadstart();

		return {
			destroy() {
				if (timeoutHandle) {
					clearTimeout(timeoutHandle);
				}
				el.removeEventListener('loadstart', onloadstart);
				el.removeEventListener('load', onloadend);
				el.removeEventListener('loadeddata', onloadend);
				el.removeEventListener('loadedmetadata', onloadmeta);
				el.removeEventListener('animationend', animationend);
			}
		};
	}
</script>

{#each [{ src, video }] as pic (JSON.stringify(pic))}
	{#if video}
		<video
			style="background: {background}; aspect-ratio: {src.fallback.w} / {src.fallback.h};"
			muted
			autoplay
			{controls}
			disablepictureinpicture
			disableremoteplayback
			loop
			playsinline
			use:onload
		>
			<source src={video} type="video/mp4" />
		</video>
	{:else}
		<picture style="background: {background}; aspect-ratio: {src.fallback.w} / {src.fallback.h};">
			{#each Object.entries(src.sources) as [format, images] (format)}
				<source
					srcset={images.map((img) => `${transformSrc(img.src)} ${img.w}w`).join(', ')}
					type={'image/' + format}
				/>
			{/each}
			<img
				src={transformSrc(src.fallback.src)}
				{alt}
				use:onload
				loading="lazy"
				decoding="async"
				class:loading
				class:loaded={!loading}
				width={src.fallback.w}
				height={src.fallback.h}
				style="font-size: 0; {!(!loadingMeta || !loading) &&
					`width: ${src.fallback.w}px; height: ${src.fallback.h}px;`}"
			/>
		</picture>
	{/if}
{/each}

<style>
	picture,
	video {
		display: flex;
		width: 100%;
		height: 100%;
		max-height: 100%;
		max-width: 100%;
		overflow: hidden;
	}
	img {
		object-fit: contain;
		object-position: center;
		width: 100%;
		height: 100%;
	}

	.loading {
		opacity: 0;
	}
	.loaded {
		animation: in 0.1s linear;
	}

	@keyframes in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
