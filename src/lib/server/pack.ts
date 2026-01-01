import { PackrStream, UnpackrStream } from 'msgpackr';
import { createReadStream, createWriteStream } from 'node:fs';
import { rename } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { createGunzip, createGzip } from 'node:zlib';

export async function writePack<T>(path: string, data: T) {
	const tmp = path + '.tmp.' + Date.now();
	const ws = createWriteStream(tmp);
	const gz = createGzip({ level: 9 });
	const packr = new PackrStream();
	const p = pipeline(packr, gz, ws);
	packr.end(data);

	await p;

	await rename(tmp, path);
}
export async function readPack<T>(path: string): Promise<T> {
	const gunzip = createGunzip();
	const unpackr = new UnpackrStream();
	const rs = createReadStream(path);
	const data = new Promise<T>((resolve) => {
		unpackr.once('data', resolve);
	});

	await pipeline(rs, gunzip, unpackr);

	return await data;
}
