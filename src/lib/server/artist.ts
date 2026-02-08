import { $DATA } from './directories.ts';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { z } from 'zod';
import { Artist } from './models/Artist.ts';
import { cacheVersion, getCache, getLogLevel } from './util.ts';
import { normalizeArtist, type NormalizedArtist } from '../util/art.ts';
import { galleries } from './gallery.ts';
import { Logger } from 'tslog';
const ArtistLog = new Logger({ minLevel: getLogLevel() });

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
			await fs.readFile(path.join($DATA(), 'artists.yaml'), { encoding: 'utf-8' })
		);
	} catch {
		return {};
	}

	(await Promise.all(Object.values(artists).map((v) => Artist.parseAsync(v)))).map((a) => ({
		...a,
		links: Object.fromEntries(
			Object.entries(a.links).map(([k, v]) => {
				if (!v.includes('://')) {
					v = 'https://' + v;
				}

				try {
					v = new URL(v).toString();
				} catch (e: unknown) {
					ArtistLog.error(`Failed to process URL for artist @${k}:`, e);
				}
				return [k, v];
			})
		)
	}));

	getCache().artistCache.cache = artists;
	getCache().artistCache.version = nextVersion;
	return artists;
}

export async function getAllArtists(): Promise<Array<NormalizedArtist>> {
	const all = await artists();
	const mapped: NormalizedArtist[] = Object.values(await galleries())
		.flatMap((g) => g.pieces)
		.flatMap((p) => p.artist)
		.flatMap((a) => normalizeArtist(a, all))
		.concat(Object.values(all).flatMap((a) => normalizeArtist(a.name, all)));

	// Collapse by name
	const record: Record<string, NormalizedArtist> = {};
	for (const m of mapped) {
		record[m.name] = m;
	}

	return Object.values(record);
}
