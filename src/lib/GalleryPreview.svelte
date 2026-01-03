<script lang="ts">
	import type { Gallery } from './util/art.ts';
	import Image from './Image.svelte';

	interface Props {
		gallery: Gallery;
		cssSize: string;
	}

	const { gallery, cssSize }: Props = $props();

	const pieces = $derived(gallery.pieces.slice(0, 4));
</script>

{#if pieces[0]}
	{@const topw = pieces[1] ? 'calc(var(--preview-size) / 2)' : 'var(--preview-size)'}
	{@const toph = pieces[2] ? 'calc(var(--preview-size) / 2)' : 'var(--preview-size)'}
	{@const botw = pieces[3] ? 'calc(var(--preview-size) / 2)' : 'var(--preview-size)'}
	{@const both = 'calc(var(--preview-size) / 2)'}
	<div class="preview" style="--preview-size: {cssSize}">
		<div style="height: {toph}; width: {topw}" class="imgcontainer" class:square={topw === toph}>
			<div><Image alt={pieces[0].alt} picture={pieces[0].image.thumbnail} /></div>
		</div>
		{#if pieces[1]}
			<div style="height: {toph}; width: {topw}" class="imgcontainer" class:square={topw === toph}>
				<div><Image alt={pieces[1].alt} picture={pieces[1].image.thumbnail} /></div>
			</div>
		{/if}
		{#if pieces[2]}
			<div style="height: {both}; width: {botw}" class="imgcontainer" class:square={botw === both}>
				<div><Image alt={pieces[2].alt} picture={pieces[2].image.thumbnail} /></div>
			</div>
		{/if}
		{#if pieces[3]}
			<div style="height: {both}; width: {botw}" class="imgcontainer" class:square={botw === both}>
				<div><Image alt={pieces[3].alt} picture={pieces[3].image.thumbnail} /></div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.preview {
		display: contents;
	}
	.imgcontainer {
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.imgcontainer:not(.square) > div {
		width: var(--preview-size);
		height: var(--preview-size);
		max-width: var(--preview-size);
		max-height: var(--preview-size);
		min-width: var(--preview-size);
		min-height: var(--preview-size);
	}
</style>
