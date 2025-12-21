<script lang="ts" module>
	export function asString(artists: Array<NormalizedArtist>) {
		let s = '';
		for (let i = 0; i < artists.length; i++) {
			const artist = artists[i];
			const hasLink = !!artist.info?.links?.[0];
			if (hasLink) {
				s += '@' + artist.name;
			} else {
				s += artist.name;
			}
			if (i < artists.length - 2) {
				s += ', ';
			}
			if (i === artists.length - 2) {
				s += ' and ';
			}
		}
		return s;
	}
</script>

<script lang="ts">
	import type { NormalizedArtist } from '../util/art.ts';

	interface Props {
		artists: Array<NormalizedArtist>;
	}

	let { artists }: Props = $props();
</script>

{#each artists as artist, i (artist.name)}
	{@const link = Object.values(artist.info?.links ?? {})[0] ?? null}
	{#if link}
		<a target="_blank" rel="noreferrer nofollow noopener" href={link} style="font-weight: 700;">
			@{artist.name}
		</a>
	{:else if artist}
		<span style="font-weight: 700;">
			{artist.info ? `@${artist.name}` : artist.name}</span
		>{/if}{#if i < artists.length - 2},{' '}
	{:else if i === artists.length - 2}
		{' '}and{' '}
	{/if}
{/each}
