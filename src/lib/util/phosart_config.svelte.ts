import type Gallery from '../Gallery.svelte';
import type FullGallery from '../FullGallery.svelte';
import { createContext, type ComponentProps } from 'svelte';
import type { ArtPiece, NormalizedArtist, NormalizedCharacter } from './art.ts';

const [get, set] = createContext<LibraryConfig | undefined>();

export type ChipAction<T> =
	| {
			onclick: (data: T) => void;
			makeHref?: never;
	  }
	| {
			makeHref: (data: T) => string;
			onclick?: never;
	  };

type ChipOptionBase<T> =
	| { action?: ChipAction<T> | null; hidden?: never }
	| { hidden?: true; action?: never };

type ChipOptionTypes = {
	tag: string;
	artist: NormalizedArtist;
	character: NormalizedCharacter;
	permalink: ArtPiece;
};

export type ChipOptions<T> = ChipOptionBase<T>;
export type DataType<Type extends keyof ChipOptionTypes> = ChipOptionTypes[Type];

export type ChipOptionsByType = {
	[K in keyof ChipOptionTypes]?: ChipOptions<DataType<K>>;
};

export interface LibraryConfig {
	siteName: string;
	gallery?: {
		DefaultCardComponent?: NonNullable<ComponentProps<typeof FullGallery>['CardComponent']> | null;
		DefaultPieceComponent?: NonNullable<ComponentProps<typeof Gallery>['PieceComponent']> | null;
	};
	modal?: { chipOptionsByType?: ChipOptionsByType | null };
	defaultTransformSrc?: (src: string) => string;
	origin?: string;
}

const DEFAULT_CONFIG: LibraryConfig = {
	siteName: '',
	gallery: {
		DefaultCardComponent: undefined, // TODO
		DefaultPieceComponent: undefined // TODO
	},
	modal: {
		chipOptionsByType: {
			artist: {
				action: { makeHref: (artist) => `/artist/${artist.name}` }
			},
			tag: { action: { makeHref: (tag) => `/tag/${tag}` } },
			character: { action: { makeHref: (ch) => `/characters/${ch.name}` } },
			permalink: { action: { makeHref: (pl) => `/piece/${pl.slug}` } }
		}
	}
};

function spread(cfg: LibraryConfig): LibraryConfig {
	const modalBase = DEFAULT_CONFIG.modal;
	let gallery = DEFAULT_CONFIG.gallery;
	let modal = modalBase;
	let chipOptionsByType = modalBase?.chipOptionsByType;

	if (cfg.gallery) {
		gallery = { ...DEFAULT_CONFIG.gallery, ...cfg.gallery };
	}
	if (cfg.modal) {
		if (cfg.modal.chipOptionsByType) {
			chipOptionsByType = { ...modalBase?.chipOptionsByType, ...cfg.modal.chipOptionsByType };
		}
		modal = { ...modalBase, ...cfg.modal, chipOptionsByType };
	}

	return { ...cfg, gallery, modal };
}

export function useChipConfig<Type extends keyof ChipOptionsByType>(
	type: Type
): ChipOptions<DataType<Type>> | null {
	const config = useLibraryConfig();
	if (!config.modal) {
		return null;
	}
	return config.modal.chipOptionsByType?.[type] ?? null;
}

export function setLibraryConfig(config: LibraryConfig) {
	set(spread(config));
	$effect(() => {
		set(spread(config));
	});
}

export function useLibraryConfig(): LibraryConfig {
	return get() ?? DEFAULT_CONFIG;
}
