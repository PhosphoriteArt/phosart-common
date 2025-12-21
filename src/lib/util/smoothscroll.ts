export const smoothScroll = (anchor: HTMLAnchorElement) => {
	const cb = (e: Event) => {
		e.preventDefault();
		const href = anchor.getAttribute('href');
		if (!href || !href.startsWith('#')) return;
		const target = document.getElementById(href.replace(/^#/g, ''));
		if (!target) return;

		window.scrollTo({
			top: target.offsetTop,
			behavior: 'smooth'
		});
	};

	anchor.addEventListener('click', cb);
	return {
		destroy() {
			anchor.removeEventListener('click', cb);
		}
	};
};
