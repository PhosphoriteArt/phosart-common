<script lang="ts" module>
	import {
		useChipConfig,
		type ChipOptionsByType,
		type DataType
	} from '../util/phosart_config.svelte.ts';
</script>

<script lang="ts" generics="Type extends keyof ChipOptionsByType">
	import type { Snippet } from 'svelte';
	import Character from './Description/Character.svelte';

	interface Props<K extends keyof ChipOptionsByType> {
		type: K;
		data: DataType<K>;
	}

	type ChipProps = NonNullable<
		{
			[K in keyof ChipOptionsByType]: Props<K>;
		}[keyof ChipOptionsByType]
	>;

	let props: ChipProps = $props();

	const config = $derived(useChipConfig(props.type));
	const action = $derived(config?.action ?? null);
	const href = $derived(action?.makeHref?.(props.data));
	const clickHandler = $derived(
		config?.action?.onclick ? () => action?.onclick?.(props.data) : null
	);

	const info = $derived.by(() => {
		switch (props.type) {
			case 'artist':
				return props.data.info ? `@${props.data.name}` : props.data.name;
			case 'character':
				return '';
			case 'permalink':
				return 'Permalink';
			case 'tag':
				return `#${props.data}`;
		}
	});

	const icon = $derived.by(() => {
		switch (props.type) {
			case 'artist':
				return 'fa-paintbrush';
			case 'character':
				return 'n/a';
			case 'permalink':
				return '';
			case 'tag':
				return '';
		}
	});
</script>

<span class="chip-root">
	{#if props.type == 'character'}
		<Character character={props.data} />
	{:else}
		<svelte:element
			this={href ? 'a' : 'span'}
			style={href || clickHandler ? 'cursor: pointer;' : undefined}
			href={href ?? undefined}
			onclick={clickHandler ?? undefined}
			role="button"
			tabindex="0"
		>
			{#if icon}
				<span class="fa solid {icon}"></span>
			{/if}
			{info}
		</svelte:element>
	{/if}
</span>

<style lang="postcss">
	.chip-root {
		line-height: 1.3em;
		display: inline-block;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #fff4;
		background-color: #0001;
		transition: border-color 0.35s ease-in-out;
		white-space: nowrap;

		& :global(a) {
			border: 0;
		}
		&:first-child {
			margin-left: 0;
		}
		&:has(:global(a:hover)) {
			border-color: var(--color-accent);
		}
	}
</style>
