import { z } from 'zod';

export const Artist = z.object({
	handle: z.string(),
	name: z.string(),
	self: z.boolean().default(false),
	links: z.record(
		z.string(),
		z.union([
			z.literal('twitter'),
			z.literal('facebook'),
			z.literal('instagram'),
			z.literal('tumblr'),
			z.literal('toyhouse'),
			z.literal('website'),
			z.literal('linktree'),
			z.string()
		])
	),
	type: z.literal('Artist').default('Artist')
});
