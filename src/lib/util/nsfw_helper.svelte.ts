import { SvelteSet } from 'svelte/reactivity';

export type ImageId = string;

export const nsfwConsented = $state<{
	unblurThumbnails: boolean;
	unblurText: boolean;
	consented: 'all' | SvelteSet<ImageId>;
}>({ unblurThumbnails: false, consented: new SvelteSet(), unblurText: false });

export const nsfwBlurStyle = 'filter: blur(200px); overflow: hidden;';

export function nsfwBlur(
	nsfw: boolean | undefined,
	sha256: ImageId = '.',
	imageType: 'full' | 'thumb' = 'thumb'
): string {
	const didConsent = nsfwConsented.consented === 'all' || nsfwConsented.consented.has(sha256);
	const shouldBlur = didConsent && (nsfwConsented.unblurThumbnails || imageType === 'full');
	if (nsfw && shouldBlur) {
		return nsfwBlurStyle;
	}
	return '';
}

export function nsfwRedact(s: string, nsfw?: boolean): string {
	if (nsfw && !nsfwConsented.unblurText) {
		return '[redacted: nsfw]';
	}
	return s;
}
