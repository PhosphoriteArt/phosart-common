import { getContext, setContext } from 'svelte';
import type { Character } from './art';

const key = Symbol();

export function useCharacterContext(characters: Character[]) {
	setContext(key, characters);
}

export function useCharacters(): Character[] {
	return getContext(key);
}
