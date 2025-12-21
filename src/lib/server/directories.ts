import { join, dirname } from 'node:path';
import * as fs from 'node:fs';

function findRoot() {
	let cur = dirname(process.env.PROJECT_ROOT ?? process.argv[1]);
	while (cur.length > 1) {
		try {
			// If package.json parses correctly...
			JSON.parse(fs.readFileSync(join(cur, 'package.json'), { encoding: 'utf-8' }));
			return cur;
		} catch {
			cur = join(cur, '..');
		}
	}
	throw new Error('Failed to find project root?');
}

export const $ROOT = join(findRoot(), 'src');
export const $ART = join($ROOT, 'art');
export const $PUBLIC = join($ROOT, '..', 'static', '_');
