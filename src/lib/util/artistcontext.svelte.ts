import { getContext, setContext } from 'svelte';
import { normalizeArtist, type ArtPiece, type Artist, type NormalizedArtist } from './art.ts';

const key = Symbol();

export function useArtistsContext(artists: Artist[]) {
	setContext(key, artists);
	$effect(() => {
		setContext(key, artists);
	});
}

export function useArtists(): Artist[] {
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
