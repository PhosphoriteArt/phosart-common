import { z } from 'zod';
import { Picture } from './image.ts';

const AltPicture = Picture.and(z.object({ alt: z.string() }));
const BaseAltPicture = z.object({
	image: z.string(),
	alt: z.string()
});

function Character<T extends z.ZodTypeAny>(imageType: T) {
	return z.object({
		name: z.string(),
		pronouns: z.string(),
		thumbnail: imageType.optional(),
		picture: imageType,
		description: z.string(),
		short_description: z.string().optional(),
		type: z.literal('Character').default('Character')
	});
}

export const RawCharacter = Character(BaseAltPicture);
export const FullCharacter = Character(AltPicture);
