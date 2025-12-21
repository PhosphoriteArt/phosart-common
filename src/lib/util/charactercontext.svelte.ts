import { getContext, setContext } from 'svelte';
import type { Character } from './art.ts';

const key = Symbol();

export function useCharacterContext(characters: Character[]) {
	setContext(key, characters);
	$effect(() => {
		setContext(key, characters);
	});
}

export function useCharacters(): Character[] {
	return getContext(key);
}
