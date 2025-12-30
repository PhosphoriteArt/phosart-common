import { readFile, stat, writeFile } from 'node:fs/promises';
import { $DATA } from './directories.ts';
import path from 'node:path';
export interface FastCache {
	[relpath: string]: {
		mtime: number;
		hash: string;
	};
}

export async function getFastHash(
	fc: FastCache,
	fullpath: string,
	relpath: string
): Promise<[string | null, number | null]> {
	const cacheinfo = fc[relpath];
	if (!cacheinfo) return [null, null];

	const fstat = await stat(fullpath);
	const mtime = fstat.mtimeMs;

	if (mtime !== cacheinfo.mtime) {
		return [null, mtime];
	}

	return [cacheinfo.hash, mtime];
}

export async function updateFastCache(
	fc: FastCache,
	fullpath: string,
	relpath: string,
	hash: string,
	premtime?: number | null
) {
	const mtime = premtime ?? (await stat(fullpath)).mtimeMs;

	fc[relpath] = {
		mtime,
		hash
	};
}

export async function flushFastCache(fc: FastCache) {
	await writeFile(path.join($DATA, '.fastcache.json'), JSON.stringify(fc), { encoding: 'utf-8' });
}

export async function readFastCache(): Promise<FastCache> {
	try {
		return JSON.parse(await readFile(path.join($DATA, '.fastcache.json'), { encoding: 'utf-8' }));
	} catch {
		return {};
	}
}
