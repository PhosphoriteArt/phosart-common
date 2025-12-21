<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import type { Artist, ArtPiece } from '../../util/art.ts';
	import { useArtists } from '../../util/artistcontext.ts';
	import { useCharacters } from '../../util/charactercontext.ts';

	interface Props {
		character: ArtPiece['characters'][number];
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
	let url = $derived(characterObj ? `/characters/${handle.toLowerCase()}` : null);
</script>

{#if artist}
	<span class="character">
		<a href="/characters/{handle.toLowerCase()}" style="display: none;">
			(this link is present only for static generation– forces SvelteKit to prerender the page.)
		</a>

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
{:else if url}
	<span class="character">
		<a href={url}>
			<span class="fa solid fa-user"></span>
			{name}
		</a>
	</span>
{:else}
	<span class="character">
		<a href="/characters/{character.toString().toLowerCase()}">
			<span class="fa solid fa-user"></span>
			{name}
		</a>
	</span>
{/if}

<style>
	.fa {
		font-size: 0.85em;
	}
</style>
