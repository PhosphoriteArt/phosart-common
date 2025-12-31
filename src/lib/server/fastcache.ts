import { rename, stat } from 'node:fs/promises';
import { $DATA } from './directories.ts';
import path from 'node:path';
import { createGunzip, createGzip } from 'node:zlib';
import { PackrStream, UnpackrStream } from 'msgpackr';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
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
	const final = path.join($DATA, '.fastcache.pack.gz');
	const tmp = final + '.tmp';
	const ws = createWriteStream(tmp);
	const gz = createGzip({ level: 9 });
	const packr = new PackrStream();
	const p = pipeline(packr, gz, ws);
	packr.end(fc);

	await p;

	await rename(tmp, final);
}

export async function readFastCache(): Promise<FastCache> {
	try {
		const gunzip = createGunzip();
		const unpackr = new UnpackrStream();
		const rs = createReadStream(path.join($DATA, '.fastcache.pack.gz'));
		const data = new Promise<FastCache>((resolve) => {
			unpackr.once('data', resolve);
		});

		await pipeline(rs, gunzip, unpackr);

		return await data;
	} catch {
		return {};
	}
}
