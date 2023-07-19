import { spawn } from "child_process";

export function pass<T>(value: T) {
	return value;
}

export function randomBetween(min: number, max: number, int = false) {
	return (int ? Math.round : pass)(Math.random() * (max - min)) + min;
}

export function execute(command: string, args: string[]) {
	return new Promise<void>((res, rej) => {
		const proc = spawn(command, args);
		
		proc.stdout.on('data', (data) => {
			process.stdout.write(data);
		});

		proc.stderr.on('data', (data) => {
			process.stderr.write(data);
		});

		proc.on("close", signal => {
			if (!signal) res();
			else rej(signal);
		});

		process.stdin.pipe(proc.stdin);
	});
}