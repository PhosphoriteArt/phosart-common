import { glob } from 'glob';
import { $DATA } from './directories.ts';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { FullCharacter, RawCharacter } from './models/Character.ts';
import type { z } from 'zod';
import { processImageFastcache } from './imageprocess.ts';
import { cacheVersion, getCache, fullPath, relPath } from './util.ts';
import { flushFastCache, readFastCache, type FastCache } from './fastcache.ts';

export type CharacterCache = Record<string, z.infer<typeof FullCharacter>>;

async function doResolveImage(
	filename: string,
	character: z.infer<typeof RawCharacter>,
	fc: FastCache
): Promise<z.infer<typeof FullCharacter>> {
	const full = processImageFastcache(
		fc,
		fullPath(filename, character.picture.image),
		relPath(filename, character.picture.image)
	);
	const thumb = character.thumbnail
		? processImageFastcache(
				fc,
				fullPath(filename, character.thumbnail.image),
				relPath(filename, character.thumbnail.image)
			)
		: undefined;

	return {
		...character,
		picture: { ...(await full), alt: character.picture.alt },
		thumbnail: thumb
			? {
					...(await thumb),
					alt: character.thumbnail!.alt
				}
			: undefined
	};
}

async function resolveImages(
	documents: Record<string, z.infer<typeof RawCharacter>>,
	fc: FastCache
): Promise<Record<string, z.infer<typeof FullCharacter>>> {
	const final: Record<string, z.infer<typeof FullCharacter>> = {};
	for (const [fname, doc] of Object.entries(documents)) {
		final[fname] = await doResolveImage(fname, doc, fc);
	}
	return final;
}

export async function characters() {
	const cached = getCache().characterCache;
	const nextVersion = await cacheVersion();
	if (cached.cache && cached.version === nextVersion) {
		return cached.cache;
	}
	const allCharacters = await glob('./**/*.character', { cwd: $DATA });
	const charactersData = await glob('./**/characters.yaml', { cwd: $DATA });
	let idx = 0;
	const documents = (
		await Promise.all(
			allCharacters.map((fn) =>
				fs
					.readFile(path.join($DATA, fn), { encoding: 'utf-8' })
					.then((text) => ({ filename: fn, text }))
			)
		)
	)
		.map(({ filename, text }) => ({ filename, obj: yaml.parse(text) }))
		.map(({ filename, obj }) => {
			return { filename, obj: RawCharacter.parse({ ...obj, index: idx++ }) };
		})
		.concat(
			(
				await Promise.all(
					charactersData.map((fn) =>
						fs
							.readFile(path.join($DATA, fn), { encoding: 'utf-8' })
							.then((text) => ({ filename: fn, text }))
					)
				)
			)
				.map(({ filename, text }) => ({ filename, obj: yaml.parse(text) }))
				.flatMap(({ filename, obj }, idx) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return (obj as any[]).map((obj) => {
						const ch = RawCharacter.parse({ ...obj, index: idx++ });
						return { filename: `${filename}#${ch.index}`, obj: ch };
					});
				})
		)
		.reduce<Record<string, z.infer<typeof RawCharacter>>>(
			(rec, { filename, obj }) => ({ ...rec, [filename]: obj }),
			{}
		);

	const fc = await readFastCache();
	const out = await resolveImages(documents, fc);
	await flushFastCache(fc);
	getCache().characterCache.cache = out;
	getCache().characterCache.version = nextVersion;
	return out;
}
