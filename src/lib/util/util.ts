export function asRecord<T>(arr: T[], key: (el: T) => string): Record<string, T> {
	const record: Record<string, T> = {};
	for (const val of arr) {
		record[key(val)] = val;
	}

	return record;
}
export function deduplicateBy<T>(arr: T[], key: (el: T) => string): T[] {
	return Object.values(asRecord(arr, key));
}
