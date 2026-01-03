<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import type { Artist, NormalizedCharacter } from '../../util/art.ts';
	import { useArtists } from '../../util/artistcontext.svelte.ts';
	import { useChipConfig } from '../../util/phosart_config.svelte.ts';

	interface Props {
		character: NormalizedCharacter;
	}

	let { character }: Props = $props();
	const artists = useArtists();

	let cname = $derived(character.name);
	let characterObj = $derived(character.info ?? null);
	let artist = $derived(character.from);
	let artistObj: Artist | null = $derived(artist ? (artists[artist] ?? null) : null);
	let artistUrl = $derived(artistObj?.links ? Object.values(artistObj.links)[0] : null);

	let name = $derived(characterObj?.name ?? cname);

	const config = useChipConfig('character');
	const href = $derived(config?.action?.makeHref?.(character));
	const clickHandler = $derived(
		config?.action?.onclick ? () => config?.action?.onclick?.(character) : null
	);
</script>

{#if !config?.hidden}
	{#if artist}
		<span class="character">
			<svelte:element
				this={artistUrl ? 'a' : 'span'}
				href={artistUrl ?? undefined}
				target={!artistUrl ? undefined : artistUrl.startsWith('http') ? '_blank' : '_self'}
				rel={!artistUrl
					? undefined
					: artistUrl.startsWith('http')
						? 'noreferrer noopener nofollow'
						: ''}
			>
				<span class="fa solid fa-user-group"></span>
				<span>
					{artistObj?.name ? `@${artistObj.name}` : artist}'s
				</span>
				<span>
					{name}
				</span>
			</svelte:element>
		</span>
	{:else if href}
		<span class="character">
			<a {href}>
				<span class="fa solid fa-user"></span>
				{name}
			</a>
		</span>
	{:else if clickHandler}
		<span class="character">
			<!-- svelte-ignore a11y_invalid_attribute -->
			<a href="#" onclick={clickHandler}>
				<span class="fa solid fa-user"></span>
				{name}
			</a>
		</span>
	{:else}
		<span class="character">
			<span class="fa solid fa-user"></span>
			{name}
		</span>
	{/if}
{/if}

<style>
	.fa {
		font-size: 0.85em;
	}
</style>
