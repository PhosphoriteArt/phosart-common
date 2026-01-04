import sharp, { type Sharp } from 'sharp';
import { Logger } from 'tslog';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Source } from '../util/art.ts';
import { getLogLevel, hashUrl } from './util.ts';
import type { z } from 'zod';
import { $PUBLIC } from './directories.ts';
import type { Picture } from './models/image.ts';
import { getFastHash, updateFastCache, type FastCache } from './fastcache.ts';
import sharpPhash from 'sharp-phash';
import { Sema } from 'async-sema';
import os from 'node:os';
const ImageProcessLog = new Logger({ minLevel: getLogLevel() });
const sema = new Sema(os.cpus().length, { capacity: 1000 });

const phash: typeof import('sharp-phash').default =
	sharpPhash as unknown as typeof import('sharp-phash').default;

let processedHashes = new Set<string>();

type SourceInfo = Source;
type ImageFormat = keyof sharp.FormatEnum;

interface SavedImage extends SourceInfo {
	format: ImageFormat;
}

interface Transformation {
	format: ImageFormat;
	width: number;
	height?: number;
	position?: string;
}

interface ProcessOptions {
	forceKeep?: boolean;
	position?: string;
}

const LQIP_WIDTH = 64;
const FORMATS: Array<ImageFormat> = ['avif', 'webp'];
const WIDTHS = [640, 960, 1280, 1920, 3840];
const THUMBS = [160, 320];

export function getProcessedHashes(): ReadonlySet<string> {
	return processedHashes;
}
export function clearProcessedHashes() {
	processedHashes = new Set();
}
export async function getUnusedHashes(): Promise<ReadonlySet<string>> {
	const eligible = new Set<string>();
	const pubdir = await fs.readdir($PUBLIC(), { withFileTypes: true, recursive: false });

	await Promise.all(
		pubdir.map(async (dirent) => {
			if (!dirent.isDirectory()) {
				return;
			}
			const ents = await fs.readdir(path.resolve(path.join($PUBLIC(), dirent.name)));
			if (!ents.includes('.keep.mark')) {
				eligible.add(dirent.name);
			}
		})
	);

	return eligible.difference(processedHashes);
}
export async function deleteHashes(unused: ReadonlySet<string>) {
	if (unused.size === 0) {
		return;
	}
	ImageProcessLog.warn('Cleaning up generated directory:', unused.size, 'unused folders found...');
	const respub = path.resolve($PUBLIC());
	for (const hash of unused) {
		const resolved = path.resolve(path.join($PUBLIC(), hash));
		if (!resolved.startsWith(respub)) {
			ImageProcessLog.warn(
				'Tried to clean hash at path',
				resolved,
				'which is not a subdirectory of public',
				respub,
				'??'
			);
		} else {
			ImageProcessLog.debug('Deleting', resolved, '...');
			await fs.rm(resolved, { recursive: true, force: true });
			ImageProcessLog.info('Deleted unused generated directory', resolved, '...');
		}
	}
}
export async function cleanUnusedHashes() {
	await deleteHashes(await getUnusedHashes());
}

async function getPictureDetails(h: string): Promise<z.infer<typeof Picture> | null> {
	try {
		return JSON.parse(
			await fs.readFile(path.join($PUBLIC(), h, 'details.json'), { encoding: 'utf-8' })
		);
	} catch {
		return null;
	}
}

export async function processVideoFastcache(
	fc: FastCache,
	fullpath: string,
	relpath: string,
	name: string,
	processOptions: ProcessOptions = {}
): Promise<string> {
	const [prehash, mtime] = await getFastHash(fc, fullpath, relpath);
	const [path, hash] = await doProcessVideo(fullpath, name, prehash, processOptions);
	if (!prehash) {
		await updateFastCache(fc, fullpath, relpath, hash, mtime);
	}

	return path;
}

