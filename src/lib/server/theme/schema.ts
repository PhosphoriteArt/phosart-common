import { writeFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import z from 'zod';
import { $DATA } from '../directories.ts';
import { parseDocument } from 'yaml';
import { Logger } from 'tslog';
import { getLogLevel } from '../util.ts';
const ThemeLogger = new Logger({ minLevel: getLogLevel() });

const $THEMESCHEMA = path.resolve($DATA, '.theme-schema.json');
const $THEMECONFIG = path.resolve($DATA, 'theme-config.yaml');
const BLANK = `{
  "$schema": "https://raw.githubusercontent.com/PhosphoriteArt/phosart-common/refs/heads/main/settings.schema.json"
}`;

const ZColorOption = z.object({ type: z.literal('color') });
const ZSelectionOption = z.object({ type: z.literal('selection'), options: z.array(z.string()) });
const ZStringOption = z.object({ type: z.literal('string') });
export const ZThemeSettingsSchema = z.record(
	z.string(),
	z.union([ZColorOption, ZSelectionOption, ZStringOption])
);

export type ThemeSettingsSchema = z.infer<typeof ZThemeSettingsSchema>;

const defaultSettings = {
	defaultArtist: { type: 'string' }
} as const satisfies ThemeSettingsSchema;

type MaterializedOptionFor<T extends ThemeSettingsSchema[string]> =
	T extends z.infer<typeof ZColorOption>
		? `#${string}`
		: T extends z.infer<typeof ZSelectionOption>
			? [...T['options']]
			: T extends z.infer<typeof ZStringOption>
				? string
				: never;

export type SettingsFor<T extends ThemeSettingsSchema> = {
	[K in keyof T]: MaterializedOptionFor<T[K]>;
};

export async function readThemeSchema<T extends ThemeSettingsSchema>(): Promise<T> {
	let text: string;
	try {
		text = await readFile($THEMESCHEMA, { encoding: 'utf-8' });
	} catch (err) {
		ThemeLogger.warn('Error reading theme file:', err, 'recreating');
		await writeFile($THEMESCHEMA, BLANK, { encoding: 'utf-8' });
		text = BLANK;
	}
	try {
		const settings = await ZThemeSettingsSchema.parseAsync(JSON.parse(text));
		return settings as T;
	} catch (err) {
		ThemeLogger.warn('Error parsing theme file:', err);
		throw err;
	}
}

function validateSchema<T extends ThemeSettingsSchema>(
	schema: T,
	doc: unknown
): doc is SettingsFor<T> {
	if (typeof doc !== 'object' || !doc) {
		throw new Error(
			"document '" +
				JSON.stringify(doc) +
				"' is not a truthy object and thus cannot conform to schema " +
				JSON.stringify(schema)
		);
	}
	const cast = doc as Record<string, unknown>;

	for (const [k, v] of Object.entries(schema)) {
		if (k in cast) {
			const docval: unknown = cast[k];
			switch (v.type) {
				case 'color':
					if (typeof docval !== 'string' || !docval.startsWith('#')) {
						throw new Error(
							"document '" +
								JSON.stringify(doc) +
								"' @ key '" +
								k +
								"' does not have type color (instead has value '" +
								v +
								"') and thus does not conform to schema " +
								JSON.stringify(schema)
						);
					}
					break;
				case 'selection':
					if (typeof docval !== 'string' || !v.options.includes(docval)) {
						throw new Error(
							"document '" +
								JSON.stringify(doc) +
								"' @ key '" +
								k +
								"' does not have a valid selection at that key (instead has value '" +
								v +
								"') and thus does not conform to schema " +
								JSON.stringify(schema)
						);
					}
					break;
				case 'string':
					if (typeof docval !== 'string') {
						throw new Error(
							"document '" +
								JSON.stringify(doc) +
								"' @ key '" +
								k +
								"' does not have a valid string at that key (instead has value '" +
								v +
								"') and thus does not conform to schema " +
								JSON.stringify(schema)
						);
					}
			}
		}
	}
	return true;
}

export async function readThemeConfig<T extends ThemeSettingsSchema>(
	schema: T
): Promise<SettingsFor<T & typeof defaultSettings> | null> {
	let text: string;
	try {
		text = await readFile($THEMECONFIG, { encoding: 'utf-8' });
	} catch (err) {
		ThemeLogger.warn('Error reading theme file:', err, 'recreating');
		await writeFile($THEMECONFIG, '', { encoding: 'utf-8' });
		text = '';
	}
	try {
		const doc = parseDocument(text);
		if (validateSchema(Object.assign({}, defaultSettings, schema), doc)) {
			return doc;
		}

		throw new Error('unreachable');
	} catch (err) {
		ThemeLogger.warn('Error parsing theme file:', err);
		throw err;
	}
}

function writeJsonSchema() {
	const p = path.resolve(path.join(import.meta.dirname, '../../../settings.schema.json'));
	writeFileSync(p, JSON.stringify(ZThemeSettingsSchema.toJSONSchema()), { encoding: 'utf-8' });
	console.log('Wrote jsonschema to ' + p);
}

if (process.env.WRITE_SCHEMA) {
	writeJsonSchema();
}
