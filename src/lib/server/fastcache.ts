import { stat } from 'node:fs/promises';
import { $DATA } from './directories.ts';
import path from 'node:path';
import { Logger } from 'tslog';
import { getLogLevel } from './util.ts';
import { readPack, writePack } from './pack.ts';
const FastcacheLogger = new Logger({ minLevel: getLogLevel() });

const $FASTCACHEPATH = () => path.join($DATA(), '.fastcache.pack.gz');

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
	try {
		await writePack($FASTCACHEPATH(), fc);
	} catch (err) {
		FastcacheLogger.warn('Failed to write fastcache', err);
	}
}

export async function readFastCache(): Promise<FastCache> {
	try {
		return await readPack($FASTCACHEPATH());
	} catch (err) {
		FastcacheLogger.warn('Failed to read fastcache', err);
		return {};
	}
}
