import { $DATA } from './directories.ts';
import * as fs from 'node:fs/promises';
import * as path from 'node:path/posix';
import * as yaml from 'yaml';
import type { z } from 'zod';
import { Artist } from './models/Artist.ts';
import { cacheVersion, getCache } from './util.ts';

export type ArtistCache = Record<string, z.infer<typeof Artist>>;

export async function artists() {
	const cached = getCache().artistCache;
	const nextVersion = await cacheVersion();
	if (cached.cache && cached.version === nextVersion) {
		return cached.cache;
	}
	let artists: ArtistCache;
	try {
		artists = yaml.parse(
			await fs.readFile(path.join($DATA, 'artists.yaml'), { encoding: 'utf-8' })
		);
	} catch {
		return {};
	}

	await Promise.all(Object.values(artists).map((v) => Artist.parseAsync(v)));

	getCache().artistCache.cache = artists;
	getCache().artistCache.version = nextVersion;
	return artists;
}
