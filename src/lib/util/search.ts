import fz from 'fuzzysort';
import { normalizeArtist, normalizeCharacter, type ArtPiece } from './art.ts';
import { asRecord } from './util.ts';

export function executeSearch(query: string, pieces: ArtPiece[]): ArtPiece[] {
	const allPieces = asRecord(pieces, (p) => p.slug);

	const searchObj = Object.values(allPieces).map((p) => ({
		name: p.name,
		description: p.description,
		alt: p.alt,
		tags: p.tags.join(', '),
		characters: p.characters
			.map((ch) => normalizeCharacter(ch))
			.map((ch) => `${ch.name} ${ch.from}`),
		artists: normalizeArtist(p.artist)
			.map((a) => a.name)
			.join(', '),
		slug: p.slug
	}));

	const results = fz.go(query, searchObj, {
		keys: ['name', 'description', 'alt', 'tags', 'characters', 'artists'],
		threshold: 0.3
	});

	return results.map((res) => allPieces[res.obj.slug]);
}
