import { glob } from 'glob';
import { $DATA } from './directories.ts';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { z } from 'zod';
import { Artist } from './models/Artist.ts';
import { getCache } from './util.ts';

export type ArtistCache = Record<string, z.infer<typeof Artist>>;

export async function artists() {
	const cached = getCache().artistCache;
	if (cached) {
		return cached;
	}
	const allArtists = await glob('./**/*.artist', { cwd: $DATA });
	const documents = (
		await Promise.all(
			allArtists.map((fn) =>
				fs
					.readFile(path.join($DATA, fn), { encoding: 'utf-8' })
					.then((text) => ({ filename: fn, text }))
			)
		)
	)
		.map(({ filename, text }) => ({ filename, obj: yaml.parse(text) }))
		.map(({ filename, obj }) => {
			return { filename, obj: Artist.parse(obj) };
		})
		.reduce<Record<string, z.infer<typeof Artist>>>(
			(rec, { filename, obj }) => ({ ...rec, [filename]: obj }),
			{}
		);

	getCache().artistCache = documents;
	return documents;
}
