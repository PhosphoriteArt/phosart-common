<script lang="ts" module>
	import { asString } from './Postcard/ArtistLink.svelte';
	import { normalizeArtist, type ResourceRef } from './util/art.ts';
	import { useLibraryConfig } from './util/phosart_config.svelte.ts';

	interface OpengraphMeta {
		title: string | null;
		description: string | null;
		siteName: string | null;
		image: string | null;
		width: number | null;
		height: number | null;
	}

	function getMeta(resource: ResourceRef, siteName?: string | null): OpengraphMeta {
		const base: OpengraphMeta = {
			title: null,
			description: null,
			siteName: siteName ?? null,
			image: null,
			width: null,
			height: null
		};

		if (!resource.type || !resource.resource) {
			return base;
		}

		switch (resource.type) {
			case 'artist':
				base.title = `@${resource.resource.info?.name ?? resource.resource.name}`;
				break;
			case 'character': {
				base.title = `${resource.resource.info?.name ?? resource.resource.name}`;
				if (resource.resource.from) {
					base.title += ` by @${resource.resource.from}`;
				}
				const image =
					resource.resource.info?.thumbnail?.full.fallback ??
					resource.resource.info?.picture.full.fallback ??
					null;

				base.image = image?.src ?? null;
				base.width = image?.w ?? null;
				base.height = image?.h ?? null;
				base.description =
					resource.resource.info?.short_description ?? resource.resource.info?.description ?? null;

				break;
			}
			case 'piece': {
				base.title = resource.resource.name;
				const artists = normalizeArtist(resource.resource.artist);
				if (artists.length > 0) {
					base.title += ` by ${asString(artists)}`;
				}
				base.description = resource.resource.description || resource.resource.alt;
				base.image = resource.resource.image.full.fallback.src;
				base.width = resource.resource.image.full.fallback.w;
				base.height = resource.resource.image.full.fallback.h;
				break;
			}
			case 'tag':
				base.title = `#${resource.resource}`;
				break;
		}

		if (base.siteName) {
			base.title += ` | ${base.siteName}`;
		}
		return base;
	}
</script>

<script lang="ts">
	type Props = ResourceRef &
		// If unspecified, the following will be inferred from above
		Partial<OpengraphMeta> & {
			setPageTitle?: boolean;
			transformSrc?: (src: string) => string;
		};

	const {
		setPageTitle,
		height: userHeight,
		image: userImage,
		siteName: userSiteName,
		description: userDescription,
		title: userTitle,
		width: userWidth,
		transformSrc: userTransformSrc,
		...resourceRef
	}: Props = $props();

	const config = useLibraryConfig();

	const transformSrc = $derived(
		userTransformSrc ?? config.defaultTransformSrc ?? ((s: string) => s)
	);

	const inferred = getMeta(resourceRef, config.siteName);
	const height = $derived(userHeight ?? inferred.height);
	const image = $derived(userImage ?? inferred.image);
	const siteName = $derived(userSiteName ?? inferred.siteName);
	const description = $derived(userDescription ?? inferred.description);
	const title = $derived(userTitle ?? inferred.title);
	const width = $derived(userWidth ?? inferred.width);
</script>

<svelte:head>
	{#if resourceRef.type && resourceRef.resource}
		{#if siteName}
			<meta property="og:site_name" content={siteName} />
		{/if}
		{#if title}
			<meta property="og:title" content={title} />
			{#if setPageTitle}
				<title>{title}</title>
			{/if}
		{/if}
		{#if description}
			<meta property="og:description" content={description} />
		{/if}
		{#if image && width && height}
			<meta property="og:image" content={transformSrc(image)} />
			<meta property="og:image:width" content={String(width)} />
			<meta property="og:image:height" content={String(height)} />
			<meta name="twitter:card" content="summary_large_image" />
		{/if}
	{/if}
</svelte:head>
