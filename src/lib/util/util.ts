function defaultCombine<T>(a: T): T {
	return a;
}

export function asRecord<T>(
	arr: T[],
	key: (el: T) => string,
	combine?: (a: T, b: T) => T
): Record<string, T> {
	const record: Record<string, T> = {};
	for (const val of arr) {
		const k = key(val);
		if (k in record) {
			record[k] = (combine ?? defaultCombine)(record[k], val);
		} else {
			record[k] = val;
		}
	}

	return record;
}

export function multiRecordBy<T>(arr: T[], key: (el: T) => string): Record<string, T[]> {
	return asRecord(
		arr.map((v) => [v]),
		(arr) => key(arr[0]),
		(a1, a2) => [...a1, ...a2]
	);
}

export function deduplicateBy<T>(
	arr: T[],
	key: (el: T) => string,
	combine?: (a: T, b: T) => T
): T[] {
	return Object.values(asRecord(arr, key, combine));
}
