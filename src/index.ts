import { Brella } from "./brella";
import { Vec2 } from "./math";
import { randomBetween } from "./util";

export { TinierColor } from "./tinier-color"

export type BrellaTransitionOptions = {
	brellaMax?: number;
	brellaRibs?: number[];
	brellaRetries?: number;

	frameAttack?: number;
	frameHold?: number;
	frameRotate?: number;

	colorHue?: [number, number];
	colorSaturation?: [number, number];
	colorLightness?: [number, number];
}

export default class BrellaTransition {
	private active = false;
	private brellas: Brella[];

	private brellaMax: number;
	private brellaRibs: number[];
	private brellaRetries: number;

	private frameAttack: number;
	private frameHold: number;
	private frameRotate: number;

	private colorHue: [number, number];
	private colorSaturation: [number, number];
	private colorLightness: [number, number];

	readonly estimatedFrames: number;

	constructor(options: BrellaTransitionOptions = {}) {
		this.brellas = [];

		this.brellaMax = options.brellaMax || 30;
		this.brellaRibs = options.brellaRibs || [6, 8];
		this.brellaRetries = options.brellaRetries || 1000000;

		this.frameAttack = options.frameAttack || 15;
		this.frameHold = options.frameHold || 30;
		this.frameRotate = options.frameRotate || 0.01;

		this.colorHue = (options.colorHue?.map(x => x == 360 || x == -360 ? x : (x < 0 ? (x % 360) + 360 : x % 360)).sort() || [0, 360]) as [number, number];
		this.colorSaturation = (options.colorSaturation?.map(x => x < 0 ? 0 : (x > 100 ? 100 : x)).sort() || [80, 100]) as [number, number];
		this.colorLightness = (options.colorLightness?.map(x => x < 0 ? 0 : (x > 100 ? 100 : x)).sort() || [50, 50]) as [number, number];

		this.estimatedFrames = this.brellaMax * 0.5 + this.frameAttack * 2 + this.frameHold - 1;
	}

	/**
	 * Renders all Brellas for a frame. The frame counter is automatically incremented.
	 * Does not clear the canvas
	 * @param ctx Canvas rendering context of the canvas you want to render onto
	 */
	render(ctx: CanvasRenderingContext2D) {
		if (!this.active) return;
		// Keep spawning if limit is not reached
		if (this.brellas.length < this.brellaMax) {
			// Spawn 2 brellas every frame
			for (let ii = 0; ii < 2; ii++) {
				var retries = this.brellaRetries;
				if (retries < 0) retries = Infinity;
				var pos: Vec2;
				// Keep retrying if overlapped
				do {
					pos = new Vec2(ctx.canvas.width * Math.random(), ctx.canvas.height * Math.random());
				} while (this.brellas.some(brella => brella.position.addVec(pos.inverse()).magnitudeSqr() < Math.pow(brella.size * 0.47, 2)) && retries--);
				this.brellas.push(new Brella(pos, randomBetween(ctx.canvas.height * 0.4, ctx.canvas.height * 0.6), this.brellaRibs[Math.floor(Math.random() * this.brellaRibs.length)], this.colorHue, this.colorSaturation, this.colorLightness, this.frameAttack, this.frameHold, this.frameRotate));
			}
		}
		// Draw all the brellas
		for (const brella of this.brellas)
			brella.render(ctx);
		// Check if we are done
		if (this.brellas.length >= this.brellaMax && this.brellas.every(brella => brella.ended))
			this.active = false;
	}

	activate() {
		this.brellas = [];
		this.active = true;
	}

	isActive() {
		return this.active;
	}
}