export async function processVideo(url: string, name: string): Promise<string> {
	return (await doProcessVideo(url, name, null))[0];
}

async function doProcessVideo(
	url: string,
	name: string,
	prehash: string | null,
	processOptions: ProcessOptions = {}
): Promise<[string, string]> {
	const h = prehash ?? (await hashUrl(url));
	processedHashes.add(h);

	name = name + path.extname(url);
	const outputDir = path.join($PUBLIC(), h);
	await fs.mkdir(outputDir, { recursive: true });
	await fs.copyFile(url, path.join(outputDir, name));
	if (processOptions?.forceKeep) {
		await fs.writeFile(path.join(outputDir, '.keep.mark'), '');
	}

	return [`/_/${h}/${name}`, h];
}

export async function processImageFastcache(
	fc: FastCache,
	fullpath: string,
	relpath: string,
	processOptions: ProcessOptions = {}
): Promise<z.infer<typeof Picture>> {
	const [prehash, mtime] = await getFastHash(fc, fullpath, relpath);
	const [image, hash] = await doProcessImage(fullpath, prehash, processOptions);
	if (!prehash) {
		await updateFastCache(fc, fullpath, relpath, hash, mtime);
	}

	return image;
}

export async function processImage(
	url: string,
	processOptions: ProcessOptions = {}
): Promise<z.infer<typeof Picture>> {
	return (await doProcessImage(url, null, processOptions))[0];
}

async function doProcessImage(
	url: string,
	prehash: string | null,
	processOptions: ProcessOptions = {}
): Promise<[z.infer<typeof Picture>, string]> {
	const h = prehash ?? (await hashUrl(url));
	processedHashes.add(h);
	ImageProcessLog.silly('[IMAGE] Got image with hash', h);
	const cached = await getPictureDetails(h);
	if (cached) {
		ImageProcessLog.debug('[IMAGE] Found cached details for', url, h);
		return [cached, h];
	}
	const tok = await sema.acquire();
	try {
		ImageProcessLog.debug('[IMAGE] Starting to process', url);
		const image = sharp(url, { animated: true });
		const details = await _doProcessImage(url, image, h, processOptions);
		ImageProcessLog.info('[IMAGE] Finished processing', url, details);
		return [details, h];
	} finally {
		sema.release(tok);
	}
}

function removeDuplicates(images: SavedImage[]): SavedImage[] {
	for (let i = images.length - 1; i >= 0; i--) {
		const me = images[i];
		if (
			images.findIndex(
				(v) => v.format === me.format && v.h === me.h && v.w === me.w && v.src === me.src
			) !== i
		) {
			images.splice(i, 1);
		}
	}
	return images;
}

