export function pass<T>(value: T) {
	return value;
}

export function randomBetween(min: number, max: number, int = false) {
	return (int ? Math.round : pass)(Math.random() * (max - min)) + min;
}