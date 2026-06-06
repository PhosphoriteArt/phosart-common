export const nsfwConsented = $state({ consented: false });

export const nsfwBlurStyle = 'filter: blur(200px); overflow: hidden;';

export function nsfwBlur(nsfw?: boolean): string {
	if (nsfw && !nsfwConsented.consented) {
		return nsfwBlurStyle;
	}
	return '';
}

export function nsfwRedact(s: string, nsfw?: boolean): string {
	if (nsfw && !nsfwConsented.consented) {
		return '[redacted: nsfw]';
	}
	return s;
}
