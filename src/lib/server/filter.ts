import { normalizeArtist, type ArtPiece, type Artist, type Character } from '../util/art.ts';

type Filterable = Pick<Artist, 'name' | 'type'> | Pick<Character, 'name' | 'type'> | string;

function filterOne(piece: ArtPiece, by: Filterable) {
	if (typeof by === 'string') {
		const tags = piece.tags?.map((tag) => tag.toLowerCase()) ?? [];
		if (by.startsWith('!')) {
			if (tags.includes(by.toLowerCase().substring(1))) return false;
		} else if (!tags.includes(by.toLowerCase())) {
			return false;
		}
	} else if (by.type === 'Artist') {
		const artists = normalizeArtist(piece.artist);
		return artists.some((artist) => artist.name.toLowerCase() === by.name.toLowerCase());
	} else if (by.type === 'Character') {
		if (
			!piece.characters
				?.map((ref) => (typeof ref === 'string' ? ref : ref.name))
				.map((ref) => ref.toLowerCase())
				.includes(by.name.toLowerCase())
		)
			return false;
	}
	return true;
}

export function filter(
	gallery: ArtPiece[] | Record<string, ArtPiece>,
	by: Filterable | Array<Filterable>
): ArtPiece[] {
	if (!Array.isArray(gallery)) gallery = Object.values(gallery);

	return gallery
		.filter((piece) => {
			if (Array.isArray(by)) return by.every((predicate) => filterOne(piece, predicate));
			return filterOne(piece, by);
		})
		.sort((a, b) => b.date.getTime() - a.date.getTime());
}
