#!/usr/bin/env node
import { Canvas } from "canvas";
import * as fs from "fs";
import { program } from "commander";
import sanitize from "sanitize-filename";
import { exit } from "process";
import { tmpdir } from "os";
import path from "path";
import BrellaTransition from "./index.js";

import * as util from "./util.js";
import import_ from "@brillout/import";
import { Converter as ConverterType } from "ffmpeg-stream";
const { nanoid } = util;

program
	.option("-W, --width <number>", "width of the canvas", "1920")
	.option("-H, --height <number>", "height of the canvas", "1080")
	.option("-o, --output <string>", "name of output file", "brella.webm")
	.option("--output-image", "output every frame as an image file")
	.option("--output-dir <string>", "directory to output image files to")
	.option("--force-output-dir", "output to directory even if the directory already exists")
	.option("--brella <number>", "maximum amount of brella", "30")
	.option("--ribs <numbers>", "possible number of ribs, separated by commas", "6,8")
	.option("--retries <number>", "maximum retries before choosing to overlap, -1 to allow indefinite retries", "1000000")
	.option("-r, --fps <number>", "framerate of the transition", "60")
	.option("--attack <number>", "frames of brella opening/closing", "15")
	.option("--hold <number>", "frames of brella staying opened", "30")
	.option("--rotate <number>", "radian angle to apply to the brella every frame", "0.01")
	.option("-h, --hue <numbers>", "HUE angle range in degrees, separated by comma", "0,360")
	.option("-s, --saturation <numbers>", "saturation range in percentage, separated by comma", "80,100")
	.option("-l, --lightness <numbers>", "lightness range in percentage, separated by comma", "50,50");

const options = program.parse().opts();
let attack = parseInt(options.attack);
if (isNaN(attack) || attack < 0) {
	console.log("Attack must be a positive integer");
	exit(1);
}
let hold = parseInt(options.hold);
if (isNaN(hold) || hold < 0) {
	console.log("Hold must be a positive integer");
	exit(1);
}
if (!attack && !hold) {
	console.log("One of attack or hold must be positive");
	exit(1);
}
let rotate = parseFloat(options.rotate);
if (isNaN(rotate)) {
	console.log("Rotate must be a number");
	exit(1);
}
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
const fps = parseInt(options.fps);
if (isNaN(fps)) {
	console.log("Frame rate must be a number");
	exit(1);
}

if (options.outputImage && options.outputDir && fs.existsSync(options.outputDir) && !options.forceOutputDir) {
	console.log(`Output directory ${options.outputDir} already exists`);
	exit(1);
}
let tmpDir: string | undefined;
if (options.outputImage) {
	if (options.outputDir) {
		fs.mkdirSync(options.outputDir, { recursive: true });
		tmpDir = options.outputDir;
	} else
		tmpDir = fs.mkdtempSync(path.join(tmpdir(), "brella-"));
}

import_("ffmpeg-stream").then(async ({ Converter }: { Converter: typeof ConverterType }) => {
	const converter = new Converter();
	const converterInput = converter.createInputStream({
		r: fps,
		f: "image2pipe"
	});
	converterInput.on("error", console.error);

	let realOutName = outName;
	const outNameArr = outName.split(".");
	while (fs.existsSync(realOutName)) {
		outNameArr[outNameArr.length - 1] = nanoid();
		realOutName = outNameArr.join(".") + ".webm";
	}
	if (realOutName != outName)
		console.log(`${outName} already exists. Will instead output to ${realOutName}`);
	converter.createOutputToFile(realOutName, {
		lossless: 1,
		vcodec: "libvpx-vp9",
		pix_fmt: "yuva420p"
	});
	const converting = converter.run();

	const canvas = new Canvas(parseInt(options.width), parseInt(options.height), "image");
	const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

	const transition = new BrellaTransition({
		brellaMax: parseInt(options.brella),
		brellaRetries: parseInt(options.retries),
		brellaRibs: ribs,
		frameAttack: attack,
		frameHold: hold,
		frameRotate: rotate,
		colorHue: hue as [number, number],
		colorSaturation: saturation as [number, number],
		colorLightness: lightness as [number, number]
	});
	transition.activate();
	const pad = Math.floor(Math.log10(transition.estimatedFrames));

	let counter = 0;
	// Keep drawing if some brellas are still active
	while (transition.isActive()) {
		// Clear the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// Draw the frame
		transition.render(ctx);
		// Get the PNG stream
		const readable = canvas.createPNGStream();
		// Write each frame to a PNG file
		if (tmpDir) {
			const name = counter.toString().padStart(4, "0");
			const writable = fs.createWriteStream(`${tmpDir}/frame-${name}.png`);
			readable.pipe(writable);
		}
		// Pipe frame to FFMpeg converter
		await new Promise<void>((res) => {
			readable
				.on("end", res)
				.pipe(converterInput, { end: false });
		});
		counter++;
		process.stdout.clearLine(0);
		process.stdout.cursorTo(0);
		process.stdout.write(`[${Math.floor(counter * 100 / transition.estimatedFrames).toString().padStart(3, "0")}%] Rendered ${counter.toString().padStart(pad, "0")} / ${transition.estimatedFrames} frames`)
	}
	process.stdout.write("\n");
	converterInput.end();
	console.log("Finalizing output...");
	await converting;
});