import {
	normalizeArtist,
	normalizeCharacter,
	type ArtPiece,
	type ResourceRef
} from '../util/art.ts';

function filterOne(piece: ArtPiece, by: ResourceRef, negated: boolean): boolean {
	if (!by.type || !by.resource) {
		return false;
	}

	switch (by.type) {
		case 'artist': {
			const artists = normalizeArtist(by.resource);
			let hasArtist = artists.some(
				(artist) => artist.name.toLowerCase() === by.resource.name.toLowerCase()
			);
			if (negated) {
				hasArtist = !hasArtist;
			}
			return hasArtist;
		}
		case 'character': {
			const characters = normalizeCharacter(piece.characters);
			let hasCharacter = characters.some(
				(ch) =>
					ch.name.toLowerCase() === by.resource.name.toLowerCase() &&
					(ch.from?.toLowerCase() === by.resource.from?.toLowerCase() ||
						(!ch.from && !by.resource.from))
			);
			if (negated) {
				hasCharacter = !hasCharacter;
			}
			return hasCharacter;
		}
		case 'piece': {
			let isPiece = by.resource.slug === piece.slug;
			if (negated) {
				isPiece = !isPiece;
			}
			return isPiece;
		}
		case 'tag': {
			let hasTag = piece.tags.map((t) => t.toLowerCase()).includes(by.resource);
			if (negated) {
				hasTag = !hasTag;
			}
			return hasTag;
		}
	}
}

export function filter(
	gallery: ArtPiece[] | Record<string, ArtPiece>,
	by: ResourceRef,
	{ negated, sorted }: { negated?: boolean; sorted?: boolean }
): ArtPiece[] {
	if (!Array.isArray(gallery)) gallery = Object.values(gallery);

	const results = gallery.filter((piece) => {
		return filterOne(piece, by, negated ?? false);
	});

	if (!sorted) {
		return results;
	}
	return results.sort((a, b) => b.date.getTime() - a.date.getTime());
}
