import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';
import path from 'node:path';
import { $DATA } from './directories.ts';
import type { GalleryCache } from './gallery.ts';
import type { CharacterCache } from './character.ts';
import type { ArtistCache } from './artist.ts';

export async function hashUrl(url: string) {
	const buf = await fs.readFile(url);
	return crypto.createHash('md5').update(buf).digest('hex').substring(24);
}

export function hash(object: object) {
	return crypto.createHash('md5').update(JSON.stringify(object)).digest('hex').substring(24);
}

export function relativeFile(startFile: string, nextFile: string) {
	const out = path.join($DATA, path.dirname(startFile), nextFile);
	return out;
}

export interface GlobalCache {
	galleryCache: GalleryCache | null;
	characterCache: CharacterCache | null;
	artistCache: ArtistCache | null;
}

export function getCache(): GlobalCache {
	if (typeof global == 'undefined') {
		throw new Error('global is undefined');
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let cache: GlobalCache | undefined = (global as any).__art_global_cache;
	if (!cache) {
		cache = {
			galleryCache: null,
			characterCache: null,
			artistCache: null
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(global as any).__art_global_cache = cache;
	}

	return cache;
}
