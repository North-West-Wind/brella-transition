#!/usr/bin/env node
import { Canvas } from "canvas";
import commandExists from "command-exists";
import * as fs from "fs";
import { Vec2 } from "./math";
import { Brella } from "./brella";
import { execute, randomBetween } from "./util";
import { program } from "commander";

program
	.option("-W, --width <number>", "width of the canvas", "1920")
	.option("-H, --height <number>", "height of the canvas", "1080")
	.option("--brella <number>", "maximum amount of brella", "30")
	.option("--retries <number>", "maximum retries before choosing to overlap, -1 to allow indefinite retries", "1000000")
	.option("--fps <number>", "framerate of the transition", "60")
	.option("--attack <number>", "frames of brella opening/closing", "15")
	.option("--hold <number>", "frames of brella staying opened", "30")
	.option("--ribs <numbers>", "possible number of ribs, separated by commas", "6,8");

const options = program.parse().opts();
export const attack = parseInt(options.attack);
export const hold = parseInt(options.hold);
const ribs = options.ribs.split(",").map((x: string) => parseInt(x));

if (!fs.existsSync("tmp")) fs.mkdirSync("tmp");
if (!fs.existsSync("out")) fs.mkdirSync("out");

const canvas = new Canvas(parseInt(options.width), parseInt(options.height), "image");
const ctx = canvas.getContext("2d");

const brellas: Brella[] = [];

var counter = 0;
// Keep drawing if some brellas are still active
while (!brellas.length || !brellas.every(brella => brella.ended)) {
	// 30 is the limit
	if (brellas.length < parseInt(options.brella)) {
		// Spawn 2 brellas every frame
		for (let ii = 0; ii < 2; ii++) {
			var retries = parseInt(options.retries);
			if (retries < 0) retries = Infinity;
			var pos: Vec2;
			// Keep retrying if overlapped
			do {
				pos = new Vec2(canvas.width * Math.random(), canvas.height * Math.random());
			} while (brellas.some(brella => brella.position.addVec(pos.inverse()).magnitudeSqr() < Math.pow(brella.size * 0.47, 2)) && retries--);
			brellas.push(new Brella(pos, randomBetween(canvas.height * 0.4, canvas.height * 0.6), ribs[Math.floor(Math.random() * ribs.length)]));
		}
	}
	// Clear the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Draw all the brellas
	for (const brella of brellas)
		brella.render(ctx);
	// Write each frame to a PNG file
	const name = (counter++).toString().padStart(4, "0");
	fs.writeFileSync(`out/frame-${name}.png`, canvas.toBuffer());
}

if (commandExists.sync("ffmpeg"))
	execute("ffmpeg", ["-framerate", options.fps.toString(), "-f", "image2", "-i", "out/frame-%04d.png", "-lossless", "1", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "out/brella.webm"])
		.then(() => {
			// Clean up
			for (const file of fs.readdirSync("out")) {
				if (!file.endsWith(".png")) continue;
				fs.rmSync(`out/${file}`);
			}
		});