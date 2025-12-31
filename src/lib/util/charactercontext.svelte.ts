import { getContext, setContext } from 'svelte';
import type { CharacterCache } from '../server/character.ts';

const key = Symbol();

export function useCharacterContext(characters: CharacterCache) {
	setContext(key, characters);
	$effect(() => {
		setContext(key, characters);
	});
}

export function useCharacters(): CharacterCache {
	return getContext(key);
}
