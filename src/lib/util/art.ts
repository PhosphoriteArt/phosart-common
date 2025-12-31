import type { z } from 'zod';

import type { FullCharacter } from '../server/models/Character.ts';
import type { Artist as ZArtist } from '../server/models/Artist.ts';
import type {
	Picture as ZPicture,
	Image as ZImage,
	Source as ZSource
} from '../server/models/image.ts';
import type {
	FullGallery,
	FullArtPiece,
	BaseArtPiece as ZBaseArtPiece,
	RawGallery as ZRawGallery,
	BaseArtist as ZBaseArtist,
	BaseGallery as ZBaseGallery,
	ExtendedGallery as ZExtendedGallery
} from '../server/models/Gallery.ts';
import type { ArtistCache } from '../server/artist.ts';

export type RawGallery = z.infer<typeof ZRawGallery>;
export type BaseGallery = z.infer<typeof ZBaseGallery>;
export type ExtendedGallery = z.infer<typeof ZExtendedGallery>;
export type Gallery = z.infer<typeof FullGallery>;
export type Character = z.infer<typeof FullCharacter>;
export type BaseArtist = z.infer<typeof ZBaseArtist>;
export type Artist = z.infer<typeof ZArtist>;
export type ArtPiece = z.infer<typeof FullArtPiece>;
export type BaseArtPiece = z.infer<typeof ZBaseArtPiece>;
export type Picture = z.infer<typeof ZPicture>;
export type Image = z.infer<typeof ZImage>;
export type Source = z.infer<typeof ZSource>;
export type CharacterRef = ArtPiece['characters'][number];

export interface NormalizedArtist {
	name: string;
	anonymous: boolean;
	info: Artist | null;
}
function normalizeSingleArtist(
	a: string | { name: string; anonymous: boolean },
	artists?: ArtistCache
): NormalizedArtist {
	const name = typeof a === 'string' ? a : a.name;
	const foundArtist = artists?.[name] ?? null;

	return {
		name,
		anonymous: typeof a === 'string' ? false : a.anonymous,
		info: foundArtist
	};
}

export function normalizeArtist(
	as: ArtPiece['artist'],
	artists?: ArtistCache
): Array<NormalizedArtist> {
	if (!as) {
		return [];
	}

	if (!Array.isArray(as)) {
		return [normalizeSingleArtist(as, artists)];
	}
	return as.map((a) => normalizeSingleArtist(a, artists));
}

export function no4K(image: Image): Image {
	const sources = Object.entries(image.sources).reduce(
		(prev, [k, sources]) => ({ ...prev, [k]: sources.filter((source) => source.w < 3840) }),
		{} as Image['sources']
	);
	const [, best] = bestSource(sources);
	return {
		...image,
		fallback: best,
		sources: sources
	};
}

export function onlyHighRes(image: Image): Image {
	const [key, best] = bestSource(image.sources);
	return {
		...image,
		fallback: best,
		sources: {
			[key]: [best]
		}
	};
}

function bestSource(sources: Image['sources']): [string, z.infer<typeof ZSource>] {
	const [key, bestSourceType] = sources.webp ? ['webp', sources.webp] : Object.entries(sources)[0];
	const bestImage = bestSourceType.reduce((p, v) => (v.w > p.max ? { max: v.w, source: v } : p), {
		max: 0,
		source: null as Image['sources'][string][number] | null
	});
	if (bestImage.source === null) {
		throw new Error('Could not find any sources?');
	}
	return [key, bestImage.source];
}
