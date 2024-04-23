import { CanvasRenderingContext2D } from "canvas";
import { Vec2 } from "./math";
import tinycolor from "tinycolor2";
import { attack, hold } from ".";

const RED = "#dc2329";

export class Brella {
	position: Vec2;
	size: number;
	private sides: number;
	private centerAngle: number;
	private color: tinycolor.Instance;
	private angle: number;
	private frames = 0;
	ended = false;

	constructor(position: Vec2, size: number, sides: number, hueRange: number[], saturationRange: number[], lightnessRange: number[]) {
		this.position = position;
		this.size = size;
		this.sides = sides;
		this.centerAngle = Math.PI * 2 / sides;
		/*if (color) this.color = tinycolor(color);
		else this.color = tinycolor(RED).spin(Math.floor(Math.random() * 360));*/
		this.color = tinycolor(`hsl(${hueRange[0] + (hueRange[1] ? Math.floor(Math.random() * (hueRange[1] - hueRange[0])) : 0)} ${saturationRange[0] + (saturationRange[1] ? Math.floor(Math.random() * (saturationRange[1] - saturationRange[0])) : 0)}% ${lightnessRange[0] + (lightnessRange[1] ? Math.floor(Math.random() * (lightnessRange[1] - lightnessRange[0])) : 0)}%)`);
		this.angle = Math.random() * Math.PI * 2;
	}

	render(ctx: CanvasRenderingContext2D) {
		if (this.ended) return;
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(this.angle);
		// Draw canopy
		ctx.fillStyle = this.color.toHexString();
		if (this.frames < attack) this.makePath(ctx, this.frames);
		else if (this.frames < attack + hold) this.makePath(ctx, attack);
		else this.makePath(ctx, attack * 2 + hold - this.frames - 1);
		ctx.fill();
		// Draw ribs
		ctx.strokeStyle = this.color.clone().darken(5).toHexString();
		ctx.lineCap = "round";
		this.drawRibs(ctx);
		ctx.stroke();
		// Draw cap
		ctx.fillStyle = this.color.clone().darken(20).toHexString();
		this.drawCap(ctx);
		ctx.resetTransform();
		this.frames++;
		if (this.frames >= attack * 2 + hold) this.ended = true;
		this.angle += 0.01;
	}

	private scale() {
		if (this.frames < attack) return Math.sin(Math.PI * this.frames / (attack * 2));
		else if (this.frames < attack + hold) return Math.sin(Math.PI * attack / (attack * 2));
		else return Math.sin(Math.PI * (attack * 2 + hold - this.frames - 1) / (attack * 2));
	}

	private makePath(ctx: CanvasRenderingContext2D, x: number) {
		const coefficient = 0.1 / (attack * attack * 1.2);
		ctx.beginPath();
		let vec = new Vec2(0, this.size * 0.5 * this.scale());
		ctx.moveTo(vec.x, vec.y);
		for (let ii = 1; ii < this.sides + 1; ii++) {
			const lastVec = vec;
			vec = vec.rotate(this.centerAngle);
			const mid = lastVec.addVec(vec).scaleAll(0.5);
			const cp = mid.scaleAll(coefficient * x * x + 0.9);
			ctx.bezierCurveTo(cp.x, cp.y, cp.x, cp.y, vec.x, vec.y);
		}
		ctx.closePath();
	}

	private drawRibs(ctx: CanvasRenderingContext2D) {
		const scale = this.scale();
		let vec = new Vec2(0, this.size * 0.5 * scale).scaleAll(0.995);
		ctx.lineWidth = this.size * 0.01 * scale;
		for (let ii = 0; ii < this.sides; ii++) {
			ctx.beginPath();
			ctx.moveTo(vec.x, vec.y);
			ctx.lineTo(0, 0);
			ctx.stroke();
			vec = vec.rotate(this.centerAngle);
		}
	}

	private drawCap(ctx: CanvasRenderingContext2D) {
		ctx.beginPath();
		ctx.arc(0, 0, this.size * 0.02 * this.scale(), 0, Math.PI * 2);
		ctx.fill();
	}
}