import { glob } from 'glob';
import * as yaml from 'yaml';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { z } from 'zod';
import { Logger } from 'tslog';
import {
	BaseArtPiece,
	BaseGallery,
	FullArtPiece,
	FullGallery,
	RawGallery
} from './models/Gallery.ts';
import { $ART } from './directories.ts';
import { processImage, processVideo } from './imageprocess.ts';
import { getCache, hash, relativeFile } from './util.ts';
const GalleryLogger = new Logger({ minLevel: 2 });

type FileName = string;
type BaseGalleryT = z.infer<typeof BaseGallery>;
type RawGalleryT = z.infer<typeof RawGallery>;
type FullGalleryT = z.infer<typeof FullGallery>;
type GalleryListing<T> = Record<FileName, T>;

export type GalleryCache = GalleryListing<FullGalleryT>;

type BaseArtPieceT = z.infer<typeof BaseArtPiece>;
type FullArtPieceT = z.infer<typeof FullArtPiece>;

async function resolveExtendsRec(
	fname: string,
	gallery: RawGalleryT,
	rec: Record<FileName, RawGalleryT>
): Promise<FullGalleryT> {
	if (!('$extends' in gallery)) {
		return await resolveReferences(gallery, fname);
	}
	const full: FullGalleryT = { pieces: [] };

	for (const relative of gallery.$extends) {
		const base = path.dirname(fname);
		const target = path.join(base, relative);
		if (rec[target]) {
			const result = await resolveExtendsRec(target, rec[target], rec);
			if ('$extends' in result) {
				throw new Error('Impossible');
			}
			full.pieces.push(...result.pieces);
		} else {
			GalleryLogger.warn('[GALLERY] Could not find target for', target, 'when parsing', fname);
		}
	}

	return full;
}
async function resolveExtends(
	rec: GalleryListing<RawGalleryT>
): Promise<GalleryListing<FullGalleryT>> {
	const listing: GalleryListing<FullGalleryT> = {};
	for (const [fname, gallery] of Object.entries(rec)) {
		if ('$extends' in gallery) {
			listing[fname] = await resolveExtendsRec(fname, gallery, rec);
		} else {
			listing[fname] = await resolveReferences(gallery, fname);
		}
	}
	return listing;
}

async function resolvePieceReferences(
	piece: BaseArtPieceT,
	filename: FileName
): Promise<FullArtPieceT> {
	const image = await processImage(relativeFile(filename, piece.image));
	const alts = await Promise.all(
		piece.alts?.map(async (alt) => ({
			...alt,
			image: await processImage(relativeFile(filename, alt.image)),
			video: alt.video
				? {
						full: await processVideo(relativeFile(filename, alt.video.full), 'full'),
						thumb: await processVideo(relativeFile(filename, alt.video.thumb), 'thumb')
					}
				: undefined
		})) ?? []
	);
	const video = piece.video
		? {
				full: await processVideo(relativeFile(filename, piece.video.full), 'full'),
				thumb: await processVideo(relativeFile(filename, piece.video.thumb), 'thumb')
			}
		: undefined;

	return { ...piece, image, alts, video };
}

async function resolveReferences(gallery: BaseGalleryT, fname: FileName): Promise<FullGalleryT> {
	return {
		pieces: await Promise.all(gallery.pieces.map((piece) => resolvePieceReferences(piece, fname)))
	};
}

export async function galleries() {
	const cached = getCache().galleryCache;
	if (cached) {
		return cached;
	}
	const allGalleries = await glob('./**/*.gallery', { cwd: $ART });
	const documents = (
		await Promise.all(
			allGalleries.map((fn) =>
				fs
					.readFile(path.join($ART, fn), { encoding: 'utf-8' })
					.then((text) => ({ filename: fn, text }))
			)
		)
	)
		.map(({ filename, text }) => ({ filename, obj: yaml.parse(text) }))
		.map(({ filename, obj }) => {
			GalleryLogger.silly('[GALLERY] Parsing', filename);
			obj.pieces = obj.pieces
				? obj.pieces.map((p: BaseArtPieceT) => ({ ...p, slug: p.id ?? hash(p) }))
				: undefined;
			return { filename, obj: RawGallery.parse(obj) };
		})
		.reduce<Record<FileName, RawGalleryT>>(
			(rec, { filename, obj }) => ({ ...rec, [filename]: obj }),
			{}
		);

	const out = await resolveExtends(documents);
	getCache().galleryCache = out;
	return out;
}