async function _doProcessImage(
	url: string,
	image: Sharp,
	hash: string,
	processOptions: ProcessOptions = {}
): Promise<z.infer<typeof Picture>> {
	const meta = await image.metadata();
	const fullTransformations: Transformation[] =
		meta.format === 'gif'
			? [
					{ format: 'gif' as ImageFormat, width: meta.width! },
					{ format: 'webp', width: meta.width! }
				]
			: FORMATS.flatMap((format) =>
					WIDTHS.flatMap(
						(width) =>
							({ format, width, position: processOptions?.position }) satisfies Transformation
					)
				);
	const thumbnailTransformations: Transformation[] = (
		meta.format === 'gif' ? ['gif' as ImageFormat, 'webp' as ImageFormat] : FORMATS
	).flatMap((format) =>
		THUMBS.flatMap(
			(width) =>
				({
					format,
					width,
					height: width,
					position: processOptions?.position
				}) satisfies Transformation
		)
	);

	const fulls = Promise.all(
		fullTransformations.map((tf) =>
			doSaveImage(url, hash, doTransformImage(image, tf), tf, meta.pages ?? 1)
		)
	).then(removeDuplicates);
	const thumbs = Promise.all(
		thumbnailTransformations.map((tf) =>
			doSaveImage(url, hash, doTransformImage(image, tf), tf, meta.pages ?? 1)
		)
	).then(removeDuplicates);
	const phPromise = phash(url);
	const fullLqip = doLQIP(image, {
		format: 'webp',
		width: LQIP_WIDTH,
		position: processOptions?.position
	});
	const thumbLqip = doLQIP(image, {
		format: 'webp',
		width: LQIP_WIDTH,
		height: LQIP_WIDTH,
		position: processOptions?.position
	});

	const data = {
		phash: await phPromise,
		full: {
			sha256: hash,
			lqip: await fullLqip,
			sources: (await fulls).reduce<Record<string, SourceInfo[]>>(
				(all, cur) => ({
					...all,
					[cur.format]: [...(all[cur.format] ?? []), cur]
				}),
				{}
			),
			fallback: (await fulls).reduce<SourceInfo>(
				(best, cur) => (cur.format === 'webp' && cur.w > best.w ? cur : best),
				(await fulls)[0]
			)
		},
		thumbnail: {
			sha256: hash,
			lqip: await thumbLqip,
			sources: (await thumbs).reduce<Record<string, SourceInfo[]>>(
				(all, cur) => ({
					...all,
					[cur.format]: [...(all[cur.format] ?? []), cur]
				}),
				{}
			),
			fallback: (await thumbs).reduce<SourceInfo>(
				(best, cur) => (cur.format === 'webp' && cur.w > best.w ? cur : best),
				(await thumbs)[0]
			)
		}
	};

	await fs.writeFile(path.join($PUBLIC(), hash, 'details.json'), JSON.stringify(data, null, 4), {
		encoding: 'utf-8'
	});
	if (processOptions?.forceKeep) {
		await fs.writeFile(path.join($PUBLIC(), hash, '.keep.mark'), '');
	}

	ImageProcessLog.info('[IMAGE] Processed image ', hash);
	return data;
}

async function doSaveImage(
	url: string,
	hash: string,
	image: Sharp,
	tf: Transformation,
	pages: number
): Promise<SavedImage> {
	const base = path.join($PUBLIC(), hash);
	await fs.mkdir(base, { recursive: true });
	ImageProcessLog.silly('[IMAGE] Starting transformation of', url, 'to', tf);
	return await new Promise<SavedImage>((resolve, reject) =>
		image.toBuffer(async (err, buf, info) => {
			if (err) return void reject(err);

			if (info.format === 'heif') info.format = 'avif';

			const name = `${info.width}x${info.height / pages}.${info.format}`;
			const output = path.join(base, name);

			await fs.writeFile(output, buf);

			ImageProcessLog.debug('[IMAGE] Saved new image', output, 'for transformation of', url, tf);
			resolve({
				src: `/_/${hash}/${name}`,
				w: info.width,
				h: info.height / pages,
				format: info.format as ImageFormat
			});
		})
	);
}

function doTransformImage(
	image: Sharp,
	{ format, width, height = -1, position = 'north' }: Transformation
): Sharp {
	return image
		.clone()
		.resize({
			width: width,
			height: height === -1 ? undefined : height,
			position,
			withoutEnlargement: true
		})
		.toFormat(format);
}

async function doLQIP(
	image: Sharp,
	{ width, height = -1, position = 'north' }: Transformation
): Promise<SavedImage> {
	return await new Promise((resolve, reject) =>
		image
			.clone()
			.resize({
				width: width,
				height: height === -1 ? undefined : height,
				position,
				withoutEnlargement: true
			})
			.toFormat('webp', { quality: 20 })
			.toBuffer((err, buffer, info) => {
				if (err) return void reject(err);

				const dataUrl = `data:image/webp;base64,${buffer.toString('base64')}`;
				resolve({
					format: 'webp',
					w: info.width,
					h: info.height,
					src: dataUrl
				});
			})
	);
}
