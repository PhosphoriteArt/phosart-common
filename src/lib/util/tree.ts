import type { GalleryCache } from '../server/gallery.ts';
import type { ArtPiece, Gallery } from './art.ts';

export type FolderElement = { $type: 'folder'; data: GalleryTree; items: number };
export type GalleryElement = { $type: 'gallery'; data: Gallery; fullpath: string };
export type TreeElement = FolderElement | GalleryElement;

export type GalleryTree = {
	[element: string]: TreeElement;
};

export function asTree(
	cache: GalleryCache,
	transformPieces?: (pieces: Array<ArtPiece>) => Array<ArtPiece>
): FolderElement {
	const paths: [string, Gallery][] = Object.entries(cache);
	const tree: TreeElement = { $type: 'folder', data: {}, items: 0 };
	for (const [path, gallery] of paths) {
		let cur = tree;
		tree.items += gallery.pieces.length;
		const segments = path.split('/');
		const dir = segments.slice(0, -1);
		for (const segment of dir) {
			let next = cur.data[segment];
			if (!next) {
				cur.data[segment] = { $type: 'folder', data: {}, items: 0 };
				next = cur.data[segment];
			}
			if (next.$type !== 'folder') {
				throw new Error('Somehow found gallery + folder with same name??');
			}
			next.items += gallery.pieces.length;
			cur = next;
		}
		cur.data[segments.at(-1)!] = {
			$type: 'gallery',
			data: {
				pieces: transformPieces?.(gallery.pieces) ?? gallery.pieces
			},
			fullpath: path
		};
	}

	return tree;
}

export function pathView(tree: FolderElement, path: string[]): GalleryTree {
	let cur: TreeElement = tree;
	// Go to path
	for (let i = 0; i < path.length; i++) {
		const el = path[i];
		const next: TreeElement = cur.data[el];
		if (!next) {
			return {};
		}
		if (next.$type !== 'folder') {
			return {};
		}
		cur = next;
	}

	cur = { ...cur, data: { ...cur.data } };

	// Prune deeper levels
	for (const [k, el] of Object.entries(cur.data)) {
		if (el.$type === 'folder') {
			if (el.items === 0) {
				delete cur.data[k];
			} else {
				cur.data[k] = { $type: 'folder', data: {}, items: el.items };
			}
		}
	}
	return cur.data;
}
