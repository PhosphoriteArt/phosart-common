import { join, dirname } from 'node:path/posix';
import * as fs from 'node:fs';

function tryFindRoot(start: string) {
	let cur = dirname(start);
	while (cur.length > 1) {
		if (cur.includes('node_modules')) {
			cur = join(cur, '..');
			continue;
		}

		try {
			// If package.json parses correctly...
			JSON.parse(fs.readFileSync(join(cur, 'package.json'), { encoding: 'utf-8' }));
			return cur;
		} catch {
			cur = join(cur, '..');
		}
	}
	return null;
}

function findRoot() {
	let root: string | null = null;
	if (process.env.PROJECT_ROOT) {
		root = tryFindRoot(process.env.PROJECT_ROOT);
	}
	root = root ?? tryFindRoot(process.argv[1]) ?? tryFindRoot(process.cwd());

	if (!root) {
		throw new Error('Failed to find root');
	}

	return root;
}

export const $ROOT = join(findRoot(), 'src');
export const $DATA = join($ROOT, 'data');
export const $PUBLIC = join($ROOT, '..', 'static', '_');
