import type Gallery from '../Gallery.svelte';
import type FullGallery from '../FullGallery.svelte';
import { createContext, type ComponentProps } from 'svelte';
import type { ArtPiece, CharacterRef, NormalizedArtist } from './art.ts';

const [get, set] = createContext<LibraryConfig>();

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
	| { action?: ChipAction<T>; hidden?: never }
	| { hidden?: true; action?: never };

type ChipOptionTypes = {
	tag: string;
	artist: NormalizedArtist;
	character: CharacterRef;
	permalink: ArtPiece;
};

export type ChipOptions<T> = ChipOptionBase<T>;
export type DataType<Type extends keyof ChipOptionTypes> = ChipOptionTypes[Type]

export type ChipOptionsByType = {
	[K in keyof ChipOptionTypes]?: ChipOptions<DataType<K>>
}

export interface LibraryConfig {
	gallery?: {
		DefaultCardComponent?: NonNullable<ComponentProps<typeof FullGallery>['CardComponent']>;
		DefaultPieceComponent?: NonNullable<ComponentProps<typeof Gallery>['PieceComponent']>;
	};
	modal?: { chipOptionsByType?: ChipOptionsByType };
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
	set(config);
	$effect(() => {
		set(config);
	});
}

export function useLibraryConfig(): LibraryConfig {
	return get();
}
