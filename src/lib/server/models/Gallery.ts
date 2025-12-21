import { z } from 'zod';
import { Picture } from './image.ts';

const ExtendedGallery = z.object({
	$extends: z.array(z.string())
});

export const Video = z.object({
	full: z.string(),
	thumb: z.string()
});

const Artist = z.union([z.string(), z.object({ name: z.string(), anonymous: z.coerce.boolean() })]);

function ArtPiece<T extends z.ZodTypeAny>(imageType: T) {
	return z.object({
		id: z.string().optional(),
		name: z.string(),
		artist: z.union([Artist, z.array(Artist)]).optional(),
		date: z.coerce.date(),
		image: imageType,
		characters: z
			.array(
				z.union([
					z.string(),
					z.object({
						from: z.string(),
						name: z.string()
					})
				])
			)
			.default([]),
		position: z.string().optional(),
		tags: z.array(z.string()).default([]),
		alt: z.string(),
		description: z.string().optional(),
		alts: z
			.array(
				z.object({
					name: z.string(),
					image: imageType,
					alt: z.string(),
					description: z.string().optional(),
					video: Video.optional()
				})
			)
			.optional(),
		video: Video.optional(),
		slug: z.string()
	});
}

function Gallery<T extends z.ZodTypeAny>(imageType: T) {
	return z.object({
		pieces: z.array(ArtPiece(imageType))
	});
}

export const BaseGallery = Gallery(z.string());
export const RawGallery = z.union([ExtendedGallery, BaseGallery]);
export const FullGallery = Gallery(Picture);
export const BaseArtPiece = ArtPiece(z.string());
export const FullArtPiece = ArtPiece(Picture);
