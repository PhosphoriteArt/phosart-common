export function formatDate(d: Date | string) {
	if (typeof d === 'string') {
		d = new Date(d);
	}

	return d.toLocaleDateString();
}
