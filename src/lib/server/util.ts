import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';
import path from 'node:path';
import { $DATA } from './directories.ts';
import type { GalleryCache, RawGalleryCache } from './gallery.ts';
import type { CharacterCache } from './character.ts';
import type { ArtistCache } from './artist.ts';
import { $ART } from './index.ts';

export async function hashUrl(url: string) {
	const buf = await fs.readFile(url);
	return crypto.createHash('md5').update(buf).digest('hex').substring(24);
}

export function hash(object: object) {
	return crypto.createHash('md5').update(JSON.stringify(object)).digest('hex').substring(24);
}

export function relPath(startFile: string, nextFile: string) {
	const out = path.join(path.dirname(startFile), nextFile);
	return out;
}
export function fullPath(startFile: string, nextFile: string) {
	const out = path.join($DATA, path.dirname(startFile), nextFile);
	return out;
}

type FileStructure = {
	[name: string]: FileStructure | string;
};

async function getStructureHash(scanPath: string = $ART): Promise<FileStructure> {
	const list = await fs.readdir(scanPath, { withFileTypes: true });
	const structure: FileStructure = {};

	for (const element of list) {
		const next = path.join(scanPath, element.name);
		if (element.isDirectory()) {
			structure[element.name] = await getStructureHash(next);
		} else if (element.isFile() && /\.(gallery|character|yaml|yml)$/gi.test(element.name)) {
			structure[element.name] = await hashUrl(next);
		}
	}

	return structure;
}

interface Cache<T> {
	cache: T | null;
	version: string | null;
}

export interface GlobalCache {
	galleryCache: Cache<GalleryCache>;
	rawGalleryCache: Cache<RawGalleryCache>;
	characterCache: Cache<CharacterCache>;
	artistCache: Cache<ArtistCache>;
}

export async function cacheVersion(): Promise<string> {
	return hash(await getStructureHash());
}

export function getCache(): GlobalCache {
	if (typeof global == 'undefined') {
		throw new Error('global is undefined');
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let cache: GlobalCache | undefined = (global as any).__art_global_cache;
	if (!cache) {
		cache = {
			galleryCache: { cache: null, version: null },
			characterCache: { cache: null, version: null },
			artistCache: { cache: null, version: null },
			rawGalleryCache: { cache: null, version: null }
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(global as any).__art_global_cache = cache;
	}

	return cache;
}

export function clearCache() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(global as any).__art_global_cache = null;
}

export function getLogLevel(defaultLevel: number = 4): number {
	try {
		if (!process.env.LOG_LEVEL) {
			return defaultLevel;
		}

		return parseInt(process.env.LOG_LEVEL);
	} catch {
		return defaultLevel;
	}
}
