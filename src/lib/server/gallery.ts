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
import { $DATA } from './directories.ts';
import { processImageFastcache, processVideoFastcache } from './imageprocess.ts';
import {
	cacheVersion,
	clearCache,
	getCache,
	hash,
	fullPath,
	relPath,
	getLogLevel
} from './util.ts';
import { flushFastCache, readFastCache, type FastCache } from './fastcache.ts';
import type { ArtPiece } from '../util/art.ts';
import { asRecord } from '../util/util.ts';
const GalleryLogger = new Logger({ minLevel: getLogLevel() });

type FileName = string;
type BaseGalleryT = z.infer<typeof BaseGallery>;
type RawGalleryT = z.infer<typeof RawGallery>;
type FullGalleryT = z.infer<typeof FullGallery>;
type GalleryListing<T> = Record<FileName, T>;

export type GalleryCache = GalleryListing<FullGalleryT>;
export type RawGalleryCache = GalleryListing<RawGalleryT>;

type BaseArtPieceT = z.infer<typeof BaseArtPiece>;
type FullArtPieceT = z.infer<typeof FullArtPiece>;

async function resolveExtendsRec(
	fname: string,
	gallery: RawGalleryT,
	rec: Record<FileName, RawGalleryT>,
	fc: FastCache
): Promise<FullGalleryT> {
	if (!('$extends' in gallery)) {
		return await resolveReferences(gallery, fname, fc);
	}
	const full: FullGalleryT = { pieces: [] };

	for (const relative of gallery.$extends) {
		const base = path.dirname(fname);
		const target = path.join(base, relative);
		if (rec[target]) {
			const result = await resolveExtendsRec(target, rec[target], rec, fc);
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
	rec: GalleryListing<RawGalleryT>,
	fc: FastCache
): Promise<GalleryListing<FullGalleryT>> {
	const listing: GalleryListing<FullGalleryT> = {};
	for (const [fname, gallery] of Object.entries(rec)) {
		if ('$extends' in gallery) {
			listing[fname] = await resolveExtendsRec(fname, gallery, rec, fc);
		} else {
			listing[fname] = await resolveReferences(gallery, fname, fc);
		}
	}
	return listing;
}

async function resolvePieceReferences(
	piece: BaseArtPieceT,
	filename: FileName,
	fc: FastCache
): Promise<FullArtPieceT> {
	const relpath = relPath(filename, piece.image);
	const fullpath = fullPath(filename, piece.image);
	const image = await processImageFastcache(fc, fullpath, relpath, { position: piece.position });

	const alts = await Promise.all(
		piece.alts?.map(async (alt) => ({
			...alt,
			image: await processImageFastcache(
				fc,
				fullPath(filename, alt.image),
				relPath(filename, alt.image),
				{ position: piece.position }
			),
			video: alt.video
				? {
						full: await processVideoFastcache(
							fc,
							fullPath(filename, alt.video.full),
							relPath(filename, alt.video.full),
							'full'
						),
						thumb: await processVideoFastcache(
							fc,
							fullPath(filename, alt.video.thumb),
							relPath(filename, alt.video.thumb),
							'thumb'
						)
					}
				: undefined
		})) ?? []
	);
	const video = piece.video
		? {
				full: await processVideoFastcache(
					fc,
					fullPath(filename, piece.video.full),
					relPath(filename, piece.video.full),
					'full'
				),
				thumb: await processVideoFastcache(
					fc,
					fullPath(filename, piece.video.thumb),
					relPath(filename, piece.video.thumb),
					'thumb'
				)
			}
		: undefined;

	return { ...piece, image, alts, video };
}

async function resolveReferences(
	gallery: BaseGalleryT,
	fname: FileName,
	fc: FastCache
): Promise<FullGalleryT> {
	return {
		pieces: await Promise.all(
			gallery.pieces.map((piece) => resolvePieceReferences(piece, fname, fc))
		)
	};
}

export async function rawGalleries(): Promise<RawGalleryCache> {
	const cached = getCache().rawGalleryCache;
	const nextVersion = await cacheVersion();
	if (cached.cache && cached.version === nextVersion) {
		return cached.cache;
	}
	const allGalleries = await glob('./**/*.gallery', { cwd: $DATA() });
	const documents = (
		await Promise.all(
			allGalleries.map((fn) =>
				fs
					.readFile(path.join($DATA(), fn), { encoding: 'utf-8' })
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
			(rec, { filename, obj }) => ({ ...rec, [filename.replaceAll(path.sep, '/')]: obj }),
			{}
		);

	getCache().rawGalleryCache.cache = documents;
	getCache().rawGalleryCache.version = nextVersion;
	return documents;
}

export async function galleries(doRetry: boolean = true) {
	const cached = getCache().galleryCache;
	const nextVersion = await cacheVersion();
	if (cached.cache && cached.version === nextVersion) {
		return cached.cache;
	}

	const documents = await rawGalleries();
	Object.values(documents).forEach((g) => {
		if ('pieces' in g) {
			g.pieces = g.pieces.filter((p) => !p.deindexed);
		}
	});

	try {
		const fc = await readFastCache();
		const out = await resolveExtends(documents, fc);
		await flushFastCache(fc);
		getCache().galleryCache.cache = out;
		getCache().galleryCache.version = nextVersion;
		return out;
	} catch (e) {
		if (doRetry) {
			GalleryLogger.warn('Encountered error, clearing cache and trying again', e);
			clearCache();
			return await galleries(/* doRetry = */ false);
		} else {
			throw e;
		}
	}
}

export async function allPieces(): Promise<Record<string, ArtPiece>> {
	return asRecord(
		Object.values(await galleries()).flatMap((p) => p.pieces),
		(p) => p.slug
	);
}

export async function getPieceBySlug(slug: string): Promise<ArtPiece | null> {
	return (await allPieces())[slug] ?? null;
}

export function hasNsfw(gallery: ArtPiece[]): boolean {
	return gallery.some((p) => p.nsfw);
}
