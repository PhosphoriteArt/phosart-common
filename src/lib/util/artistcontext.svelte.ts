import { getContext, setContext } from 'svelte';
import { normalizeArtist, type ArtPiece, type NormalizedArtist } from './art.ts';
import type { ArtistCache } from '../server/index.ts';

const key = Symbol();

export function useArtistsContext(artists: ArtistCache) {
	setContext(key, artists);
	$effect(() => {
		setContext(key, artists);
	});
}

export function useArtists(): ArtistCache {
	return getContext(key);
}

export function useArtist(piece: null): null;
export function useArtist(piece: ArtPiece): Array<NormalizedArtist>;
export function useArtist(name: string): Array<NormalizedArtist>;
export function useArtist(piece: string | ArtPiece | null): Array<NormalizedArtist> | null {
	const allArtists = useArtists();
	if (!piece) return null;
	return normalizeArtist(typeof piece === 'string' ? piece : piece.artist, allArtists);
}
