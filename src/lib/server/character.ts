import { $DATA } from './directories.ts';
import * as fs from 'node:fs/promises';
import * as path from 'node:path/posix';
import * as yaml from 'yaml';
import { FullCharacter, RawCharacter } from './models/Character.ts';
import type { z } from 'zod';
import { processImageFastcache } from './imageprocess.ts';
import { cacheVersion, getCache, fullPath, relPath } from './util.ts';
import { flushFastCache, readFastCache, type FastCache } from './fastcache.ts';

export type CharacterCache = Record<string, z.infer<typeof FullCharacter>>;
export type RawCharacterCache = Record<string, z.infer<typeof RawCharacter>>;

const CHARACTER_PATH = path.join('characters', 'characters.yaml');

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

export async function rawCharacters(): Promise<RawCharacterCache> {
	const cached = getCache().rawCharacterCache;
	const nextVersion = await cacheVersion();
	if (cached.cache && cached.version === nextVersion) {
		return cached.cache;
	}
	const document = yaml.parse(
		await fs.readFile(path.join($DATA(), CHARACTER_PATH), { encoding: 'utf-8' })
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const characters: Record<string, z.infer<typeof RawCharacter>> = (document as any[])
		.flatMap((obj, idx) => {
			const ch = RawCharacter.parse({ ...obj, index: idx++ });
			return ch;
		})
		.reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {});

	getCache().rawCharacterCache.cache = characters;
	getCache().rawCharacterCache.version = nextVersion;
	return characters;
}

export async function characters(): Promise<CharacterCache> {
	const cached = getCache().characterCache;
	const nextVersion = await cacheVersion();
	if (cached.cache && cached.version === nextVersion) {
		return cached.cache;
	}

	const characters = await rawCharacters();
	const fc = await readFastCache();

	const resolved = Object.fromEntries<z.infer<typeof FullCharacter>>(
		await Promise.all(
			Object.entries(characters).map<Promise<[string, z.infer<typeof FullCharacter>]>>(
				async ([k, v]) => {
					const resolved = await doResolveImage(CHARACTER_PATH, v, fc);
					return [k, resolved];
				}
			)
		)
	);

	await flushFastCache(fc);
	getCache().characterCache.cache = resolved;
	getCache().characterCache.version = nextVersion;
	return resolved;
}
