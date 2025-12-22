<script lang="ts">
	interface Props {
		open?: boolean;
		children?: import('svelte').Snippet;
		onclose?: () => void;
	}

	let { open = $bindable(false), children, onclose }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let closing = false;

	function doClose() {
		dialog?.close();
		// closing = true;
		// const evt = (e: AnimationEvent) => {
		// 	dialog.close();
		// 	closing = false;
		// 	dialog.removeEventListener('animationend', evt);
		// };
		// dialog.addEventListener('animationend', evt);
	}
	$effect(() => {
		if (dialog && open && !dialog.open) dialog.showModal();
	});
	$effect(() => {
		if (dialog && !open && dialog.open) doClose();
	});
</script>

<dialog
	class:closing
	bind:this={dialog}
	onclick={doClose}
	onclose={() => {
		open = false;
		onclose?.();
	}}
	onkeypress={(e) => e.code === 'Escape' && doClose()}
>
	{@render children?.()}
</dialog>

<style>
	dialog {
		border: none;
		background: none;
		padding: 0;
		animation: in 0.1s linear;
		overflow: hidden;
		width: 100%;
		height: 100%;
	}

	dialog:modal {
		max-width: 100%;
		max-height: 100%;
	}

	dialog::backdrop {
		background-color: #000a;
		animation: in 0.1s linear;
	}

	dialog.closing,
	dialog.closing::backdrop {
		animation: out 0.1s linear;
	}

	@keyframes in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
</style>
