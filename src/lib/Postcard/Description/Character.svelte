<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import type { Artist, CharacterRef } from '../../util/art.ts';
	import { useArtists } from '../../util/artistcontext.svelte.ts';
	import { useCharacters } from '../../util/charactercontext.svelte.ts';
	import { useChipConfig } from '../../util/phosart_config.svelte.ts';

	interface Props {
		character: CharacterRef;
	}

	let { character }: Props = $props();
	const artists = useArtists();
	const characters = useCharacters();

	let handle = $derived(typeof character === 'string' ? character : character.name);
	let characterObj = $derived(characters.find((c) => c.name === handle));
	let artist = $derived(typeof character === 'string' ? null : character.from);
	let artistObj: Artist | null = $derived(
		artist ? (artists.find((a) => a.handle === artist) ?? null) : null
	);
	let artistUrl = $derived(artistObj?.links ? Object.values(artistObj.links)[0] : null);

	let name = $derived(characterObj?.name ?? handle);

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
