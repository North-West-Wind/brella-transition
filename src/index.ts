#!/usr/bin/env node
import { Canvas } from "canvas";
import * as fs from "fs";
import { Vec2 } from "./math";
import { Brella } from "./brella";
import { nanoid, randomBetween } from "./util";
import { program } from "commander";
import { run } from "ffmpeg-helper";
import sanitize from "sanitize-filename";
import { exit } from "process";
import commandExists from "command-exists";
import { exec } from "child_process";

program
	.option("-W, --width <number>", "width of the canvas", "1920")
	.option("-H, --height <number>", "height of the canvas", "1080")
	.option("-o, --output <string>", "name of output file", "brella.webm")
	.option("--brella <number>", "maximum amount of brella", "30")
	.option("--retries <number>", "maximum retries before choosing to overlap, -1 to allow indefinite retries", "1000000")
	.option("--fps <number>", "framerate of the transition", "60")
	.option("--attack <number>", "frames of brella opening/closing", "15")
	.option("--hold <number>", "frames of brella staying opened", "30")
	.option("--ribs <numbers>", "possible number of ribs, separated by commas", "6,8")
	.option("-h, --hue <numbers>", "HUE angle range in degrees, separated by comma", "0,360")
	.option("-s, --saturation <numbers>", "saturation range in percentage, separated by comma", "80,100")
	.option("-l, --lightness <numbers>", "lightness range in percentage, separated by comma", "50,50");

const options = program.parse().opts();
export const attack = parseInt(options.attack);
export const hold = parseInt(options.hold);
const ribs: number[] = options.ribs.split(",").map((x: string) => parseInt(x));
if (ribs.some(x => isNaN(x) || x < 3)) {
	console.log("Ribs must be numbers >= 3");
	exit(1);
}
let hue: number[] = options.hue.split(",").map((x: string) => parseInt(x));
if (!hue.length || hue.some(x => isNaN(x))) {
	console.log("HUE angle range must be numbers");
	exit(1);
}
hue = hue.map(x => x == 360 || x == -360 ? x : (x < 0 ? (x % 360) + 360 : x % 360)).sort();
let saturation: number[] = options.saturation.split(",").map((x: string) => parseInt(x));
if (!saturation.length || saturation.some(x => isNaN(x))) {
	console.log("Saturation range must be numbers");
	exit(1);
}
saturation = saturation.map(x => x < 0 ? 0 : (x > 100 ? 100 : x)).sort();
let lightness: number[] = options.lightness.split(",").map((x: string) => parseInt(x));
if (!lightness.length || lightness.some(x => isNaN(x))) {
	console.log("Lightness range must be numbers");
	exit(1);
}
lightness = lightness.map(x => x < 0 ? 0 : (x > 100 ? 100 : x)).sort();
const outName = sanitize(options.output);
if (outName != options.output) {
	console.log("Output file name is not valid");
	exit(1);
}

let tmpDir = "tmp-" + nanoid();
while (fs.existsSync(tmpDir)) tmpDir = "tmp-" + nanoid();
fs.mkdirSync(tmpDir);

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
			brellas.push(new Brella(pos, randomBetween(canvas.height * 0.4, canvas.height * 0.6), ribs[Math.floor(Math.random() * ribs.length)], hue, saturation, lightness));
		}
	}
	// Clear the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Draw all the brellas
	for (const brella of brellas)
		brella.render(ctx);
	// Write each frame to a PNG file
	const name = (counter++).toString().padStart(4, "0");
	fs.writeFileSync(`${tmpDir}/frame-${name}.png`, canvas.toBuffer());
}

let realOutName = outName;
const outNameArr = outName.split(".");
while (fs.existsSync(realOutName)) {
	outNameArr[outNameArr.length - 1] = nanoid();
	realOutName = outNameArr.join(".") + ".webm";
}
if (realOutName != outName) console.log(`${outName} already exists. Will instead output to ${realOutName}`);

const command = ["ffmpeg", "-framerate", options.fps.toString(), "-f", "image2", "-i", `${tmpDir}/frame-%04d.png`, "-lossless", "1", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", realOutName].join(" ");
if (commandExists.sync("ffmpeg")) {
	exec(command, (err, _stdout, stderr) => {
		if (err) {
			console.error("Error executing ffmpeg command");
			console.error("stderr:", stderr);
		} else {
			// Clean up
			fs.rmSync(tmpDir, { recursive: true });
		}
	});
} else {
	console.log("ffmpeg is not found! Install it and run this command in this directory to create your file:");
	console.log(command);
}