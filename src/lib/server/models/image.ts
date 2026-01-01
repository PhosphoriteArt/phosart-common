import { z } from 'zod';

export const Source = z.object({
	src: z.string(),
	w: z.number(),
	h: z.number()
});

export const Image = z.object({
	sources: z.record(z.string(), z.array(Source)),
	fallback: Source,
	lqip: Source,
	sha256: z.string()
});

export const Picture = z.object({
	full: Image,
	thumbnail: Image,
	phash: z.string()
});
