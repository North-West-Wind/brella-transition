import crypto from "crypto";

export function pass<T>(value: T) {
	return value;
}

export function randomBetween(min: number, max: number, int = false) {
	return (int ? Math.round : pass)(Math.random() * (max - min)) + min;
}

// copied from https://github.com/ai/nanoid/blob/main/nanoid.js because nanoid won't work in my configuration
const a = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
export function nanoid(e = 21) {
	let t = "", r = crypto.getRandomValues(new Uint8Array(e));
	for (let n = 0; n < e; n++)
		t += a[63 & r[n]];
	return t;
}