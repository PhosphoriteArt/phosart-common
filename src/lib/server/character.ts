import { glob } from 'glob';
import { $ART } from './directories.ts';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { FullCharacter, RawCharacter } from './models/Character.ts';
import type { z } from 'zod';
import { processImage } from './imageprocess.ts';
import { getCache, relativeFile } from './util.ts';

export type CharacterCache = Record<string, z.infer<typeof FullCharacter>>

async function doResolveImage(
	filename: string,
	character: z.infer<typeof RawCharacter>
): Promise<z.infer<typeof FullCharacter>> {
	const full = processImage(relativeFile(filename, character.picture.image));
	const thumb = character.thumbnail
		? processImage(relativeFile(filename, character.thumbnail.image))
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
	documents: Record<string, z.infer<typeof RawCharacter>>
): Promise<Record<string, z.infer<typeof FullCharacter>>> {
	const final: Record<string, z.infer<typeof FullCharacter>> = {};
	for (const [fname, doc] of Object.entries(documents)) {
		final[doc.name.toLowerCase()] = await doResolveImage(fname, doc);
	}
	return final;
}

export async function characters() {
	const cached = getCache().characterCache;
	if (cached) {
		return cached;
	}
	const allGalleries = await glob('./**/*.character', { cwd: $ART });
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
			return { filename, obj: RawCharacter.parse(obj) };
		})
		.reduce<Record<string, z.infer<typeof RawCharacter>>>(
			(rec, { filename, obj }) => ({ ...rec, [filename]: obj }),
			{}
		);

	const out = await resolveImages(documents);
	getCache().characterCache = out;
	return out;
}
