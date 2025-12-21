<script lang="ts">
	interface Props {
		loading: boolean;
	}

	let { loading }: Props = $props();
</script>

<svg class:loading class="loading-spinner" xmlns="http://www.w3.org/2000/svg">
	<rect
		width="100%"
		height="100%"
		fill="none"
		stroke="#278965"
		stroke-linecap="butt"
		rx="12px"
		ry="12px"
	/>
	<rect
		width="100%"
		height="100%"
		fill="none"
		stroke="#3EB489"
		stroke-dasharray="40, 100"
		stroke-linecap="butt"
		rx="12px"
		ry="12px"
	/>
</svg>

<style lang="postcss">
	.loading-spinner {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		border-radius: 12px;
		z-index: 10;
		opacity: 0;
		transition: opacity 0.2s;
		pointer-events: none;

		rect {
			transition: stroke-width 0.2s;
			stroke-width: 0;
		}

		&.loading {
			opacity: 1;

			rect {
				stroke-width: 4px;
			}
			rect:last-of-type {
				stroke-dashoffset: 600;
				stroke-dasharray: 200, 80;
				animation: svgloader forwards linear infinite 0.5s;
			}
		}
	}

	@keyframes svgloader {
		from {
			stroke-dashoffset: 280;
		}
		to {
			stroke-dashoffset: 0;
		}
	}
</style>
